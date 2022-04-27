export class MovingAverage {
  constructor(value, alpha = 0.99) {
    this.v = value;
    this.alpha = alpha;
  }

  get value() {
    return this.v;
  }

  set value(v) {
    this.v = this.alpha * this.v + (1 - this.alpha) * (v || this.v);
  }
}
