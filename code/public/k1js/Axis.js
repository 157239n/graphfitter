import { linspace, loglinspace } from "./utils.js";
import { Point } from "./Point.js";

export class Axis {
  static X = undefined;
  static Y = undefined;
  static aps = [];
  static list = [];
  static changed = false; // created/deleted axis
  static logChanged = false;
  constructor(ctx) {
    this.ctx = ctx;
    Axis.list.push(this);
    Axis.changed = true;
    this.valueChanged = true;
    this._lastValues = [0, 0];
    this.node = undefined;
    this.logNode = undefined;
    this._log = false;
    let pgen = () => ({
      mouse: false,
      node: undefined,
      js: undefined,
      textNode: undefined,
      _value: 0,
      get value() {
        return this._value;
      },
      set value(v) {
        this.textNode.value = v;
        this._value = v;
      },
    });
    this.p1 = pgen();
    this.p2 = pgen();
  }

  get log() {
    return this._log;
  }

  set log(l) {
    this.logNode.checked = l;
    this._log = l;
  }

  static initDims(w = 1200, h = 750) {
    // initialize dimensions
    Axis.X.p1.js.xy = [0.15 * w, 0.9 * h];
    Axis.X.p2.js.xy = [0.9 * w, 0.9 * h];
    Axis.Y.p1.js.xy = [0.1 * w, 0.85 * h];
    Axis.Y.p2.js.xy = [0.1 * w, 0.1 * h];
  }

  static init() {
    Axis.X.p1.js = new Point(ctx, 0, 0);
    Axis.X.p2.js = new Point(ctx, 0, 0);
    Axis.Y.p1.js = new Point(ctx, 0, 0);
    Axis.Y.p2.js = new Point(ctx, 0, 0);
    Axis.initDims();
    Axis.X.p1.node = document.querySelector("#aX_p1");
    Axis.X.p2.node = document.querySelector("#aX_p2");
    Axis.Y.p1.node = document.querySelector("#aY_p1");
    Axis.Y.p2.node = document.querySelector("#aY_p2");
    Axis.X.p1.textNode = document.querySelector("#aX_p1 input");
    Axis.X.p2.textNode = document.querySelector("#aX_p2 input");
    Axis.Y.p1.textNode = document.querySelector("#aY_p1 input");
    Axis.Y.p2.textNode = document.querySelector("#aY_p2 input");
    Axis.X.logNode = document.querySelector("#aX_t");
    Axis.Y.logNode = document.querySelector("#aY_t");
    Axis.aps = [Axis.X.p1, Axis.X.p2, Axis.Y.p1, Axis.Y.p2];
    for (const p of Axis.aps) {
      p.node.onmouseenter = (e) => (p.mouse = true);
      p.node.onmouseleave = (e) => (p.mouse = false);
      p.textNode.oninput = (e) => {
        let f = parseFloat(p.textNode.value);
        if (f !== f) {
          p.textNode.style.borderColor = "red";
          p.textNode.style.outlineColor = "red";
        } else {
          p.textNode.style.borderColor = "black";
          p.textNode.style.outlineColor = "black";
          p._value = f;
        }
      };
      p.textNode.oninput();
    }
  }

  static interact() {
    Axis.apply((ax) => ax.interact());
    for (const p of Axis.aps) if (p.mouse) p.js.lock();
  }

  static intermediaries() {
    let ctx = this.ctx;
    if (
      Axis.X.log !== Axis.X.logNode.checked ||
      Axis.Y.log !== Axis.Y.logNode.checked
    )
      Axis.logChanged = true;
    Axis.X.log = Axis.X.logNode.checked;
    Axis.Y.log = Axis.Y.logNode.checked;
  }

  get json() {
    return {
      p1: { ...this.p1.js.xy, value: this.p1.value },
      p2: { ...this.p2.js.xy, value: this.p2.value },
      log: this.log,
    };
  }

  set json(j) {
    this.p1.js.xy = j.p1;
    this.p2.js.xy = j.p2;
    this.p1.value = j.p1.value;
    this.p2.value = j.p2.value;
    this.log = j.log;
  }

  static get json() {
    return { X: Axis.X.json, Y: Axis.Y.json };
  }

  static set json(j) {
    Axis.X.json = j.X;
    Axis.Y.json = j.Y;
    Axis.changed = true;
  }

  interact() {
    if (
      this._lastValues[0] !== this.p1.value ||
      this._lastValues[1] !== this.p2.value
    )
      this.valueChanged = true;
    this._lastValues = [this.p1.value, this.p2.value];
  }

  static get valueChanged() {
    for (const ax of Axis.list) if (ax.valueChanged) return true;
    return false;
  }

  get moved() {
    return this.p1.js.moved || this.p2.js.moved;
  }

  static get moved() {
    for (const ax of Axis.list) if (ax.moved) return true;
    return false;
  }

  draw() {
    let p = this.ctx.p;
    let p1 = this.p1.js;
    let p2 = this.p2.js;
    let vrS = this.ctx.vrS;
    p.strokeWeight(1 / vrS);
    p.line(p1.x, p1.y, p2.x, p2.y);
    let n = 5;
    let values = (this.log ? loglinspace : linspace)(
      this.p1.value,
      this.p2.value,
      n
    );
    let xs = linspace(p1.x, p2.x, n);
    let ys = linspace(p1.y, p2.y, n);
    p.fill(0, 0, 0);
    p.textSize(20 / vrS);
    let r = 5 / vrS;
    for (let i = 0; i < n; i++) {
      p.text(values[i].toPrecision(4), xs[i], ys[i] + 20 / vrS);
      p.ellipse(xs[i], ys[i], r, r);
    }
    p.strokeWeight(1);
    Axis.changed = false;
    Axis.logChanged = false;
    this.valueChanged = false;
  }

  static apply(f) {
    for (const a of Axis.list) f(a);
  }
}
