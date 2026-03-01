import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-slate-200">404</h1>
      <h2 className="text-xl font-semibold text-slate-700">Page not found</h2>
      <p className="text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href={ROUTES.feed} className="mt-2 text-sm text-slate-900 underline underline-offset-4">
        Back to feed
      </Link>
    </div>
  );
}
