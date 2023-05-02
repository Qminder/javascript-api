import * as sinon from 'sinon';
import { gql } from 'graphql-tag';

import { Qminder } from '../../qminder';
import { GraphqlService } from './graphql.service';
import { filter, firstValueFrom, Subscriber } from 'rxjs';
import { ConnectionStatus } from '../../model/connection-status';

describe('GraphQL service', function () {
  const ME_ID_REQUEST = '{ me { id } }';
  const ME_ID_SUCCESS_RESPONSE: any = {
    statusCode: 200,
    data: [
      {
        errors: [],
        data: {
          me: {
            id: 123456,
          },
        },
      },
    ],
  };
  let requestStub: sinon.SinonStub;
  let graphqlService = new GraphqlService();
  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'queryGraph');
  });

  describe('query', function () {
    beforeEach(function () {
      requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('calls ApiBase.queryGraph with the correct parameters', async () => {
      await graphqlService.query(ME_ID_REQUEST);
      const graphqlQuery = { query: ME_ID_REQUEST };
      expect(requestStub.calledWith(graphqlQuery)).toBeTruthy();
    });
    it('calls ApiBase.queryGraph with both query & variables', async () => {
      const variables = { x: 5, y: 4 };
      await graphqlService.query(ME_ID_REQUEST, variables);
      const graphqlQuery = { query: ME_ID_REQUEST, variables };
      expect(requestStub.calledWith(graphqlQuery)).toBeTruthy();
    });
    it('collapses whitespace and newlines', async () => {
      const query = `
        {
          me {
            id
          }
        }
      `;
      await graphqlService.query(query);
      const graphqlQuery = { query: ME_ID_REQUEST };
      expect(requestStub.calledWith(graphqlQuery)).toBeTruthy();
    });

    it('throws when query is missing', async () => {
      expect(() => (graphqlService.query as any)()).toThrow();
      expect(requestStub.callCount).toBe(0);
    });
  });

  describe('tag support', () => {
    beforeEach(function () {
      requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('GraphqlService.query works correctly when passed a gql`` tagged query', () => {
      expect(
        () =>
        graphqlService.query(gql`
            {
              me {
                id
              }
            }
          `) as any,
      ).not.toThrow();

      expect(requestStub.callCount).toBe(1);
      expect(requestStub.firstCall.args[0]).toEqual({
        query: '{ me { id }\n}',
      });
    });
    it('GraphqlService.query works correctly when passed a long query with variables and fragments', () => {
      expect(
        () =>
        graphqlService.query(gql`
            query MyIdQuery($id: ID!) {
              location(id: $id) {
                id
                name
                timezone
                lines {
                  ...MyFrag
                }
              }
            }
            fragment MyFrag on Line {
              id
              name
            }
          `) as any,
      ).not.toThrow();

      expect(requestStub.callCount).toBe(1);
      expect(requestStub.firstCall.args[0]).toEqual({
        query:
          'query MyIdQuery($id: ID!) { location(id: $id) { id name timezone lines { ...MyFrag } }\n} fragment MyFrag on Line { id name\n}',
      });
    });
  });

  describe('subscriptions', () => {
    let graphqlService: GraphqlService;
    let fetchSpy: sinon.SinonStub;
    const keyValue = 'temporary_api_key';
    const FAKE_RESPONSE = {
      json() {
        return { key: keyValue };
      },
    };

    beforeEach(() => {
      graphqlService = new GraphqlService();
      fetchSpy = sinon.stub(graphqlService, 'fetch');
      fetchSpy.onCall(0).resolves(FAKE_RESPONSE);
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
      it('fetches temporary api key when a new connection is opened', async () => {
        graphqlService.subscribe('subscription { baba }').subscribe(() => {});
        const spy = jest.fn();
        graphqlService.WebSocket = spy as any;
        // wait until the web socket connection was opened
        await new Promise(process.nextTick);
        expect(fetchSpy.args[0][0]).toBe(
          'https://api.qminder.com/graphql/connection-key',
        );
        expect(spy).toBeCalledWith(
          `wss://api.qminder.com:443/graphql/subscription?rest-api-key=${keyValue}`,
        );
      });
    });

    describe('with websocket cleanup', () => {
      afterEach(async () => {
        await firstValueFrom(
          graphqlService
            .getSubscriptionConnectionObservable()
            .pipe(filter((state) => state === ConnectionStatus.DISCONNECTED)),
        );
      });

      beforeEach(() => {
        jest
          .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
          .mockResolvedValue(keyValue);
        (graphqlService as any).enableAutomaticReconnect = false;
      });

      describe('.subscribe', () => {
        it('fires an Apollo compliant subscribe event, when a new subscriber comes in', async () => {
          const sendMessageSpy = jest.spyOn(
            graphqlService as any,
            'sendMessage',
          );
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
          const sendMessageSpy = jest.spyOn(
            graphqlService as any,
            'sendMessage',
          );
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
          const sendMessageSpy = jest.spyOn(
            graphqlService as any,
            'sendMessage',
          );
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
  });

  afterEach(function () {
    requestStub.restore();
  });
});
