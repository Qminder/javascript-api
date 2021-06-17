import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';

describe('Qminder.webhooks', function () {
  let requestStub: sinon.SinonStub;
  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function () {
    requestStub.restore();
  });

  describe('create(url)', function () {
    beforeEach(function () {
      requestStub.onFirstCall().resolves({ id: 512, secret: 'SECRET!' });
    });
    it('throws and does not send a HTTP request if the URL is not provided', function () {
      expect(() => (Qminder.webhooks.create as any)()).toThrow();
      expect(requestStub.called).toBeFalsy();
    });
    it('throws and does not send a HTTP request if the URL is not a string', function () {
      expect(() =>
        Qminder.webhooks.create({ url: 'https://g.co' } as any),
      ).toThrow();
      expect(requestStub.called).toBeFalsy();
    });
    it('creates a request with the URL in formdata when provided', function (done) {
      Qminder.webhooks.create('https://g.co').then(
        (data) => {
          expect(
            requestStub.calledWith('webhooks', { url: 'https://g.co' }),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
  });

  describe('remove(id)', function () {
    beforeEach(function () {
      requestStub.onFirstCall().resolves({ status: 'success' });
    });
    it('throws and does not send a HTTP request if the ID is not provided', function () {
      expect(() => (Qminder.webhooks.remove as any)()).toThrow();
      expect(requestStub.called).toBeFalsy();
    });
    it('throws and does not send a HTTP request if the ID is not a number', function () {
      expect(() => (Qminder.webhooks.remove as any)('fefefe')).toThrow();
      expect(() => (Qminder.webhooks.remove as any)({ x: 5 })).toThrow();
      expect(() => (Qminder.webhooks.remove as any)({ id: 666 })).toThrow();
      expect(requestStub.called).toBeFalsy();
    });
    it('creates a request with the correct URL', function (done) {
      Qminder.webhooks.remove(12).then(() => {
        expect(
          requestStub.calledWith('webhooks/12', undefined, 'DELETE'),
        ).toBeTruthy();
        done();
      });
    });
  });
});
