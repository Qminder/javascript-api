import { randomizedExponentialBackoff } from './randomized-exponential-backoff';

describe('randomized exponential falloff', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  it('resolves after time interval', async () => {
    const promise = randomizedExponentialBackoff(1);
    jest.advanceTimersByTime(10000);
    await promise;
  });

  it('does not go past 61000 ms for any retryCount', async () => {
    for (let i = 0; i < 100; i++) {
      const promise = randomizedExponentialBackoff(i);
      jest.advanceTimersByTime(61000);
      await promise;
    }
  });
});
