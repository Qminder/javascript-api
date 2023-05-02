import * as sinon from 'sinon';
<<<<<<< Updated upstream:src/services/api-base/api-base.spec.ts
import fetch from 'cross-fetch';
import * as Qminder from '../../qminder-api';
=======
import * as Qminder from '../../../qminder-api';
>>>>>>> Stashed changes:src/lib/services/api-base/api-base.spec.ts
import { GraphQLApiError } from '../../util/errors';
import { ClientError } from '../../model/client-error';

jest.mock('cross-fetch', () => {
  const crossFetch = jest.requireActual('cross-fetch');
  return {
    __esModule: true,
    ...crossFetch,
    fetch: jest.fn(),
    default: jest.fn(),
  };
});

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
      statusCode: 200,
      errors: [],
      data: [responseData],
    },
  };
}

const FAKE_RESPONSE = {
  json() {
    return { statusCode: 200 };
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

    fetchSpy = fetch;
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
      await expect(Qminder.ApiBase.request('locations/673/')).rejects.toThrow();
    });

    it('does not throw an error when setKey has been called', async () => {
      Qminder.setKey(API_KEY);
      await expect(
        Qminder.ApiBase.request('locations/673/'),
      ).resolves.not.toThrow();
    });

    it('sends a fetch() request to https://SERVER/v1/URL', () => {
      Qminder.setKey(API_KEY);
      Qminder.ApiBase.request('TEST');
      expect(fetchSpy).toHaveBeenCalledWith('https://api.qminder.com/v1/TEST', {
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
          'https://api.qminder.com/v1/TEST',
          init,
        );
        done();
      });
    });

    it('sends POST requests when the second argument is defined', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', { id: 1 }).then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual('id=1');
        expect(fetchSpy.mock.calls[0][1].method).toEqual('POST');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends POST requests with its third argument set as POST', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';

      Qminder.ApiBase.request('TEST', undefined, 'POST').then(() => {
        expect(fetchSpy.mock.calls[0][1].method).toEqual('POST');
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends POST requests with the request body as formdata', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      Qminder.ApiBase.request('TEST', body).then(() => {
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
      const url = 'https://api.qminder.com/v1/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      Qminder.ApiBase.request('TEST', body).then(() => {
        expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
          'application/x-www-form-urlencoded',
        );
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sets the HTTP header Idempotency-Key if idempotencyKey has been provided', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';
      const body = {
        id: 5,
        firstName: 'John',
        lastName: 'Smith',
      };

      Qminder.ApiBase.request('TEST', body, undefined, '9e3a333e').then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual(
          'id=5&firstName=John&lastName=Smith',
        );
        expect(fetchSpy.mock.calls[0][1].headers['Idempotency-Key']).toEqual(
          '9e3a333e',
        );
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends strings as JSON', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';
      const body = JSON.stringify([123, 456, 789]);

      Qminder.ApiBase.request('TEST', body, 'POST').then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual(body);
        expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
          'application/json',
        );
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('sends objects as www-form-urlencoded', (done) => {
      Qminder.setKey(API_KEY);
      const url = 'https://api.qminder.com/v1/TEST';
      const body = { a: 'test' };

      Qminder.ApiBase.request('TEST', body, 'POST').then(() => {
        expect(fetchSpy.mock.calls[0][1].body).toEqual('a=test');
        expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toEqual(
          'application/x-www-form-urlencoded',
        );
        expect(fetchSpy.mock.calls[0][0]).toEqual(url);
        done();
      });
    });

    it('handles legacy error response (message)', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        statusCode: 409,
        message: 'Oh, snap!',
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: GraphQLApiError) => {
          expect(error).toEqual(new Error('Oh, snap!'));
          done();
        },
      );
    });

    it('handles legacy error response (developerMessage)', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        statusCode: 409,
        developerMessage: 'Oh, snap!',
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: GraphQLApiError) => {
          expect(error).toEqual(new Error('Oh, snap!'));
          done();
        },
      );
    });

    it('handles client error', (done) => {
      Qminder.setKey(API_KEY);

      const response: any = {
        statusCode: 409,
        error: { email: 'Email already in use' },
      };

      fetchSpy.mockReturnValue(new MockResponse(response));

      Qminder.ApiBase.request('TEST').then(
        () => done(new Error('Should have errored')),
        (error: GraphQLApiError) => {
          expect(error).toEqual(
            new ClientError('email', 'Email already in use'),
          );
          done();
        },
      );
    });
  });

  describe('queryGraph()', () => {
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

    it('throws when no query is passed', () => {
      Qminder.ApiBase.setKey('testing');
      expect(() => (Qminder.ApiBase.queryGraph as any)()).toThrow();
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
      expect(() => Qminder.ApiBase.queryGraph(ME_ID.request)).toThrow();
    });

    it('sends a correct request', () => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ME_ID.successfulResponse)),
      );
      Qminder.ApiBase.queryGraph(ME_ID.request);
      expect(fetchSpy).toHaveBeenCalledWith(API_URL, ME_ID.expectedFetch);
    });

    it('resolves with the entire response object, not only response data', (done) => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ME_ID.successfulResponse)),
      );

      Qminder.ApiBase.queryGraph(ME_ID.request).then((response) => {
        expect(response).toEqual(ME_ID.successfulResponse);
        done();
      });
    });

    it('throws an error when getting errors as response', (done) => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ERROR_UNDEFINED_FIELD)),
      );

      Qminder.ApiBase.queryGraph(ME_ID.request).then(
        () => done(new Error('QueryGraph should have thrown an error')),
        () => done(),
      );
    });

    it('resolves with response, even if response has errors', (done) => {
      Qminder.ApiBase.setKey('testing');
      fetchSpy.mockImplementation(() =>
        Promise.resolve(new MockResponse(ERROR_UNDEFINED_FIELD)),
      );

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
