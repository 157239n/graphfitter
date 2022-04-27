export class AutoIncrement {
  constructor() {
    this.value = 0;
  }

  inc() {
    this.value += 1;
    return this.value;
  }
}
