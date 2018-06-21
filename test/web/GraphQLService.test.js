describe("GraphQLService", function() {
  const ME_ID_REQUEST = '{ me { id } }';
  const ME_ID_SUCCESS_RESPONSE = {
    statusCode: 200,
    errors: [],
    data: {
      me: {
        id: 123456
      }
    }
  };
  beforeEach(function() {
    if (typeof Qminder === 'undefined') {
      Qminder = this.Qminder;
    }
    if (typeof sinon === 'undefined') {
      sinon = this.sinon;
    }
    Qminder.setKey('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    Qminder.setServer('local.api.qminderapp.com');

    // Stub ApiBase.request to feed specific data to API
    this.requestStub = sinon.stub(Qminder.ApiBase, 'queryGraph');
  });

  describe("Qminder.graphql", function() {
    beforeEach(function() {
      this.requestStub.onFirstCall().resolves(ME_ID_SUCCESS_RESPONSE);
    });
    it('calls ApiBase.queryGraph with the correct parameters', function() {
      Qminder.graphql(ME_ID_REQUEST).then(() => {
        expect(this.requestStub.calledWith(ME_ID_REQUEST, undefined)).toBeTruthy();
      });
    });
    it('calls ApiBase.queryGraph with both query & variables', function() {
      const variables = { x: 5, y: 4 };
      Qminder.graphql(ME_ID_REQUEST, variables).then(() => {
        expect(this.requestStub.calledWith(ME_ID_REQUEST, variables)).toBeTruthy();
      });
    });

    it('throws when query is missing', function() {
      expect(() => Qminder.graphql()).toThrow();
      expect(this.requestStub.callCount).toBe(0);
    });

  });

  afterEach(function() {
    Qminder.ApiBase.queryGraph.restore();
  });
});
