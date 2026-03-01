import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL, COOKIE_KEYS } from '@/lib/constants';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_KEYS.refreshToken)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      cookieStore.delete(COOKIE_KEYS.accessToken);
      cookieStore.delete(COOKIE_KEYS.refreshToken);
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await res.json();
    const response = NextResponse.json({ accessToken: data.accessToken });

    response.cookies.set(COOKIE_KEYS.accessToken, data.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });
    response.cookies.set(COOKIE_KEYS.refreshToken, data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
