/* eslint-disable max-classes-per-file */
import fetch from 'cross-fetch';
import { DocumentNode } from 'graphql';
import { print } from 'graphql/language/printer';
import WebSocket from 'isomorphic-ws';
import { Observable, Observer, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import ApiBase, { GraphqlQuery, GraphqlResponse } from '../api-base';

type QueryOrDocument = string | DocumentNode;

function queryToString(query: QueryOrDocument): string {
  if (typeof query === 'string') {
    return query;
  }
  if (query.kind === 'Document') {
    return print(query);
  }
  throw new Error('queryToString: query must be a string or a DocumentNode');
}

interface OperationMessage {
  id?: string;
  type: MessageType;
  payload?: any;
  errors?: any[];
}

class Subscription {
  public id: string;
  query: string;

  constructor(id: string, query: string) {
    this.id = id;
    this.query = query;
  }
}

enum MessageType {
  // To Server
  GQL_CONNECTION_INIT = 'connection_init',
  GQL_START = 'start',
  GQL_STOP = 'stop',

  // From Server
  GQL_CONNECTION_ACK = 'connection_ack',
  GQL_DATA = 'data',
  GQL_CONNECTION_KEEP_ALIVE = 'ka',
  GQL_COMPLETE = 'complete',
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  INITIALIZING = 'INITIALIZING',
  CONNECTED = 'CONNECTED',
}

/**
 * A service that lets the user query Qminder API via GraphQL statements.
 * Queries and subscriptions are supported. There is no support for mutations.
 *
 * Note: the GraphQL API is accessible via `Qminder.graphql`. You should use that, instead of
 * trying to import GraphQLService.
 */
export class GraphQLService {
  private apiKey: string;

  private apiServer: string;

  WebSocket: typeof WebSocket;

  fetch: Function;

  private socket: WebSocket = null;

  private connectionStatus: ConnectionStatus;
  private connectionSubject = new Subject<ConnectionStatus>();
  private connection$ = this.connectionSubject.pipe(shareReplay(1));

  private nextSubscriptionId: number = 1;

  private subscriptions: Subscription[] = [];

  private subscriptionObserverMap: { [id: string]: Observer<object> } = {};

  /** A timeout object after which to retry connecting to Qminder API. */
  private retryTimeout: any;

  /** Counts the amount of times the event emitter retried connecting. This is used for
   *  exponential retry falloff. */
  private connectionRetries = 0;

  constructor() {
    this.setServer('api.qminder.com');
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    this.fetch = fetch;
    this.WebSocket = WebSocket;
  }

  /**
   * Query Qminder API with GraphQL.
   *
   * Send a GraphQL query to the Qminder API.
   *
   * When the query contains variables, make sure to fill them all in the second parameter.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // 1. Figure out the selected location ID of the current user, with async/await
   * try {
   *     const response = await Qminder.graphql.query(`{ me { selectedLocation } }`);
   *     console.log(response.me.selectedLocation); // "12345"
   * } catch (error) {
   *     console.log(error);
   * }
   * // 2. Figure out the selected location ID of the current user, with promises
   * Qminder.graphql.query("{ me { selectedLocation } }").then(function(response) {
   *     console.log(response.me.selectedLocation);
   * }, function(error) {
   *     console.log(error);
   * });
   * ```
   *
   * @param query required: the query to send, for example `"{ me { selectedLocation } }"`
   * @param variables optional: additional variables for the query, if variables were used
   * @returns a promise that resolves to the query's results, or rejects if the query failed
   * @throws when the 'query' argument is undefined or an empty string
   */
  query(
    queryDocument: QueryOrDocument,
    variables?: { [key: string]: any },
  ): Promise<GraphqlResponse> {
    const query = queryToString(queryDocument);
    if (!query || query.length === 0) {
      throw new Error(
        'GraphQLService query expects a GraphQL query as its first argument',
      );
    }

    const packedQuery = query.replace(/\s\s+/g, ' ').trim();
    const graphqlQuery: GraphqlQuery = {
      query: packedQuery,
    };

    if (variables) {
      graphqlQuery.variables = variables;
    }

    return ApiBase.queryGraph(graphqlQuery);
  }

  /**
   * Subscribe to Qminder Events API using GraphQL.
   *
   * For example
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * // 1. Be notified of any created tickets
   * try {
   *     const observable = Qminder.graphql.subscribe("subscription { createdTickets(locationId: 123) { id firstName } }")
   *
   *     observable.subscribe(data => console.log(data));
   *     // => { createdTickets: { id: '12', firstName: 'Marta' } }
   * } catch (error) {
   *     console.error(error);
   * }
   * ```
   *
   * @param query required: the GraphQL query to send, for example `"subscription { createdTickets(locationId: 123) { id firstName } }"`
   * @returns an RxJS Observable that will push data as
   * @throws when the 'query' argument is undefined or an empty string
   */
  subscribe(queryDocument: QueryOrDocument): Observable<object> {
    const query = queryToString(queryDocument);

    if (!query || query.length === 0) {
      throw new Error(
        'GraphQLService query expects a GraphQL query as its first argument',
      );
    }

    return new Observable<object>((observer: Observer<object>) => {
      const id = this.generateOperationId();
      this.subscriptions.push(new Subscription(id, query));
      this.sendMessage(id, MessageType.GQL_START, { query });
      this.subscriptionObserverMap[id] = observer;

      return () => this.stopSubscription(id);
    });
  }

  /**
   * Initialize the EventsService by setting the API key.
   * When the API key is set, the socket can be opened.
   * This method is automatically called when doing Qminder.setKey().
   * @hidden
   */
  setKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get subscription connection observable
   * This returns an observable which fires with the connection status every time it changes.
   * @returns an RxJS obserable that will fire with the connection status every time it changes
   */
  getSubscriptionConnectionObservable(): Observable<
    'DISCONNECTED' | 'CONNECTING' | 'INITIALIZING' | 'CONNECTED'
  > {
    return this.connection$;
  }

  /**
   * Set the WebSocket hostname the GraphQL service uses.
   * @hidden
   */
  setServer(apiServer: string) {
    this.apiServer = apiServer;
  }

  private stopSubscription(id: string) {
    this.sendMessage(id, MessageType.GQL_STOP, null);

    delete this.subscriptionObserverMap[id];
    this.subscriptions = this.subscriptions.filter((sub) => {
      return sub.id !== id;
    });
  }

  private openSocket() {
    if (this.connectionStatus !== ConnectionStatus.DISCONNECTED) {
      return;
    }
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.fetchTemporaryApiKey().then((tempApiKey: string) => {
      this.createSocketConnection(tempApiKey);
    });
  }

  private fetchTemporaryApiKey(): Promise<string> {
    const url = 'graphql/connection-key';
    const body = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
    };

    return this.fetch(`https://${this.apiServer}/${url}`, body)
      .then((response: Response) => response.json())
      .then((responseJson: { key: string }) => responseJson.key);
  }

  private createSocketConnection(tempApiKey: string) {
    const socket = new this.WebSocket(
      `wss://${this.apiServer}:443/graphql/subscription?rest-api-key=${tempApiKey}`,
    );
    this.socket = socket;

    socket.onopen = () => {
      console.log('[GraphQL subscription] Connection established!');
      this.setConnectionStatus(ConnectionStatus.INITIALIZING);
      this.connectionRetries = 0;
      this.sendMessage(undefined, MessageType.GQL_CONNECTION_INIT, null);
    };

    socket.onclose = (event: { code: number }) => {
      // NOTE: if the event code is 1006, it is any of the errors in the list here:
      // https://www.w3.org/TR/websockets/#concept-websocket-close-fail
      console.log(`[GraphQL subscription] Connection lost: ${event.code}`);
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      this.socket = null;

      // If it wasn't a client-side close socket, retry connecting.
      if (event.code !== 1000) {
        // Increase the retry timeout, the more times we retry
        const timeoutMult = Math.floor(this.connectionRetries / 10);
        const newTimeout = Math.min(5000 + timeoutMult * 1000, 60000);

        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
        }

        console.log(
          `[GraphQL subscription] Reconnecting in ${
            newTimeout / 1000
          } seconds...`,
        );
        this.retryTimeout = setTimeout(this.openSocket.bind(this), newTimeout);

        this.connectionRetries += 1;
      }
    };

    socket.onerror = () => {
      console.log(
        '[GraphQL subscription] An error occurred, the websocket will disconnect.',
      );
    };

    socket.onmessage = (rawMessage: { data: WebSocket.Data }) => {
      if (typeof rawMessage.data === 'string') {
        const message: OperationMessage = JSON.parse(rawMessage.data);

        switch (message.type) {
          case MessageType.GQL_CONNECTION_KEEP_ALIVE:
            break;

          case MessageType.GQL_CONNECTION_ACK:
            this.setConnectionStatus(ConnectionStatus.CONNECTED);
            this.subscriptions.forEach((subscription) => {
              const payload = {
                query: subscription.query,
              };
              const msg = JSON.stringify({
                id: subscription.id,
                type: MessageType.GQL_START,
                payload,
              });
              this.sendRawMessage(msg);
            });
            break;

          case MessageType.GQL_DATA:
            this.subscriptionObserverMap[message.id]?.next(
              message.payload.data,
            );
            break;

          case MessageType.GQL_COMPLETE:
            this.subscriptionObserverMap[message.id]?.complete();
            break;

          default:
            if (message.payload && message.payload.data) {
              this.subscriptionObserverMap[message.id]?.error(
                message.payload.data,
              );
            } else if (message.errors && message.errors.length > 0) {
              this.subscriptionObserverMap[message.id]?.error(message.errors);
            }
        }
      }
    };
  }

  private sendMessage(id: string, type: MessageType, payload: any) {
    const message = JSON.stringify({ id, type, payload });
    if (
      this.connectionStatus === ConnectionStatus.CONNECTED ||
      this.connectionStatus === ConnectionStatus.INITIALIZING
    ) {
      this.sendRawMessage(message);
    } else {
      this.openSocket();
    }
  }

  private sendRawMessage(message: any) {
    this.socket.send(message);
  }

  private generateOperationId(): string {
    const currentId = `${this.nextSubscriptionId}`;
    this.nextSubscriptionId += 1;
    return currentId;
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.connectionSubject.next(status);
  }
}

export default new GraphQLService();
