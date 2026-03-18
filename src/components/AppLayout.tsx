'use client';

import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import type { Profile } from '@/types/database';

interface AppLayoutProps {
  children: (profile: Profile) => React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGuard>
      {(profile) => (
        <div className="min-h-screen bg-slate-50">
          <Navbar profile={profile} />
          {/* pt-16 = Navbar-Höhe (64px) */}
          <main className="pt-16">
            {children(profile)}
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
