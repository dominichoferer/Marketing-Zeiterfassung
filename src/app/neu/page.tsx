'use client';

import AppLayout from '@/components/AppLayout';
import TimeEntryForm from '@/components/TimeEntryForm';

export default function NeuPage() {
  return (
    <AppLayout>
      {(profile) => (
        <>
          {/* Page Header */}
          <div className="bg-white border-b border-brand-100">
            <div className="max-w-2xl mx-auto px-6 py-8">
              <h1 className="text-2xl font-semibold text-slate-800">Neuer Eintrag</h1>
              <p className="text-slate-400 text-sm mt-1 font-light">
                Gib deine Tätigkeit ein – mit KI-Schnelleingabe oder manuell.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-2xl mx-auto px-6 py-8">
            <TimeEntryForm profile={profile} />
          </div>
        </>
      )}
    </AppLayout>
  );
}
