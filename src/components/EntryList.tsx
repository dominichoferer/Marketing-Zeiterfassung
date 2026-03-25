'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES, STAFF } from '@/lib/config';
import { formatDuration, formatDate, getPeriodRange, type PeriodState } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import PeriodSelector from './PeriodSelector';
import type { TimeEntry } from '@/types/database';
import { Trash2, Filter, Pencil } from 'lucide-react';
import EditEntryModal from './EditEntryModal';

export default function EntryList({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodState>({ mode: 'today', offset: 0 });
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing]   = useState<TimeEntry | null>(null);

  const range = getPeriodRange(period);

  useEffect(() => {
    loadEntries();
  }, [period, filterCompany, filterStaff]);

  async function loadEntries() {
    setLoading(true);
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (range.from) query = query.gte('date', range.from);
    if (range.to)   query = query.lte('date', range.to);
    if (filterCompany) query = query.eq('company_id', filterCompany);
    if (filterStaff)   query = query.eq('staff_code', filterStaff);

    const { data } = await query.limit(500);
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
      {editing && (
        <EditEntryModal
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          }}
        />
      )}
      {/* Zeitraum + Filter */}
      <div className="bg-white rounded-xl border border-brand-100 p-4 space-y-3">
        {/* PeriodSelector */}
        <PeriodSelector value={period} onChange={setPeriod} label={range.label} />

        {/* Firma & Mitarbeiter Filter */}
        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-brand-50">
          <Filter size={15} className="text-brand-400 flex-shrink-0" />

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

          {(filterCompany || filterStaff) && (
            <button
              onClick={() => { setFilterCompany(''); setFilterStaff(''); }}
              className="text-sm text-brand-400 hover:text-brand-600 underline cursor-pointer"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Zusammenfassung */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500 font-light">
          {entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}
        </p>
        <p className="text-sm font-semibold text-slate-700">
          Gesamt: {formatDuration(totalMinutes)}
        </p>
      </div>

      {/* Tabelle */}
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
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setEditing(entry)}
                          className="text-slate-300 hover:text-brand-500 transition-colors p-1 rounded cursor-pointer"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
