describe("Qminder.devices", function() {

  const NAME_DEVICES = [
    {
      id: 1235,
      type: "OVERVIEW_MONITOR",
      name: "Large TV",
      online: true
    },
    {
      id: 3418,
      type: "NAME_DEVICE",
      name: "iPad name device",
      needsUpdate: true,
      battery: {
        level: 5,
        charging: false
      },
      online: false
    }
  ];

  const TV_DETAILS = {
    statusCode: 200,
    id: 41078,
    name: "52 inch TV in Lobby",
    theme: "standard"
  };

  beforeEach(function() {
    if (typeof Qminder === 'undefined') {
      Qminder = this.Qminder;
    }
    if (typeof sinon === 'undefined') {
      sinon = this.sinon;
    }
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  describe('list()', function() {
    beforeEach(function() {
      this.requestStub.onFirstCall().resolves({ data: NAME_DEVICES });
    });

    it('calls the right API URL', function() {
      Qminder.devices.list(124);
      expect(this.requestStub.calledWith('locations/124/devices/')).toBeTruthy();
    });

    it('throws an error when location ID is not provided', function() {
      expect(() => Qminder.devices.list()).toThrow();
    });

    it('throws an error when location ID is not a number', function() {
      expect(() => Qminder.devices.list({ id: 12345 })).toThrow();
    });

    it('takes the data out and parses it into Devices', function(done) {
      Qminder.devices.list(1235).then((data) => {
        expect(data.data).toBeUndefined();
        expect(data.data).not.toBe(NAME_DEVICES);
        done();
      }, (error) => {
        console.error('It broke', error.stack);
        done(new Error('broke'));
      });
    });
  });

  describe('details()', function() {
    beforeEach(function() {
      this.requestStub.onFirstCall().resolves(TV_DETAILS);
    });

    it('requests the correct API URL', function() {
      Qminder.devices.details(1234);
      expect(this.requestStub.calledWith('tv/1234')).toBeTruthy();
    });

    it('throws when the TV ID is not passed in', function() {
      expect(() => Qminder.devices.details()).toThrow();
    });

    it('throws when the TV ID is not a number', function() {
      expect(() => Qminder.devices.details({ id: 5 })).toThrow();
      expect(() => Qminder.devices.details("Yo")).toThrow();
    });

    it('constructs a Device for the response', function(done) {
      Qminder.devices.details(5).then((device) => {
        expect(device instanceof Qminder.Device).toBeTruthy();
        done();
      }, done);
    });
  });

  afterEach(function() {
    Qminder.ApiBase.request.restore();
  });
});
