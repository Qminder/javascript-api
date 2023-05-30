const MAX_BACKOFF_MS = 60000;
const MIN_BACKOFF_MS = 5000;
const MIN_JITTER_MS = 300;
const MAX_JITTER_MS = 1000;
const BASE = 1.2;

export function calculateRandomizedExponentialBackoffTime(
  counter: number,
): number {
  const timeOut = Math.min(
    MAX_BACKOFF_MS,
    Math.max(MIN_BACKOFF_MS, BASE ** counter * 1000),
  );
  const jitter = Math.floor(
    Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS) + MIN_JITTER_MS,
  );
  return timeOut + jitter;
}
