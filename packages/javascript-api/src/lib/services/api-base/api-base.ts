import { ComplexError } from '../../model/errors/complex-error.js';
import { SimpleError } from '../../model/errors/simple-error.js';
import { UnknownError } from '../../model/errors/unknown-error.js';
import {
  ErrorResponse,
  GraphqlResponse,
  isErrorResponse,
  isSuccessResponse,
} from '../../model/graphql-response.js';
import { RequestInit } from '../../model/fetch.js';
import {
  AccessTokenProvider,
  bearerAuthorizationHeaders,
  sendWithRefreshOnUnauthorized,
} from '../auth-headers.js';

type RequestInitWithMethodRequired = Pick<RequestInit, 'method' | 'headers'> & {
  body?: string | File | object;
};

interface GraphqlQueryVariables {
  [key: string]: any;
}

export interface GraphqlQuery {
  query: string;
  variables?: GraphqlQueryVariables;
}

export interface SuccessResponse {
  status: number;
}
/**
 * Base functionality of the API, such as HTTP requests with the API key.
 *
 * Includes two function definitions for requesting the HTTP API and the GraphQL API, used
 * internally by other methods.
 *
 * @hidden
 */
export class ApiBase {
  /**
   * Stores the Qminder API key.
   * @private
   */
  private static apiKey: string | undefined;
  /**
   * Gives the access token that is sent as a Bearer token, instead of the API key.
   * @private
   */
  private static accessTokenProvider: AccessTokenProvider | undefined;
  /**
   * Keeps track of the API server's name.
   * @private
   */
  private static apiServer = 'api.qminder.com';

  /**
   * Set the Qminder API key used for all requests.
   * After setting the API key, you can use the library to make API calls.
   */
  static setKey(key: string) {
    this.apiKey = key;
    this.accessTokenProvider = undefined;
  }

  /**
   * Authenticate the requests with a Bearer access token, instead of an API key.
   * The provider is called before every request, so it can return a refreshed token.
   * When the API answers 401, the request is sent once more with a token that the provider
   * is asked to refresh.
   */
  static setAccessTokenProvider(provider: AccessTokenProvider) {
    this.accessTokenProvider = provider;
    this.apiKey = undefined;
  }

  /**
   * Set the domain name of the Qminder API server.
   * @param  server the server's domain name, eg 'api.qminder.com'
   * @hidden
   */
  static setServer(server: string) {
    this.apiServer = server;
  }

  /**
   * Send a HTTP request to the Qminder API at the given URL.
   * @param url the URL part to append to the API server, for example "tickets/create"
   * @param options the custom options to configure the request
   * @returns  returns a promise that resolves to the API call's JSON response as a plain object.
   */
  static async request<T = {}>(
    url: string,
    options?: RequestInitWithMethodRequired,
  ): Promise<T> {
    const init: RequestInit = {
      method: options?.method || 'GET',
      mode: 'cors',
      headers: {
        ...options?.headers,
      },
    };

    if (options?.body) {
      if (!options.method) {
        init.method = 'POST';
      }

      if (typeof File !== 'undefined' && options.body instanceof File) {
        init.body = options.body;
        init.headers['Content-Type'] = options.body.type;
      } else if (typeof options.body === 'object') {
        init.body = new URLSearchParams(options.body as any).toString();
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (typeof options.body === 'string') {
        init.body = options.body;
        init.headers['Content-Type'] = 'application/json';
      } else {
        throw new Error('Cannot determine Content-Type of data');
      }
    }

    const response = await this.send(`https://${this.apiServer}/${url}`, init);
    const text = await response.text();

    if (!text && response.ok) {
      return {} as T;
    }

    let parsedResponse: T;
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse response body as JSON: ${text}`);
    }

    if (!response.ok) {
      throw this.withStatus(this.extractError(parsedResponse), response.status);
    }

    return parsedResponse;
  }

  /**
   * Sends GraphQL query to the Qminder API.
   *
   * Sends the given query to the Qminder API, returning a Promise that resolves to the site's HTTP
   * response.
   * @param query required: GraphQL query, for example "{ me { email } }", or
   * "query X($id: ID!) { location($id) { name } }"
   * @returns a Promise that resolves to the entire response ({ statusCode, data?, errors? ... })
   * @throws when the API key is missing or invalid, or when errors in the
   * response are found
   */
  static async queryGraph<T>(query: GraphqlQuery): Promise<T> {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(query),
    };

    let response = await this.send(`https://${this.apiServer}/graphql`, init);
    let graphQLResponse: GraphqlResponse<T> = await response.json();

    if (isErrorResponse(graphQLResponse)) {
      throw this.withStatus(
        this.extractGraphQLError(graphQLResponse),
        response.status,
      );
    }
    if (isSuccessResponse(graphQLResponse)) {
      return graphQLResponse.data;
    }

    throw this.withStatus(this.extractError(graphQLResponse), response.status);
  }

  /**
   * Sends the request with the authentication of the library.
   * When the API answers 401 and the access token provider is in use, sends it once more with a new token.
   */
  private static send(url: string, init: RequestInit): Promise<Response> {
    return sendWithRefreshOnUnauthorized(async (forceRefresh) => {
      const auth = this.getAuthHeaders(forceRefresh);
      // Awaits only for a promise, so that a request with an API key starts at once.
      const authHeaders = auth instanceof Promise ? await auth : auth;

      return fetch(url, {
        ...init,
        headers: { ...init.headers, ...authHeaders },
      });
    }, this.accessTokenProvider !== undefined);
  }

  /**
   * Returns the headers at once for an API key, so the request starts without a delay.
   * Returns a promise only when the access token provider must be called.
   */
  private static getAuthHeaders(
    forceRefresh: boolean,
  ): Record<string, string> | Promise<Record<string, string>> {
    if (this.accessTokenProvider) {
      return bearerAuthorizationHeaders(this.accessTokenProvider, forceRefresh);
    }

    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    return { 'X-Qminder-REST-API-Key': this.apiKey };
  }

  private static withStatus<E extends Error & { status?: number }>(
    error: E,
    status: number,
  ): E {
    error.status = status;
    return error;
  }

  private static extractError(response: any): Error {
    if (response.message) {
      return new SimpleError(response.message);
    }

    if (response.developerMessage) {
      return new SimpleError(response.developerMessage);
    }

    // The body of an error of api-gateway, for example `{ "errorMessage": "JWT is invalid" }`
    if (response.errorMessage) {
      return new SimpleError(response.errorMessage);
    }

    if (typeof response.error === 'string') {
      return new SimpleError(response.error);
    }

    if (Object.prototype.hasOwnProperty.call(response, 'error')) {
      return new ComplexError(response.error);
    }
    if (Object.prototype.hasOwnProperty.call(response, 'errors')) {
      return new ComplexError(response.errors);
    }

    return new UnknownError();
  }

  private static extractGraphQLError(response: ErrorResponse): Error {
    return new SimpleError(
      response.errors.map((error) => error.message).join('\n'),
    );
  }
}
