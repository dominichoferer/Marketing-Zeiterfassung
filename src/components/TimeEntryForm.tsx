'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { COMPANIES, DURATION_OPTIONS } from '@/lib/config';
import { todayISO, getClosestDuration } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { Sparkles, Pencil, Loader2, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface TimeEntryFormProps {
  profile: Profile;
}

type Mode = 'ki' | 'manual';

interface KIResult {
  description: string;
  company_id: string | null;
  duration_minutes: number | null;
  confidence: number;
}

export default function TimeEntryForm({ profile }: TimeEntryFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('ki');

  // KI Felder
  const [kiInput, setKiInput] = useState('');
  const [kiLoading, setKiLoading] = useState(false);
  const [kiResult, setKiResult] = useState<KIResult | null>(null);
  const [kiError, setKiError] = useState('');

  // Formular Felder
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [date, setDate] = useState(todayISO());

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleKISubmit() {
    if (!kiInput.trim()) return;
    setKiLoading(true);
    setKiError('');
    setKiResult(null);

    try {
      const res = await fetch('/api/ki-eingabe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: kiInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setKiError(data.error ?? 'Fehler bei der KI-Verarbeitung.');
        return;
      }

      setKiResult(data);
      // Felder mit KI-Ergebnis befüllen
      setDescription(data.description ?? '');
      if (data.company_id) setCompanyId(data.company_id);
      if (data.duration_minutes) {
        const closest = getClosestDuration(data.duration_minutes);
        setDurationMinutes(closest.minutes);
      }
    } catch {
      setKiError('Netzwerkfehler. Bitte nochmal versuchen.');
    } finally {
      setKiLoading(false);
    }
  }

  async function handleSave() {
    if (!description.trim() || !companyId || !durationMinutes) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('time_entries').insert({
      user_id: session.user.id,
      staff_name: profile.staff_name!,
      staff_code: profile.staff_code!,
      company_id: companyId,
      description: description.trim(),
      duration_minutes: durationMinutes,
      date,
    });

    if (!error) {
      setSaved(true);
      setTimeout(() => {
        router.push('/eintraege');
      }, 1200);
    }
    setSaving(false);
  }

  const isFormValid = description.trim() && companyId && durationMinutes;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setMode('ki')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
            mode === 'ki'
              ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
              : 'text-slate-500 hover:bg-slate-50'
          )}
        >
          <Sparkles size={16} />
          KI-Schnelleingabe
        </button>
        <button
          onClick={() => setMode('manual')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
            mode === 'manual'
              ? 'bg-slate-50 text-slate-800 border-b-2 border-slate-800'
              : 'text-slate-500 hover:bg-slate-50'
          )}
        >
          <Pencil size={16} />
          Manuell
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* KI Eingabe */}
        {mode === 'ki' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Stichworte eingeben
            </label>
            <p className="text-xs text-slate-400 mb-2">
              z.B. „Robotunits Homepage Text 2h" oder „Servus Newsletter 30min"
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={kiInput}
                onChange={(e) => setKiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKISubmit()}
                placeholder="Tätigkeit, Firma, Dauer…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                onClick={handleKISubmit}
                disabled={kiLoading || !kiInput.trim()}
                className="bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {kiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {kiLoading ? 'Analysiere…' : 'Analysieren'}
              </button>
            </div>

            {kiError && (
              <p className="mt-2 text-sm text-red-500">{kiError}</p>
            )}

            {kiResult && (
              <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-violet-500" />
                  <span className="text-xs font-medium text-violet-700">
                    KI-Ergebnis {kiResult.confidence >= 0.7 ? '(sicher)' : '(bitte prüfen)'}
                  </span>
                </div>
                <p className="text-xs text-violet-600">
                  Felder wurden unten vorausgefüllt. Du kannst sie noch bearbeiten.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tätigkeit / Beschreibung <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. Texte für Homepage überarbeitet"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Firma */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Firma <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCompanyId(c.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                  companyId === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : 'opacity-80 hover:opacity-100'
                )}
                style={{
                  backgroundColor: c.color,
                  color: c.textColor,
                  borderColor: companyId === c.id ? c.color : 'transparent',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dauer */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dauer <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => setDurationMinutes(opt.minutes)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  durationMinutes === opt.minutes
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datum */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Speichern */}
        <button
          onClick={handleSave}
          disabled={!isFormValid || saving || saved}
          className={clsx(
            'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
            saved
              ? 'bg-emerald-500 text-white'
              : isFormValid
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          {saved ? (
            <><CheckCircle size={16} /> Gespeichert!</>
          ) : saving ? (
            <><Loader2 size={16} className="animate-spin" /> Speichern…</>
          ) : (
            'Eintrag speichern'
          )}
        </button>
      </div>
    </div>
  );
}
