import * as sinon from 'sinon';
import { Qminder } from '../../qminder';
import { WebhookService } from './webhook.service';

describe('Webhook service', function () {
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
      expect(() => (WebhookService.create as any)()).toThrow();
      expect(requestStub.called).toBeFalsy();
    });

    it('throws and does not send a HTTP request if the URL is not a string', function () {
      expect(() =>
        WebhookService.create({ url: 'https://g.co' } as any),
      ).toThrow();
      expect(requestStub.called).toBeFalsy();
    });

    it('creates a request with the URL in formdata when provided', function (done) {
      WebhookService.create('https://g.co').then(
        (data) => {
          expect(
            requestStub.calledWith('v1/webhooks', {
              body: { url: 'https://g.co' },
              method: 'POST',
            }),
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

    it('creates a request with headers when provided', function (done) {
      const headers = {
        'X-Qminder-Webhook-Type': 'internal',
      };

      WebhookService.create('https://g.co', headers).then(
        (data) => {
          expect(
            requestStub.calledWith('v1/webhooks', {
              body: { url: 'https://g.co' },
              method: 'POST',
              ...headers,
            }),
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
      expect(() => WebhookService.remove(undefined as any)).toThrow();
      expect(requestStub.called).toBeFalsy();
    });

    it('supports string IDs', () => {
      expect(() => WebhookService.remove('fefefe' as any)).not.toThrow();
    });

    it('supports webhook objects', () => {
      expect(() =>
        WebhookService.remove({ id: '4c6c94e3-9f26-4b76-8440-d2bc0ebf537c' }),
      ).not.toThrow();
    });

    it('throws and does not send a HTTP request if the ID is not provided in the object', function () {
      expect(() => WebhookService.remove({ x: 5 } as any)).toThrow();
      expect(requestStub.called).toBeFalsy();
    });

    it('creates a request with the correct URL', function (done) {
      WebhookService.remove(12).then(() => {
        expect(
          requestStub.calledWith('v1/webhooks/12', { method: 'DELETE' }),
        ).toBeTruthy();
        done();
      });
    });
  });
});
