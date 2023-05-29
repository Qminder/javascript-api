/**
 * @jest-environment jsdom
 */
import { WebSocket } from 'mock-socket';
import { firstValueFrom, NEVER, Subject } from 'rxjs';
import { sleepMs } from '../../../util/sleep-ms/sleep-ms';
import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: jest.fn(),
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

  it('when the browser returns online before a retry attempt, it will reconnect sooner', async () => {
    (sleepMs as jest.Mock).mockImplementationOnce(() => firstValueFrom(NEVER));
    fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1006);
    fixture.openServer();
    window.dispatchEvent(new Event('offline')); // sends ping
    // 2 s timer expires (ping timeout)
    // reconnect starts
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
  });

  it('does not initialize multiple connections if all indicators of disconnect are fired at the same time', async () => {
    const sleepMsController = new Subject<void>();
    const openSocketSpy = jest.spyOn(
      fixture.graphqlService as any,
      'openSocket',
    );
    const createSocketConnectionSpy = jest.spyOn(
      fixture.graphqlService as any,
      'createSocketConnection',
    );
    (sleepMs as jest.Mock).mockImplementationOnce(() =>
      firstValueFrom(sleepMsController),
    );

    fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit(); // setInterval
    expect(openSocketSpy).toHaveBeenCalledTimes(1);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(1);

    await fixture.consumeSubscribeMessage();
    jest.runOnlyPendingTimers(); // setInterval() triggers ping message
    await fixture.consumePingMessage();
    await fixture.closeWithError(1006); // calls sleepMs()
    jest.runAllTimers(); // mock-socket internals
    sleepMsController.next(); // resolves sleepMs, calling createTemporaryApiKey and awaiting

    jest.useFakeTimers(); // setTimeout is also now under jest control
    await jest.runOnlyPendingTimersAsync(); // resolve await, calls openSocket

    expect(openSocketSpy).toHaveBeenCalledTimes(2);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('offline')); // calls sendPing(), which sets a pong timeout of 2000ms
    fixture.openServer();
    await jest.runAllTimersAsync(); // waits 2000ms, calls handleConnectionDrop, which calls openSocket, which has an 'await' inside, which calls createSocketConnection
    expect(openSocketSpy).toHaveBeenCalledTimes(3);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(3);
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
