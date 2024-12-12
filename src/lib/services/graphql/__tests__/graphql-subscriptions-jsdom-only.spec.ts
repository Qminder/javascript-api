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
    fixture.mockApiKeyFetching();
  });

  afterEach(async () => {
    await fixture.cleanup();
  });

  it('should reconnect based on ping-pong before "onclose" retries connection', async () => {
    (sleepMs as jest.Mock).mockImplementationOnce(() => firstValueFrom(NEVER));
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.useFakeTimers();
    window.dispatchEvent(new Event('offline'));
    // 12 s timer expires (ping timeout)
    // reconnect starts
    jest.advanceTimersToNextTimerAsync();
    jest.useRealTimers();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
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

    jest.useFakeTimers(); // setTimeout is also now under jest control
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit(); // setInterval
    expect(openSocketSpy).toHaveBeenCalledTimes(1);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(1);
    await jest.advanceTimersToNextTimerAsync(); // setInterval() triggers ping message

    await fixture.consumeSubscribeMessage();
    await jest.runOnlyPendingTimersAsync(); // setInterval() triggers ping message
    await jest.advanceTimersToNextTimerAsync(); // setInterval() triggers ping message

    await fixture.consumePingMessage();

    await fixture.closeWithError(1006); // calls sleepMs()
    await jest.runAllTimersAsync(); // mock-socket internals
    sleepMsController.next(); // resolves sleepMs, calling createTemporaryApiKey and awaiting

    fixture.openServer();

    await jest.advanceTimersToNextTimerAsync(); // resolve await, calls openSocket
    await fixture.waitForConnection();

    expect(openSocketSpy).toHaveBeenCalledTimes(2);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('offline')); // calls sendPing(), which sets a pong timeout of 2000ms
    await jest.advanceTimersByTimeAsync(2000);
    // waits 2000ms, calls handleConnectionDrop
    // handleConnectionDrop does not openSocket because socket is open and
    // GQL_CONNECTION_ACK not yet received
    expect(openSocketSpy).toHaveBeenCalledTimes(2);
    expect(createSocketConnectionSpy).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });
});
