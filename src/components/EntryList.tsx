'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES, STAFF } from '@/lib/config';
import { formatDuration, formatDate } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import type { TimeEntry } from '@/types/database';
import { Trash2, Filter } from 'lucide-react';

export default function EntryList({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [filterCompany, filterStaff, filterFrom, filterTo]);

  async function loadEntries() {
    setLoading(true);
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterCompany) query = query.eq('company_id', filterCompany);
    if (filterStaff) query = query.eq('staff_code', filterStaff);
    if (filterFrom) query = query.gte('date', filterFrom);
    if (filterTo) query = query.lte('date', filterTo);

    const { data } = await query.limit(200);
    setEntries(data ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    setDeleting(id);
    await supabase.from('time_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);

  const selectClass = 'border border-brand-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white';

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-brand-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-brand-400" />
          <span className="text-sm font-medium text-slate-600">Filter</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className={selectClass}
          >
            <option value="">Alle Firmen</option>
            {COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className={selectClass}
          >
            <option value="">Alle Mitarbeiter</option>
            {STAFF.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className={selectClass}
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className={selectClass}
            />
          </div>

          {(filterCompany || filterStaff || filterFrom || filterTo) && (
            <button
              onClick={() => {
                setFilterCompany('');
                setFilterStaff('');
                setFilterFrom('');
                setFilterTo('');
              }}
              className="text-sm text-brand-400 hover:text-brand-600 underline cursor-pointer"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500 font-light">
          {entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}
        </p>
        <p className="text-sm font-semibold text-slate-700">
          Gesamt: {formatDuration(totalMinutes)}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm font-light">
            Keine Einträge gefunden
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-100 bg-brand-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Datum</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Firma</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Tätigkeit</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Dauer</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Mitarbeiter</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-50 group transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-3 py-3">
                    <CompanyBadge companyId={entry.company_id} size="sm" />
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700 max-w-xs">
                    <span className="block truncate" title={entry.description}>
                      {entry.description}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                    {formatDuration(entry.duration_minutes)}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500">{entry.staff_name}</td>
                  <td className="px-3 py-3 text-right">
                    {entry.user_id === currentUserId && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded cursor-pointer"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
