import {
  DocumentNode,
  GraphQLErrorExtensions,
  print,
  SourceLocation,
} from 'graphql';
import WebSocket, { CloseEvent } from 'isomorphic-ws';
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  scan,
  shareReplay,
  startWith,
  Subject,
  Subscriber,
  take,
} from 'rxjs';

import { ConnectionStatus } from '../../model/connection-status.js';
import { Logger } from '../../util/logger/logger.js';
import { calculateRandomizedExponentialBackoffTime } from '../../util/randomized-exponential-backoff/randomized-exponential-backoff.js';
import { sleepMs } from '../../util/sleep-ms/sleep-ms.js';
import { ApiBase, GraphqlQuery } from '../api-base/api-base.js';
import { TemporaryApiKeyService } from '../temporary-api-key/temporary-api-key.service.js';

function parseQuery(queryOrDocumentNode: string | DocumentNode): string {
  return typeof queryOrDocumentNode === 'string'
    ? queryOrDocumentNode
    : print(queryOrDocumentNode);
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

interface Message {
  readonly id?: string;
  readonly type: MessageType;
  readonly payload?: {
    readonly data?: Record<string, any> | null;
    readonly errors?: QminderGraphQLError[];
  };
}

interface Subscription {
  readonly messageId: string;
  readonly query: string;
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
  private readonly logger = new Logger('GraphQL');
  private apiServer: string;

  private socket: WebSocket = null;

  private connectionStatus: ConnectionStatus;

  private readonly connectionStatus$ = new BehaviorSubject<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );

  private subcriptionsCount = 0;

  private subscriptions: Subscription[] = [];

  private readonly messageSubscribers = new Map<
    string,
    Subscriber<Record<string, any>>
  >();

  private readonly subscriptionConnection$: Observable<ConnectionStatus>;

  private readonly erroredSubscriptionsAction$ = new Subject<
    | {
        readonly type: 'add';
        readonly messageId: string;
      }
    | {
        readonly type: 'remove';
        readonly messageId: string;
      }
    | {
        readonly type: 'clear';
      }
  >();

  private readonly erroredSubscriptionsMessageIds$ =
    this.erroredSubscriptionsAction$.pipe(
      scan((messageIds, action) => {
        const result = new Set(messageIds);

        switch (action.type) {
          case 'add':
            return result.add(action.messageId);
          case 'remove':
            result.delete(action.messageId);
            return result;
          case 'clear':
            return new Set();
        }
      }, new Set<string>()),
      startWith(new Set<string>()),
      shareReplay(1),
    );

  private readonly haveAnySubscriptionsErrored$ =
    this.erroredSubscriptionsMessageIds$.pipe(
      map(({ size }) => !!size),
      distinctUntilChanged(),
    );

  private erroredSubscriptionsRetryTimeout: ReturnType<
    typeof setTimeout
  > | null = null;

  private erroredSubscriptionsRetryCount = 0;

  private temporaryApiKeyService: TemporaryApiKeyService | undefined;

  private pongTimeout: any;
  private pingPongInterval: any;
  private readonly sendPingWithThisBound = this.sendPing.bind(this);

  private connectionAttemptsCount = 0;

  constructor() {
    this.setServer('api.qminder.com');

    this.subscriptionConnection$ = this.connectionStatus$.pipe(
      distinctUntilChanged(),
      shareReplay(1),
    );

    this.erroredSubscriptionsMessageIds$.subscribe();
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
   * @example
   *
   * Be notified of any created tickets
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   *
   * try {
   *   Qminder.GraphQL.subscribe(`
   *     subscription {
   *       createdTickets(locationId: 123) {
   *         id
   *         firstName
   *       }
   *     }
   *   `).subscribe((data) => {
   *     console.log(data); // { createdTickets: { id: '12', firstName: 'Marta' } }
   *   });
   * } catch (error) {
   *     console.error(error);
   * }
   * ```
   *
   * @param queryOrDocumentNode the GraphQL query to send, for example `"subscription { createdTickets(locationId: 123) { id firstName } }"`
   * @returns a RxJS Observable that will push data
   * @throws when the `queryDocument` argument is an empty string
   *
   * Retries errored subscriptions (doesn't throw) with exponential backoff.
   *
   * To get notified when any subscriptions have errored, use the {@link haveAnySubscriptionsErrored} method.
   */
  subscribe<T extends Record<string, any>>(
    queryOrDocumentNode: string | DocumentNode,
  ): Observable<T> {
    const query = parseQuery(queryOrDocumentNode);
    if (!query) {
      throw new Error(
        'GraphQLService query expects a GraphQL query as its first argument',
      );
    }

    return new Observable((subscriber) => {
      const messageId = `${++this.subcriptionsCount}`;
      this.subscriptions.push({ messageId, query });
      this.sendMessage(messageId, MessageType.GQL_START, { query });
      this.messageSubscribers.set(messageId, subscriber);

      return () => {
        if (this.messageSubscribers.has(messageId)) {
          this.sendMessage(messageId, MessageType.GQL_STOP, null);
        }

        this.cleanUpSubscription(messageId);
      };
    });
  }

  /**
   * Initialize websocket connection.
   * Can be used to create a link between the server that can be monitored via getSubscriptionConnectionObservable.
   *
   * There is no need to call this method in order for data transfer to work. The `subscribe()` method also initializes
   * a websocket connection before proceeding.
   */
  async openPendingWebSocket(): Promise<void> {
    if (
      ![ConnectionStatus.CONNECTING, ConnectionStatus.CONNECTED].includes(
        this.connectionStatus,
      )
    ) {
      await this.openSocket();
    }
  }

  /**
   * Initialize the EventsService by setting the API key.
   * When the API key is set, the socket can be opened.
   * This method is automatically called when doing Qminder.setKey().
   * @hidden
   */
  setKey(apiKey: string): void {
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
   * Have any GraphQL subscriptions been rejected by the server.
   *
   * Emits `false` if all errored subscriptions have been successfully retried.
   */
  haveAnySubscriptionsErrored(): Observable<boolean> {
    return this.haveAnySubscriptionsErrored$;
  }

  /**
   * Set the WebSocket hostname the GraphQL service uses.
   * @hidden
   */
  setServer(apiServer: string): void {
    this.apiServer = apiServer;
  }

  private cleanUpSubscription(messageId: string): void {
    this.erroredSubscriptionsAction$.next({
      type: 'remove',
      messageId,
    });

    this.messageSubscribers.delete(messageId);

    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.messageId !== messageId,
    );
  }

  private async openSocket(): Promise<void> {
    if (
      [ConnectionStatus.CONNECTING, ConnectionStatus.CONNECTED].includes(
        this.connectionStatus,
      )
    ) {
      return;
    }

    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.logger.info('Connecting to websocket');

    const temporaryApiKey = await this.getTemporaryApiKey();
    this.createSocketConnection(temporaryApiKey);
  }

  private async getTemporaryApiKey(): Promise<string> {
    return await this.temporaryApiKeyService.fetchTemporaryApiKey();
  }

  private getServerUrl(temporaryApiKey: string): string {
    return `wss://${this.apiServer}:443/graphql/subscription?rest-api-key=${temporaryApiKey}`;
  }

  private createSocketConnection(temporaryApiKey: string): void {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }

    this.socket = new WebSocket(this.getServerUrl(temporaryApiKey));

    this.socket.onopen = () => {
      this.sendRawMessage(
        JSON.stringify({
          id: undefined,
          type: MessageType.GQL_CONNECTION_INIT,
          payload: null,
        }),
      );
    };

    this.socket.onclose = (event) => {
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

        this.logger.info(`Reconnect socket in ${timer.toFixed(0)}ms`);

        sleepMs(timer).then(() => {
          this.connectionAttemptsCount++;
          this.openSocket();
        });
      }

      if (this.connectionStatus === ConnectionStatus.CONNECTING) {
        this.logger.error(
          `Received socket close event before a connection was established! Close code: ${event.code}`,
        );
      }
    };

    this.socket.onerror = () => {
      if (this.isBrowserOnline()) {
        this.logger.error('Websocket error occurred!');
      } else {
        this.logger.info('Websocket error occurred!');
      }
    };

    this.socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return;
      }

      const message: Message = JSON.parse(event.data);

      switch (message.type) {
        case MessageType.GQL_CONNECTION_KEEP_ALIVE:
          break;

        case MessageType.GQL_CONNECTION_ACK: {
          this.connectionAttemptsCount = 0;

          this.clearErroredSubscriptionsRetry();
          this.erroredSubscriptionsRetryCount = 0;
          this.erroredSubscriptionsAction$.next({ type: 'clear' });

          this.setConnectionStatus(ConnectionStatus.CONNECTED);
          this.logger.info('Connected to websocket');
          this.startConnectionMonitoring();

          let resubscriptionFailed = false;

          for (const { messageId, query } of this.subscriptions) {
            const msg = JSON.stringify({
              id: messageId,
              type: MessageType.GQL_START,
              payload: { query },
            });

            if (!this.sendRawMessage(msg)) {
              this.logger.warn(
                `Failed to re-subscribe ${this.subscriptions.length} subscription(s): WebSocket not open`,
              );

              resubscriptionFailed = true;
              break;
            }
          }

          if (resubscriptionFailed) {
            this.handleConnectionDrop();
          }

          break;
        }

        case MessageType.GQL_DATA:
          this.erroredSubscriptionsAction$.next({
            type: 'remove',
            messageId: message.id,
          });

          this.messageSubscribers.get(message.id)?.next(message.payload.data);
          break;

        case MessageType.GQL_COMPLETE: {
          const subscriber = this.messageSubscribers.get(message.id);
          this.cleanUpSubscription(message.id);
          subscriber?.complete();
          break;
        }

        case MessageType.GQL_PONG:
          clearTimeout(this.pongTimeout);
          break;

        case MessageType.GQL_ERROR:
          this.logger.warn(
            `GraphQL subscription error: ${JSON.stringify(message)}`,
          );

          this.erroredSubscriptionsAction$.next({
            type: 'add',
            messageId: message.id,
          });

          if (!this.erroredSubscriptionsRetryTimeout) {
            this.scheduleErroredSubscriptionsRetry();
          }

          break;

        default: {
          const subscriber = this.messageSubscribers.get(message.id);
          if (!subscriber) {
            return;
          }

          if (message.payload?.data) {
            this.cleanUpSubscription(message.id);
            subscriber.error(message.payload.data);
          } else if (message.payload?.errors?.length) {
            this.cleanUpSubscription(message.id);
            subscriber.error(message.payload.errors);
          }
        }
      }
    };
  }

  private shouldRetry(event: CloseEvent): boolean {
    return (
      event.code !== CLIENT_SIDE_CLOSE_EVENT || !!this.messageSubscribers.size
    );
  }

  private async sendMessage(
    id: string,
    type: MessageType,
    payload: Record<string, unknown> | null,
  ): Promise<void> {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      await this.openSocket();
      return;
    }

    if (!this.sendRawMessage(JSON.stringify({ id, type, payload }))) {
      this.logger.warn('Message dropped: WebSocket is not in OPEN state');
      await this.handleConnectionDrop();
    }
  }

  private sendRawMessage(message: string): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    }

    return false;
  }

  private setConnectionStatus(status: ConnectionStatus): void {
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
      () => this.handleConnectionDrop(),
      PONG_TIMEOUT_IN_MS,
    );

    this.sendRawMessage(JSON.stringify({ type: MessageType.GQL_PING }));
  }

  private async handleConnectionDrop(): Promise<void> {
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

    await this.openSocket();
  }

  private clearPingMonitoring(): void {
    clearTimeout(this.pongTimeout);
    clearInterval(this.pingPongInterval);
  }

  private clearErroredSubscriptionsRetry(): void {
    clearTimeout(this.erroredSubscriptionsRetryTimeout ?? undefined);
    this.erroredSubscriptionsRetryTimeout = null;
  }

  private scheduleErroredSubscriptionsRetry(): void {
    const delay = calculateRandomizedExponentialBackoffTime(
      this.erroredSubscriptionsRetryCount++,
    );

    this.logger.info(`Retry errored subscriptions in ${delay.toFixed(0)}ms`);

    this.erroredSubscriptionsRetryTimeout = setTimeout(() => {
      this.retryErroredSubscriptions();
      this.erroredSubscriptionsRetryTimeout = null;
    }, delay);
  }

  private retryErroredSubscriptions(): void {
    this.erroredSubscriptionsMessageIds$
      .pipe(take(1))
      .subscribe((messageIds) => {
        for (const messageId of messageIds) {
          const subscription = this.subscriptions.find(
            (subscription) => subscription.messageId === messageId,
          );

          if (!subscription) {
            continue;
          }

          this.sendRawMessage(
            JSON.stringify({
              id: subscription.messageId,
              type: MessageType.GQL_START,
              payload: { query: subscription.query },
            }),
          );
        }
      });
  }

  /**
   * In a non-browser environment (NodeJS) returns `true`.
   */
  private isBrowserOnline(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine;
  }
}
