import { fetchWithTimeout, requestTimeoutMs, uploadTimeoutMs } from '@/lib/fetchWithTimeout';

let fetchMock: jest.SpiedFunction<typeof fetch>;

function sentSignal(): AbortSignal {
  const signal = fetchMock.mock.calls[0][1]?.signal;
  if (!signal) {
    throw new Error('fetch was called without a signal');
  }
  return signal;
}

// Settles only when aborted, like a request on a stalled connection, with the error Expo's fetch gives.
function stalledFetch(_input: RequestInfo | URL, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new Error('fetch failed: Fetch request has been canceled')),
    );
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(stalledFetch);
});

afterEach(() => {
  jest.useRealTimers();
  fetchMock.mockRestore();
});

describe('fetchWithTimeout', () => {
  it('aborts a stalled request after the request timeout', async () => {
    const request = fetchWithTimeout('https://example.test/rest/v1/products');
    const rejected = expect(request).rejects.toThrow('The request timed out.');

    jest.advanceTimersByTime(requestTimeoutMs - 1);
    expect(sentSignal().aborted).toBe(false);
    jest.advanceTimersByTime(1);
    expect(sentSignal().aborted).toBe(true);
    await rejected;
  });

  it('reports a timeout as an AbortError, which postgrest-js never retries', async () => {
    const request = fetchWithTimeout('https://example.test/rest/v1/products');
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });

    jest.advanceTimersByTime(requestTimeoutMs);
    await rejected;
  });

  it('times out even when fetch never settles after the abort', async () => {
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    const request = fetchWithTimeout('https://example.test/rest/v1/products');
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });

    jest.advanceTimersByTime(requestTimeoutMs);
    expect(sentSignal().aborted).toBe(true);
    await rejected;
  });

  it('keeps the method, headers and body it was given', () => {
    fetchWithTimeout('https://example.test/rest/v1/products', {
      method: 'POST',
      headers: { apikey: 'key' },
      body: '{"name":"Toner"}',
    }).catch(() => undefined);

    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/rest/v1/products');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { apikey: 'key' },
      body: '{"name":"Toner"}',
    });
  });

  it('gives a photo upload the longer timeout', () => {
    fetchWithTimeout('https://example.test/storage/v1/object/product-photos/a.jpg', {
      method: 'POST',
      body: new ArrayBuffer(200),
    }).catch(() => undefined);

    jest.advanceTimersByTime(uploadTimeoutMs - 1);
    expect(sentSignal().aborted).toBe(false);
    jest.advanceTimersByTime(1);
    expect(sentSignal().aborted).toBe(true);
  });

  it('stops the timer once the response arrives', async () => {
    const response = new Response('[]');
    fetchMock.mockResolvedValueOnce(response);

    await expect(fetchWithTimeout('https://example.test/rest/v1/products')).resolves.toBe(response);
    jest.advanceTimersByTime(uploadTimeoutMs);
    expect(sentSignal().aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('passes a network failure on unchanged and stops the timer', async () => {
    const failure = new TypeError('Network request failed');
    fetchMock.mockRejectedValueOnce(failure);

    await expect(fetchWithTimeout('https://example.test/rest/v1/products')).rejects.toBe(failure);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("leaves a caller's own signal and limit alone", () => {
    const controller = new AbortController();
    const init = { method: 'POST', signal: controller.signal };
    fetchWithTimeout('https://example.test/functions/v1/read-product-label', init).catch(
      () => undefined,
    );

    expect(fetchMock.mock.calls[0][1]).toBe(init);
    jest.advanceTimersByTime(uploadTimeoutMs);
    expect(controller.signal.aborted).toBe(false);
    controller.abort();
    expect(sentSignal().aborted).toBe(true);
  });
});
