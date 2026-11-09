/**
 * What the library tells the access token provider.
 */
export interface AccessTokenContext {
  /**
   * True when the API answered 401 for the previous token. The provider must then return a new token,
   * also when it still has one that has not expired.
   */
  forceRefresh: boolean;
}

/**
 * Gives the access token for the next request. May return a promise.
 */
export type AccessTokenProvider = (
  context: AccessTokenContext,
) => string | Promise<string>;

export type AuthHeadersProvider = (
  forceRefresh: boolean,
) => Promise<Record<string, string>>;

/**
 * @hidden
 */
export async function bearerAuthorizationHeaders(
  provider: AccessTokenProvider,
  forceRefresh: boolean,
): Promise<Record<string, string>> {
  const token = await provider({ forceRefresh });
  return { Authorization: `Bearer ${token}` };
}

/**
 * Sends the request. When the API answers 401 and the authentication can be refreshed, sends it once more
 * with a forced refresh.
 *
 * @param send sends the request, with the authentication headers of the given kind
 * @param canRefresh whether a forced refresh can give another authentication, which is false for an API key
 * @hidden
 */
export async function sendWithRefreshOnUnauthorized(
  send: (forceRefresh: boolean) => Promise<Response>,
  canRefresh: boolean,
): Promise<Response> {
  const response = await send(false);
  if (response.status === 401 && canRefresh) {
    return send(true);
  }

  return response;
}
