export class UnknownError extends Error {
  /** The HTTP status of the response that caused the error, when there was one. */
  status?: number;

  constructor() {
    super('Error occurred! Could not extract error message!');
  }
}
