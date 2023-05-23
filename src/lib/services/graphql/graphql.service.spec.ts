import { gql } from 'graphql-tag';
import WebSocket from 'isomorphic-ws';
import * as sinon from 'sinon';

import { Qminder } from '../../qminder';
import { GraphqlService } from './graphql.service';

jest.mock('isomorphic-ws', () => jest.fn());

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
  let graphqlService: GraphqlService;
  let temporaryApiKeySpy: jest.SpyInstance;
  const keyValue = 'temporary_api_key';

  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    graphqlService = new GraphqlService();
    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'queryGraph');

    temporaryApiKeySpy = jest
      .spyOn(graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
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

    it('opens 1 connection if multiple subscriptions are opened simultaneously', async () => {
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

  afterEach(function () {
    requestStub.restore();
  });
});
