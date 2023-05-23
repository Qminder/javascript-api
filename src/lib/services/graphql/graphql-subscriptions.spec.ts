import { gql } from 'graphql-tag';

import WebSocket from 'isomorphic-ws';
import { Subscriber } from 'rxjs';
import { GraphqlService } from './graphql.service';

jest.mock('isomorphic-ws', () => jest.fn());

describe('GraphQL subscriptions', () => {
  let graphqlService: GraphqlService;
  let temporaryApiKeySpy: jest.SpyInstance;
  const keyValue = 'temporary_api_key';

  beforeEach(() => {
    graphqlService = new GraphqlService();
    temporaryApiKeySpy = jest
      .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
  });

  describe('.generateOperationId', () => {
    it('returns an incrementing string', () => {
      expect((graphqlService as any).generateOperationId()).toBe('1');
      expect((graphqlService as any).generateOperationId()).toBe('2');
      expect((graphqlService as any).generateOperationId()).toBe('3');
      expect((graphqlService as any).generateOperationId()).toBe('4');
      expect((graphqlService as any).generateOperationId()).toBe('5');
    });
  });

  describe('.subscribe', () => {
    beforeEach(() => {
      (WebSocket as unknown as jest.Mock).mockReset();
    });
    it('fetches temporary api key when a new connection is opened', async () => {
      graphqlService.subscribe('subscription { baba }').subscribe(() => {});
      // wait until the web socket connection was opened
      await new Promise(process.nextTick);
      expect(temporaryApiKeySpy).toHaveBeenCalled();
      expect(WebSocket).toBeCalledWith(
        `wss://api.qminder.com:443/graphql/subscription?rest-api-key=${keyValue}`,
      );
    });

    it('opens 1 connection if multiple calls to connection key were performed', async () => {
      graphqlService.subscribe('subscription { aaaa }').subscribe(() => {});
      graphqlService.subscribe('subscription { aaab }').subscribe(() => {});
      graphqlService.subscribe('subscription { aaac }').subscribe(() => {});
      graphqlService.subscribe('subscription { aaad }').subscribe(() => {});
      // wait until the web socket connection was opened
      await new Promise(process.nextTick);
      expect(temporaryApiKeySpy).toHaveBeenCalledTimes(1);
      expect(WebSocket).toHaveBeenCalledTimes(1);
    });
  });

  it('fires an Apollo compliant subscribe event, when a new subscriber comes in', async () => {
    const sendMessageSpy = jest.spyOn(graphqlService as any, 'sendMessage');
    graphqlService.subscribe('subscription { baba }').subscribe(() => {});
    // wait until the web socket connection was opened
    await new Promise(process.nextTick);
    expect((graphqlService as any).subscriptions.length).toBe(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.anything(),
      'start',
      expect.objectContaining({
        query: 'subscription { baba }',
      }),
    );
  });

  it('sends an un-subscribe message when the subscription is unsubscribe from', () => {
    const stopSubscriptionSpy = jest.spyOn(
      graphqlService as any,
      'stopSubscription',
    );
    const subscription = graphqlService
      .subscribe('subscription { baba }')
      .subscribe(() => {});
    subscription.unsubscribe();
    expect(stopSubscriptionSpy).toHaveBeenCalledWith('1');
  });

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
    it('deletes the subscription from the mapping of ID -> callbacks', () => {
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

  describe('receiving messages', () => {
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
  });
});
