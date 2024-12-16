import { RequestInit } from '../../model/fetch';
import { sleepMs } from '../../util/sleep-ms/sleep-ms';

export class TemporaryApiKeyService {
  private readonly apiServer: string;
  private readonly permanentApiKey: string;

  constructor(apiServer: string, permanentApiKey: string) {
    this.apiServer = apiServer;
    this.permanentApiKey = permanentApiKey;
  }

  async fetchTemporaryApiKey(retryCount = 0): Promise<string> {
    const url = 'graphql/connection-key';
    const body: RequestInit = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'X-Qminder-REST-API-Key': this.permanentApiKey,
      },
    };

    let response: Response;

    try {
      response = await fetch(`https://${this.apiServer}/${url}`, body);
    } catch (e) {
      if (this.isBrowserOnline()) {
        console.warn('[Qminder API]: Failed to fetch temporary API key');
      } else {
        console.info(
          '[Qminder API]: Failed to fetch temporary API key. The browser is offline.',
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
      console.error(
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
      console.error(
        '[Qminder API]: Failed to parse the temporary API key response',
        e,
      );
      return this.retry(retryCount + 1);
    }
  }

  private async retry(retryCount = 0): Promise<string> {
    const timeOutMs = Math.min(60000, Math.max(5000, 2 ** retryCount * 1000));
    console.info(`[Qminder API]: Retrying to fetch API key in ${timeOutMs} ms`);
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
