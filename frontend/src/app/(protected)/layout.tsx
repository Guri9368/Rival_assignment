import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { ROUTES } from '@/lib/constants';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { accessToken } = await getSession();
  if (!accessToken) redirect(ROUTES.login);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </>
  );
}
