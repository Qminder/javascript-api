export class Logger {
  private prefix = 'QminderSDK';
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  info(message: string, ...optionalParams: any[]): void {
    console.log(this.constructStatement(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    console.warn(this.constructStatement(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    console.error(this.constructStatement(message), ...optionalParams);
  }

  private constructStatement(message: string): string {
    return `[${new Date().toISOString()}][${this.prefix}][${this.name}] ${message}`;
  }
}
