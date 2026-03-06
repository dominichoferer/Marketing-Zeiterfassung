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
  const diff = (day === 0 ? -6 : 1) - day; // Montag als Wochenstart
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function startOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
