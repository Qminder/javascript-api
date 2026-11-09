import { sleepMs } from '../../util/sleep-ms/sleep-ms.js';
import { Logger } from '../../util/logger/logger.js';
import {
  AuthHeadersProvider,
  sendWithRefreshOnUnauthorized,
} from '../auth-headers.js';

export class TemporaryApiKeyService {
  private logger = new Logger('TemporaryKey');
  private readonly getApiServer: () => string;
  private readonly getAuthHeaders: AuthHeadersProvider;
  private readonly canRefreshAuthHeaders: boolean;

  /**
   * @param getApiServer gives the domain name of the API server. It is called for each request, because
   * the server can be set after the authentication.
   * @param getAuthHeaders gives the authentication headers of the request
   * @param canRefreshAuthHeaders whether `getAuthHeaders` gives other headers when it is asked to refresh,
   * which an API key does not
   */
  constructor(
    getApiServer: () => string,
    getAuthHeaders: AuthHeadersProvider,
    canRefreshAuthHeaders: boolean,
  ) {
    this.getApiServer = getApiServer;
    this.getAuthHeaders = getAuthHeaders;
    this.canRefreshAuthHeaders = canRefreshAuthHeaders;
  }

  async fetchTemporaryApiKey(retryCount = 0): Promise<string> {
    const url = `https://${this.getApiServer()}/graphql/connection-key`;

    let response: Response;

    try {
      response = await sendWithRefreshOnUnauthorized(
        async (forceRefresh) =>
          fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: await this.getAuthHeaders(forceRefresh),
          }),
        this.canRefreshAuthHeaders,
      );
    } catch (e) {
      if (this.isBrowserOnline()) {
        this.logger.warn('Failed to fetch temporary API key');
      } else {
        this.logger.info(
          'Failed to fetch temporary API key. The browser is offline.',
        );
      }
      return this.retry(retryCount + 1);
    }

    if (response.status === 403) {
      throw new Error(
        'Provided API key is invalid. Unable to fetch temporary key',
      );
    }
    if (response.status >= 500) {
      this.logger.error(
        `Failed to fetch API key from the server. Status: ${response.status}`,
      );
      return this.retry(retryCount + 1);
    }

    try {
      const responseJson = await response.json();
      const key = responseJson.key;
      if (typeof key === 'undefined') {
        throw new Error(
          `Response does not contain key. Response: ${JSON.stringify(
            responseJson,
          )}`,
        );
      }
      return key;
    } catch (e) {
      this.logger.error('Failed to parse the temporary API key response', e);
      return this.retry(retryCount + 1);
    }
  }

  private async retry(retryCount = 0): Promise<string> {
    const timeOutMs = Math.min(60000, Math.max(5000, 2 ** retryCount * 1000));
    this.logger.info(`Retrying to fetch API key in ${timeOutMs} ms`);
    await sleepMs(timeOutMs);
    return this.fetchTemporaryApiKey(retryCount + 1);
  }

  /**
   * Returns the online status of the browser.
   * In the non-browser environment (NodeJS) this always returns true.
   */
  private isBrowserOnline(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine;
  }
}
