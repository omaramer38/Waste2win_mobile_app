const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data as T;
};
