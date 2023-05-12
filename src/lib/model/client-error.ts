export class ClientError extends Error {
  error?: { [key: string]: string };

  constructor(message: string, error?: { [key: string]: string }) {
    super(message);
    this.error = error;
  }
}
