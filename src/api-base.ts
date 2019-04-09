import * as querystring from 'querystring';
import * as fetch from 'isomorphic-fetch';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE' | 'CONNECT';

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
  locations: {line: number, column: number, sourceName: string}[];
}

/**
 * The shape of the JSON response from the GraphQL API.
 */
export interface GraphqlResponse {
  /** If all went well, 200. The response may still have errors. */
  statusCode: number;
  /** An array that contains any GraphQL errors. */
  errors: GraphqlError[];
  /** If the data was loaded without any errors, contains the requested object. */
  data?: object;
}

export interface GraphqlBatchResponse {
  statusCode: number;
  errors: GraphqlError[];
  data: {
    errors: GraphqlError[];
    data?: object;
  }[];
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  developerMessage: string;
}

interface SuccessResponse {
  statusCode: number;
}

type ApiResponse = ErrorResponse | SuccessResponse;

/**
 * Returns true if an ApiResponse is an Error response, usable as a type guard.
 * @param response an ApiResponse to narrow down
 * @returns true if the ApiResponse is an ErrorResponse, false if it is a SuccessResponse
 * @hidden
 */
function responseIsError(response: ApiResponse): response is ErrorResponse {
  return response.statusCode && Math.floor(response.statusCode / 100) !== 2;
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
      this.fetch = ((fetch as any).default as Function);
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
  request(url: string,
          data?: Object | File | string,
          method: HTTPMethod = 'GET',
          idempotencyKey?: string | number): Promise<Object> {

    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: CorrectRequestInit = {
      method: method,
      mode: 'cors',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey
      },
    };

    if (data) {
      init.method = 'POST';
      if (typeof File !== "undefined" && data instanceof File && init.headers) {
        init.body = data;
        init.headers['Content-Type'] = data.type;
      } else if (typeof data === 'object') {
        init.body = querystring.stringify(data);
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (typeof data === 'string') {
        init.body = data;
        init.headers['Content-Type'] = 'application/json';
      } else {
        throw new Error('Cannot determine Content-Type of data')
      }
    }

    if (idempotencyKey) {
      init.headers['Idempotency-Key'] = `${idempotencyKey}`;
    }

    return this.fetch(`https://${this.apiServer}/v1/${url}`, init)
           .then((response: Response) => response.json())
           .then((responseJson: ApiResponse) => {
             if (responseIsError(responseJson)) {
               throw new Error(responseJson.developerMessage || responseJson.message);
             }
             return responseJson;
           });
  }

  /**
   * Sends list of GraphQL queries to the Qminder API.
   *
   * Sends the given query to the Qminder API, returning a Promise that resolves to the site's HTTP
   * response.
   * @param queries required: list of GraphQL queries, for example "{ me { email } }", or
   * "query X($id: ID!) { location($id) { name } }"
   * @returns a Promise that resolves to the entire response ({ statusCode, data?, errors? ... })
   * @throws when the API key is missing
   */

  queryGraph(queries: GraphqlQuery[]): Promise<GraphqlBatchResponse> {
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: RequestInit = {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
      mode: 'cors',
      body: JSON.stringify(queries),
    };

    return (this.fetch(`https://${this.apiServer}/graphql`, init)
      .then((response: Response) => response.json()) as Promise<GraphqlBatchResponse>);
  }
}

export default new ApiBase();
