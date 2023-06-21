import gql from 'graphql-tag';
import { WebSocket } from 'mock-socket';
import { Subscriber } from 'rxjs';
import { ConnectionStatus } from '../../../model/connection-status';
import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';
import { QminderGraphQLError } from '../graphql.service';

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
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    await fixture.cleanup();
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
    // start the test with an empty observer-map
    expect(fixture.getGraphqlServiceSubscriptionObserverMapSize()).toBe(0);
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    // the observer map should equal { "1": Subscriber => spy }
    expect(fixture.getGraphqlServiceSubscriptionObserverMap()).toEqual({
      '1': expect.any(Subscriber),
    });

    // unsubscribing should clean up
    subscription.unsubscribe();
    await fixture.consumeAnyMessage();
    expect(fixture.getGraphqlServiceSubscriptionObserverMapSize()).toBe(0);
  });

  it('when receiving a published message for a subscription that does not exist anymore, it does not throw', async () => {
    expect(fixture.getGraphqlServiceSubscriptionObserverMapSize()).toBe(0);
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

  it('connect, ping timeout, connect, ping timeout, connect', async () => {
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

  it('error messages are propagated to the subscriber', async () => {
    const ERRORS: QminderGraphQLError[] = [
      {
        message:
          "Invalid Syntax : offending token 'createdTickets' at line 1 column 1",
        sourcePreview:
          'createdTickets(locationId: 673) {\n' +
          '            id\n' +
          '            firstName\n' +
          '            lastName\n',
        offendingToken: 'createdTickets',
        locations: [],
        errorType: 'InvalidSyntax',
        extensions: null,
        path: null,
      },
    ];
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
        errors: ERRORS,
      },
    });

    expect(errorSpy).toHaveBeenCalledWith(ERRORS);
    // Cleans up as well
    expect(
      (fixture.graphqlService as any).subscriptionObserverMap['1'],
    ).toBeUndefined();

    subscription.unsubscribe();
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
