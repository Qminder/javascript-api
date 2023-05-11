import fetch from 'cross-fetch';
import { GraphQLApiError } from '../../util/errors.js';
import { GraphqlResponse } from '../../model/graphql-response.js';

type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'DELETE'
  | 'CONNECT';

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

// NOTE: this is defined because the RequestInit type has issues
interface CorrectRequestInit {
  method?: string;
  headers?: {
    [key: string]: string;
  };
  mode?: 'cors' | 'same-origin' | 'navigate' | 'no-cors';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?:
    | 'default'
    | 'force-cache'
    | 'no-cache'
    | 'no-store'
    | 'only-if-cached'
    | 'reload';
  body?: string | Blob;
  referrer?: string;
  referrerPolicy?:
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
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

  /** The fetch() function to use for API calls.
   * @private */
  fetch: Function;

  /**
   * Constructs a new ApiBase instance.
   * @constructor
   */
  constructor() {
    this.fetch = fetch;
  }

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
   * @param url  the URL part to append to the API server, for example "tickets/create"
   * @param data  the the request data, as a File or JS object (serialized to formdata)
   * @param method  the HTTP method to use, defaults to GET. POST and DELETE are used too.
   * @param idempotencyKey  optional: the idempotency key for this request
   * @returns  returns a promise that resolves to the API call's JSON response as a plain object.
   */
  static async request<T = {}>(
    url: string,
    data?: object | File | string,
    method: HTTPMethod = 'GET',
    idempotencyKey?: string | number,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: CorrectRequestInit = {
      method,
      mode: 'cors',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
    };

    if (data) {
      if (method !== 'PUT') {
        init.method = 'POST';
      }
      if (typeof File !== 'undefined' && data instanceof File) {
        init.body = data;
        init.headers['Content-Type'] = data.type;
      } else if (typeof data === 'object') {
        init.body = new URLSearchParams(data as any).toString();
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (typeof data === 'string') {
        init.body = data;
        init.headers['Content-Type'] = 'application/json';
      } else {
        throw new Error('Cannot determine Content-Type of data');
      }
    }

    if (idempotencyKey) {
      init.headers['Idempotency-Key'] = `${idempotencyKey}`;
    }

    try {
      const response = await fetch(`https://${this.apiServer}/v1/${url}`, init);
      const parsedResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(parsedResponse.error)  
      }

      return parsedResponse;
    } catch (e: any) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  }

  /**
   * Sends GraphQL query to the Qminder API.
   *
   * Sends the given query to the Qminder API, returning a Promise that resolves to the site's HTTP
   * response.
   * @param query required: GraphQL query, for example "{ me { email } }", or
   * "query X($id: ID!) { location($id) { name } }"
   * @returns a Promise that resolves to the entire response ({ status, data?, errors? ... })
   * @throws when the API key is missing or invalid, or when errors in the
   * response are found
   */
  static queryGraph(query: GraphqlQuery): Promise<GraphqlResponse> {
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: CorrectRequestInit = {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(query),
    };

    return fetch(`https://${this.apiServer}/graphql`, init)
      .then((response: Response) => response.json())
      .then((responseJson: any) => {
        if (responseJson.errorMessage) {
          throw new Error(responseJson.errorMessage);
        }
        if (responseJson.errors && responseJson.errors.length > 0) {
          throw new GraphQLApiError(responseJson.errors);
        }
        return responseJson as Promise<GraphqlResponse>;
      });
  }
}
