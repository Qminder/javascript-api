// Needed because JSDOM does not support fetch
// See https://github.com/jsdom/jsdom/issues/1724
import 'cross-fetch/polyfill';

import * as sinon from 'sinon';
import { ComplexError } from '../../model/errors/complex-error';
import { SimpleError } from '../../model/errors/simple-error';
import { UnknownError } from '../../model/errors/unknown-error';
import { Qminder } from '../../qminder';
import { ResponseValidationError } from '../../model/errors/response-validation-error';

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
        'Content-Type': 'application/json',
        'X-Qminder-REST-API-Key': 'testing',
      },
      mode: 'cors',
      body: JSON.stringify(queryObject),
    },
    successfulResponse: {
      data: [responseData],
    },
  };
}

const FAKE_RESPONSE = {
  ok: true,
  json() {
    return {};
  },
  text() {
    return Promise.resolve('{}');
  },
};

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
  ok: boolean;

  constructor(private data: any) {
    this.ok = data.ok !== undefined ? data.ok : true;
  }

  json() {
    return this.data;
  }

  text() {
    return Promise.resolve(JSON.stringify(this.data));
  }
}

describe('ApiBase', () => {
  const API_KEY = 'testing';
  let fetchSpy: any;

  beforeEach(() => {
    // Manual reset for ApiBase - Karma doesn't reload the environment between tests.
    (Qminder.ApiBase as any).initialized = false;
    (Qminder.ApiBase as any).apiKey = undefined;
    (Qminder.ApiBase as any).accessTokenProvider = undefined;
    (Qminder.ApiBase as any).apiServer = 'api.qminder.com';

    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    it('after constructing, it has server = api.qminder.com', () => {
      expect((Qminder.ApiBase as any).apiServer).toBe('api.qminder.com');
    });
  });

  describe('setServer()', () => {
    it('sets Qminder.ApiBase.apiServer to first argument', () => {
      Qminder.setServer('local.api.qminder.com');
      expect((Qminder.ApiBase as any).apiServer).toBe('local.api.qminder.com');
    });
  });

  describe('setKey()', () => {
    it('stores the API key', () => {
      Qminder.ApiBase.setKey('testing');
      expect((Qminder.ApiBase as any).apiKey).toBe('testing');
    });
  });

  describe('setAccessTokenProvider()', () => {
    beforeEach(() => {
      fetchSpy.mockReturnValue(FAKE_RESPONSE);
    });

    it('sends the token as a Bearer token and not the API key', async () => {
      Qminder.setAccessTokenProvider(() => 'token-1');
      await Qminder.ApiBase.request('TEST');
      expect(fetchSpy).toHaveBeenCalledWith('https://api.qminder.com/TEST', {
        headers: { Authorization: 'Bearer token-1' },
        method: 'GET',
        mode: 'cors',
      });
    });

    it('calls the provider for every request', async () => {
      let count = 0;
      Qminder.setAccessTokenProvider(async () => `token-${++count}`);
      await Qminder.ApiBase.request('TEST');
      await Qminder.ApiBase.request('TEST');
      const authorizations = fetchSpy.mock.calls.map(
        (call: any) => call[1].headers.Authorization,
      );
      expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-2']);
    });

    it('sends the token with GraphQL queries', async () => {
      Qminder.setAccessTokenProvider(() => 'token-1');
      fetchSpy.mockReturnValue({
        ok: true,
        json: () => ({ data: { me: { id: '1' } } }),
      });
      await Qminder.ApiBase.queryGraph({ query: '{ me { id } }' });
      const headers = fetchSpy.mock.lastCall[1].headers;
      expect(headers.Authorization).toBe('Bearer token-1');
      expect(headers['X-Qminder-REST-API-Key']).toBeUndefined();
    });

    it('gives the provider a context that does not force a refresh', async () => {
      const provider = jest.fn().mockReturnValue('token-1');
      Qminder.setAccessTokenProvider(provider);

      await Qminder.ApiBase.request('TEST');

      expect(provider).toHaveBeenCalledWith({ forceRefresh: false });
    });

    it('sends the request once more with a refreshed token when the response is 401', async () => {
      const provider = jest.fn(({ forceRefresh }) =>
        forceRefresh ? 'new-token' : 'old-token',
      );
      Qminder.setAccessTokenProvider(provider);
      fetchSpy
        .mockReturnValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve('{"errorMessage":"JWT is invalid"}'),
        })
        .mockReturnValueOnce(FAKE_RESPONSE);

      await Qminder.ApiBase.request('TEST');

      expect(provider).toHaveBeenNthCalledWith(1, { forceRefresh: false });
      expect(provider).toHaveBeenNthCalledWith(2, { forceRefresh: true });
      const authorizations = fetchSpy.mock.calls.map(
        (call: any) => call[1].headers.Authorization,
      );
      expect(authorizations).toEqual(['Bearer old-token', 'Bearer new-token']);
    });

    it('does not send the request more than once more', async () => {
      Qminder.setAccessTokenProvider(() => 'token-1');
      fetchSpy.mockReturnValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"errorMessage":"JWT is invalid"}'),
      });

      await expect(Qminder.ApiBase.request('TEST')).rejects.toMatchObject({
        status: 401,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('sends a GraphQL query once more with a refreshed token when the response is 401', async () => {
      const provider = jest.fn(({ forceRefresh }) =>
        forceRefresh ? 'new-token' : 'old-token',
      );
      Qminder.setAccessTokenProvider(provider);
      fetchSpy
        .mockReturnValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ errorMessage: 'JWT is invalid' }),
        })
        .mockReturnValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { me: { id: '1' } } }),
        });

      await expect(
        Qminder.ApiBase.queryGraph({ query: '{ me { id } }' }),
      ).resolves.toEqual({ me: { id: '1' } });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy.mock.calls[1][1].headers.Authorization).toBe(
        'Bearer new-token',
      );
    });

    it('does not send the request again with an API key when the response is 401', async () => {
      Qminder.setKey(API_KEY);
      fetchSpy.mockReturnValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"errorMessage":"Please authenticate"}'),
      });

      await expect(Qminder.ApiBase.request('TEST')).rejects.toThrow();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('is replaced by setKey()', async () => {
      Qminder.setAccessTokenProvider(() => 'token-1');
      Qminder.setKey(API_KEY);
      await Qminder.ApiBase.request('TEST');
      expect(fetchSpy.mock.lastCall[1]).toEqual({
        headers: { 'X-Qminder-REST-API-Key': 'testing' },
        method: 'GET',
        mode: 'cors',
      });
    });
  });

  describe('request()', () => {
    beforeEach(() => {
      fetchSpy.mockReturnValue(FAKE_RESPONSE);
    });

    it('throws an error when setKey has not been called', async () => {
      await expect(
        Qminder.ApiBase.request('v1/locations/673/'),
      ).rejects.toThrow();
    });

    it('does not throw an error when setKey has been called', async () => {
      Qminder.setKey(API_KEY);
      await expect(
        Qminder.ApiBase.request('v1/locations/673/'),
      ).resolves.not.toThrow();
    });

    it('sends a fetch() request to https://SERVER/URL', () => {
      Qminder.setKey(API_KEY);
      Qminder.ApiBase.request('TEST');
      expect(fetchSpy).toHaveBeenCalledWith('https://api.qminder.com/TEST', {
        headers: { 'X-Qminder-REST-API-Key': 'testing' },
        method: 'GET',
        mode: 'cors',
      });
    });

    it('parses the response text as JSON', (done) => {
      Qminder.setKey(API_KEY);
      const textSpy = sinon.stub(FAKE_RESPONSE, 'text');
      textSpy.onCall(0).resolves(JSON.stringify({ message: 'Worked' }));

      Qminder.ApiBase.request('TEST').then((response) => {
        expect(textSpy.called).toBe(true);
        expect((response as any).message).toBe('Worked');
        textSpy.restore();
        done();
      });
    });

    it('sends the API key in the headers as X-Qminder-REST-API-Key', (done) => {
      Qminder.setKey(API_KEY);
      const init = {
        headers: {
          'X-Qminder-REST-API-Key': API_KEY,
        },
        method: 'GET',
        mode: 'cors',
      };

      Qminder.ApiBase.request('TEST').then((response) => {
        expect(fetchSpy).toHaveBeenCalledWith(
          'https://api.qminder.com/TEST',
          init,
        );
        done();
      });
    });

    it('sends POST requests when the second argument is defined', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';

      Qminder.ApiBase.request('TEST', { body: { id: 1 } }).then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual('id=1');
        expect(fetchSpy.mock.calls[0][1].method).toEqual('POST');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends POST requests with its third argument set as POST', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';

      Qminder.ApiBase.request('TEST', { method: 'POST' }).then(() => {
        expect(fetchSpy.mock.calls[0][1].method).toEqual('POST');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends POST requests with the request body as formdata', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      Qminder.ApiBase.request('TEST', { body: body }).then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual(
          'id=5&firstName=John&lastName=Smith',
        );
        expect(fetchSpy.mock.calls[0][1].method).toEqual('POST');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('if POSTing with urlencoded data, sets the content type correctly', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      Qminder.ApiBase.request('TEST', { body: body }).then(() => {
        expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
          'application/x-www-form-urlencoded',
        );
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sets the custom HTTP headers if provided', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      const headers = {
        'X-Qminder-Test-Header': 'test',
      };

      Qminder.ApiBase.request('TEST', {
        body: body,
        headers: headers,
      }).then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual(
          'id=5&firstName=John&lastName=Smith',
        );
        expect(
          fetchSpy.mock.calls[0][1].headers['X-Qminder-Test-Header'],
        ).toEqual('test');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends strings as JSON', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';
      const body = JSON.stringify([123, 456, 789]);

      Qminder.ApiBase.request('TEST', { body: body, method: 'POST' }).then(
        () => {
          expect(fetchSpy.mock.calls[0][1].body).toEqual(body);
          expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
            'application/json',
          );
          expect(fetchSpy.mock.calls[0][0]).toEqual(url);
          done();
        },
      );
    });

    it('preserves PATCH method when body is present', (done) => {
      Qminder.setKey(API_KEY);

      Qminder.ApiBase.request('TEST', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: 'Jane' }),
      }).then(() => {
        expect(fetchSpy.mock.calls[0][1].method).toEqual('PATCH');
        done();
      });
    });

    it('handles empty response body gracefully for successful responses', async () => {
      Qminder.setKey(API_KEY);

      fetchSpy.mockReturnValue({
        ok: true,
        text() {
          return Promise.resolve('');
        },
      });

      const result = await Qminder.ApiBase.request('TEST');
      expect(result).toEqual({});
    });

    it('throws a descriptive error for invalid JSON response', async () => {
      Qminder.setKey(API_KEY);

      fetchSpy.mockReturnValue({
        ok: true,
        text() {
          return Promise.resolve('not valid json');
        },
      });

      await expect(Qminder.ApiBase.request('TEST')).rejects.toThrow(
        'Failed to parse response body as JSON',
      );
    });

    it('sends objects as www-form-urlencoded', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/TEST';
      const body = { a: 'test' };

      Qminder.ApiBase.request('TEST', { body: body, method: 'POST' }).then(
        () => {
          expect(fetchSpy.mock.calls[0][1].body).toEqual('a=test');
          expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
            'application/x-www-form-urlencoded',
          );
          expect(fetchSpy.mock.calls[0][0]).toEqual(url);
          done();
        },
      );
    });

    it('should handle error with message in "error" property', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        statusCode: 409,
        message: 'Internal server error',
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: SimpleError) => {
          expect(error.message).toEqual('Internal server error');
          expect(error instanceof SimpleError).toBeTruthy();
          done();
        },
      );
    });

    it('should handle error with unrecognised response type', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        statusCode: 409,
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: SimpleError) => {
          expect(error.message).toEqual(
            'Error occurred! Could not extract error message!',
          );
          expect(error instanceof UnknownError).toBeTruthy();
          done();
        },
      );
    });

    it('should handle error with error property as string', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        error: 'Internal Server Error',
        statusCode: 409,
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: SimpleError) => {
          expect(error.message).toEqual('Internal Server Error');
          expect(error instanceof SimpleError).toBeTruthy();
          done();
        },
      );
    });

    it('should handle error with message in "developerMessage" property', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        statusCode: 409,
        developerMessage: 'Oh, snap!',
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: SimpleError) => {
          expect(error.message).toEqual('Oh, snap!');
          expect(error instanceof SimpleError).toBeTruthy();
          done();
        },
      );
    });

    it('should handle error with complex error in "error" property', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        statusCode: 409,
        error: { email: 'Email already in use' },
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: ComplexError) => {
          expect(error.error).toEqual({ email: 'Email already in use' });
          expect(error.message).toEqual(
            'Error occurred! Check error property for more information!',
          );
          expect(error instanceof ComplexError).toBeTruthy();
          done();
        },
      );
    });

    it('should handle error with complex error in "errors" property', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        ok: false,
        statusCode: 409,
        errors: { email: 'Email already in use' },
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: ComplexError) => {
          expect(error.error).toEqual({ email: 'Email already in use' });
          expect(error.message).toEqual(
            'Error occurred! Check error property for more information!',
          );
          expect(error instanceof ComplexError).toBeTruthy();
          done();
        },
      );
    });
  });

  describe('queryGraph()', () => {
    const VALIDATION_ERROR =
      "Validation error of type FieldUndefined: Field 'x' in type 'Account' is undefined @ 'account/x'";

    const ME_ID = generateRequestData('{ me { id } }', {
      me: {
        id: 12345,
      },
    });

    const ERROR_UNDEFINED_FIELD: any = {
      statusCode: 200,
      errors: [
        {
          message: VALIDATION_ERROR,
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

    it('throws when no query is passed', () => {
      Qminder.ApiBase.setKey('testing');
      expect(() => (Qminder.ApiBase.queryGraph as any)()).rejects.toThrow();
    });

    it('does not throw when no variables are passed', async () => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ME_ID.successfulResponse)),
      );

      await expect(
        Qminder.ApiBase.queryGraph(ME_ID.request),
      ).resolves.not.toThrow();
    });

    it('throws when API key is not defined', () => {
      fetchSpy.mockReturnValue(new MockResponse(ME_ID.successfulResponse));
      expect(() => Qminder.ApiBase.queryGraph(ME_ID.request)).rejects.toThrow();
    });

    it('sends a correct request', () => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ME_ID.successfulResponse)),
      );
      Qminder.ApiBase.queryGraph(ME_ID.request);
      expect(fetchSpy).toHaveBeenCalledWith(API_URL, ME_ID.expectedFetch);
    });

    it('resolves with response data', (done) => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ME_ID.successfulResponse)),
      );

      Qminder.ApiBase.queryGraph(ME_ID.request).then((response) => {
        expect(response).toEqual(ME_ID.successfulResponse.data);
        done();
      });
    });

    it('throws an error when getting errors as response', async () => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ERROR_UNDEFINED_FIELD)),
      );

      expect(async () => {
        await Qminder.ApiBase.queryGraph(ME_ID.request);
      }).rejects.toThrow(
        new SimpleError(
          "Validation error of type FieldUndefined: Field 'x' in type 'Account' is undefined @ 'account/x'",
        ),
      );
    });

    it('should throw an error when response does not contain any data', async () => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() => Promise.resolve(FAKE_RESPONSE));

      expect(async () => {
        await Qminder.ApiBase.queryGraph(ME_ID.request);
      }).rejects.toThrow(
        new ResponseValidationError(
          'Error occurred! Could not extract error message!',
        ),
      );
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      Qminder.setKey(API_KEY);
    });

    it('should have the HTTP status of the response', async () => {
      fetchSpy.mockReturnValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('{"message":"Not found"}'),
      });

      await expect(Qminder.ApiBase.request('TEST')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should read the errorMessage of api-gateway', async () => {
      fetchSpy.mockReturnValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"errorMessage":"JWT is invalid"}'),
      });

      await expect(Qminder.ApiBase.request('TEST')).rejects.toMatchObject({
        message: 'JWT is invalid',
        status: 401,
      });
    });

    it('should have the HTTP status for a GraphQL response', async () => {
      fetchSpy.mockReturnValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ errorMessage: 'Too many requests' }),
      });

      await expect(
        Qminder.ApiBase.queryGraph({ query: '{ me { id } }' }),
      ).rejects.toMatchObject({ message: 'Too many requests', status: 429 });
    });
  });
});
