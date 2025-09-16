import {
  DocumentNode,
  GraphQLErrorExtensions,
  print,
  SourceLocation,
} from 'graphql';
import WebSocket, { CloseEvent } from 'isomorphic-ws';
import { Observable, Observer, startWith, Subject } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { ConnectionStatus } from '../../model/connection-status.js';
import { calculateRandomizedExponentialBackoffTime } from '../../util/randomized-exponential-backoff/randomized-exponential-backoff.js';
import { sleepMs } from '../../util/sleep-ms/sleep-ms.js';
import { ApiBase, GraphqlQuery } from '../api-base/api-base.js';
import { TemporaryApiKeyService } from '../temporary-api-key/temporary-api-key.service.js';
import { Logger } from '../../util/logger/logger.js';

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

export interface QminderGraphQLError {
  message: string;
  errorType?: string | null;
  extensions?: GraphQLErrorExtensions | null;
  sourcePreview?: string | null;
  offendingToken?: string | null;
  locations?: SourceLocation[] | null;
  path?: (string | number)[] | null;
}

interface OperationMessage<T = object> {
  id?: string;
  type: MessageType;
  payload?: {
    data?: T | null;
    errors?: QminderGraphQLError[];
  };
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
  GQL_ERROR = 'error',
}

const PONG_TIMEOUT_IN_MS = 12000;
const PING_PONG_INTERVAL_IN_MS = 20000;

// https://www.w3.org/TR/websockets/#concept-websocket-close-fail
const CLIENT_SIDE_CLOSE_EVENT = 1000;

/**
 * A service that lets the user query Qminder API via GraphQL statements.
 * Queries and subscriptions are supported. There is no support for mutations.
 *
 * Note: the GraphQL API is accessible via `Qminder.GraphQL`. You should use that, instead of
 * trying to import GraphQLService.
 */
export class GraphqlService {
  private logger = new Logger('GraphQL');
  private apiServer: string;

  private socket: WebSocket = null;

  private connectionStatus: ConnectionStatus;
  private connectionStatus$ = new Subject<ConnectionStatus>();

  private nextSubscriptionId: number = 1;

  private subscriptions: Subscription[] = [];
  private subscriptionObserverMap: { [id: string]: Observer<object> } = {};
  private subscriptionConnection$: Observable<ConnectionStatus>;
  private temporaryApiKeyService: TemporaryApiKeyService | undefined;

  private pongTimeout: any;
  private pingPongInterval: any;
  private sendPingWithThisBound = this.sendPing.bind(this);
  private handleConnectionDropWithThisBound =
    this.handleConnectionDrop.bind(this);

  private connectionAttemptsCount = 0;

  constructor() {
    this.setServer('api.qminder.com');

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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // 1. Figure out the selected location ID of the current user, with async/await
   * try {
   *     const response = await Qminder.GraphQL.query(`{ me { selectedLocation } }`);
   *     console.log(response.me.selectedLocation); // "12345"
   * } catch (error) {
   *     console.log(error);
   * }
   * // 2. Figure out the selected location ID of the current user, with promises
   * Qminder.GraphQL.query("{ me { selectedLocation } }").then(function(response) {
   *     console.log(response.me.selectedLocation);
   * }, function(error) {
   *     console.log(error);
   * });
   * ```
   *
   * @param queryDocument required: the query to send, for example gql`{ me { selectedLocation } }`
   * @param variables optional: additional variables for the query, if variables were used
   * @returns a promise that resolves to the query's results, or rejects if the query failed
   * @throws when the 'query' argument is undefined or an empty string
   */
  query<T>(
    queryDocument: DocumentNode,
    variables?: { [key: string]: any },
  ): Promise<T> {
    const query = print(queryDocument);
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
   * import { Qminder } from 'qminder-api';
   * // 1. Be notified of any created tickets
   * try {
   *     const observable = Qminder.GraphQL.subscribe("subscription { createdTickets(locationId: 123) { id firstName } }")
   *
   *     observable.subscribe(data => console.log(data));
   *     // => { createdTickets: { id: '12', firstName: 'Marta' } }
   * } catch (error) {
   *     console.error(error);
   * }
   * ```
   *
   * @param queryDocument required: the GraphQL query to send, for example `"subscription { createdTickets(locationId: 123) { id firstName } }"`
   * @returns an RxJS Observable that will push data as
   * @throws when the 'query' argument is undefined or an empty string
   */
  subscribe<T extends object>(queryDocument: QueryOrDocument): Observable<T> {
    const query = queryToString(queryDocument);

    if (!query || query.length === 0) {
      throw new Error(
        'GraphQLService query expects a GraphQL query as its first argument',
      );
    }

    return new Observable<T>((observer: Observer<T>) => {
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
    this.temporaryApiKeyService = new TemporaryApiKeyService(
      this.apiServer,
      apiKey,
    );
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
    this.cleanupSubscription(id);
  }

  private cleanupSubscription(id: string) {
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
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.logger.info('Connecting to websocket');
    this.fetchTemporaryApiKey()
      .then((temporaryApiKey: string) => {
        this.createSocketConnection(temporaryApiKey);
      })
      .catch((e) => {
        throw e;
      });
  }

  private async fetchTemporaryApiKey(): Promise<string> {
    return this.temporaryApiKeyService.fetchTemporaryApiKey();
  }

  private getServerUrl(temporaryApiKey: string): string {
    return `wss://${this.apiServer}:443/graphql/subscription?rest-api-key=${temporaryApiKey}`;
  }

  private createSocketConnection(temporaryApiKey: string) {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
    this.socket = new WebSocket(this.getServerUrl(temporaryApiKey));

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

    socket.onclose = (event: CloseEvent) => {
      this.logger.warn('WebSocket connection closed:', {
        code: event.code,
        reason: event.reason,
      });

      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      this.socket = null;

      this.clearPingMonitoring();
      if (this.shouldRetry(event)) {
        const timer = calculateRandomizedExponentialBackoffTime(
          this.connectionAttemptsCount,
        );
        this.logger.info(
          `Waiting for ${timer.toFixed(1)}ms before reconnecting`,
        );
        sleepMs(timer).then(() => {
          this.connectionAttemptsCount += 1;
          this.openSocket();
        });
      }

      if (this.connectionStatus === ConnectionStatus.CONNECTING) {
        this.logger.error(
          `Received socket close event before a connection was established! Close code: ${event.code}`,
        );
      }
    };

    socket.onerror = () => {
      const message = 'Websocket error occurred!';
      if (this.isBrowserOnline()) {
        this.logger.error(message);
      } else {
        this.logger.info(message);
      }
    };

    socket.onmessage = (rawMessage: { data: WebSocket.Data }) => {
      if (typeof rawMessage.data === 'string') {
        const message: OperationMessage = JSON.parse(rawMessage.data);

        switch (message.type) {
          case MessageType.GQL_CONNECTION_KEEP_ALIVE:
            break;

          case MessageType.GQL_CONNECTION_ACK:
            this.connectionAttemptsCount = 0;
            this.setConnectionStatus(ConnectionStatus.CONNECTED);
            this.logger.info('Connected to websocket');
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

          case MessageType.GQL_ERROR:
            this.subscriptionObserverMap[message.id]?.error(
              message.payload.errors,
            );
            this.cleanupSubscription(message.id);
            break;

          default:
            if (message.payload && message.payload.data) {
              this.subscriptionObserverMap[message.id]?.error(
                message.payload.data,
              );
            } else if (
              message.payload.errors &&
              message.payload.errors.length > 0
            ) {
              this.subscriptionObserverMap[message.id]?.error(
                message.payload.errors,
              );
            }
        }
      }
    };
  }

  private shouldRetry(event: CloseEvent) {
    if (event.code !== CLIENT_SIDE_CLOSE_EVENT) {
      return true;
    }

    return Object.entries(this.subscriptionObserverMap).length > 0;
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
    this.pingPongInterval = setInterval(
      this.sendPingWithThisBound,
      PING_PONG_INTERVAL_IN_MS,
    );
  }

  private monitorWithOfflineEvent(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('offline', this.sendPingWithThisBound);
      window.addEventListener('offline', this.sendPingWithThisBound);
    }
  }

  private sendPing(): void {
    this.pongTimeout = setTimeout(
      this.handleConnectionDropWithThisBound,
      PONG_TIMEOUT_IN_MS,
    );
    if (this.socket) {
      this.sendRawMessage(JSON.stringify({ type: MessageType.GQL_PING }));
    }
  }

  private handleConnectionDrop(): void {
    if (this.connectionStatus === ConnectionStatus.CONNECTING) {
      return;
    }
    if (this.isBrowserOnline()) {
      this.logger.warn(`Websocket connection dropped!`);
    } else {
      this.logger.info(`Websocket connection dropped. We are offline.`);
    }
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    this.clearPingMonitoring();

    this.openSocket();
  }

  private clearPingMonitoring(): void {
    clearTimeout(this.pongTimeout);
    clearInterval(this.pingPongInterval);
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
