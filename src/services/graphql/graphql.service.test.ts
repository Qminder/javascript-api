import * as sinon from 'sinon';
import { gql } from 'graphql-tag';

import * as Qminder from '../../qminder-api';

describe('GraphQLService', function () {
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
  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'queryGraph');
  });

  describe('Qminder.graphql.query', function () {
    beforeEach(function () {
      requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('calls ApiBase.queryGraph with the correct parameters', async () => {
      await Qminder.graphql.query(ME_ID_REQUEST);
      const graphqlQuery = { query: ME_ID_REQUEST };
      expect(requestStub.calledWith(graphqlQuery)).toBeTruthy();
    });
    it('calls ApiBase.queryGraph with both query & variables', async () => {
      const variables = { x: 5, y: 4 };
      await Qminder.graphql.query(ME_ID_REQUEST, variables);
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
      await Qminder.graphql.query(query);
      const graphqlQuery = { query: ME_ID_REQUEST };
      expect(requestStub.calledWith(graphqlQuery)).toBeTruthy();
    });

    it('throws when query is missing', async () => {
      expect(() => (Qminder.graphql.query as any)()).toThrow();
      expect(requestStub.callCount).toBe(0);
    });
  });

  describe('graphql tag support', () => {
    beforeEach(function () {
      requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('Qminder.graphql.query works correctly when passed a gql`` tagged query', () => {
      expect(
        () =>
          Qminder.graphql.query(gql`
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
    it('Qminder.graphql.query works correctly when passed a long query with variables and fragments', () => {
      expect(
        () =>
          Qminder.graphql.query(gql`
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

  afterEach(function () {
    requestStub.restore();
  });
});
