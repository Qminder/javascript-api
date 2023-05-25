import gql from 'graphql-tag';
import { WebSocket } from 'mock-socket';
import { Subscriber } from 'rxjs';
import { ConnectionStatus } from '../../model/connection-status';
import { GraphQLSubscriptionsFixture } from './graphql-subscriptions-fixture';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../util/sleep-ms', () => ({
  sleepMs: () =>
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
  let fixture: GraphQLSubscriptionsFixture;

  beforeEach(async () => {
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    await fixture.cleanup();
  });

  it('sends connection init to start', async () => {
    fixture.triggerSubscription();
    await fixture.waitForConnection();
    const initMessage = await fixture.getNextMessage();
    expect(initMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });
  });

  it('sends a subscribe message to the socket when someone subscribes', async () => {
    fixture.triggerSubscription();
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
    fixture.triggerSubscription(
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
    fixture.triggerSubscription();
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
  });

  it('when the server replies to ping message, does not reconnect', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDropWithThisBound',
    );
    fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit();
    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumeSubscribeMessage();
    expect(await fixture.getNextMessage()).toEqual({
      type: 'ping',
    });
    jest.useRealTimers();
    fixture.sendMessageToClient({ type: 'pong' });

    expect(reconnectSpy).not.toHaveBeenCalled();
  });

  it('when the server sends an error, it will reconnect and subscribe again', async () => {
    fixture.triggerSubscription();
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
  });

  it('when the connection closes abnormally, it will reconnect and subscribe again', async () => {
    fixture.triggerSubscription();
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
  });

  it('when a reconnection fails, it will continue to retry', async () => {
    fixture.triggerSubscription();
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
