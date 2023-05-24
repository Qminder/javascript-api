/* global globalThis: false */
/* eslint-env jest */
class MockInterval<T = unknown> {
  constructor(
    public callback: (context?: T) => void,
    public delay: number,
    public context?: T,
  ) {}
}

export class MockSetInterval {
  private intervals: Record<number, MockInterval<unknown>> = {};
  private nextIndex = 0;

  constructor() {
    this.setInterval = this.setInterval.bind(this);
    this.clearInterval = this.clearInterval.bind(this);
  }

  setInterval<T = unknown>(
    callback: (context?: T) => void,
    delay: number,
    context?: T,
  ): number {
    const id = this.nextIndex + 1;
    this.intervals[id] = new MockInterval(
      callback,
      delay,
      context,
    ) as MockInterval<unknown>;
    return id;
  }

  clearInterval(id: number) {
    delete this.intervals[id];
  }

  advanceAll() {
    for (const interval of Object.values(this.intervals)) {
      interval.callback(interval.context);
    }
  }
}

let oldSetInterval: Window['setInterval'] | undefined;
let oldClearInterval: Window['clearInterval'] | undefined;

export function mockSetIntervalGlobals(): MockSetInterval {
  const mockSetInterval = new MockSetInterval();
  oldSetInterval = globalThis.setInterval;
  oldClearInterval = globalThis.clearInterval;
  globalThis.setInterval = mockSetInterval.setInterval as any;
  globalThis.clearInterval = mockSetInterval.clearInterval;
  return mockSetInterval;
}

export function resetSetIntervalGlobals() {
  globalThis.setInterval = oldSetInterval as any;
  globalThis.clearInterval = oldClearInterval;
}

export async function withMockSetIntervalGlobals(
  callback: (m: MockSetInterval) => Promise<void>,
): Promise<void> {
  try {
    const mockSetInterval = mockSetIntervalGlobals();
    await callback(mockSetInterval);
  } finally {
    resetSetIntervalGlobals();
  }
}
