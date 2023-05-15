export class UnknownError extends Error {
  constructor() {
    super('Error occurred! Could not extract error message!');
  }
}
