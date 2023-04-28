/* eslint-disable max-classes-per-file */
import fetch from 'cross-fetch';
import { DocumentNode } from 'graphql';
import { print } from 'graphql/language/printer.js';
import WebSocket from 'isomorphic-ws';
import { Observable, Observer, startWith, Subject } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import ApiBase, { GraphqlQuery, GraphqlResponse } from '../api-base.js';
import { ConnectionStatus } from '../model/connection-status.js';

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
  id: string;
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
  GQL_PING = 'ping',

  // From Server
  GQL_CONNECTION_ACK = 'connection_ack',
  GQL_DATA = 'data',
  GQL_CONNECTION_KEEP_ALIVE = 'ka',
  GQL_COMPLETE = 'complete',
  GQL_PONG = 'pong',
}

const PONG_TIMEOUT_IN_MS = 2000;
const PING_PONG_INTERVAL = 20000;

// https://www.w3.org/TR/websockets/#concept-websocket-close-fail
const CLIENT_SIDE_CLOSE_EVENT = 1000;

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

  fetch: Function;

  private socket: WebSocket = null;

  private connectionStatus: ConnectionStatus;
  private connectionStatus$ = new Subject<ConnectionStatus>();

  private nextSubscriptionId: number = 1;

  private subscriptions: Subscription[] = [];
  private subscriptionObserverMap: { [id: string]: Observer<object> } = {};
  private subscriptionConnection$: Observable<ConnectionStatus>;

  private pongTimeout: any;
  private pingPongInterval: any;
  private sendPingWithThisBound = this.sendPing.bind(this);
  private handleConnectionDropWithThisBound = this.handleConnectionDrop.bind(this);

  constructor() {
    this.setServer('api.qminder.com');
    this.fetch = fetch;

    this.subscriptionConnection$ = this.connectionStatus$.pipe(
      startWith(ConnectionStatus.CONNECTING),
      distinctUntilChanged(),
      shareReplay(1),
    );
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
   * Initialize websocket connection.
   * Can be used to create a link between the server that can be monitored via getSubscriptionConnectionObservable.
   *
   * There is no need to call this method in order for data transfer to work. The `subscribe()` method also initializes
   * a websocket connection before proceeding.
   */
  openPendingWebSocket(): void {
    if (
      ![ConnectionStatus.CONNECTING, ConnectionStatus.CONNECTED].includes(
        this.connectionStatus,
      )
    ) {
      this.openSocket();
    }
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
   * Get active connection status
   * @returns Observable that fires on each connection status change
   */
  getSubscriptionConnectionObservable(): Observable<ConnectionStatus> {
    return this.subscriptionConnection$;
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
    if (
      [ConnectionStatus.CONNECTING, ConnectionStatus.CONNECTED].includes(
        this.connectionStatus,
      )
    ) {
      return;
    }

    console.info('[Qminder API - 27.04.]: Trying to connect to websocket!');
    this.fetchTemporaryApiKey().then((temporaryApiKey: string) => {
      this.createSocketConnection(temporaryApiKey);
    });
  }

  private async fetchTemporaryApiKey(retryCount = 0): Promise<string> {
    const url = 'graphql/connection-key';
    const body = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'X-Qminder-REST-API-Key': this.apiKey,
      },
    };

    try {
      const response = await this.fetch(
        `https://${this.apiServer}/${url}`,
        body,
      );
      const responseJson = await response.json();
      return responseJson.key;
    } catch (e) {
      const timeOut = Math.min(60000, Math.max(5000, 2 ** retryCount * 1000));
      console.warn(
        `[Qminder API - 27.04.]: Failed fetching temporary API key! Retrying in ${
          timeOut / 1000
        } seconds!`,
      );
      return new Promise((resolve) =>
        setTimeout(
          () => resolve(this.fetchTemporaryApiKey(retryCount + 1)),
          timeOut,
        ),
      );
    }
  }

  private createSocketConnection(temporaryApiKey: string) {
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.socket = new WebSocket(
      `wss://${this.apiServer}:443/graphql/subscription?rest-api-key=${temporaryApiKey}`,
    );

    const socket = this.socket;
    socket.onopen = () => {
      this.sendRawMessage(
        JSON.stringify({
          id: undefined,
          type: MessageType.GQL_CONNECTION_INIT,
          payload: null,
        }),
      );
    };

    socket.onclose = (event: { code: number }) => {
      if (event.code === CLIENT_SIDE_CLOSE_EVENT) {
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.clearMonitoring();
        this.socket = null;
      }
    };

    socket.onerror = () => {
      console.error('[Qminder API - 27.04.]: An error occurred!');
    };

    socket.onmessage = (rawMessage: { data: WebSocket.Data }) => {
      if (typeof rawMessage.data === 'string') {
        const message: OperationMessage = JSON.parse(rawMessage.data);

        switch (message.type) {
          case MessageType.GQL_CONNECTION_KEEP_ALIVE:
            break;

          case MessageType.GQL_CONNECTION_ACK:
            this.setConnectionStatus(ConnectionStatus.CONNECTED);
            console.info('[Qminder API - 27.04.]: Connected to websocket!');
            this.startConnectionMonitoring();
            this.subscriptions.forEach((subscription) => {
              const payload = { query: subscription.query };
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

          case MessageType.GQL_PONG:
            clearTimeout(this.pongTimeout);
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
    if (this.connectionStatus === ConnectionStatus.CONNECTED) {
      this.sendRawMessage(JSON.stringify({ id, type, payload }));
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
    this.connectionStatus$.next(status);
  }

  private startConnectionMonitoring(): void {
    this.monitorWithPingPong();
    this.monitorWithOfflineEvent();
  }

  private monitorWithPingPong(): void {
    this.pingPongInterval = setInterval(this.sendPingWithThisBound, PING_PONG_INTERVAL);
  }

  private monitorWithOfflineEvent(): void {
    window.addEventListener('offline', this.sendPingWithThisBound);
  }
  
  private sendPing(): void {
    this.pongTimeout = setTimeout(this.handleConnectionDropWithThisBound, PONG_TIMEOUT_IN_MS);
    this.sendRawMessage(JSON.stringify({ type: MessageType.GQL_PING }));
  }

  private handleConnectionDrop(): void {
    console.warn(`[Qminder API - 27.04.]: Websocket connection dropped!`);

    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    this.clearMonitoring();

    this.openSocket();
  }

  private clearMonitoring(): void {
    window.removeEventListener('offline', this.sendPingWithThisBound);
    clearTimeout(this.pongTimeout);
    clearInterval(this.pingPongInterval);
  }
}

export default new GraphQLService();
