import { Point } from "./Point.js";
import { Series } from "./Series.js";
import { Axis } from "./Axis.js";
import { AutoIncrement } from "./AutoIncrement.js";
import { MovingAverage } from "./MovingAverage.js";
import { download } from "./utils.js";
import { toast } from "./Toast.js";

export { Point, Series, Axis, AutoIncrement, MovingAverage, download, toast };
export function func(a, b) {
  return a + b;
}

let add = (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y });
let mul = (v, c) => ({ x: v.x * c, y: v.y * c });
let sub = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });
let mag = (v) => Math.sqrt(v.x ** 2 + v.y ** 2);
let dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
let matmul = (m, v) => [
  m[0][0] * v.x + m[0][1] * v.y,
  m[1][0] * v.x + m[1][1] * v.y,
];
let inv = (m) => {
  let [[a, b], [c, d]] = m;
  let det = 1 / (a * d - b * c);
  return [
    [d * det, -b * det],
    [-c * det, a * det],
  ];
};

let interp = (a, b, x) => a + (b - a) * x;
let iinterp = (a, b, x) => (x - a) / (b - a);

export function vg(ctx) {
  let [aX1, aX2] = [Axis.X.p1.js, Axis.X.p2.js];
  let [aY1, aY2] = [Axis.Y.p1.js, Axis.Y.p2.js];
  let [daX, daY] = [sub(aX2, aX1), sub(aY2, aY1)];
  let mat = inv([
    [daX.x, daY.x],
    [daX.y, daY.y],
  ]);
  let iden = (x) => x;
  let lx = Axis.X.log ? Math.log : iden;
  let ilx = Axis.X.log ? Math.exp : iden;
  let ly = Axis.Y.log ? Math.log : iden;
  let ily = Axis.Y.log ? Math.exp : iden;

  ctx.vgT = (vx, vy) => {
    let v = { x: vx, y: vy };
    let [m, _1] = matmul(mat, sub(v, aX1));
    let [_2, n] = matmul(mat, sub(v, aY1));
    let gx = parseFloat(
      ilx(interp(lx(Axis.X.p1.value), lx(Axis.X.p2.value), m)).toPrecision(8)
    );
    let gy = parseFloat(
      ily(interp(ly(Axis.Y.p1.value), ly(Axis.Y.p2.value), n)).toPrecision(8)
    );
    return [gx, gy];
  };
  ctx.gvT = (gx, gy) => {
    let m = iinterp(lx(Axis.X.p1.value), lx(Axis.X.p2.value), lx(gx));
    let n = iinterp(ly(Axis.Y.p1.value), ly(Axis.Y.p2.value), ly(gy));
    let B = add(aX1, mul(daX, m));
    let A = add(aY1, mul(daY, n));
    let [neg_alpha, beta] = matmul(mat, sub(A, B));
    return add(B, mul(daY, beta));
  };
}

let conv = (img, k3x3) => {
  let newImg = []
  for (let j = 0; j < img.height-2; j++)
    newImg.push(new Array(img.width-2).fill(0));
  for (let kj = 0; kj < 3; kj++) {
    for (let ki = 0; ki < 3; ki++) {
      let e = k3x3[kj][ki];
      for (let j = 0; j < newImg.height; j++) {
        for (let i = 0; i < newImg.width; i++) {
          newImg[j][i] += img[j+kj][i+ki];
        }
      }
    }
  }
  return newImg;
}

export let convFlatOrig = (img, newImg, k3x3, w, h) => {
  for (let kj = 0; kj < 3; kj++)
    for (let ki = 0; ki < 3; ki++) {
      let e = k3x3[kj*3+ki];
      for (let j = 0; j < h-2; j++)
        for (let i = 0; i < w-2; i++) {
          let [a, b] = [j*(w-2)+i, (j+kj)*w+(i+ki)]
          // newImg[a*4+0] += e*img[b*4+0];
          // newImg[a*4+1] += e*img[b*4+1];
          // newImg[a*4+2] += e*img[b*4+2];
          // newImg[a*4+3] += e*img[b*4+3];
          newImg[a*4+0] += e*(img[b*4+0] + img[b*4+1] + img[b*4+2] + img[b*4+3]);
          newImg[a*4+1] = newImg[a*4+0];
          newImg[a*4+2] = newImg[a*4+0];
          newImg[a*4+3] = newImg[a*4+0];
        }
    }
  return newImg;
}

export let convFlatImg = (img, newImg, k3x3, w, h) => {
  for (let j = 0; j < h-2; j++)
    for (let i = 0; i < w-2; i++){
      let a = j*(w-2)+i;
      let s = 0;
      for (let kj = 0; kj < 3; kj++)
        for (let ki = 0; ki < 3; ki++) {
          let b = (j+kj)*w+(i+ki);
          s += k3x3[kj*3+ki]*(img[b*4+0] + img[b*4+1] + img[b*4+2] + img[b*4+3]);
        }
      newImg[a*4+0] = s;
      newImg[a*4+1] = s;
      newImg[a*4+2] = s;
      newImg[a*4+3] = s;
    }
  return newImg;
}

export let convFlat = (img, k3x3, w, h) => {
  let arr = []
  for (let j = 0; j < h-2; j++) arr.push(new Array(w-2).fill(0))
  for (let j = 0; j < h-2; j++)
    for (let i = 0; i < w-2; i++){
      let a = j*(w-2)+i;
      let s = 0;
      for (let kj = 0; kj < 3; kj++)
        for (let ki = 0; ki < 3; ki++) {
          let b = (j+kj)*w+(i+ki);
          s += k3x3[kj*3+ki]*(img[b*4+0] + img[b*4+1] + img[b*4+2] + img[b*4+3]);
        }
      arr[j][i] = s;
    }
  return arr;
}
