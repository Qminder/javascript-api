import gql from 'graphql-tag';
import WS from 'jest-websocket-mock';
import { WebSocket } from 'mock-socket';
import { Subscriber, lastValueFrom, take } from 'rxjs';
import { ConnectionStatus } from '../../model/connection-status';
import { GraphqlService } from './graphql.service';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../util/randomized-exponential-backoff', () => ({
  randomizedExponentialBackoff: () =>
    new Promise((resolve) => setTimeout(resolve, 4)),
}));

/**
 * The message sequence during these tests is the following:
 *
 * client -> server: 'connection_init'
 * server -> client: 'connection_ack'
 * client -> server: 'start', ID, query
 * server -> client: 'data', ID, payload
 * client -> server: 'end', ID
 * ...
 */

// Close codes: https://www.rfc-editor.org/rfc/rfc6455#section-7.4
describe('GraphQL subscriptions', () => {
  let graphqlService: GraphqlService;
  let server: WS;
  // let mockSetInterval: MockSetInterval;

  const keyValue = 'temporary_api_key';
  const PORT = 42990;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeEach(async () => {
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    graphqlService = new GraphqlService();
    jest
      .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
    jest
      .spyOn(graphqlService as any, 'getServerUrl')
      .mockReturnValue(SERVER_URL);
  });

  afterEach(async () => {
    WS.clean();
    await server.closed;
  });

  it('sends connection init to start', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await server.connected;
    const initMessage = await server.nextMessage;
    expect(initMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });
  });

  it('sends a subscribe message to the socket when someone subscribes', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    const nextMessage = await server.nextMessage;
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(nextMessage).toEqual({
      id: expect.anything(),
      type: 'start',
      payload: {
        query: 'subscription { baba }',
      },
    });
  });

  it('sends an un-subscribe message when the subscription is unsubscribed from', async () => {
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(() => {});
    await handleConnectionInit();
    await consumeSubscribeMessage();
    subscription.unsubscribe();
    expect(await server.nextMessage).toEqual({
      type: 'stop',
      id: '1',
      payload: null,
    });
  });

  it('works with graphql-tag generated documents', async () => {
    graphqlService
      .subscribe(
        gql`
          subscription {
            baba
          }
        `,
      )
      .subscribe(() => {});
    await handleConnectionInit();
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription {\n  baba\n}\n' },
    });
  });

  it('cleans up internal state when unsubscribing', async () => {
    // start the test with an empty observer-map
    expect(
      Object.keys((graphqlService as any).subscriptionObserverMap).length,
    ).toBe(0);
    // subscribe once
    const spy = jest.fn();
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(spy);
    await handleConnectionInit();
    await consumeSubscribeMessage();
    // the observer map should equal { "1": Subscriber => spy }
    expect((graphqlService as any).subscriptionObserverMap).toEqual({
      '1': expect.any(Subscriber),
    });

    // unsubscribing should clean up
    subscription.unsubscribe();
    await consumeAnyMessage();
    expect(
      Object.keys((graphqlService as any).subscriptionObserverMap).length,
    ).toBe(0);
  });

  it('when receiving a published message for a subscription that does not exist anymore, it does not throw', async () => {
    expect(
      Object.keys((graphqlService as any).subscriptionObserverMap).length,
    ).toBe(0);
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(() => {});

    await handleConnectionInit();
    await consumeSubscribeMessage();
    subscription.unsubscribe();
    await consumeAnyMessage();

    server.send({
      id: '1',
      type: 'data',
      payload: {
        data: {
          baba: 9,
        },
      },
    });
  });

  it('when the server closes the connection, it will reconnect and subscribe again', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    await consumeSubscribeMessage();
    await closeWithCode(1001); // sets timeout to try again later
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    await handleConnectionInit();
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
  });

  it('when the server replies to ping message, does not reconnect', async () => {
    const reconnectSpy = jest.spyOn(
      graphqlService as any,
      'handleConnectionDropWithThisBound',
    );
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    useFakeSetInterval();
    await handleConnectionInit();
    await jest.advanceTimersToNextTimerAsync();
    await consumeSubscribeMessage();
    expect(await server.nextMessage).toEqual({
      type: 'ping',
    });
    jest.useRealTimers();
    server.send({ type: 'pong' });

    expect(reconnectSpy).not.toHaveBeenCalled();
  });

  it('when the server sends an error, it will reconnect and subscribe again', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    useFakeSetInterval();
    await handleConnectionInit();
    await consumeSubscribeMessage();
    await closeWithError(1002);
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    await handleConnectionInit();
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    jest.useRealTimers();
  });

  it('when the connection closes abnormally, it will reconnect and subscribe again', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    await consumeSubscribeMessage();
    useFakeSetInterval();
    await closeWithError(1006);
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    jest.runAllTimers();
    await handleConnectionInit();
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
  });

  it('when a reconnection fails, it will continue to retry', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    await consumeSubscribeMessage();
    useFakeSetInterval();
    await closeWithError(1006);
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    jest.runAllTimers();
    await server.connected;
    jest.advanceTimersToNextTimer();
    // NOTE: when we don't send a CONNECTION_ACK, then we will still be in the
    // CONNECTING state.
    expect(
      await lastValueFrom(
        graphqlService.getSubscriptionConnectionObservable().pipe(take(1)),
      ),
    ).toBe(ConnectionStatus.CONNECTING);

    await closeWithError(1006);
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();

    await handleConnectionInit();
    await consumeSubscribeMessage();
  });

  async function handleConnectionInit() {
    await server.connected;
    const initMessage = (await server.nextMessage) as { type: string };
    expect(initMessage.type).toBe('connection_init');
    server.send({
      type: 'connection_ack',
    });
  }

  async function closeWithError(closeCode: number) {
    server.error({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: false,
    });
    await server.closed;
  }
  async function closeWithCode(closeCode: number) {
    server.close({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: true,
    });
    await server.closed;
  }
  async function consumeSubscribeMessage() {
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
  }
  async function consumeAnyMessage() {
    await server.nextMessage;
  }

  function useFakeSetInterval() {
    jest.useFakeTimers({
      doNotFake: [
        'Date',
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setTimeout',
        'clearTimeout',
      ],
    });
  }
});
