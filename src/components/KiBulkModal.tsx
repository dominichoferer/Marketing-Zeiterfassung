'use client';

import { useState, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  Trash2,
  AlertCircle,
  ChevronLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { COMPANIES, DURATION_OPTIONS } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface ParsedEntry {
  id: string;
  description: string;
  company_id: string | null;
  duration_minutes: number | null;
  date: string;
}

interface KiBulkModalProps {
  onClose: () => void;
  profile: Profile;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '–';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function KiBulkModal({ onClose, profile }: KiBulkModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<'input' | 'loading' | 'review' | 'saving' | 'done'>('input');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [rawText, setRawText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, []);

  const analyse = async () => {
    setError(null);
    setStep('loading');

    try {
      let body: Record<string, unknown>;

      if (activeTab === 'image' && imageFile) {
        const base64 = await fileToBase64(imageFile);
        body = { imageBase64: base64, mimeType: imageFile.type, today };
      } else {
        if (rawText.trim().length < 3) {
          setError('Bitte mindestens eine Zeile eingeben.');
          setStep('input');
          return;
        }
        body = { text: rawText, today };
      }

      const res = await fetch('/api/ki-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unbekannter Fehler');

      setEntries(
        (data.entries as Partial<ParsedEntry>[]).map((e, i) => ({
          id: `entry-${i}-${Date.now()}`,
          description: e.description || '',
          company_id: e.company_id || null,
          duration_minutes: e.duration_minutes || null,
          date: e.date || today,
        }))
      );
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('input');
    }
  };

  const updateEntry = (id: string, updates: Partial<ParsedEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const saveAll = async () => {
    setStep('saving');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Nicht eingeloggt');
      setStep('review');
      return;
    }

    const rows = entries
      .filter((e) => e.description.trim() && e.company_id && e.duration_minutes)
      .map((e) => ({
        user_id: session.user.id,
        staff_name: profile.staff_name || '',
        staff_code: profile.staff_code || '',
        company_id: e.company_id!,
        description: e.description.trim(),
        duration_minutes: e.duration_minutes!,
        date: e.date,
      }));

    if (rows.length === 0) {
      setError('Kein vollständiger Eintrag vorhanden. Bitte Firma und Dauer ergänzen.');
      setStep('review');
      return;
    }

    const { error: dbError } = await supabase.from('time_entries').insert(rows);
    if (dbError) {
      setError(dbError.message);
      setStep('review');
      return;
    }

    setStep('done');
    setTimeout(() => onClose(), 1800);
  };

  const incomplete = entries.filter((e) => !e.company_id || !e.duration_minutes);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-500" />
            <h2 className="font-semibold text-slate-800">KI-Bulk Einträge</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── INPUT ── */}
          {step === 'input' && (
            <div className="p-6 space-y-5">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText size={15} />
                  Text eingeben
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'image'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ImageIcon size={15} />
                  Screenshot hochladen
                </button>
              </div>

              {activeTab === 'text' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 font-light">
                    Schreibe jede Aufgabe in eine eigene Zeile. Die KI erkennt Firma, Dauer und
                    Beschreibung automatisch.
                  </p>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={
                      'Robotunits Homepage Text 2h\nHeron Social Media Posts 45min\nServus Newsletter Korrektur 1,5h\nCNC Technik Angebot überarbeitet 30min'
                    }
                    rows={8}
                    className="w-full border border-brand-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent font-mono leading-relaxed"
                  />
                </div>
              )}

              {activeTab === 'image' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 font-light">
                    Lade einen Screenshot deiner abgeschlossenen Tasks hoch. Die KI erkennt
                    Zeiten, Firmen und Beschreibungen.
                  </p>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-brand-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Screenshot Vorschau"
                        className="w-full max-h-64 object-contain bg-slate-50"
                      />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-600 rounded-lg p-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-brand-200 hover:border-brand-400 hover:bg-brand-50'
                      }`}
                    >
                      <Upload size={28} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Screenshot hierher ziehen</p>
                      <p className="text-xs text-slate-400 mt-1">oder klicken zum Auswählen</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Sparkles size={32} className="text-violet-400" />
                <Loader2 size={48} className="text-violet-300 animate-spin absolute -inset-2" />
              </div>
              <p className="text-slate-600 font-medium">KI analysiert deine Einträge…</p>
              <p className="text-slate-400 text-sm font-light">Einen Moment bitte</p>
            </div>
          )}

          {/* ── REVIEW ── */}
          {(step === 'review' || step === 'saving') && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{entries.length}</span> Einträge erkannt
                  {incomplete.length > 0 && (
                    <span className="ml-2 text-amber-500">· {incomplete.length} unvollständig</span>
                  )}
                </p>
                <button
                  onClick={() => { setStep('input'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Zurück
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onChange={(updates) => updateEntry(entry.id, updates)}
                    onRemove={() => removeEntry(entry.id)}
                    today={today}
                  />
                ))}
              </div>

              {entries.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-light">
                  Keine Einträge mehr vorhanden.
                </div>
              )}
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CheckCircle size={48} className="text-emerald-500" />
              <p className="text-slate-700 font-semibold text-lg">Einträge gespeichert!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'input' || step === 'review' || step === 'saving') && (
          <div className="px-6 py-4 border-t border-brand-100 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>

            {step === 'input' && (
              <button
                onClick={analyse}
                disabled={
                  (activeTab === 'text' && rawText.trim().length < 3) ||
                  (activeTab === 'image' && !imageFile)
                }
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                <Sparkles size={15} />
                Analysieren
              </button>
            )}

            {(step === 'review' || step === 'saving') && entries.length > 0 && (
              <button
                onClick={saveAll}
                disabled={step === 'saving'}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                {step === 'saving' ? (
                  <><Loader2 size={15} className="animate-spin" />Wird gespeichert…</>
                ) : (
                  <><CheckCircle size={15} />{entries.filter((e) => e.company_id && e.duration_minutes).length} Einträge speichern</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryCard({
  entry, onChange, onRemove, today,
}: {
  entry: ParsedEntry;
  onChange: (updates: Partial<ParsedEntry>) => void;
  onRemove: () => void;
  today: string;
}) {
  const isIncomplete = !entry.company_id || !entry.duration_minutes;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      isIncomplete ? 'border-amber-200 bg-amber-50/50' : 'border-brand-100 bg-white'
    }`}>
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={entry.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="flex-1 border border-brand-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          placeholder="Beschreibung…"
        />
        <button
          onClick={onRemove}
          className="text-slate-300 hover:text-red-400 transition-colors p-1.5 mt-0.5 cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {COMPANIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ company_id: entry.company_id === c.id ? null : c.id })}
              style={entry.company_id === c.id ? { backgroundColor: c.color, color: c.textColor } : undefined}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${
                entry.company_id === c.id
                  ? 'border-transparent shadow-sm scale-105'
                  : 'border-brand-200 text-slate-500 hover:border-brand-400'
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={entry.date || today}
          onChange={(e) => onChange({ date: e.target.value })}
          className="ml-auto border border-brand-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      <div className="flex gap-1 flex-wrap">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.minutes}
            onClick={() => onChange({ duration_minutes: entry.duration_minutes === opt.minutes ? null : opt.minutes })}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${
              entry.duration_minutes === opt.minutes
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-brand-200 text-slate-500 hover:border-brand-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {entry.duration_minutes && !DURATION_OPTIONS.find((o) => o.minutes === entry.duration_minutes) && (
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-brand-600 text-white border border-brand-600">
            {formatDuration(entry.duration_minutes)}
          </span>
        )}
      </div>
    </div>
  );
}
