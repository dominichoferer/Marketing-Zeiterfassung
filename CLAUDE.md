# Heron Marketing Zeiterfassung – Projektkontext für Claude

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
- **Claude API** (`claude-haiku-4-5`) für KI-Schnelleingabe
- **Vercel** (Hosting)

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx              # Root: leitet zu /dashboard oder /login weiter
│   ├── layout.tsx            # Root-Layout (HTML-Shell, kein Auth)
│   ├── globals.css
│   ├── login/page.tsx        # Login-Seite (öffentlich)
│   ├── dashboard/page.tsx    # Stundenübersicht (geschützt)
│   ├── neu/page.tsx          # Neuer Zeiteintrag (geschützt)
│   ├── eintraege/page.tsx    # Alle Einträge mit Filter (geschützt)
│   └── api/
│       └── ki-eingabe/route.ts  # API-Route: Claude KI-Schnelleingabe
│
├── components/
│   ├── AppLayout.tsx         # *** GEMEINSAMES LAYOUT für geschützte Seiten ***
│   │                         #     Wraps: AuthGuard + Navbar + <main>
│   │                         #     Neue Seiten immer damit wrappen!
│   ├── AuthGuard.tsx         # Auth-Check + Profil-Setup (erster Login)
│   ├── Navbar.tsx            # Seitenleiste (240px, links)
│   ├── DashboardStats.tsx    # Statistiken + Firmen-Balken
│   ├── EntryList.tsx         # Tabelle mit Filterleiste
│   ├── TimeEntryForm.tsx     # KI- + manuelle Eingabe
│   └── CompanyBadge.tsx      # Firma als farbiger Badge
│
├── lib/
│   ├── config.ts             # STAFF, COMPANIES, DURATION_OPTIONS (zentrale Datenkonfiguration)
│   ├── supabase.ts           # Supabase-Client (singleton)
│   └── utils.ts              # formatDuration, formatDate, todayISO, getCompany, …
│
└── types/
    └── database.ts           # TypeScript-Typen: Database, Profile, TimeEntry, TimeEntryInsert
```

## Wichtige Konventionen

### Neue geschützte Seite hinzufügen
```tsx
'use client';
import AppLayout from '@/components/AppLayout';

export default function MeineSeite() {
  return (
    <AppLayout>
      {(profile) => (
        <div className="max-w-3xl mx-auto">
          {/* profile.id, profile.staff_name, profile.staff_code verfügbar */}
        </div>
      )}
    </AppLayout>
  );
}
```

### Firma oder Mitarbeiter hinzufügen/ändern
→ Nur in `src/lib/config.ts` anpassen:
- `COMPANIES` – Firmen mit ID, Name, Farbe
- `STAFF` – Mitarbeiter mit Name und Kürzel

### Datenbankschema
→ `supabase/schema.sql` + TypeScript-Typen in `src/types/database.ts` synchron halten

### Auth-Logik
- `AuthGuard` prüft Session und lädt das Profil aus `profiles`-Tabelle
- `profile.id === session.user.id` (Supabase Auth UID)
- Beim ersten Login: Setup-Dialog wählt Mitarbeiter aus `STAFF`-Liste

## Firmen (Stand März 2025)
| ID  | Name          | Farbe     |
|-----|---------------|-----------|
| SEI | Servus        | #4da3db   |
| ROB | Robotunits    | #607d8b   |
| HIF | Heron         | #2c5282   |
| CNC | CNC Technik   | #e53e3e   |
| VEG | Vertic Greens | #38a169   |
| EIH | Einheit       | #a3cf58   |
| SCH | Schnecko      | #fdf2e9   |

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=          # Optional: für KI-Schnelleingabe
```
