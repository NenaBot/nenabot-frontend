import { APIError, apiClient } from '../../services/apiClient';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  test('retries transient failures and eventually resolves', async () => {
    jest.useFakeTimers();

    const fetchMock = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const requestPromise = apiClient.get<{ ok: boolean }>('/api/health', { retries: 1 });

    await jest.advanceTimersByTimeAsync(1000);

    await expect(requestPromise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  test('does not retry APIError responses', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>()
      .mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ code: 'BAD_REQUEST', message: 'invalid payload' }),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/api/health', { retries: 3 })).rejects.toEqual(
      expect.objectContaining({
        name: 'APIError',
        status: 400,
        code: 'BAD_REQUEST',
        message: 'invalid payload',
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('times out requests and rejects with AbortError', async () => {
    jest.useFakeTimers();

    const fetchMock = jest.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    global.fetch = fetchMock as unknown as typeof fetch;

    const requestPromise = apiClient.get('/api/slow', { timeout: 20, retries: 0 });
    const rejection = requestPromise.catch((error) => error);

    await jest.advanceTimersByTimeAsync(25);

    const error = await rejection;
    expect(error).toEqual(
      expect.objectContaining({
        name: 'AbortError',
      }),
    );

    jest.useRealTimers();
  });

  test('falls back to UNKNOWN_ERROR when non-json error payload is returned', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>()
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new TypeError('not json');
        },
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/api/fail')).rejects.toBeInstanceOf(APIError);
    await expect(apiClient.get('/api/fail')).rejects.toEqual(
      expect.objectContaining({
        status: 500,
        code: 'UNKNOWN_ERROR',
        message: 'HTTP 500',
      }),
    );
  });

  test('returns the current camera feed endpoint from deprecated helper', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(apiClient.getVideoStreamUrl()).toBe('http://localhost:8000/api/stream/camera/feed');
    expect(warnSpy).toHaveBeenCalledWith(
      '[CameraAPI] apiClient.getVideoStreamUrl() is deprecated, prefer getStreamUrl(kind)',
      expect.objectContaining({
        url: 'http://localhost:8000/api/stream/camera/feed',
      }),
    );
  });
});
