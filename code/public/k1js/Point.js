export class Point {
  static list = [];
  static changed = false; // created/deleted points
  /**
   * Represents a point that can be interacted with (hovered, dragged, etc.)
   *
   * @param {object} ctx
   * @param {number} x
   * @param {number} y
   * @param {object} nProp Properties when normal
   * @param {object} iProp Properties when interacting with it
   */
  constructor(ctx, x, y, nProp = {}, iProp = {}) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.nProp = { r: 10, color: [255, 255, 255, 100], ...nProp };
    this.iProp = { r: 20, color: [255, 0, 0, 100], ...iProp };
    this._lock = false;
    Point.list.push(this);
    Point.changed = true;
    this.moved = true;
  }

  get xy() {
    return { x: this.x, y: this.y };
  }

  set xy(xy) {
    this.x = xy[0] ?? xy.x;
    this.y = xy[1] ?? xy.y;
    this.moved = true;
  }

  remove() {
    this.unlock();
    const index = Point.list.indexOf(this);
    if (index > -1) Point.list.splice(index, 1);
  }

  near(radius) {
    let rx = this.x * this.ctx.vrS + this.ctx.vrT[0];
    let ry = this.y * this.ctx.vrS + this.ctx.vrT[1];
    return Math.abs(rx - this.ctx.p.mouseX) < radius && Math.abs(ry - this.ctx.p.mouseY) < radius;
  }

  lock() {
    if (this.ctx.lock === false) {
      this._lock = true;
      this.ctx.lock = true;
    }
    return this;
  }

  unlock() {
    this._lock = false;
    this.ctx.lock = false;
    return this;
  }

  interact() {
    let ctx = this.ctx;
    if (!this._lock && this.near(this.prop.r)) this.lock();
    if (this._lock && !this.near(this.prop.r)) this.unlock();
  }

  get prop() {
    return this._lock ? this.iProp : this.nProp;
  }

  draw() {
    let vrS = this.ctx.vrS;
    let p = this.ctx.p;
    let r = (2 * this.prop.r) / vrS;
    p.strokeWeight(1 / vrS);
    p.fill(...this.prop.color);
    p.ellipse(this.x, this.y, r, r);
    this.moved = false;
    Point.changed = false;
  }

  mouseDragged() {
    if (this._lock && this.near(this.iProp.r * 2)) {
      this.x += this.ctx.p.movedX / this.ctx.vrS;
      this.y += this.ctx.p.movedY / this.ctx.vrS;
      this.moved = true;
    }
  }

  static apply(f) {
    for (const p of Point.list) f(p);
  }

  static get moved() {
    for (const p of Point.list) if (p.moved) return true;
    return false;
  }
}
