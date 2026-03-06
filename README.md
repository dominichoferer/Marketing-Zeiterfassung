# Marketing Zeiterfassung

Zeiterfassungstool für das Marketing Team von hern – dokumentiert Tätigkeiten pro Tochterfirma mit KI-Schnelleingabe.

## Features

- **Dashboard** – Wöchentliche/monatliche Stundenübersicht pro Firma (farbige Balken)
- **KI-Schnelleingabe** – Stichworte eingeben, Claude erkennt Firma & Dauer automatisch
- **Manuelle Eingabe** – Firma, Dauer, Beschreibung, Datum
- **Einträge-Übersicht** – Alle Einträge filterbar nach Firma, Mitarbeiter, Datum
- **Team-Login** – Supabase Auth, jeder Mitarbeiter hat seinen Account

## Firmen

| ID | Name | Farbe |
|----|------|-------|
| SEI | Servus | #4da3db |
| ROB | Robotunits | #607d8b |
| HIF | Heron | #2c5282 |
| CNC | CNC Technik | #e53e3e |
| VEG | Vertic Greens | #38a169 |
| EIH | Einheit | #a3cf58 |
| SCH | Schnecko | #fdf2e9 |

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
- **Claude API** (KI-Schnelleingabe via `claude-haiku-4-5`)
- **Vercel** (Hosting)

## Setup

### 1. Supabase Projekt erstellen

1. [supabase.com](https://supabase.com) → Neues Projekt erstellen
2. SQL Editor → Inhalt von `supabase/schema.sql` ausführen
3. Project URL und Anon Key notieren (Settings → API)

### 2. Lokale Entwicklung

```bash
cp .env.local.example .env.local
# .env.local ausfüllen (Supabase URL + Key + optional Anthropic API Key)

npm install
npm run dev
```

### 3. Vercel Deployment

1. [vercel.com](https://vercel.com) → Neues Projekt → GitHub Repo verbinden
2. Environment Variables eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (für KI-Schnelleingabe)
3. Deploy

### 4. Team-Accounts erstellen

Im Supabase Dashboard → Authentication → Users → „Invite user" für jeden Mitarbeiter.

### 5. Claude API Key (für KI-Schnelleingabe)

1. [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Key in Vercel als `ANTHROPIC_API_KEY` eintragen

## KI-Schnelleingabe Beispiele

- `"Robotunits Homepage Text 2h"` → Robotunits, Texterstellung Homepage, 120 min
- `"Servus Newsletter 30min"` → Servus, Newsletter bearbeitet, 30 min
- `"CNC Social Media Posts 1,5 Stunden"` → CNC Technik, Social Media, 90 min
