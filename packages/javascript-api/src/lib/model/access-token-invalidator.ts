/**
 * Called with an access token that the Qminder API rejected.
 */
export type AccessTokenInvalidator = (rejectedToken: string) => void;
