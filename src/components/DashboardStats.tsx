'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES } from '@/lib/config';
import { formatDuration, startOfWeekISO, startOfMonthISO, todayISO } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import type { TimeEntry } from '@/types/database';
import { Clock, TrendingUp, Users } from 'lucide-react';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
};

export default function DashboardStats() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    loadEntries();
  }, [period]);

  async function loadEntries() {
    setLoading(true);
    const from = period === 'week'
      ? startOfWeekISO()
      : period === 'month'
      ? startOfMonthISO()
      : todayISO();

    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .gte('date', from)
      .lte('date', todayISO())
      .order('date', { ascending: false });

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
  const uniqueStaff = new Set(entries.map((e) => e.staff_code)).size;

  const todayEntries = entries.filter((e) => e.date === todayISO());

  return (
    <div className="space-y-6">
      {/* Period Toggle */}
      <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm bg-white self-start w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-5 py-2 font-medium transition-colors"
            style={{
              backgroundColor: period === p ? '#2c5282' : 'transparent',
              color: period === p ? '#ffffff' : '#64748b',
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Clock size={20} style={{ color: '#2c5282' }} />}
          label={`Diese${period === 'day' ? 'n Tag' : period === 'week' ? ' Woche' : 'n Monat'}`}
          value={formatDuration(totalMinutes)}
        />
        <StatCard
          icon={<TrendingUp size={20} style={{ color: '#4da3db' }} />}
          label="Einträge"
          value={String(entries.length)}
        />
        <StatCard
          icon={<Users size={20} style={{ color: '#38a169' }} />}
          label="Mitarbeiter aktiv"
          value={String(uniqueStaff)}
        />
      </div>

      {/* Company Bars */}
      <div>
        <h2 className="text-slate-700 font-semibold text-base mb-3">Stunden nach Firma</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2c5282', borderTopColor: 'transparent' }} />
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
      </div>

      {/* Today's Entries (only when not on 'day' view to avoid duplication) */}
      {period !== 'day' && todayEntries.length > 0 && (
        <div>
          <h2 className="text-slate-700 font-semibold text-base mb-3">Heute</h2>
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
        </div>
      )}

      {/* Day view: show all entries */}
      {period === 'day' && entries.length > 0 && (
        <div>
          <h2 className="text-slate-700 font-semibold text-base mb-3">Einträge heute</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <CompanyBadge companyId={entry.company_id} size="sm" />
                <span className="flex-1 text-sm text-slate-700 truncate">{entry.description}</span>
                <span className="text-sm text-slate-500 flex-shrink-0">{formatDuration(entry.duration_minutes)}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{entry.staff_name}</span>
              </div>
            ))}
          </div>
        </div>
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
