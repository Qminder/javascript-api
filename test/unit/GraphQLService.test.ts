import * as Qminder from '../../src/qminder-api';
import * as sinon from 'sinon';

describe('GraphQLService', function() {
  const ME_ID_REQUEST = '{ me { id } }';
  const ME_ID_SUCCESS_RESPONSE: any = {
    statusCode: 200,
    data: [
        {
            errors: [],
            data: {
              me: {
                id: 123456
              }
            }
        }
    ]
  };
  let requestStub: sinon.SinonStub;
  beforeEach(function() {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'queryGraph');
  });

  describe('Qminder.graphql.query', function() {
    beforeEach(function() {
      requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('calls ApiBase.queryGraph with the correct parameters', function() {
      Qminder.graphql.query(ME_ID_REQUEST).then(() => {
        expect(requestStub.calledWith(ME_ID_REQUEST, undefined)).toBeTruthy();
      });
    });
    it('calls ApiBase.queryGraph with both query & variables', function() {
      const variables = { x: 5, y: 4 };
      Qminder.graphql.query(ME_ID_REQUEST, variables).then(() => {
        expect(requestStub.calledWith(ME_ID_REQUEST, variables)).toBeTruthy();
      });
    });
    it('collapses whitespace and newlines', function() {
      const query = `
        {
          me {
            id
          }
        }
      `;
      Qminder.graphql.query(query).then(() => {
        expect(requestStub.calledWith(ME_ID_REQUEST, undefined)).toBeTruthy();
      });
    });

    it('throws when query is missing', function() {
      expect(() => (Qminder.graphql.query as any)()).toThrow();
      expect(requestStub.callCount).toBe(0);
    });

  });

  afterEach(function() {
    requestStub.restore();
  });
});
