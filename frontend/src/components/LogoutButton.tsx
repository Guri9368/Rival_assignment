'use client';

import { useState } from 'react';
import { logoutAction } from '@/features/auth/actions';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logoutAction();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium bg-white text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
