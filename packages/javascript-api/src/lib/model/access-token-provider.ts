/**
 * Resolves with an access token that is sent to the Qminder API as a bearer token.
 * Called before every request, so should be cached.
 */
export type AccessTokenProvider = () => Promise<string>;
