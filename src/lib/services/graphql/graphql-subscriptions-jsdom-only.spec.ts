/**
 * @jest-environment jsdom
 */
import { WebSocket } from 'mock-socket';
import { NEVER, firstValueFrom } from 'rxjs';
import { GraphQLSubscriptionsFixture } from './graphql-subscriptions-fixture';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../util/randomized-exponential-backoff', () => ({
  randomizedExponentialBackoff: () => firstValueFrom(NEVER),
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
});
