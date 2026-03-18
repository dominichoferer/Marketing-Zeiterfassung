'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES } from '@/lib/config';
import { formatDuration, formatDate, getPeriodRange, type PeriodState } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import PeriodSelector from './PeriodSelector';
import type { TimeEntry } from '@/types/database';
import { Clock, TrendingUp } from 'lucide-react';

export default function DashboardStats() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodState>({ mode: 'month', offset: 0 });

  const range = getPeriodRange(period);

  useEffect(() => {
    loadEntries();
  }, [period]);

  async function loadEntries() {
    setLoading(true);
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('date', { ascending: false });

    if (range.from) query = query.gte('date', range.from);
    if (range.to)   query = query.lte('date', range.to);

    const { data } = await query;
    setEntries(data ?? []);
    setLoading(false);
  }

  const byCompany = COMPANIES.map((c) => {
    const total = entries
      .filter((e) => e.company_id === c.id)
      .reduce((sum, e) => sum + e.duration_minutes, 0);
    return { ...c, totalMinutes: total };
  }).filter((c) => c.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const maxMinutes = byCompany[0]?.totalMinutes ?? 1;

  return (
    <div className="space-y-6">

      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector value={period} onChange={setPeriod} label={range.label} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Clock className="text-brand-600" size={20} />}
          label={range.label}
          value={formatDuration(totalMinutes)}
        />
        <StatCard
          icon={<TrendingUp className="text-violet-500" size={20} />}
          label="Einträge"
          value={String(entries.length)}
        />
      </div>

      {/* Company Bars */}
      <div>
        <h2 className="text-slate-800 font-semibold text-base mb-3">Stunden nach Firma</h2>
        <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : byCompany.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-light">
              Keine Einträge in diesem Zeitraum
            </div>
          ) : (
            <div className="divide-y divide-brand-50">
              {byCompany.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <CompanyBadge companyId={c.id} size="sm" />
                    <span className="text-sm font-semibold text-slate-700">
                      {formatDuration(c.totalMinutes)}
                    </span>
                  </div>
                  <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
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
      </div>

      {/* Einträge im Zeitraum */}
      {!loading && entries.length > 0 && (
        <>
          <h2 className="text-slate-800 font-semibold text-base">Einträge</h2>
          <div className="bg-white rounded-xl border border-brand-100 divide-y divide-brand-50">
            {entries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <CompanyBadge companyId={entry.company_id} size="sm" />
                <span className="flex-1 text-sm text-slate-700 truncate">{entry.description}</span>
                <span className="text-sm text-slate-500 flex-shrink-0">{formatDuration(entry.duration_minutes)}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(entry.date)}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{entry.staff_name}</span>
              </div>
            ))}
            {entries.length > 10 && (
              <div className="px-5 py-3 text-xs text-slate-400 text-center font-light">
                + {entries.length - 10} weitere Einträge → Alle Einträge ansehen
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500 font-medium truncate">{label}</span>
      </div>
      <p className="text-xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
