describe('Configuration', function() {
  describe('Qminder.setKey', function() {
    beforeEach(function() {
      if (typeof Qminder === 'undefined') {
        Qminder = this.Qminder;
      }
      if (typeof sinon === 'undefined') {
        sinon = this.sinon;
      }

      Qminder.setKey('EXAMPLE_API_KEY');
      this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
      this.requestStub.onFirstCall().resolves({ data: [] });
    });

    it('sets the API key for the REST API', function() {
      expect(Qminder.ApiBase.apiKey).toBe('EXAMPLE_API_KEY');
    });

    it('allows using the REST API', function() {
      expect(() => Qminder.locations.list()).not.toThrow();
      expect(this.requestStub.called).toBeTruthy();
    });

    it('sets the API key for the websocket API', function() {
      expect(Qminder.events.apiKey).toBe('EXAMPLE_API_KEY');
    });
    it('allows using the websocket API', function() {
      expect(() => Qminder.events.onTicketCreated(() => {})).not.toThrow();
    });

    xit('uses the API key in the websocket handshake', function() {
      Qminder.events.openSocket();
      expect(this.webSocketStub.calledWith('wss://' + Qminder.events.apiServer + '/events?rest-api-key=EXAMPLE_API_KEY')).toBeTruthy();
    });

    afterEach(function() {
      Qminder.ApiBase.request.restore();
    });
  });
});
