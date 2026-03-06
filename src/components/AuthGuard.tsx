'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { STAFF } from '@/lib/config';

interface AuthGuardProps {
  children: (profile: Profile) => React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!data || !data.staff_name) {
        setNeedsSetup(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSetup() {
    if (!selectedStaff) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const staff = STAFF.find((s) => s.code === selectedStaff)!;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, staff_name: staff.name, staff_code: staff.code })
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setNeedsSetup(false);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Willkommen!</h2>
          <p className="text-slate-500 text-sm mb-6">Bitte wähle deinen Namen aus dem Team-Liste.</p>

          <label className="block text-sm font-medium text-slate-700 mb-2">Dein Name</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          >
            <option value="">– Name wählen –</option>
            {STAFF.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={handleSetup}
            disabled={!selectedStaff || saving}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? 'Speichern…' : 'Weiter'}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;
  return <>{children(profile)}</>;
}
