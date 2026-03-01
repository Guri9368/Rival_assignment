import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { getSession } from '@/lib/session';
import { LogoutButton } from './LogoutButton';

export async function Navbar() {
  const { accessToken } = await getSession();
  const loggedIn = !!accessToken;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={ROUTES.feed} className="text-lg font-bold text-slate-900 tracking-tight">
          BlogPlatform
        </Link>
        <nav className="flex items-center gap-2">
          <Link href={ROUTES.feed} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            Feed
          </Link>
          {loggedIn ? (
            <>
              <Link href={ROUTES.dashboard} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href={ROUTES.login} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                Sign in
              </Link>
              <Link href={ROUTES.register} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
