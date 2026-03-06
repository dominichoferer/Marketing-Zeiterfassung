'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import EntryList from '@/components/EntryList';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EintraegePage() {
  return (
    <AuthGuard>
      {(profile) => <EintraegeContent profile={profile} />}
    </AuthGuard>
  );
}

function EintraegeContent({ profile }: { profile: { id: string; staff_name: string | null; staff_code: string | null; created_at: string } }) {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  return (
    <div className="flex min-h-screen">
      <Navbar profile={profile} />
      <main className="ml-[240px] flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Alle Einträge</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Zeiteinträge des gesamten Marketing Teams
              </p>
            </div>
            <Link
              href="/neu"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle size={16} />
              Neuer Eintrag
            </Link>
          </div>

          {userId && <EntryList currentUserId={userId} />}
        </div>
      </main>
    </div>
  );
}
