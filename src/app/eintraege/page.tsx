'use client';

import AppLayout from '@/components/AppLayout';
import EntryList from '@/components/EntryList';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function EintraegePage() {
  return (
    <AppLayout>
      {(profile) => (
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

          <EntryList currentUserId={profile.id} />
        </div>
      )}
    </AppLayout>
  );
}
