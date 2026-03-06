-- ============================================================
-- Marketing Zeiterfassung – Supabase Schema
-- Dieses SQL in Supabase → SQL Editor ausführen
-- ============================================================

-- UUID Extension aktivieren
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────
-- Verknüpft Supabase Auth User mit Mitarbeiter-Namen
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  staff_name text,
  staff_code text,
  created_at timestamptz default now()
);

-- ── Time Entries ───────────────────────────────────────────
create table if not exists public.time_entries (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  staff_name       text not null,
  staff_code       text not null,
  company_id       text not null,   -- 'SEI', 'ROB', 'HIF', etc.
  description      text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  date             date not null default current_date,
  created_at       timestamptz default now()
);

-- Index für schnelle Abfragen
create index if not exists time_entries_user_id_idx on public.time_entries(user_id);
create index if not exists time_entries_date_idx on public.time_entries(date);
create index if not exists time_entries_company_id_idx on public.time_entries(company_id);

-- ── Row Level Security ────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.time_entries enable row level security;

-- Profiles: jeder eingeloggte User sieht alle Profile (für Team-Übersicht)
create policy "Profiles lesbar für alle eingeloggten User"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "User kann eigenes Profil anlegen"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "User kann eigenes Profil bearbeiten"
  on public.profiles for update
  using (auth.uid() = id);

-- Time Entries: alle eingeloggten User sehen alle Einträge
create policy "Einträge lesbar für alle eingeloggten User"
  on public.time_entries for select
  using (auth.role() = 'authenticated');

create policy "User kann eigene Einträge anlegen"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

create policy "User kann eigene Einträge bearbeiten"
  on public.time_entries for update
  using (auth.uid() = user_id);

create policy "User kann eigene Einträge löschen"
  on public.time_entries for delete
  using (auth.uid() = user_id);

-- ── Auto-Profil bei Registrierung ────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
