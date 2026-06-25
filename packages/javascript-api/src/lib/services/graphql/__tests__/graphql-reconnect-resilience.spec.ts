import { WebSocket } from 'mock-socket';

import { ConnectionStatus } from '../../../model/connection-status';
import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';
import * as backoff from '../../../util/randomized-exponential-backoff/randomized-exponential-backoff';
import * as sleep from '../../../util/sleep-ms/sleep-ms';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: jest.fn(() => new Promise((resolve) => setTimeout(resolve, 4))),
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
    await fixture.cleanup();
  });

  it('should escalate reconnect backoff across repeated unstable connections', async () => {
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

  it('should back off using the attempt counter when a connection drops after ACK', async () => {
    const service = fixture.graphqlService as any;
    service.connectionStatus = ConnectionStatus.CONNECTED;
    service.connectionAttemptsCount = 2;

    const openSocketSpy = jest
      .spyOn(service, 'openSocket')
      .mockResolvedValue(undefined);

    await service.handleConnectionDrop();

    expect(backoffSpy).toHaveBeenCalledWith(2);
    expect(service.connectionAttemptsCount).toBe(3);
    expect(openSocketSpy).toHaveBeenCalledTimes(1);
  });

  it('should defer the reconnect until the backoff delay elapses', async () => {
    const service = fixture.graphqlService as any;
    service.connectionStatus = ConnectionStatus.CONNECTED;

    const sleepMs = sleep.sleepMs as jest.Mock;
    sleepMs.mockClear();
    let resolveSleep: () => void;
    sleepMs.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSleep = resolve;
      }),
    );

    const openSocketSpy = jest
      .spyOn(service, 'openSocket')
      .mockResolvedValue(undefined);

    const dropPromise = service.handleConnectionDrop();

    // The backoff is armed, but the reconnect must wait for it to elapse.
    expect(sleepMs).toHaveBeenCalledTimes(1);
    expect(openSocketSpy).not.toHaveBeenCalled();

    resolveSleep();
    await dropPromise;

    expect(openSocketSpy).toHaveBeenCalledTimes(1);
  });

  it('should not leak ping intervals when the connection monitor restarts', async () => {
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

  it('should reconnect through backoff after a pong timeout, not immediately', async () => {
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

  it('should log how long the browser was offline when it comes back online', () => {
    const service = fixture.graphqlService as any;
    const warnSpy = jest.spyOn(service.logger, 'warn');
    let now = 1000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

    service.handleBrowserOffline();
    now = 6000;
    service.handleBrowserOnline();

    expect(warnSpy).toHaveBeenCalledWith('Browser came back online', {
      offlineDurationMs: 5000,
    });

    nowSpy.mockRestore();
  });

  it('should clear the previous pong timeout before arming a new one', () => {
    const service = fixture.graphqlService as any;
    service.socket = { send: jest.fn() };

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    service.sendPing();

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    service.sendPing();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(
      setTimeoutSpy.mock.results[0].value,
    );
  });
});
