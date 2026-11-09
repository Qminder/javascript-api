export class SimpleError extends Error {
  /** The HTTP status of the response that caused the error, when there was one. */
  status?: number;

  constructor(message: string) {
    super(message);
  }
}
