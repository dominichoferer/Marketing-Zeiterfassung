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
        <div className="flex min-h-screen">
          <Navbar profile={profile} />
          <main className="ml-[240px] flex-1 p-8">
            {children(profile)}
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
