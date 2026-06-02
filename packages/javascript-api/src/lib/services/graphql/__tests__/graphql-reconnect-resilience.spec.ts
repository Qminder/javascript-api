import { WebSocket } from 'mock-socket';

import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';
import * as backoff from '../../../util/randomized-exponential-backoff/randomized-exponential-backoff';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
}));

/**
 * Regression tests for the per-device API-key storm: a single iPad minting
 * tens of thousands of DEVICE_SIGN_IN keys/day. Each reconnect fetches a fresh
 * temporary key, so excessive/uncontrolled reconnects translate directly into
 * excessive key creation.
 */
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

  // Bug 4: connectionAttemptsCount resets to 0 on every ACK, so a flapping
  // connection that briefly connects then drops never backs off — it stays
  // pinned at the 5s floor forever, maximizing key minting.
  it('escalates reconnect backoff across repeated unstable connections', async () => {
    const sub = fixture.triggerSubscription();

    for (let cycle = 0; cycle < 3; cycle++) {
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage();
      // connection drops almost immediately — never stable
      await fixture.closeWithCode(1001);
      fixture.openServer();
    }

    const counters = backoffSpy.mock.calls.map((call) => call[0]);
    // An unstable connection must back off progressively, not reset each time.
    expect(counters).toEqual([0, 1, 2]);

    // Settle the final reconnect into a clean, terminal state so the service
    // does not keep reconnecting on the shared port into the next test.
    await fixture.handleConnectionInit();
    sub.unsubscribe();
  });

  // Bug 2: monitorWithPingPong re-arms setInterval without clearing the prior
  // one. Each extra ACK leaks a ping timer that keeps firing forever, and every
  // leaked timer can independently drive a reconnect (= a new key).
  it('does not leak ping intervals when the connection monitor restarts', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const sub = fixture.triggerSubscription();
    await fixture.handleConnectionInit(); // ACK #1 -> ping monitor armed
    await fixture.consumeSubscribeMessage();

    // A second ACK on the same connection restarts monitoring.
    fixture.sendMessageToClient({ type: 'connection_ack' });
    await fixture.consumeSubscribeMessage(); // resubscribe from the 2nd ACK

    const armedIds = setIntervalSpy.mock.results.map((result) => result.value);
    const clearedIds = clearIntervalSpy.mock.calls.map((call) => call[0]);
    const liveIntervals = armedIds.filter((id) => !clearedIds.includes(id));
    // Exactly one ping interval may be alive, no matter how often we re-monitor.
    expect(liveIntervals).toHaveLength(1);

    sub.unsubscribe();
  });

  // Bug 1: handleConnectionDrop (pong timeout) reconnects immediately via its
  // own path, bypassing the backoff used by the socket's onclose handler. A
  // flapping connection then reconnects with no throttling -> key storm.
  it('reconnects through backoff after a pong timeout, not immediately', async () => {
    jest.useFakeTimers();
    const sub = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync(); // ping sent, pong timeout armed
    await fixture.consumePingMessage();

    await jest.runOnlyPendingTimersAsync(); // pong timeout fires -> drop

    // The pong-timeout drop must use the same backoff path as a socket close.
    expect(backoffSpy).toHaveBeenCalled();

    jest.useRealTimers();
    sub.unsubscribe();
  });

  // Observability: log how long the device was offline so the frequency and
  // duration of network loss is visible per device in the logs.
  it('logs how long the browser was offline when it comes back online', () => {
    const service = fixture.graphqlService as any;
    const warnSpy = jest.spyOn(service.logger, 'warn');

    jest.useFakeTimers();
    service.handleBrowserOffline();
    jest.advanceTimersByTime(5000); // 5s offline
    service.handleBrowserOnline();
    jest.useRealTimers();

    expect(warnSpy).toHaveBeenCalledWith('Browser came back online', {
      offlineDurationMs: 5000,
    });
  });

  // Bug 3: sendPing re-arms pongTimeout without clearing the previous one, so a
  // stale pong timer can fire and drop a healthy connection.
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
