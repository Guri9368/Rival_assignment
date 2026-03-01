import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_KEYS, ROUTES } from './lib/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(COOKIE_KEYS.accessToken)?.value;

  // Protect all /dashboard/* routes
  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      const loginUrl = new URL(ROUTES.login, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/register') && accessToken) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
