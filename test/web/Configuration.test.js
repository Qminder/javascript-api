describe('Configuration', function() {
  describe('Qminder.setKey', function() {
    beforeEach(function() {
      if (typeof Qminder === 'undefined') {
        Qminder = this.Qminder;
      }
      if (typeof sinon === 'undefined') {
        sinon = this.sinon;
      }
      if (typeof window !== 'undefined') {
        this.webSocketStub = sinon.stub(window, 'WebSocket');
      } else {
        this.webSocketStub = sinon.spy(this, 'WebSocket');
      }
      Qminder.setKey('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
      this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
      this.requestStub.onFirstCall().resolves({ data: [] });
    });

    it('sets the API key for the REST API', function() {
      expect(Qminder.ApiBase.apiKey).toBe('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    });

    it('allows using the REST API', function() {
      expect(() => Qminder.locations.list()).not.toThrow();
      expect(this.requestStub.called).toBeTruthy();
    });

    it('sets the API key for the websocket API', function() {
      expect(Qminder.events.apiKey).toBe('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    });
    it('allows using the websocket API', function() {
      expect(() => Qminder.events.onTicketCreated(() => {})).not.toThrow();
    });

    xit('uses the API key in the websocket handshake', function() {
      Qminder.events.openSocket();
      expect(this.webSocketStub.calledWith('wss://' + Qminder.events.apiServer + '/events?rest-api-key=F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn')).toBeTruthy();
    });

    afterEach(function() {
      this.webSocketStub.restore();
      Qminder.ApiBase.request.restore();
    });
  });
});
