import * as sinon from 'sinon';
import { Qminder } from './qminder';

describe('Qminder API', function () {
  describe('Qminder.setKey', function () {
    let requestStub: sinon.SinonStub;
    beforeEach(function () {
      Qminder.setKey('EXAMPLE_API_KEY');
      requestStub = sinon.stub(Qminder.ApiBase, 'request');
      requestStub.onFirstCall().resolves({ data: [] });
    });

    it('sets the API key for the REST API', function () {
      expect((Qminder.ApiBase as any).apiKey).toBe('EXAMPLE_API_KEY');
    });

    it('allows using the REST API', function () {
      expect(() => Qminder.Location.list()).not.toThrow();
      expect(requestStub.called).toBeTruthy();
    });

    afterEach(function () {
      (Qminder.ApiBase.request as sinon.SinonStub).restore();
    });
  });
});
