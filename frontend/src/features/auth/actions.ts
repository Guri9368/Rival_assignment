'use server';

import { redirect } from 'next/navigation';
import { setSession, clearSession } from '@/lib/session';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import { AuthResponse } from '@/types/api.types';

// Direct fetch — no cookie reading needed on server side
async function serverAuthFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Request failed');
    throw new Error(message);
  }

  return res.json();
}

export async function loginAction(data: { email: string; password: string }) {
  try {
    const res = await serverAuthFetch<AuthResponse>('/auth/login', data);
    await setSession(res.accessToken, res.refreshToken);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Login failed. Please try again.' };
  }
  redirect(ROUTES.dashboard);
}

export async function registerAction(data: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}) {
  try {
    const res = await serverAuthFetch<AuthResponse>('/auth/register', data);
    await setSession(res.accessToken, res.refreshToken);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Registration failed. Please try again.' };
  }
  redirect(ROUTES.dashboard);
}

export async function logoutAction() {
  try {
    const { getSession } = await import('@/lib/session');
    const { accessToken } = await getSession();
    if (accessToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });
    }
  } catch {
    // ignore — clear session regardless
  }
  await clearSession();
  redirect(ROUTES.login);
}
