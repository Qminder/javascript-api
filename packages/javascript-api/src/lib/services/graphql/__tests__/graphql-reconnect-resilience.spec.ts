import { WebSocket } from 'mock-socket';

import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';
import * as backoff from '../../../util/randomized-exponential-backoff/randomized-exponential-backoff';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
}));

describe('GraphQL reconnect resilience', () => {
  let fixture: GraphQLSubscriptionsFixture;
  let backoffSpy: jest.SpyInstance;

  beforeEach(() => {
    backoffSpy = jest.spyOn(
      backoff,
      'calculateRandomizedExponentialBackoffTime',
    );
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await fixture.cleanup();
    jest.restoreAllMocks();
  });

  it('escalates reconnect backoff across repeated unstable connections', async () => {
    const sub = fixture.triggerSubscription();

    for (let cycle = 0; cycle < 3; cycle++) {
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage();
      await fixture.closeWithCode(1001);
      fixture.openServer();
    }

    const counters = backoffSpy.mock.calls.map((call) => call[0]);
    expect(counters).toEqual([0, 1, 2]);

    await fixture.handleConnectionInit();
    sub.unsubscribe();
  });

  it('does not leak ping intervals when the connection monitor restarts', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const sub = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    fixture.sendMessageToClient({ type: 'connection_ack' });
    await fixture.consumeSubscribeMessage();

    const armedIds = setIntervalSpy.mock.results.map((result) => result.value);
    const clearedIds = clearIntervalSpy.mock.calls.map((call) => call[0]);
    const liveIntervals = armedIds.filter((id) => !clearedIds.includes(id));
    expect(liveIntervals).toHaveLength(1);

    sub.unsubscribe();
  });

  it('reconnects through backoff after a pong timeout, not immediately', async () => {
    jest.useFakeTimers();
    const sub = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    await jest.runOnlyPendingTimersAsync();

    expect(backoffSpy).toHaveBeenCalled();

    jest.useRealTimers();
    sub.unsubscribe();
  });

  it('logs how long the browser was offline when it comes back online', () => {
    const service = fixture.graphqlService as any;
    const warnSpy = jest.spyOn(service.logger, 'warn');

    jest.useFakeTimers();
    service.handleBrowserOffline();
    jest.advanceTimersByTime(5000);
    service.handleBrowserOnline();
    jest.useRealTimers();

    expect(warnSpy).toHaveBeenCalledWith('Browser came back online', {
      offlineDurationMs: 5000,
    });
  });

  it('clears the previous pong timeout before arming a new one', () => {
    const service = fixture.graphqlService as any;
    service.socket = { send: jest.fn() };

    service.sendPing();
    const firstPongTimeout = service.pongTimeout;

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    service.sendPing();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstPongTimeout);
  });
});
