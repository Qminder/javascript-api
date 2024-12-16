import { sleepMs } from './sleep-ms';

describe('sleepMs', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it.each([1, 2, 5, 100, 200, 500, 100, 200, 500, 1000, 2000, 5000])(
    'resolves after time interval: %d ms',
    async (ms) => {
      const promise = sleepMs(ms);
      jest.advanceTimersByTime(ms);
      await promise;
    },
  );
});
