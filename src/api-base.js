// @flow
import querystring from 'querystring';
// $FlowFixMe
import fetch from './lib/fetch-ENV';
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE' | 'CONNECT';


/**
 * Base functionality of the API, such as HTTP requests with the API key.
 * Additionally, manages the WebSocket connection.
 * @private
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
   * @private
   */
  setServer(server: string) {
    this.apiServer = server;
  }

  /**
   * Send a HTTP request to the Qminder API at the given URL.
   * @param url  the URL part to append to the API server, for example "tickets/create"
   * @param data  the the request data, as a File or JS object (serialized to formdata)
   * @param method  the HTTP method to use, defaults to GET. POST and DELETE are used too.
   * @returns  returns a promise that resolves to the API call's JSON response as a plain object.
   */
  request(url: string,
          data?: Object | File,
          method?: HTTPMethod = 'GET'): Promise<Object> {

    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const init: RequestOptions = {
      method: method,
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
      mode: 'cors',
    };

    if (data) {
      init.method = 'POST';
      if (typeof File !== "undefined" && data instanceof File && init.headers) {
        init.body = data;
        // $FlowFixMe: there's an issue with the fetch RequestOptions type.
        init.headers['Content-Type'] = data.type;
      } else {
        init.body = querystring.stringify(data);
        // $FlowFixMe: there's an issue with the fetch RequestOptions type.
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }
    return this.fetch(`https://${this.apiServer}/v1/${url}`, init)
           .then(response => response.json())
           .then(responseJson => {
             if (responseJson.statusCode && Math.floor(responseJson.statusCode/100) !== 2) {
               throw new Error(responseJson.developerMessage || responseJson.message);
             }
             return responseJson;
           });
  }

  /**
   * Send a GraphQL query to the Qminder API.
   *
   * Sends the given query to the Qminder API, returning a Promise that resolves to the site's HTTP
   * response.
   * @param query required: he GraphQL query, for example "{ me { email } }", or
   * "query X($id: ID!) { location($id) { name } }"
   * @param variables optional: the GraphQL query's variables, for example { id: "4" }
   * @returns a Promise that resolves to the entire response ({ statusCode, data?, errors? ... })
   * @throws when the API key is missing
   * @throws when the query is undefined or an empty string
   */
  queryGraph(query: string, variables?: { [string]: any }): Promise<Object> {
    if (!query) {
      throw new Error('ApiBase.queryGraph expected a query as its first argument.');
    }
    if (!this.apiKey) {
      throw new Error('Please set the API key before making any requests.');
    }

    const requestBody: { query: string, variables?: { [string]: any }} = { query };

    if (variables) {
      requestBody.variables = variables;
    }

    const init: RequestOptions = {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
      mode: 'cors',
      body: JSON.stringify(requestBody),
    };

    return this.fetch(`https://${this.apiServer}/graphql`, init)
      .then(response => response.json());
  }
}

export default new ApiBase();
