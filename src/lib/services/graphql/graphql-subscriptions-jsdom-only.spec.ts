/**
 * @jest-environment jsdom
 */
import WS from 'jest-websocket-mock';
import { WebSocket } from 'mock-socket';
import { NEVER, firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';

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
  let graphqlService: GraphqlService;
  let server: WS;
  // let mockSetInterval: MockSetInterval;

  const keyValue = 'temporary_api_key';
  const PORT = 42990;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeEach(async () => {
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    graphqlService = new GraphqlService();
    jest
      .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
    jest
      .spyOn(graphqlService as any, 'getServerUrl')
      .mockReturnValue(SERVER_URL);
  });

  afterEach(async () => {
    WS.clean();
    await server.closed;
  });

  it('when the browser returns online before a retry attempt, it will reconnect sooner', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    await consumeSubscribeMessage();
    await closeWithError(1006);
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    window.dispatchEvent(new Event('offline')); // sends ping
    // 2 s timer expires (ping timeout)
    // reconnect starts
    await handleConnectionInit();
    await consumeSubscribeMessage();
  });

  async function handleConnectionInit() {
    await server.connected;
    const initMessage = (await server.nextMessage) as { type: string };
    expect(initMessage.type).toBe('connection_init');
    server.send({
      type: 'connection_ack',
    });
  }

  async function closeWithError(closeCode: number) {
    server.error({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: false,
    });
    await server.closed;
  }
  async function closeWithCode(closeCode: number) {
    server.close({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: true,
    });
    await server.closed;
  }
  async function consumeSubscribeMessage() {
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
  }
  async function consumeAnyMessage() {
    await server.nextMessage;
  }

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
