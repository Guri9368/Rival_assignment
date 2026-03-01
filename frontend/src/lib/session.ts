import { cookies } from 'next/headers';
import { COOKIE_KEYS } from './constants';

const SECURE = process.env.NODE_ENV === 'production';

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.accessToken)?.value;
  const refreshToken = cookieStore.get(COOKIE_KEYS.refreshToken)?.value;
  return { accessToken, refreshToken };
}

export async function setSession(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  // Access token: NOT httpOnly so the browser JS can send it in Authorization header
  // This is acceptable — access tokens are short-lived (15 min)
  cookieStore.set(COOKIE_KEYS.accessToken, accessToken, {
    httpOnly: false,   // readable by JS — needed to attach to API requests
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,   // 15 minutes
  });

  // Refresh token: httpOnly — never readable by JS, more secure
  cookieStore.set(COOKIE_KEYS.refreshToken, refreshToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_KEYS.accessToken);
  cookieStore.delete(COOKIE_KEYS.refreshToken);
}
