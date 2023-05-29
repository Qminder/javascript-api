import { calculateRandomizedExponentialBackoffTime } from './randomized-exponential-backoff';

globalThis.Math.random = () => 0.92939;

describe('calculateRandomizedExponentialBackoffTime', () => {
  it.each([
    [1, 5000],
    [2, 5000],
    [3, 5000],
    [4, 5000],
    [5, 5000],
    [6, 5000],
    [7, 5000],
    [8, 5000],
    [9, 5209],
    [10, 6141],
    [11, 7400],
    [12, 8900],
    [13, 10699],
    [14, 12839],
  ])(
    'calculates exponential backoff correctly for %d iterations',
    async (iterations, expectedTimeout) => {
      const calculated = calculateRandomizedExponentialBackoffTime(iterations);

      expect(calculated).toBeGreaterThanOrEqual(expectedTimeout);
      expect(calculated).toBeLessThanOrEqual(expectedTimeout + 1005);
    },
  );
});
