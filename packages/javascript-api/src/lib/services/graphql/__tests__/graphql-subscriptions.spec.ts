import gql from 'graphql-tag';
import fetchMock from 'jest-fetch-mock';
import { WebSocket } from 'mock-socket';
import { ConnectionStatus } from '../../../model/connection-status';
import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
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
  let fixture: GraphQLSubscriptionsFixture;

  beforeEach(async () => {
    fetchMock.enableMocks();
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    await fixture.cleanup();
    fetchMock.mockClear();
  });

  it('sends connection init to start', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.waitForConnection();
    const initMessage = await fixture.getNextMessage();
    expect(initMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });

    subscription.unsubscribe();
  });

  it('sends a subscribe message to the socket when someone subscribes', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    const nextMessage = await fixture.getNextMessage();
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(nextMessage).toEqual({
      id: expect.anything(),
      type: 'start',
      payload: {
        query: 'subscription { baba }',
      },
    });

    subscription.unsubscribe();
  });

  it('sends an un-subscribe message when the subscription is unsubscribed from', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    expect(await fixture.getNextMessage()).toEqual({
      type: 'stop',
      id: '1',
      payload: null,
    });
  });

  it('works with graphql-tag generated documents', async () => {
    const subscription = fixture.triggerSubscription(
      gql`
        subscription {
          baba
        }
      `,
    );
    await fixture.handleConnectionInit();
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription {\n  baba\n}\n' },
    });

    subscription.unsubscribe();
  });

  it('cleans up internal state when unsubscribing', async () => {
    expect(fixture.getMessageSubscribersSize()).toBe(0);
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    expect(fixture.getMessageSubscribersSize()).toBe(1);
    expect(fixture.hasMessageSubscriber('1')).toBe(true);

    subscription.unsubscribe();
    await fixture.consumeAnyMessage();
    expect(fixture.getMessageSubscribersSize()).toBe(0);
  });

  it('when receiving a published message for a subscription that does not exist anymore, it does not throw', async () => {
    expect(fixture.getMessageSubscribersSize()).toBe(0);
    const subscription = fixture.triggerSubscription();

    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    await fixture.consumeAnyMessage();

    fixture.sendMessageToClient({
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
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithCode(1001); // sets timeout to try again later
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    subscription.unsubscribe();
  });

  it('when the server does not reply to ping message, reconnects', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDropWithThisBound',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    await jest.runOnlyPendingTimersAsync();

    expect(reconnectSpy).toHaveBeenCalled();
    await fixture.consumeInitMessage();
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('handles multiple consecutive connect/ping/timeout cycles gracefully', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDropWithThisBound',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    // ping
    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    // timeout
    await jest.runOnlyPendingTimersAsync();
    expect(reconnectSpy).toHaveBeenCalledTimes(1);

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    // ping
    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    // timeout
    await jest.runOnlyPendingTimersAsync();
    expect(reconnectSpy).toHaveBeenCalledTimes(2);

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('when the server replies to ping message, does not reconnect', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDropWithThisBound',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync();
    expect(await fixture.getNextMessage()).toEqual({
      type: 'ping',
    });

    fixture.sendMessageToClient({ type: 'pong' });
    await jest.runOnlyPendingTimersAsync();

    expect(reconnectSpy).not.toHaveBeenCalled();
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('when the server sends an error, it will reconnect and subscribe again', async () => {
    const subscription = fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1002);
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('reconnects when there are open subscriptions, and the server closes with code 1000', async () => {
    const subscription = fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1000);
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('does not reconnect when there are no open subscriptions, and the server closes with code 1000', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    await fixture.consumeAnyMessage();
    await fixture.closeWithError(1000, 'Bye Bye');
    fixture.openServer();
    expect(fixture.server.messages).toHaveLength(0);
  });

  it('when the connection closes abnormally, it will reconnect and subscribe again', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    useFakeSetInterval();
    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.runAllTimers();
    await fixture.handleConnectionInit();
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    subscription.unsubscribe();
  });

  it('when a reconnection fails, it will continue to retry', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    useFakeSetInterval();
    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.runAllTimers();
    await fixture.waitForConnection();
    jest.advanceTimersToNextTimer();
    // NOTE: when we don't send a CONNECTION_ACK, then we will still be in the
    // CONNECTING state.
    expect(await fixture.getConnectionStatus()).toBe(
      ConnectionStatus.CONNECTING,
    );

    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();

    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
  });

  it('GQL_ERROR does not kill the subscription or trigger reconnect', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDrop',
    );
    const errorSpy = jest.fn();
    const subscription = fixture.triggerSubscription('subscription { baba }', {
      error: errorSpy,
    });
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: [{ message: 'Subscription limit reached' }],
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(reconnectSpy).not.toHaveBeenCalled();
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(fixture.hasMessageSubscriber('1')).toBe(true);

    subscription.unsubscribe();
  });

  it('GQL_ERROR emits true on the subscription error observable', async () => {
    const values: boolean[] = [];
    fixture.graphqlService
      .getSubscriptionErrorObservable()
      .subscribe((v) => values.push(v));

    const subscription = fixture.triggerSubscription('subscription { baba }');
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: [
          {
            message:
              'The maximum subscription limit of 100 has been reached',
          },
        ],
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(values).toEqual([false, true]);

    subscription.unsubscribe();
  });

  it('retries failed subscriptions after delay and clears error state', async () => {
    (fixture.graphqlService as any).subscriptionRetryDelayMs = 50;

    const values: boolean[] = [];
    fixture.graphqlService
      .getSubscriptionErrorObservable()
      .subscribe((v) => values.push(v));

    const subscription = fixture.triggerSubscription('subscription { baba }');
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: [{ message: 'Limit reached' }],
      },
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(values).toEqual([false, true]);

    await new Promise((r) => setTimeout(r, 60));

    expect(values).toEqual([false, true, false]);
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });

    subscription.unsubscribe();
  });

  it('does not send GQL_STOP when server sends GQL_COMPLETE', async () => {
    const completeSpy = jest.fn();
    const subscription = fixture.triggerSubscription('subscription { baba }', {
      next: () => {},
      complete: completeSpy,
    });
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.sendMessageToClient({
      id: '1',
      type: 'complete',
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(completeSpy).toHaveBeenCalled();
    expect(fixture.hasMessageSubscriber('1')).toBe(false);
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(0);
    expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);

    subscription.unsubscribe();
  });

  it('GQL_ERROR keeps subscription tracked so it re-subscribes on natural reconnect and clears error state', async () => {
    const values: boolean[] = [];
    fixture.graphqlService
      .getSubscriptionErrorObservable()
      .subscribe((v) => values.push(v));

    const subscription = fixture.triggerSubscription('subscription { baba }');
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.sendMessageToClient({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: [{ message: 'Limit reached' }],
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(fixture.hasMessageSubscriber('1')).toBe(true);
    expect(values).toEqual([false, true]);

    await fixture.closeWithCode(1001);
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });

    expect(values).toEqual([false, true, false]);

    subscription.unsubscribe();
  });

  it('cleans up subscription on unknown message type with errors', async () => {
    const errorSpy = jest.fn();
    const subscription = fixture.triggerSubscription('subscription { baba }', {
      error: errorSpy,
    });
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.sendMessageToClient({
      id: '1',
      type: 'unknown_type',
      payload: {
        errors: [{ message: 'Something went wrong' }],
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something went wrong' }),
    );
    expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(0);
    expect(fixture.hasMessageSubscriber('1')).toBe(false);

    subscription.unsubscribe();
  });

  describe('WebSocket readyState guards', () => {
    it('triggers reconnection when socket is not in OPEN state during sendMessage', async () => {
      const service = fixture.graphqlService as any;
      const handleDropSpy = jest.spyOn(service, 'handleConnectionDrop');

      const sub = fixture.triggerSubscription();
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage();

      // mock-socket doesn't support simulating a half-closed socket,
      // so we override readyState directly to test the guard
      Object.defineProperty(service.socket, 'readyState', {
        value: 0,
        writable: true,
      });
      service.connectionStatus = ConnectionStatus.CONNECTED;

      service.sendMessage('99', 'start', { query: 'subscription { test }' });

      expect(handleDropSpy).toHaveBeenCalled();
      expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);

      sub.unsubscribe();
    });

    it('sendPing skips sending when socket is not OPEN but still sets pong timeout', () => {
      const service = fixture.graphqlService as any;
      service.socket = { readyState: 0, send: jest.fn() };
      service.pongTimeout = null;

      service.sendPing();

      expect(service.pongTimeout).not.toBeNull();
      expect(service.socket.send).not.toHaveBeenCalled();

      clearTimeout(service.pongTimeout);
    });

    it('triggers reconnection when re-subscription fails during connection_ack', async () => {
      const service = fixture.graphqlService as any;
      const handleDropSpy = jest.spyOn(service, 'handleConnectionDrop');
      const loggerWarnSpy = jest.spyOn(service.logger, 'warn');

      const sub1 = fixture.triggerSubscription('subscription { first }');
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage('subscription { first }');

      await fixture.closeWithCode(1001);
      fixture.openServer();
      await fixture.waitForConnection();
      await fixture.consumeInitMessage();

      // mock-socket doesn't support simulating a half-closed socket,
      // so we override readyState directly to test the guard
      Object.defineProperty(service.socket, 'readyState', {
        value: 0,
        writable: true,
      });
      fixture.sendMessageToClient({ type: 'connection_ack' });

      // Allow mock-socket message delivery to settle
      await new Promise((r) => setTimeout(r, 10));

      const resubWarnings = loggerWarnSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Failed to re-subscribe'),
      );
      expect(resubWarnings).toHaveLength(1);
      expect(handleDropSpy).toHaveBeenCalled();

      sub1.unsubscribe();
    });
  });

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
