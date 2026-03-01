import { API_BASE_URL, COOKIE_KEYS } from '../constants';
import { ApiErrorResponse } from '@/types/api.types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
  _isRetry?: boolean;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const data: ApiErrorResponse = await res.json();
    const msg = Array.isArray(data.message) ? data.message[0] : data.message;
    return new ApiError(res.status, msg, Array.isArray(data.message) ? data.message : undefined);
  } catch {
    return new ApiError(res.status, res.statusText || 'Request failed');
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, _isRetry, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  // Read access token from non-httpOnly cookie
  const accessToken = token ?? readCookie(COOKIE_KEYS.accessToken);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers });

  // 401 → try refresh once using the httpOnly refresh token via server route
  if (res.status === 401 && !_isRetry) {
    try {
      // Call our Next.js API route which reads the httpOnly refresh token server-side
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        return request<T>(path, { ...options, token: newToken, _isRetry: true });
      }
    } catch { /* ignore */ }

    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function serverFetch<T>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options, headers, cache: 'no-store',
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};
