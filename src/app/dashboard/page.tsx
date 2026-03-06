'use client';

import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(profile) => (
        <div className="flex min-h-screen">
          <Navbar profile={profile} />
          <main className="ml-[240px] flex-1 p-8">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Hallo {profile.staff_name}! Hier siehst du die Teamübersicht.
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

              <DashboardStats />
            </div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
