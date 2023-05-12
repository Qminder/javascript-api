export class ComplexError extends Error {
  error: { [key: string]: string };

  constructor(error: { [key: string]: string }) {
    super('Error occurred! Check error property for more information!');
    this.error = error;
  }
}
