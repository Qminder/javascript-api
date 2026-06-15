import { WebSocket } from 'mock-socket';

import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';
import * as backoff from '../../../util/randomized-exponential-backoff/randomized-exponential-backoff';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
}));

// Mirrors the constants in graphql.service.ts (not exported).
const MAX_FAILED_HANDSHAKES = 5;
const BLOCKED_RETRY_INTERVAL_MS = 5 * 60 * 1000;

describe('GraphQL blocked-WebSocket back-off', () => {
  let fixture: GraphQLSubscriptionsFixture;

  beforeEach(() => {
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    await fixture.cleanup();
  });

  it('should back off to a slow interval after repeated handshakes fail before connecting', async () => {
    const service = fixture.graphqlService as any;
    const backoffSpy = jest.spyOn(
      backoff,
      'calculateRandomizedExponentialBackoffTime',
    );
    const infoSpy = jest.spyOn(service.logger, 'info');

    const sub = fixture.triggerSubscription();

    // Each cycle: connect, never ACK, close before the connection is established.
    for (let i = 0; i < MAX_FAILED_HANDSHAKES; i++) {
      await fixture.waitForConnection();
      await fixture.consumeInitMessage();
      await fixture.closeWithCode(1001);
      fixture.openServer();
    }

    expect(service.consecutiveFailedHandshakes).toBeGreaterThanOrEqual(
      MAX_FAILED_HANDSHAKES,
    );
    // Fast exponential backoff is used only for the first (MAX - 1) reconnects;
    // once the cap is hit, the flat slow interval is used instead.
    expect(backoffSpy).toHaveBeenCalledTimes(MAX_FAILED_HANDSHAKES - 1);
    expect(infoSpy).toHaveBeenCalledWith(
      `Reconnect socket in ${BLOCKED_RETRY_INTERVAL_MS}ms`,
    );

    sub.unsubscribe();
  });

  it('should not count a close that happens after a successful connection', async () => {
    const service = fixture.graphqlService as any;

    const sub = fixture.triggerSubscription();
    await fixture.handleConnectionInit(); // connection_ack -> CONNECTED
    await fixture.consumeSubscribeMessage();

    expect(service.consecutiveFailedHandshakes).toBe(0);

    // A drop after the connection was established is a normal reconnect.
    await fixture.closeWithCode(1001);
    expect(service.consecutiveFailedHandshakes).toBe(0);

    fixture.openServer();
    await fixture.handleConnectionInit();
    sub.unsubscribe();
  });

  it('should reset the counter when the connection is established', async () => {
    const service = fixture.graphqlService as any;

    const sub = fixture.triggerSubscription();

    for (let i = 0; i < 2; i++) {
      await fixture.waitForConnection();
      await fixture.getNextMessage();
      await fixture.closeWithCode(1001);
      fixture.openServer();
    }
    expect(service.consecutiveFailedHandshakes).toBe(2);

    // A successful connection_ack resets the counter back to fast reconnects.
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    expect(service.consecutiveFailedHandshakes).toBe(0);

    sub.unsubscribe();
  });
});
