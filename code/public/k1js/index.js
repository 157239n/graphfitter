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

/**
 * Another virtual to graph translation. Works better, not totally bogus, but not
 * exactly what I wanted.
 */
function vgOld2(ctx) {
  if (ctx.aX.p1.js === undefined) return;
  let [aX1, aX2] = [ctx.aX.p1.js, ctx.aX.p2.js];
  let [aY1, aY2] = [ctx.aY.p1.js, ctx.aY.p2.js];
  let [daX, daY] = [sub(aX2, aX1), sub(aY2, aY1)];
  let [m2daX, m2daY] = [mag(daX) ** 2, mag(daY) ** 2];
  function translate(vx, vy, out = undefined) {
    let m = ((vx - aX1.x) * daX.x + (vy - aX1.y) * daX.y) / m2daX;
    let n = ((vx - aY1.x) * daY.x + (vy - aY1.y) * daY.y) / m2daY;
    let gx = ctx.aX.p1.value + (ctx.aX.p2.value - ctx.aX.p1.value) * m;
    let gy = ctx.aY.p1.value + (ctx.aY.p2.value - ctx.aY.p1.value) * n;
    return [gx, gy];
  }
  ctx.vgT = translate;
}

/**
 * Old virtual to graph translation. Totally bogus underlying math
 */
function vgOld(ctx) {
  function translate(vx, vy, out = undefined) {
    let a = ctx.aX.p2.js.x - ctx.aX.p1.js.x;
    let b = ctx.aY.p2.js.x - ctx.aY.p1.js.x;
    let c = ctx.aX.p2.js.y - ctx.aX.p1.js.y;
    let d = ctx.aY.p2.js.y - ctx.aY.p1.js.y;
    let det = 1.0 / (a * d - b * c);

    vx = vx - (ctx.aX.p1.js.x + ctx.aY.p1.js.x);
    vy = vy - (ctx.aX.p1.js.y + ctx.aY.p1.js.y);
    // Without these 2 lines below, it's not accurate, for some reason.
    // Linear algebra says that image width and height info should not
    // matter, but for some reason it matters here.

    // vx += ctx.img.width * 0.1;
    // vy += ctx.img.height * 0.9;
    vx += ctx.img.width * 0;
    vy += ctx.img.height * 1;
    let m = det * (d * vx - b * vy);
    let n = det * (-c * vx + a * vy);
    let gx = ctx.aX.p1.value + (ctx.aX.p2.value - ctx.aX.p1.value) * m;
    let gy = ctx.aY.p1.value + (ctx.aY.p2.value - ctx.aY.p1.value) * n;
    return [gx, gy, m, n];
  }
  ctx.vgT = translate;
}
