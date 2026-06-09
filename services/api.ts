const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 15000;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export const api = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.auth !== false && authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? 'Request timed out. Make sure the backend server is running.'
      : `Cannot reach the backend at ${API_URL}. Check the API IP address and that the phone is on the same network.`;

    throw new Error(message);
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let data: { message?: string } = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Server returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data as T;
};
