'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import EntryList from '@/components/EntryList';
import KiBulkModal from '@/components/KiBulkModal';
import Link from 'next/link';
import { PlusCircle, Sparkles } from 'lucide-react';

export default function EintraegePage() {
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <AppLayout>
      {(profile) => (
        <>
          {bulkOpen && <KiBulkModal profile={profile} onClose={() => setBulkOpen(false)} />}

          {/* Page Header */}
          <div className="bg-white border-b border-brand-100">
            <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Alle Einträge</h1>
                <p className="text-slate-400 text-sm mt-1 font-light">
                  Zeiteinträge des gesamten Marketing Teams
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkOpen(true)}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                  <Sparkles size={16} />
                  KI-Bulk
                </button>
                <Link
                  href="/neu"
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <PlusCircle size={16} />
                  Neuer Eintrag
                </Link>
              </div>
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
