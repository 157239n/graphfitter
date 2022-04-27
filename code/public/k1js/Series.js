import { AutoIncrement } from "./AutoIncrement.js";
import { Axis } from "./Axis.js";
import { Point } from "./Point.js";
import { linspace, loglinspace } from "./utils.js";

let autoInc = new AutoIncrement();

function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

export class Series {
  static list = [];
  static dict = {};
  static node = undefined;
  static changed = false;

  /**
   *
   * @param {object} ctx Context object
   * @param {list} points List of points
   */
  constructor(ctx, points) {
    this.ctx = ctx;
    this.idx = autoInc.inc();
    this.label = `s${this.idx}`;
    this.points = points;
    Series.list.push(this);
    Series.dict[this.label] = this;
    Series.changed = true;
    this.time = 0;
    this.timeV = 0.45;
    Series.node.appendChild(
      htmlToElement(
        `<div id="series-${this.idx}">
          <div>Series ${this.idx}</div>
          <div style="flex: 1"></div>
          <div onclick="ctx.Series.dict['${this.label}'].moveUp(); event.stopPropagation()" title="Move this series up"><image src='/rss/angle-small-up.svg' width=25 height=25 /></div>
          <div onclick="ctx.Series.dict['${this.label}'].remove(); event.stopPropagation();" title="Delete this series"><image src='/rss/trash.svg' width=25 height=25 /></div>
        </div>`
      )
    );
    this.node = document.querySelector(`#series-${this.idx}`);
    this.node.onclick = (e) => {
      if (this.editing) this.unfocus();
      else this.focus();
    };
    this.node.onmouseenter = (e) => (this.hovering = true);
    this.node.onmouseleave = (e) => (this.hovering = false);
    this.fitFn = undefined;
  }

  static get json() {
    return Series.list.map((s) => s.rawData);
  }

  static set json(d) {
    let [ctx, j] = d;
    Series.clear();
    for (const sj of j) {
      new Series(ctx, []).json = sj;
    }
  }

  static clear() {
    while (Series.list.length > 0) Series.list[0].remove();
    autoInc.value = 0;
  }

  set json(j) {
    for (const xy of j) this.points.push(new Point(ctx, ...xy));
  }

  moveUp() {
    const index = Series.list.indexOf(this);
    let tmp = Series.list[index];
    Series.list[index] = Series.list[index - 1];
    Series.list[index - 1] = tmp;
    for (const series of Series.list) Series.node.appendChild(series.node);
  }

  get editing() {
    return this.ctx.focusedSeries === this;
  }

  get rawData() {
    let answer = [];
    for (const p of this.points) answer.push([p.x, p.y]);
    return answer;
  }

  focus() {
    if (this.ctx.focusedSeries !== undefined) this.ctx.focusedSeries.unfocus();
    this.ctx.focusedSeries = this;
    this.node.classList.add("focused");
  }

  unfocus() {
    this.ctx.focusedSeries = undefined;
    this.node.classList.remove("focused");
  }

  remove() {
    this.unfocus();
    this.node.remove();
    for (const point of this.points) point.remove();
    const index = Series.list.indexOf(this);
    if (index > -1) Series.list.splice(index, 1);
    delete Series.dict[this.idx];
    Series.changed = true;
  }

  _sort() {
    this.points.sort((a, b) => (a.x > b.x) * 2 - 1);
  }

  get moved() {
    for (const p of this.points) if (p.moved) return true;
    return false;
  }

  static get moved() {
    for (const series of Series.list) if (series.moved) return true;
  }

  interact() {
    this._sort();
    if (this.time > 19.5) this.timeV = -Math.abs(this.timeV);
    if (this.time < 0.5) this.timeV = Math.abs(this.timeV);
    this.time += this.timeV;
  }

  get graphData() {
    return this.points.map((p) => this.ctx.vgT(p.x, p.y));
  }

  /**
   * Adjusted for log scales
   */
  get graphDataAdj() {
    let lx = Axis.X.log ? Math.log : (e) => e;
    let ly = Axis.Y.log ? Math.log : (e) => e;
    return this.graphData.map((p) => [lx(p[0]), ly(p[1])]);
  }

  get graphDataS() {
    if (this.ctx.vgT !== undefined)
      return (
        `${this.label} = [` +
        this.graphData.map((v) => `[${v[0]}, ${v[1]}]`).join(", ") +
        "]\n"
      );
    return "";
  }

  static get graphDataS() {
    let s = Series.list.map((s) => s.graphDataS).join("");
    s += "data = [" + Series.list.map((s) => s.label).join(", ") + "]";
    return s;
  }

  _drawLines(vps) {
    let p = this.ctx.p;
    for (let i = 0; i < vps.length - 1; i++)
      p.line(vps[i].x, vps[i].y, vps[i + 1].x, vps[i + 1].y);
  }

  draw() {
    let p = this.ctx.p;
    let vrS = this.ctx.vrS;
    let wt = 1;
    if (this.editing) {
      p.dashedLine([this.time, 20 - this.time, 5]);
      p.stroke(255, 0, 0);
      wt = 4 / vrS;
    } else if (this.hovering) {
      p.dashedLine([this.time, 20 - this.time, 5]);
      p.stroke(0, 255, 0);
      wt = 4 / vrS;
    } else {
      p.stroke(0, 0, 255);
      wt = 1 / vrS;
    }
    p.strokeWeight(wt);
    this._drawLines(this.points);
    p.dashedLine([1, 1]);
    if (
      this.ctx.gvT !== undefined &&
      this.fitFn !== undefined &&
      this.points.length >= 2
    ) {
      let f = this.fitFn;
      let gvT = this.ctx.gvT;
      let vgT = this.ctx.vgT;
      let p1 = this.points.at(0);
      let p2 = this.points.at(-1);
      let gxs = (Axis.X.log ? loglinspace : linspace)(
        vgT(p1.x, p1.y)[0],
        vgT(p2.x, p2.y)[0],
        100
      );
      p.strokeWeight(wt / 2);
      this._drawLines(gxs.map((gx) => gvT(gx, f(gx))));
    }
    p.solidLine();
    p.stroke(0, 0, 0);
    Series.changed = false;
  }

  static apply(f) {
    for (const s of Series.list) f(s);
  }
}
