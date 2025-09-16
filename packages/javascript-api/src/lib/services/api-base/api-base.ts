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
  private static apiKey: string;
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
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: RequestInit = {
      method: options?.method || 'GET',
      mode: 'cors',
      headers: {
        ...options?.headers,
        'X-Qminder-REST-API-Key': this.apiKey,
      },
    };

    if (options?.body) {
      if (options?.method !== 'PUT') {
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

    const response = await fetch(`https://${this.apiServer}/${url}`, init);
    const parsedResponse = await response.json();

    if (!response.ok) {
      throw this.extractError(parsedResponse);
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
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: RequestInit = {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(query),
    };

    let response = await fetch(`https://${this.apiServer}/graphql`, init);
    let graphQLResponse: GraphqlResponse<T> = await response.json();

    if (isErrorResponse(graphQLResponse)) {
      throw this.extractGraphQLError(graphQLResponse);
    }
    if (isSuccessResponse(graphQLResponse)) {
      return graphQLResponse.data;
    }

    throw this.extractError(graphQLResponse);
  }

  private static extractError(response: any): Error {
    if (response.message) {
      return new SimpleError(response.message);
    }

    if (response.developerMessage) {
      return new SimpleError(response.developerMessage);
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
