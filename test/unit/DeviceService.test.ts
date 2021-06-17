import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';

describe('Qminder.devices', function () {
  const TV_DETAILS = {
    statusCode: 200,
    id: 41078,
    name: '52 inch TV in Lobby',
    theme: 'standard',
  };

  let requestStub: sinon.SinonStub;
  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  describe('details()', function () {
    beforeEach(function () {
      requestStub.onFirstCall().resolves(TV_DETAILS);
    });

    it('requests the correct API URL', function () {
      Qminder.devices.details(1234);
      expect(requestStub.calledWith('tv/1234')).toBeTruthy();
    });

    it('throws when the TV ID is not passed in', function () {
      expect(() => (Qminder.devices.details as any)()).toThrow();
    });

    it('throws when the TV ID is not a number', function () {
      expect(() => (Qminder.devices.details as any)({ id: 5 })).toThrow();
      expect(() => (Qminder.devices.details as any)('Yo')).toThrow();
    });

    it('constructs a Device for the response', function (done) {
      Qminder.devices.details(5).then((device) => {
        expect(device instanceof Qminder.Device).toBeTruthy();
        done();
      }, done);
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
