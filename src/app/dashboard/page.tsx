'use client';

import AppLayout from '@/components/AppLayout';
import DashboardStats from '@/components/DashboardStats';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <AppLayout>
      {(profile) => (
        <>
          {/* ── Hero Banner ── */}
          <div className="relative h-[500px] w-full overflow-hidden">

            {/* Gradient-Basis (immer sichtbar) */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #001c33 0%, #003b67 55%, #005a9a 100%)',
              }}
            />

            {/* Hintergrundbild mit geringer Deckkraft */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/nav-bg.jpg')" }}
            />

            {/* Dunkles Overlay */}
            <div className="absolute inset-0 bg-brand-950/60" />

            {/* Hero-Inhalt */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-brand-200 text-xs font-light uppercase tracking-[0.25em] mb-4">
                Marketing Team
              </p>
              <h1 className="text-5xl md:text-6xl font-semibold text-white mb-3 leading-tight">
                Hallo, {profile.staff_name}!
              </h1>
              <p className="text-brand-200 text-lg font-light mb-10">
                Hier ist deine Teamübersicht.
              </p>
              <Link
                href="/neu"
                className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                <PlusCircle size={17} />
                Neuer Eintrag
              </Link>
            </div>
          </div>

          {/* ── Dashboard Inhalt ── */}
          <div className="max-w-3xl mx-auto px-6 py-10">
            <DashboardStats />
          </div>
        </>
      )}
    </AppLayout>
  );
}
