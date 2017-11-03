describe('Qminder.webhooks', function() {
  beforeEach(function() {
    Qminder.setKey('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    Qminder.setServer('local.api.qminderapp.com');
    this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function() {
    Qminder.ApiBase.request.restore();
  });

  describe('create(url)', function() {
    beforeEach(function() {
      this.requestStub.onFirstCall().resolves({ id: 512, secret: 'SECRET!' });
    });
    it('throws and does not send a HTTP request if the URL is not provided', function() {
      expect(() => Qminder.webhooks.create()).toThrow();
      expect(this.requestStub.called).toBeFalsy();
    });
    it('throws and does not send a HTTP request if the URL is not a string', function() {
      expect(() => Qminder.webhooks.create({ url: 'https://g.co' })).toThrow();
      expect(this.requestStub.called).toBeFalsy();
    });
    it('creates a request with the URL in formdata when provided', function(done) {
      Qminder.webhooks.create('https://g.co').then((data) => {
        expect(this.requestStub.calledWith('webhooks', { url: 'https://g.co' })).toBeTruthy();
        done();
      }, (fail) => {
        console.error(fail);
        expect(false).toBe(true);
        done();
      });
    });
  });

  describe('remove(id)', function() {
    beforeEach(function() {
      this.requestStub.onFirstCall().resolves({ status: 'success' });
    });
    it('throws and does not send a HTTP request if the ID is not provided', function() {
      expect( () => Qminder.webhooks.remove()).toThrow();
      expect(this.requestStub.called).toBeFalsy();
    });
    it('throws and does not send a HTTP request if the ID is not a number', function() {
      expect( () => Qminder.webhooks.remove("fefefe")).toThrow();
      expect( () => Qminder.webhooks.remove({ x: 5 })).toThrow();
      expect( () => Qminder.webhooks.remove({ id: 666 })).toThrow();
      expect(this.requestStub.called).toBeFalsy();
    });
    it('creates a request with the correct URL', function(done) {
      Qminder.webhooks.remove(12).then(() => {
        expect(this.requestStub.calledWith('webhooks/12', undefined, 'DELETE')).toBeTruthy();
        done();
      });
    });
  });
});
