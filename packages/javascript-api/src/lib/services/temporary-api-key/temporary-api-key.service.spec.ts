import { TemporaryApiKeyService } from './temporary-api-key.service';
import fetchMock from 'jest-fetch-mock';

jest.mock('../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
}));

describe('Temporary API Key Service', function () {
  const service = new TemporaryApiKeyService(
    () => 'api.qminder.com',
    async () => ({ 'X-Qminder-REST-API-Key': 'initialkey' }),
    false,
  );

  beforeEach(async () => {
    fetchMock.enableMocks();

    jest.spyOn(global.console, 'info').mockImplementation();
    jest.spyOn(global.console, 'error').mockImplementation();
  });

  afterEach(async () => {
    fetchMock.mockRestore();
  });

  it('fetches temporary API key', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ key: '12345' }));
    await service.fetchTemporaryApiKey();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.qminder.com/graphql/connection-key',
      {
        headers: { 'X-Qminder-REST-API-Key': 'initialkey' },
        method: 'POST',
        mode: 'cors',
      },
    );
  });

  it('fetches the temporary API key with the given authentication headers', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ key: '12345' }));
    const tokenService = new TemporaryApiKeyService(
      () => 'api.qminder.com',
      async () => ({ Authorization: 'Bearer token-1' }),
      true,
    );

    await expect(tokenService.fetchTemporaryApiKey()).resolves.toBe('12345');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.qminder.com/graphql/connection-key',
      {
        headers: { Authorization: 'Bearer token-1' },
        method: 'POST',
        mode: 'cors',
      },
    );
  });

  it('asks for refreshed authentication headers when server responds with 401', async () => {
    fetchMock.mockResponses(
      ['{}', { status: 401 }],
      [JSON.stringify({ key: '12345' }), { status: 200 }],
    );
    const getAuthHeaders = jest.fn(async (forceRefresh: boolean) => ({
      Authorization: forceRefresh ? 'Bearer new-token' : 'Bearer old-token',
    }));
    const tokenService = new TemporaryApiKeyService(
      () => 'api.qminder.com',
      getAuthHeaders,
      true,
    );

    await expect(tokenService.fetchTemporaryApiKey()).resolves.toBe('12345');

    expect(getAuthHeaders).toHaveBeenNthCalledWith(1, false);
    expect(getAuthHeaders).toHaveBeenNthCalledWith(2, true);
    const authorizations = (fetch as jest.Mock).mock.calls.map(
      (call) => call[1].headers.Authorization,
    );
    expect(authorizations).toEqual(['Bearer old-token', 'Bearer new-token']);
  });

  it('reads the API server for each request', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ key: '12345' }));
    let server = 'api.qminder.com';
    const tokenService = new TemporaryApiKeyService(
      () => server,
      async () => ({ 'X-Qminder-REST-API-Key': 'initialkey' }),
      false,
    );

    server = 'local.api.qminder.com';
    await tokenService.fetchTemporaryApiKey();

    expect(fetch).toHaveBeenCalledWith(
      'https://local.api.qminder.com/graphql/connection-key',
      expect.anything(),
    );
  });

  it('does not try again when server responds with 403', async () => {
    fetchMock.mockResponseOnce('{}', {
      status: 403,
      statusText: 'I Dont know you!',
    });
    await expect(
      async () => await service.fetchTemporaryApiKey(),
    ).rejects.toThrow();
  });

  it('tries again when server responds with 5XX error', async () => {
    fetchMock.mockResponses(
      ['{}', { status: 500, statusText: 'Internal Server Error' }],
      [JSON.stringify({ key: '12345' }), { status: 200 }],
      [JSON.stringify({ key: '12345' }), { status: 200 }],
    );
    await service.fetchTemporaryApiKey();
  });

  it('tries again when response does not contain key', async () => {
    fetchMock.mockResponses(
      ['{}', { status: 200 }],
      [JSON.stringify({ key: '12345' }), { status: 200 }],
    );
    let temporaryKey = await service.fetchTemporaryApiKey();
    expect(temporaryKey).toEqual('12345');
  });
});
