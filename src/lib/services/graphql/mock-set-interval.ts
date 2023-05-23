class MockInterval<T = unknown> {
  constructor(
    public callback: (context?: T) => void,
    public delay: number,
    public context?: T,
  ) {}
}

export class MockSetInterval {
  intervals: MockInterval<unknown>[] = [];

  constructor() {
    this.setInterval = this.setInterval.bind(this);
    this.clearInterval = this.clearInterval.bind(this);
  }

  setInterval<T = unknown>(
    callback: (context?: T) => void,
    delay: number,
    context?: T,
  ): number {
    const id = this.intervals.length;
    this.intervals.push(
      new MockInterval(callback, delay, context) as MockInterval<unknown>,
    );
    return id;
  }

  clearInterval(id: number) {
    this.intervals.splice(id, 1);
  }

  advanceAll() {
    for (const interval of this.intervals) {
      interval.callback(interval.context);
    }
  }
}

let oldSetInterval: Window['setInterval'] | undefined;
let oldClearInterval: Window['clearInterval'] | undefined;

export function mockSetIntervalGlobals(): MockSetInterval {
  const mockSetInterval = new MockSetInterval();
  oldSetInterval = window.setInterval;
  oldClearInterval = window.clearInterval;
  window.setInterval = mockSetInterval.setInterval as any;
  window.clearInterval = mockSetInterval.clearInterval;
  return mockSetInterval;
}

export function resetSetIntervalGlobals() {
  window.setInterval = oldSetInterval as any;
  window.clearInterval = oldClearInterval;
}
