import { COMPANIES, DURATION_OPTIONS } from './config';

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} Std`;
  return `${h}h ${m}min`;
}

export function getCompany(id: string) {
  return COMPANIES.find((c) => c.id === id) ?? null;
}

export function getClosestDuration(minutes: number) {
  return DURATION_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr.minutes - minutes) < Math.abs(prev.minutes - minutes) ? curr : prev
  );
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function startOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ── Zeitraum-Logik ──────────────────────────────────────────────

export type PeriodMode = 'today' | 'week' | 'month' | 'all';

export interface PeriodState {
  mode: PeriodMode;
  offset: number; // 0 = aktuell, -1 = vorherige Periode, usw.
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getPeriodRange(state: PeriodState): {
  from: string | null;
  to: string | null;
  label: string;
} {
  const { mode, offset } = state;

  if (mode === 'all') {
    return { from: null, to: null, label: 'Alle Einträge' };
  }

  if (mode === 'today') {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const iso = toISO(d);
    const label =
      offset === 0
        ? 'Heute · ' + d.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
        : d.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return { from: iso, to: iso, label };
  }

  if (mode === 'week') {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const kw = getISOWeek(monday);
    const label = `KW ${kw} · ${monday.toLocaleDateString('de-AT', { day: '2-digit', month: 'short' })} – ${sunday.toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    return { from: toISO(monday), to: toISO(sunday), label };
  }

  // mode === 'month'
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const label = first.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
  return { from: toISO(first), to: toISO(last), label };
}
