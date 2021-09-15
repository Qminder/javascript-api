import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';
import { GraphQLApiError } from '../../src/util/errors';

/**
 * A function that generates an object with the following keys:
 * - A GraphQL query
 * - The expected fetch(url, init) init parameter
 * - The expected successful response
 *
 * Given the GraphQL query, HTTP response data (without boilerplate).
 *
 * @param {string} query a GraphQL query, for example '{ me { id } }'
 * @param {object} responseData the response data this query generates
 * @returns an object with this shape: { request: object, expectedFetch:
 * object, successfulResponse: object }
 */
function generateRequestData(query: string, responseData: any): any {
  const queryObject = {
    query,
  };
  return {
    request: queryObject,
    expectedFetch: {
      method: 'POST',
      headers: {
        'X-Qminder-REST-API-Key': 'testing',
      },
      mode: 'cors',
      body: JSON.stringify(queryObject),
    },
    successfulResponse: {
      statusCode: 200,
      errors: [],
      data: [responseData],
    },
  };
}

/**
 * A mock implementation of the fetch Response object.
 * Useful for mocking out the request/response cycle of Qminder.ApiBase.fetch.
 *
 * Use like this:
 *
 * this.fetchStub.onCall(0).resolves( new MockResponse({ ... }) );
 *
 * Then, when Qminder.ApiBase calls fetch() (either via request or queryGraph),
 * the corresponding MockResponse is resolved, and the method receives
 * the object passed as parameter.
 */
class MockResponse {
  constructor(private data: any) {}
  json() {
    return this.data;
  }
}

describe('ApiBase', function () {
  const API_KEY = 'testing';
  beforeEach(function () {
    // Manual reset for ApiBase - Karma doesn't reload the environment between tests.
    (Qminder.ApiBase as any).initialized = false;
    Qminder.ApiBase.apiKey = undefined;
    Qminder.ApiBase.apiServer = 'api.qminder.com';
  });

  const FAKE_RESPONSE = {
    json() {
      return { statusCode: 200 };
    },
  };

  describe('constructor()', function () {
    it('after constructing, it has initialized = false', function () {
      expect((Qminder.ApiBase as any).initialized).toBe(false);
    });
    it('after constructing, it has server = api.qminder.com', function () {
      expect(Qminder.ApiBase.apiServer).toBe('api.qminder.com');
    });
  });
  describe('setServer()', function () {
    it('sets Qminder.ApiBase.apiServer to first argument', function () {
      Qminder.setServer('local.api.qminder.com');
      expect(Qminder.ApiBase.apiServer).toBe('local.api.qminder.com');
    });
  });
  describe('setKey()', function () {
    it('stores the API key', function () {
      Qminder.ApiBase.setKey('testing');
      expect(Qminder.ApiBase.apiKey).toBe('testing');
    });
  });
  describe('request()', function () {
    let fetchSpy: sinon.SinonStub;
    beforeEach(function () {
      fetchSpy = sinon.stub(Qminder.ApiBase, 'fetch');
      fetchSpy.onCall(0).resolves(FAKE_RESPONSE);
    });

    afterEach(function () {
      fetchSpy.restore();
    });

    it('throws an error when setKey has not been called', function () {
      expect(() => Qminder.ApiBase.request('locations/673/')).toThrow();
      expect(fetchSpy.called).toBe(false);
    });
    it('does not throw an error when setKey has been called', function () {
      Qminder.setKey(API_KEY);
      expect(() => Qminder.ApiBase.request('TEST')).not.toThrow();
    });
    it('sends a fetch() request to https://SERVER/v1/URL', function () {
      Qminder.setKey(API_KEY);
      Qminder.ApiBase.request('TEST');
      expect(Qminder.ApiBase.apiServer).toBe('api.qminder.com');
      expect(
        fetchSpy.calledWith(`https://api.qminder.com/v1/TEST`),
      ).toBeTruthy();
    });
    it('calls the Response.json() function to resolve the JSON', function (done) {
      Qminder.setKey(API_KEY);
      const jsonSpy = sinon.stub(FAKE_RESPONSE, 'json');
      jsonSpy.onCall(0).resolves({ message: 'Worked' });

      Qminder.ApiBase.request('TEST').then((response) => {
        expect(jsonSpy.called).toBe(true);
        expect((response as any).message).toBe('Worked');
        jsonSpy.restore();
        done();
      });
    });
    it('sends the API key in the headers as X-Qminder-REST-API-Key', function (done) {
      Qminder.setKey(API_KEY);
      const init = {
        headers: {
          'X-Qminder-REST-API-Key': API_KEY,
        },
        method: 'GET',
        mode: 'cors',
      };

      Qminder.ApiBase.request('TEST').then((response) => {
        expect(
          fetchSpy.calledWithExactly('https://api.qminder.com/v1/TEST', init),
        ).toBe(true);

        done();
      });
    });
    it('sends POST requests when the second argument is defined', function (done) {
      Qminder.setKey(API_KEY);

      const requestMatcher = sinon.match({
        method: 'POST',
      });

      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', { id: 1 }).then((response) => {
        expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it('sends POST requests with its third argument set as POST', function (done) {
      Qminder.setKey(API_KEY);

      const requestMatcher = sinon.match({
        method: 'POST',
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', undefined, 'POST').then((response) => {
        expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it('sends POST requests with the request body as formdata', function (done) {
      Qminder.setKey(API_KEY);

      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      const requestMatcher = sinon.match({
        body: 'id=5&firstName=John&lastName=Smith',
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', body).then((response) => {
        expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    it('if POSTing with urlencoded data, sets the content type correctly', function (done) {
      Qminder.setKey(API_KEY);

      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      const requestMatcher = sinon.match({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', body).then((response) => {
        expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
        done();
      });
    });
    // TODO: finish
    xit('does not format File objects to form data', function (done) {
      Qminder.setKey(API_KEY);

      const file = new File(['TestData'], 'testdata.txt', {
        type: 'text/plain+testMimeType',
      });
      const url = 'https://api.qminder.com/v1/TEST';

      const fileMatcher = sinon.match({
        body: {
          name: 'testdata.txt',
          type: 'text/plain+testMimeType',
        },
        headers: {
          'Content-Type': 'text/plain+testMimeType',
        },
      });

      Qminder.ApiBase.request('TEST', file).then((response) => {
        console.log(response);
        console.log(fetchSpy.firstCall.args);
        expect(fetchSpy.calledWithExactly(url, fileMatcher)).toBe(true);
      });
    });
    it('sets the HTTP header Idempotency-Key if idempotencyKey has been provided', function () {
      Qminder.setKey(API_KEY);

      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      const requestMatcher = sinon.match({
        body: 'id=5&firstName=John&lastName=Smith',
        headers: {
          'Idempotency-Key': '9e3a333e',
        },
      });
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', body, undefined, '9e3a333e');
      expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
    });
    it('sends strings as JSON', function () {
      Qminder.setKey(API_KEY);

      const body = JSON.stringify([123, 456, 789]);

      const requestMatcher = sinon.match({
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      Qminder.ApiBase.request('TEST', body, 'POST');
      const url = 'https://api.qminder.com/v1/TEST';

      expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
    });
    it('sends objects as www-form-urlencoded', function () {
      Qminder.setKey(API_KEY);

      const body = { a: 'test' };

      const requestMatcher = sinon.match({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'a=test',
      });

      Qminder.ApiBase.request('TEST', body, 'POST');
      const url = 'https://api.qminder.com/v1/TEST';

      expect(fetchSpy.calledWithExactly(url, requestMatcher)).toBe(true);
    });
  });

  describe('queryGraph()', function () {
    const ME_ID = generateRequestData('{ me { id } }', {
      me: {
        id: 12345,
      },
    });

    const ERROR_UNDEFINED_FIELD: any = {
      statusCode: 200,
      errors: [
        {
          message:
            "Validation error of type FieldUndefined: Field 'x' in type 'Account' is undefined @ 'account/x'",
          locations: [
            {
              line: 4,
              column: 3,
              sourceName: null,
            },
          ],
          description: "Field 'x' in type 'Account' is undefined",
          validationErrorType: 'FieldUndefined',
          queryPath: ['account', 'x'],
          errorType: 'ValidationError',
          extensions: null,
          path: null,
        },
      ],
    };

    const API_URL = 'https://api.qminder.com/graphql';
    let fetchSpy: sinon.SinonStub;

    beforeEach(function () {
      fetchSpy = sinon.stub(Qminder.ApiBase, 'fetch');
    });

    afterEach(function () {
      fetchSpy.restore();
    });

    it('throws when no query is passed', function () {
      Qminder.ApiBase.setKey('testing');
      expect(() => (Qminder.ApiBase.queryGraph as any)()).toThrow();
    });
    it('does not throw when no variables are passed', function () {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.onCall(0).resolves(new MockResponse(ME_ID.successfulResponse));
      expect(() => Qminder.ApiBase.queryGraph(ME_ID.request)).not.toThrow();
    });
    it('throws when API key is not defined', function () {
      fetchSpy.onCall(0).resolves(new MockResponse(ME_ID.successfulResponse));
      expect(() => Qminder.ApiBase.queryGraph(ME_ID.request)).toThrow();
    });
    it('sends a correct request', function () {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.onCall(0).resolves(new MockResponse(ME_ID.successfulResponse));
      Qminder.ApiBase.queryGraph(ME_ID.request);
      expect(
        fetchSpy.calledWithExactly(API_URL, sinon.match(ME_ID.expectedFetch)),
      ).toBeTruthy();
    });
    it('resolves with the entire response object, not only response data', function (done) {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.onCall(0).resolves(new MockResponse(ME_ID.successfulResponse));
      Qminder.ApiBase.queryGraph(ME_ID.request).then((response) => {
        expect(response).toEqual(ME_ID.successfulResponse);
        done();
      });
    });
    it('throws an error when getting errors as response', function (done) {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.resolves(new MockResponse(ERROR_UNDEFINED_FIELD));
      Qminder.ApiBase.queryGraph(ME_ID.request).then(
        () => done(new Error('QueryGraph should have thrown an error')),
        () => done(),
      );
    });
    it('resolves with response, even if response has errors', function (done) {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.onCall(0).resolves(new MockResponse(ERROR_UNDEFINED_FIELD));
      Qminder.ApiBase.queryGraph(ME_ID.request).then(
        () => done(new Error('Should have errored')),
        (error: GraphQLApiError) => {
          expect(error).toEqual(
            new GraphQLApiError(ERROR_UNDEFINED_FIELD.errors),
          );
          done();
        },
      );
    });
  });
});
