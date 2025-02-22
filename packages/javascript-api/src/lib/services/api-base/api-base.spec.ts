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
  constructor(private data: any) {}

  json() {
    return this.data;
  }
}

describe('ApiBase', () => {
  const API_KEY = 'testing';
  let fetchSpy: any;

  beforeEach(() => {
    // Manual reset for ApiBase - Karma doesn't reload the environment between tests.
    (Qminder.ApiBase as any).initialized = false;
    (Qminder.ApiBase as any).apiKey = undefined;
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

    it('calls the Response.json() function to resolve the JSON', (done) => {
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
          `Server response is not valid GraphQL response. Response: {}`,
        ),
      );
    });
  });
});
