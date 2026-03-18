'use client';

import AppLayout from '@/components/AppLayout';
import TimeEntryForm from '@/components/TimeEntryForm';

export default function NeuPage() {
  return (
    <AppLayout>
      {(profile) => (
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Neuer Eintrag</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Gib deine Tätigkeit ein – mit KI-Schnelleingabe oder manuell.
            </p>
          </div>
          <TimeEntryForm profile={profile} />
        </div>
      )}
    </AppLayout>
  );
}
