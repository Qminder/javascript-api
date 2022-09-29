import * as fetch from 'isomorphic-fetch';
import { GraphQLApiError } from './util/errors';
import { ClientError } from './model/ClientError';

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

interface GraphqlError {
  message: string;
  errorType: string;
  validationErrorType?: string;
  queryPath: string[];
  path?: any;
  extensions?: any;
  locations: { line: number; column: number; sourceName: string }[];
}

/**
 * The shape of the JSON response from the GraphQL API.
 */
export interface GraphqlResponse {
  /** An array that contains any GraphQL errors. */
  errors?: GraphqlError[];
  /** If the data was loaded without any errors, contains the requested object. */
  data?: object;
}

interface LegacyErrorResponse {
  statusCode: number;
  message: string;
  developerMessage: string;
}

interface ClientErrorResponse {
  statusCode: number;
  error: {
    [key: string]: string;
  };
}

export interface SuccessResponse {
  statusCode: number;
}

type ApiResponse<T = {}> =
  | LegacyErrorResponse
  | ClientErrorResponse
  | (SuccessResponse & T);

/**
 * Returns true if an ApiResponse is an Error response, usable as a type guard.
 * @param response an ApiResponse to narrow down
 * @returns true if the ApiResponse is an LegacyErrorResponse, false if it is a SuccessResponse
 * @hidden
 */
function responseIsLegacyError(
  response: ApiResponse,
): response is LegacyErrorResponse {
  return (
    response.statusCode &&
    Math.floor(response.statusCode / 100) !== 2 &&
    !Object.prototype.hasOwnProperty.call(response, 'error')
  );
}

/**
 * Returns true if an ApiResponse is an ClientErrorResponse response, usable as a type guard.
 * @param response an ApiResponse to narrow down
 * @returns true if the ApiResponse is an ClientErrorResponse, false if it is a SuccessResponse
 * @hidden
 */
function responseIsClientError(
  response: ApiResponse,
): response is ClientErrorResponse {
  return (
    response.statusCode &&
    Math.floor(response.statusCode / 100) === 4 &&
    Object.prototype.hasOwnProperty.call(response, 'error')
  );
}

// NOTE: this is defined because the RequestInit type has issues
interface CorrectRequestInit {
  method?: string;
  headers?: {
    [key: string]: string;
  };
  mode?: 'cors' | 'same-origin' | 'navigate' | 'no-cors';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?: string;
  body?: string | Blob;
  referrer?: string;
  referrerPolicy?: string;
}

/**
 * Base functionality of the API, such as HTTP requests with the API key.
 *
 * Includes two function definitions for requesting the HTTP API and the GraphQL API, used
 * internally by other methods.
 *
 * @hidden
 */
class ApiBase {
  /**
   * Stores the Qminder API key.
   * @private
   */
  apiKey: string;
  /**
   * Keeps track of the API server's name.
   * @private
   */
  apiServer: string;

  /** The fetch() function to use for API calls.
   * @private */
  fetch: Function;

  /**
   * Constructs a new ApiBase instance.
   * @constructor
   */
  constructor() {
    this.fetch = fetch;
    if (typeof (fetch as any).default === 'function') {
      this.fetch = (fetch as any).default as Function;
    }
    this.setServer('api.qminder.com');
  }

  /**
   * Set the Qminder API key used for all requests.
   * After setting the API key, you can use the library to make API calls.
   */
  setKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Set the domain name of the Qminder API server.
   * @param  server the server's domain name, eg 'api.qminder.com'
   * @hidden
   */
  setServer(server: string) {
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
  request<T = {}>(
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

    return this.fetch(`https://${this.apiServer}/v1/${url}`, init)
      .then((response: Response) => response.json())
      .then((responseJson: ApiResponse) => {
        if (responseIsLegacyError(responseJson)) {
          throw new Error(
            responseJson.developerMessage || responseJson.message,
          );
        }
        if (responseIsClientError(responseJson)) {
          const key = Object.keys(responseJson.error)[0];
          const message = Object.values(responseJson.error)[0];
          throw new ClientError(key, message);
        }
        return responseJson;
      });
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
  queryGraph(query: GraphqlQuery): Promise<GraphqlResponse> {
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: CorrectRequestInit = {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(query),
    };

    return this.fetch(`https://${this.apiServer}/graphql`, init)
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

export default new ApiBase();
