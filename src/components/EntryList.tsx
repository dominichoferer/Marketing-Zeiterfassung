'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES, STAFF } from '@/lib/config';
import { formatDuration, formatDate, todayISO, startOfWeekISO, startOfMonthISO, getCompany } from '@/lib/utils';
import CompanyBadge from './CompanyBadge';
import type { TimeEntry } from '@/types/database';
import { Trash2, Filter, Download } from 'lucide-react';

type QuickFilter = '' | 'today' | 'week' | 'month';

export default function EntryList({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [filterCompany, filterStaff, filterFrom, filterTo]);

  function applyQuickFilter(qf: QuickFilter) {
    setQuickFilter(qf);
    if (qf === 'today') {
      setFilterFrom(todayISO());
      setFilterTo(todayISO());
    } else if (qf === 'week') {
      setFilterFrom(startOfWeekISO());
      setFilterTo(todayISO());
    } else if (qf === 'month') {
      setFilterFrom(startOfMonthISO());
      setFilterTo(todayISO());
    } else {
      setFilterFrom('');
      setFilterTo('');
    }
  }

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

  async function handleExportExcel() {
    if (entries.length === 0) return;
    setExporting(true);

    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Marketing Zeiterfassung';
      const ws = wb.addWorksheet('Zeiteinträge');

      // Spaltenbreiten
      ws.columns = [
        { header: 'Datum',       key: 'date',        width: 16 },
        { header: 'Firma',       key: 'company',     width: 18 },
        { header: 'Tätigkeit',   key: 'description', width: 45 },
        { header: 'Dauer (h)',   key: 'duration',    width: 12 },
        { header: 'Mitarbeiter', key: 'staff',       width: 16 },
      ];

      // Header-Zeile stylen
      const headerRow = ws.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5282' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FF1A365D' } },
        };
      });
      headerRow.height = 22;

      // Datenzeilen
      entries.forEach((entry, i) => {
        const company = getCompany(entry.company_id);
        const durationH = (entry.duration_minutes / 60).toFixed(2);

        const row = ws.addRow({
          date: formatDate(entry.date),
          company: company?.name ?? entry.company_id,
          description: entry.description,
          duration: parseFloat(durationH),
          staff: entry.staff_name,
        });

        // Firma-Zelle mit Firmenfarbe
        if (company) {
          const argb = 'FF' + company.color.replace('#', '').toUpperCase();
          const textArgb = company.textColor === '#ffffff' ? 'FFFFFFFF' : 'FF1A202C';
          row.getCell('company').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
          row.getCell('company').font = { bold: true, color: { argb: textArgb }, size: 10 };
          row.getCell('company').alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Zebra-Streifen für andere Zeilen
        if (i % 2 === 0) {
          ['date', 'description', 'duration', 'staff'].forEach((key) => {
            row.getCell(key).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
          });
        }

        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', wrapText: false };
          cell.border = {
            bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          };
        });
        row.getCell('duration').alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 18;
      });

      // Download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `Zeiteintraege_${dateStr}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel-Export Fehler:', err);
    } finally {
      setExporting(false);
    }
  }

  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);

  const quickButtons: { key: QuickFilter; label: string }[] = [
    { key: 'today', label: 'Heute' },
    { key: 'week',  label: 'Diese Woche' },
    { key: 'month', label: 'Diesen Monat' },
    { key: '',      label: 'Alle' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {quickButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyQuickFilter(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{
              backgroundColor: quickFilter === key ? '#2c5282' : '#ffffff',
              color: quickFilter === key ? '#ffffff' : '#475569',
              borderColor: quickFilter === key ? '#2c5282' : '#e2e8f0',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filter</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCompany}
            onChange={(e) => { setFilterCompany(e.target.value); setQuickFilter(''); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#2c5282' } as React.CSSProperties}
          >
            <option value="">Alle Firmen</option>
            {COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStaff}
            onChange={(e) => { setFilterStaff(e.target.value); setQuickFilter(''); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2"
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
              onChange={(e) => { setFilterFrom(e.target.value); setQuickFilter(''); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); setQuickFilter(''); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2"
            />
          </div>

          {(filterCompany || filterStaff || filterFrom || filterTo) && (
            <button
              onClick={() => {
                setFilterCompany('');
                setFilterStaff('');
                setFilterFrom('');
                setFilterTo('');
                setQuickFilter('');
              }}
              className="text-sm text-slate-400 hover:text-slate-600 underline"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Summary + Export */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          {entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}
        </p>
        <div className="flex items-center gap-4">
          <p className="text-sm font-semibold text-slate-700">
            Gesamt: {formatDuration(totalMinutes)}
          </p>
          <button
            onClick={handleExportExcel}
            disabled={exporting || entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#2c5282', color: '#ffffff' }}
          >
            <Download size={15} />
            {exporting ? 'Exportiere…' : 'Excel exportieren'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2c5282', borderTopColor: 'transparent' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Keine Einträge gefunden
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100" style={{ backgroundColor: '#f0f4f8' }}>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Datum</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Firma</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Tätigkeit</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Dauer</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Mitarbeiter</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 group">
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
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded"
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
