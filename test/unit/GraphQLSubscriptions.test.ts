import * as WebSocket from 'isomorphic-ws';
import { Subscriber } from 'rxjs';
import { GraphQLService } from '../../src/services/GraphQLService';

jest.mock('isomorphic-ws');

describe('GraphQL subscriptions', () => {
  let graphqlService: GraphQLService;
  beforeEach(() => {
    graphqlService = new GraphQLService();
  });

  afterEach(() => {
    (WebSocket as unknown as jest.Mock).mockReset();
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
    it('fires an Apollo compliant subscribe event, when a new subscriber comes in', () => {
      const sendMessageSpy = jest.spyOn(graphqlService as any, 'sendMessage');
      graphqlService.subscribe('baba').subscribe(() => {});
      expect(WebSocket).toHaveBeenCalled();
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
      const subscription = graphqlService.subscribe('baba').subscribe(() => {});
      subscription.unsubscribe();
      expect(stopSubscriptionSpy).toHaveBeenCalledWith('1');
    });
  });

  describe('.stopSubscription', () => {
    it('deletes the subscription from the mapping of ID -> callbacks', () => {
      // start the test with an empty observer-map
      expect(
        Object.keys((graphqlService as any).subscriptionObserverMap).length,
      ).toBe(0);
      // subscribe once
      const spy = jest.fn();
      const subscription = graphqlService.subscribe('baba').subscribe(spy);

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
    it('when receiving a published message for a subscription that does not exist anymore, it does not throw', () => {
      expect(
        Object.keys((graphqlService as any).subscriptionObserverMap).length,
      ).toBe(0);
      const subscription = graphqlService.subscribe('baba').subscribe(() => {});
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
