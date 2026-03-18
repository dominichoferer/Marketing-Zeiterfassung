'use client';

import AppLayout from '@/components/AppLayout';
import EntryList from '@/components/EntryList';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function EintraegePage() {
  return (
    <AppLayout>
      {(profile) => (
        <>
          {/* Page Header */}
          <div className="bg-white border-b border-brand-100">
            <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Alle Einträge</h1>
                <p className="text-slate-400 text-sm mt-1 font-light">
                  Zeiteinträge des gesamten Marketing Teams
                </p>
              </div>
              <Link
                href="/neu"
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <PlusCircle size={16} />
                Neuer Eintrag
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto px-6 py-8">
            <EntryList currentUserId={profile.id} />
          </div>
        </>
      )}
    </AppLayout>
  );
}
