'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { COMPANIES, DURATION_OPTIONS } from '@/lib/config';
import { getClosestDuration } from '@/lib/utils';
import type { TimeEntry } from '@/types/database';
import { X, Loader2 } from 'lucide-react';

interface Props {
  entry: TimeEntry;
  onClose: () => void;
  onSaved: (updated: TimeEntry) => void;
}

export default function EditEntryModal({ entry, onClose, onSaved }: Props) {
  const [date, setDate]               = useState(entry.date);
  const [companyId, setCompanyId]     = useState(entry.company_id);
  const [description, setDescription] = useState(entry.description);
  const [minutes, setMinutes]         = useState(
    getClosestDuration(entry.duration_minutes).minutes
  );
  const [saving, setSaving] = useState(false);

  const inputClass =
    'w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white';

  async function handleSave() {
    setSaving(true);
    const { data, error } = await supabase
      .from('time_entries')
      .update({ date, company_id: companyId, description, duration_minutes: minutes })
      .eq('id', entry.id)
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      onSaved(data as TimeEntry);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100">
          <h2 className="text-base font-semibold text-slate-800">Eintrag bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-brand-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Datum */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Firma */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Firma</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputClass}
            >
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tätigkeit */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tätigkeit</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Dauer */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Dauer</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setMinutes(opt.minutes)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    minutes === opt.minutes
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !description.trim()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
