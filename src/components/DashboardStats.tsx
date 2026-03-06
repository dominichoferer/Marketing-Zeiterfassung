'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES } from '@/lib/config';
import { formatDuration, startOfWeekISO, startOfMonthISO, todayISO } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import type { TimeEntry } from '@/types/database';
import { Clock, TrendingUp, Calendar } from 'lucide-react';

type Period = 'week' | 'month';

export default function DashboardStats() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    loadEntries();
  }, [period]);

  async function loadEntries() {
    setLoading(true);
    const from = period === 'week' ? startOfWeekISO() : startOfMonthISO();
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .gte('date', from)
      .lte('date', todayISO())
      .order('date', { ascending: false });

    setEntries(data ?? []);
    setLoading(false);
  }

  // Stunden pro Firma aggregieren
  const byCompany = COMPANIES.map((c) => {
    const total = entries
      .filter((e) => e.company_id === c.id)
      .reduce((sum, e) => sum + e.duration_minutes, 0);
    return { ...c, totalMinutes: total };
  }).filter((c) => c.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const maxMinutes = byCompany[0]?.totalMinutes ?? 1;

  // Heutige Einträge
  const todayEntries = entries.filter((e) => e.date === todayISO());

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Clock className="text-blue-500" size={20} />}
          label={period === 'week' ? 'Diese Woche' : 'Diesen Monat'}
          value={formatDuration(totalMinutes)}
        />
        <StatCard
          icon={<Calendar className="text-emerald-500" size={20} />}
          label="Heute"
          value={formatDuration(todayEntries.reduce((s, e) => s + e.duration_minutes, 0))}
        />
        <StatCard
          icon={<TrendingUp className="text-violet-500" size={20} />}
          label="Einträge"
          value={String(entries.length)}
        />
      </div>

      {/* Period Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-base">Stunden nach Firma</h2>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                period === p ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p === 'week' ? 'Woche' : 'Monat'}
            </button>
          ))}
        </div>
      </div>

      {/* Company Bars */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : byCompany.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Noch keine Einträge in diesem Zeitraum
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {byCompany.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <CompanyBadge companyId={c.id} size="sm" />
                  <span className="text-sm font-semibold text-slate-700">
                    {formatDuration(c.totalMinutes)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(c.totalMinutes / maxMinutes) * 100}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Entries */}
      {todayEntries.length > 0 && (
        <>
          <h2 className="text-slate-800 font-semibold text-base">Heute</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <CompanyBadge companyId={entry.company_id} size="sm" />
                <span className="flex-1 text-sm text-slate-700 truncate">{entry.description}</span>
                <span className="text-sm text-slate-500 flex-shrink-0">{formatDuration(entry.duration_minutes)}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{entry.staff_name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
