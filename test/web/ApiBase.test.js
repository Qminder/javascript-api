describe("ApiBase", function () {
  const API_KEY = 'testing';
  beforeEach(function() {
    if (typeof Qminder === 'undefined') {
      Qminder = this.Qminder;
    }
    if (typeof sinon === 'undefined') {
      sinon = this.sinon;
    }
    // Manual reset for ApiBase - Karma doesn't reload the environment between tests.
    Qminder.ApiBase.initialized = false;
    Qminder.ApiBase.apiKey = undefined;
    Qminder.ApiBase.apiServer = 'api.qminder.com';
  });

  const FAKE_RESPONSE = {
    json() {
      return { statusCode: 200 };
    }
  };

  describe("constructor()", function () {
    it("after constructing, it has initialized = false", function () {
      expect(Qminder.ApiBase.initialized).toBe(false);
    });
    it("after constructing, it has server = api.qminder.com", function () {
      expect(Qminder.ApiBase.apiServer).toBe("api.qminder.com");
    });
  });
  describe("setServer()", function () {
    it("sets Qminder.ApiBase.apiServer to first argument", function () {
      Qminder.setServer('local.api.qminder.com');
      expect(Qminder.ApiBase.apiServer).toBe('local.api.qminder.com');
    });
  });
  describe("setKey()", function() {
    it("stores the API key", function() {
      Qminder.ApiBase.setKey("testing");
      expect(Qminder.ApiBase.apiKey).toBe("testing");
    });
  });
  describe("request()", function() {
    beforeEach(function() {
      this.fetchSpy = sinon.stub(Qminder.ApiBase, 'fetch');
      this.fetchSpy.onCall(0).resolves(FAKE_RESPONSE);
    });
    it("throws an error when setKey has not been called", function() {
      expect(() => Qminder.ApiBase.request("locations/673/")).toThrow();
      expect(this.fetchSpy.called).toBe(false);
    });
    it("does not throw an error when setKey has been called", function() {
      Qminder.setKey(API_KEY);
      expect(() => Qminder.ApiBase.request('TEST')).not.toThrow();
    });
    it("sends a fetch() request to https://SERVER/v1/URL", function() {
      Qminder.setKey(API_KEY);
      Qminder.ApiBase.request('TEST');
      expect(Qminder.ApiBase.apiServer).toBe('api.qminder.com');
      expect(this.fetchSpy.calledWith(`https://api.qminder.com/v1/TEST`)).toBeTruthy();
    });
    it("calls the Response.json() function to resolve the JSON", function(done) {
      Qminder.setKey(API_KEY);
      let jsonSpy = sinon.stub(FAKE_RESPONSE, 'json');
      jsonSpy.onCall(0).resolves({ message: 'Worked' });

      Qminder.ApiBase.request('TEST').then(response => {
        expect(jsonSpy.called).toBe(true);
        expect(response.message).toBe('Worked');
        jsonSpy.restore();
        done();
      });
    });
    it("sends the API key in the headers as X-Qminder-REST-API-Key", function(done) {
      Qminder.setKey(API_KEY);

      const init = {
        method: 'GET',
        headers: {
          'X-Qminder-REST-API-Key': API_KEY,
        },
        mode: 'cors',
      };

      Qminder.ApiBase.request('TEST').then(response => {
        expect(this.fetchSpy.calledWithExactly('https://api.qminder.com/v1/TEST', init)).toBe(true);

        done();
      });
    });
    it("sends POST requests when the second argument is defined", function(done) {
      Qminder.setKey(API_KEY);

      const requestMatcher = sinon.match({
        method: 'POST'
      });

      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', { id: 1 }).then(response => {
        expect(this.fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it("sends POST requests with its third argument set as POST", function(done) {
      Qminder.setKey(API_KEY);

      const requestMatcher = sinon.match({
        method: 'POST'
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', undefined, 'POST').then(response => {
        expect(this.fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it("sends POST requests with the request body as formdata", function(done) {
      Qminder.setKey(API_KEY);

      const body = {
        id: 5,
        firstName: "John",
        lastName: "Smith",
      };

      const requestMatcher = sinon.match({
        body: "id=5&firstName=John&lastName=Smith",
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', body).then(response => {
        expect(this.fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it("if POSTing with urlencoded data, sets the content type correctly", function(done) {
      Qminder.setKey(API_KEY);

      const body = {
        id: 5,
        firstName: "John",
        lastName: "Smith",
      };

      const requestMatcher = sinon.match({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', body).then(response => {
        expect(this.fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    // TODO: finish
    xit("does not format File objects to form data", function(done) {
      Qminder.setKey(API_KEY);

      const file = new File(["TestData"], "testdata.txt", { type: 'text/plain+testMimeType' });
      const url = 'https://api.qminder.com/v1/TEST';

      const fileMatcher = sinon.match({
        body: {
          name: 'testdata.txt',
          type: 'text/plain+testMimeType'
        },
        headers: {
          'Content-Type': 'text/plain+testMimeType'
        }
      });

      Qminder.ApiBase.request('TEST', file).then(response => {
        console.log(response);
        console.log(this.fetchSpy.firstCall.args);
        expect(this.fetchSpy.calledWithExactly(url, fileMatcher)).toBe(true);
      });
    });
    afterEach(function() {
      this.fetchSpy.restore();
    })
  });
});
