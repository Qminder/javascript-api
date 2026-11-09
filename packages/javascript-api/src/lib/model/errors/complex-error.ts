export class ComplexError extends Error {
  /** The HTTP status of the response that caused the error, when there was one. */
  status?: number;

  error: { [key: string]: string };

  constructor(error: { [key: string]: string }) {
    super('Error occurred! Check error property for more information!');
    this.error = error;
  }
}
