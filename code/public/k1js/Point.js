let offsets = [[0, 0],
               [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1],
               [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -2], [-2, -2], [-2, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2]]
offsets = [];
for (let i = -10; i < 11; i += 1) {
  for (let j = -10; j < 11; j += 1) {
    offsets.push([i, j, Math.sqrt(i**2+j**2)])
  }
}
offsets.sort((a,b) => Math.sign(a[2] - b[2] + Math.random()/100));
offsets = offsets.slice(0, 100);


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
    // external coordinates, has snapping
    this.x = x;
    this.y = y;
    // internal coordinates, smooth tracking
    this.ix = x;
    this.iy = y;
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
    this.ix = this.x = xy[0] ?? xy.x;
    this.iy = this.y = xy[1] ?? xy.y;
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

  _searchSnap() { // returns x, y from ix, iy
    let snapImg = this.ctx.snapImg;
    let ix = this.ix;
    let iy = this.iy;
    let debug = this.ctx.debug;
    for (const offset of offsets) {
      let a = Math.floor(ix + offset[0]);
      let b = Math.floor(iy + offset[1]);
      if (Math.abs(snapImg[b][a]) > 300) {
        if (debug) console.log("snapped");
        this.x = a;
        this.y = b;
        return;
      }
    }
    this.x = ix;
    this.y = iy;
  }

  mouseDragged() {
    if (this._lock && this.near(this.iProp.r * 2)) {
      this.ix += this.ctx.p.movedX / this.ctx.vrS;
      this.iy += this.ctx.p.movedY / this.ctx.vrS;
      if (this.ctx.snap) {
        this._searchSnap();
      } else {
        this.x = this.ix;
        this.y = this.iy;
      }
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
