/* Create a promise that resolves after the given amount of milliseconds. */
export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
