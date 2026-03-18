'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import PeriodSelector from '@/components/PeriodSelector';
import CompanyBadge from '@/components/CompanyBadge';
import { supabase } from '@/lib/supabase';
import { COMPANIES, STAFF } from '@/lib/config';
import { getPeriodRange, formatDuration, formatDate, type PeriodState } from '@/lib/utils';
import type { TimeEntry } from '@/types/database';
import { Download, Filter, Loader2 } from 'lucide-react';

const selectClass =
  'border border-brand-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white';

export default function ExportPage() {
  const [period, setPeriod]           = useState<PeriodState>({ mode: 'month', offset: 0 });
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStaff, setFilterStaff]     = useState('');
  const [entries, setEntries]         = useState<TimeEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);

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

    if (range.from)     query = query.gte('date', range.from);
    if (range.to)       query = query.lte('date', range.to);
    if (filterCompany)  query = query.eq('company_id', filterCompany);
    if (filterStaff)    query = query.eq('staff_code', filterStaff);

    const { data } = await query.limit(2000);
    setEntries(data ?? []);
    setLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      // ExcelJS dynamisch laden (kein SSR-Problem)
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
      const workbook = new (ExcelJS as any).Workbook();
      workbook.creator = 'Heron Marketing Zeiterfassung';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Zeiterfassung', {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: 'Datum',       key: 'date',        width: 24 },
        { header: 'Firma',       key: 'company',     width: 18 },
        { header: 'Tätigkeit',   key: 'description', width: 52 },
        { header: 'Dauer',       key: 'duration',    width: 12 },
        { header: 'Minuten',     key: 'minutes',     width: 10 },
        { header: 'Mitarbeiter', key: 'staff',       width: 18 },
      ];

      // Header-Zeile stylen
      const headerRow = sheet.getRow(1);
      headerRow.height = 26;
      headerRow.eachCell((cell: any) => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005A9A' } };
        cell.font   = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF003B67' } } };
      });

      // Datenzeilen
      entries.forEach((entry, i) => {
        const company = COMPANIES.find((c) => c.id === entry.company_id);
        const row = sheet.addRow({
          date:        formatDate(entry.date),
          company:     company?.name ?? entry.company_id,
          description: entry.description,
          duration:    formatDuration(entry.duration_minutes),
          minutes:     entry.duration_minutes,
          staff:       entry.staff_name,
        });
        row.height = 20;

        const rowBg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF0F7FB';

        row.eachCell((cell: any, colIndex: number) => {
          cell.font      = { size: 10, name: 'Calibri' };
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

          if (colIndex === 2 && company) {
            // Firma-Spalte: Firmenfarbe als Hintergrund
            const bg   = company.color.replace('#', '').toUpperCase();
            const text = company.textColor.replace('#', '').toUpperCase();
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
            cell.font = { color: { argb: `FF${text}` }, bold: true, size: 10, name: 'Calibri' };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
          }
        });
      });

      // Leerzeile
      sheet.addRow({});

      // Summen-Zeile
      const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);
      const summaryRow = sheet.addRow({
        date:        '',
        company:     '',
        description: `Gesamt: ${entries.length} Einträge`,
        duration:    formatDuration(totalMinutes),
        minutes:     totalMinutes,
        staff:       '',
      });
      summaryRow.height = 22;
      summaryRow.eachCell((cell: any) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E8F7' } };
        cell.font      = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF003B67' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Zeiterfassung_${range.label.replace(/[\s·/]+/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);

  return (
    <AppLayout>
      {() => (
        <>
          {/* Page Header */}
          <div className="bg-white border-b border-brand-100">
            <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Export</h1>
                <p className="text-slate-400 text-sm mt-1 font-light">
                  Zeiteinträge als formatierte Excel-Datei exportieren
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting || loading || entries.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                {exporting ? (
                  <><Loader2 size={16} className="animate-spin" />Exportiere…</>
                ) : (
                  <><Download size={16} />{loading ? '…' : entries.length} Einträge exportieren</>
                )}
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">

            {/* Filter-Box */}
            <div className="bg-white rounded-xl border border-brand-100 p-4 space-y-3">
              <PeriodSelector value={period} onChange={setPeriod} label={range.label} />

              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-brand-50">
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
            {!loading && (
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-slate-500 font-light">
                  {entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Gesamt: {formatDuration(totalMinutes)}
                </p>
              </div>
            )}

            {/* Vorschau-Tabelle */}
            <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
              {loading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm font-light">
                  Keine Einträge für diesen Zeitraum
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {entries.slice(0, 50).map((entry) => (
                      <tr key={entry.id} className="hover:bg-brand-50 transition-colors">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {entries.length > 50 && (
                <div className="px-5 py-3 border-t border-brand-50 text-xs text-slate-400 text-center font-light">
                  Vorschau zeigt 50 von {entries.length} Einträgen · Export enthält alle
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
