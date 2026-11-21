export const requestTimeoutMs = 15_000;
// A photo upload takes longer on a slow connection, so it gets more time.
export const uploadTimeoutMs = 60_000;

// Expo's fetch uses React Native's OkHttp client, which never times out, so a stalled request would hang for minutes.
export const fetchWithTimeout: typeof fetch = (input, init) => {
  // A request with its own signal, like the label read's 20 s, keeps its own limit.
  if (init?.signal) {
    return fetch(input, init);
  }
  const controller = new AbortController();
  // Photo uploads are the only requests that send raw bytes.
  const timeoutMs = init?.body instanceof ArrayBuffer ? uploadTimeoutMs : requestTimeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Expo's native fetch can miss an abort that lands as the answer arrives, so the timer settles the request itself.
  const timedOut = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      // An AbortError, because postgrest-js retries any other failed read three more times.
      reject(Object.assign(new Error('The request timed out.'), { name: 'AbortError' }));
      controller.abort();
    }, timeoutMs);
  });
  return Promise.race([fetch(input, { ...init, signal: controller.signal }), timedOut]).finally(
    () => clearTimeout(timer),
  );
};
