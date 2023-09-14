import * as sinon from 'sinon';
import { Qminder } from '../../qminder';
import { DeviceService } from './device.service';

describe('Device service', function () {
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
      DeviceService.details('1234');
      expect(requestStub.calledWith('v1/tv/1234')).toBeTruthy();
    });

    it('throws when the TV ID is not passed in', function () {
      expect(() => (DeviceService.details as any)()).toThrow();
    });

    it('constructs a Device for the response', function (done) {
      DeviceService.details('5').then((device) => {
        done();
      }, done);
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
