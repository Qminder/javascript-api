import WS from 'jest-websocket-mock';
import { WebSocket } from 'mock-socket';
import { GraphqlService } from './graphql.service';

jest.mock('isomorphic-ws', () => WebSocket);

describe('GraphQL subscriptions', () => {
  let graphqlService: GraphqlService;
  let temporaryApiKeySpy: jest.SpyInstance;
  let server: WS;

  const keyValue = 'temporary_api_key';

  beforeEach(async () => {
    const SERVER_URL = 'ws://localhost:42990';
    server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
    graphqlService = new GraphqlService();
    temporaryApiKeySpy = jest
      .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
    jest
      .spyOn(graphqlService as any, 'getServerUrl')
      .mockReturnValue(SERVER_URL);
  });

  afterEach(async () => {
    WS.clean();
  });

  async function handleConnectionInit() {
    await server.connected;
    const initMessage = (await server.nextMessage) as { type: string };
    expect(initMessage.type).toBe('connection_init');
    await server.send({
      type: 'connection_ack',
    });
  }

  it('sends connection init to start', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await server.connected;
    const initMessage = await server.nextMessage;
    expect(initMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });
  });

  it('sends a subscribe message to the socket when someone subscribes', async () => {
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    await handleConnectionInit();
    const nextMessage = await server.nextMessage;
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(nextMessage).toEqual({
      id: expect.anything(),
      type: 'start',
      payload: {
        query: 'subscription { baba }',
      },
    });
  });

  it('sends an un-subscribe message when the subscription is unsubscribed from', async () => {
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(() => {});
    await handleConnectionInit();
    expect(await server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    subscription.unsubscribe();
    expect(await server.nextMessage).toEqual({
      type: 'stop',
      id: '1',
      payload: null,
    });
  });

  /*
  it('works with graphql-tag generated documents', async () => {
    const sendMessageSpy = jest.spyOn(graphqlService as any, 'sendMessage');
    graphqlService
      .subscribe(
        gql`
          subscription {
            baba
          }
        `,
      )
      .subscribe(() => {});
    // wait until the web socket connection was opened
    await new Promise(process.nextTick);
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.anything(),
      'start',
      expect.objectContaining({
        query: 'subscription {\n  baba\n}\n',
      }),
    );
  });

  it('does not automatically add leading "subscription {" and trailing "}"', async () => {
    const sendMessageSpy = jest.spyOn(graphqlService as any, 'sendMessage');
    graphqlService
      .subscribe(
        gql`
          subscription {
            baba
          }
        `,
      )
      .subscribe(() => {});
    // wait until the web socket connection was opened
    await new Promise(process.nextTick);
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.anything(),
      'start',
      expect.objectContaining({
        query: 'subscription {\n  baba\n}\n',
      }),
    );
  });

  describe('.stopSubscription', () => {
    it('cleans up internal state when unsubscribing', () => {
      // start the test with an empty observer-map
      expect(
        Object.keys((graphqlService as any).subscriptionObserverMap).length,
      ).toBe(0);
      // subscribe once
      const spy = jest.fn();
      const subscription = graphqlService
        .subscribe('subscription { baba }')
        .subscribe(spy);

      // the observer map should equal { "1": Subscriber => spy }
      expect((graphqlService as any).subscriptionObserverMap).toEqual({
        '1': expect.any(Subscriber),
      });

      // unsubscribing should clean up
      subscription.unsubscribe();
      expect(
        Object.keys((graphqlService as any).subscriptionObserverMap).length,
      ).toBe(0);
    });
  });

  it('when receiving a published message for a subscription that does not exist anymore, it does not throw', async () => {
    expect(
      Object.keys((graphqlService as any).subscriptionObserverMap).length,
    ).toBe(0);
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(() => {});
    // wait until the web socket connection was opened
    await new Promise(process.nextTick);
    subscription.unsubscribe();
    const internalSock = (graphqlService as any).socket;

    expect(() => {
      internalSock.onmessage({
        data: JSON.stringify({
          type: 'data',
          id: '1',
          payload: {
            data: {
              baba: 12345,
            },
          },
        }),
      });
    }).not.toThrow();
  });
  */
});
