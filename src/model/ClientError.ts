export class ClientError extends Error {

    private field: string;

    constructor(field: string, message: string) {
        super(message);
        this.field = field;
    }
}
