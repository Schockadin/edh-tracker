# 🃏 EDH Tracker

Ein persönlicher, installierbarer **PWA**-Tracker für EDH / Commander: Decks per
Link speichern, Spielrunden erfassen und Statistiken grafisch auswerten.
Gebaut mit **Next.js 16**, **TypeScript**, **PostgreSQL** (Drizzle ORM) und einem
handgeschriebenen Service Worker für Offline-Betrieb.

Die App ist als **Single-User-App** ausgelegt (nur du) — geschützt durch ein
Passwort und ein signiertes Session-Cookie.

## Features

- **Decks per Link** von Moxfield, ManaBox oder Archidekt speichern.
  Der Deck-Name wird — wo möglich — per „Details laden" von der Plattform geholt
  (best-effort; Moxfield blockt serverseitige Zugriffe teils per Cloudflare).
- **Scryfall-Anbindung** für alle Kartenfelder (Commander, Partner, Gegner):
  Autocomplete beim Tippen und Validierung, sodass nur echte Karten gespeichert
  werden. Farbidentität und Commander-Bild werden automatisch von Scryfall
  bezogen (Aufruf direkt aus dem Browser, daher unabhängig von Plattform-Blocks).
- **Commander-Bilder**: eigene Decks zeigen das Commander-(und Partner-)Artwork.
- **Theme**: Hell / Dunkel / System (Standard: System), umschaltbar auf allen
  Seiten; die Präferenz wird lokal gespeichert.
- **Spielrunden erfassen**: eigenes Deck wählen, gegnerische Commander, Bracket
  (1–5), Anzahl Turns.
- **Sieg-Tracking**: Wer hat gewonnen, in **welchem Turn** und **wie**
  (Combat Damage, Commander Damage, Burn, Infect, Combo, Mill, Poison,
  Alternativer Sieg, Decking, …).
- **Grafische Statistiken**: Winrate, Siege pro Deck, Art des Siegs, Siege nach
  Turn, Bracket-Verteilung und Verlauf über die Zeit (Recharts).
- **PWA**: installierbar, offline-fähig (App-Shell + Caching), eigenes App-Icon.
- **Cached Components**: Read-Queries laufen über den Next.js Data Cache mit Tags
  und werden bei Mutationen gezielt invalidiert (`updateTag`).

## Tech-Stack

| Bereich    | Wahl                                            |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Actions)         |
| Sprache    | TypeScript (strict)                             |
| DB / ORM   | PostgreSQL + Drizzle ORM (`postgres.js` Treiber)|
| Charts     | Recharts                                        |
| Styling    | Tailwind CSS                                     |
| Auth       | Passwort + signiertes JWT-Cookie (`jose`)       |
| PWA        | Handgeschriebener Service Worker + Web Manifest |
| Hosting    | Netlify (App) + Railway (PostgreSQL)            |

## Lokale Entwicklung

Voraussetzungen: **Node 22+** und eine PostgreSQL-Datenbank.

```bash
# 1. Abhängigkeiten
npm install

# 2. Environment einrichten
cp .env.example .env          # `.env.local` funktioniert ebenfalls
#   DATABASE_URL, APP_PASSWORD und AUTH_SECRET setzen.
#   AUTH_SECRET erzeugen:  openssl rand -base64 48
#   Hinweis: Sowohl die App als auch `db:migrate`/`drizzle-kit` laden `.env`
#   und `.env.local` automatisch (echte Env-Variablen haben Vorrang).

# 3. Datenbank-Schema anlegen
npm run db:migrate      # wendet die Migrationen in ./drizzle an
#   Alternativ ohne Migrationsdateien direkt pushen:  npm run db:push

# 4. Dev-Server
npm run dev             # http://localhost:3000
```

Weitere Skripte:

| Skript                | Zweck                                             |
| --------------------- | ------------------------------------------------- |
| `npm run build`       | Produktions-Build                                 |
| `npm run start`       | Produktions-Server                                |
| `npm run typecheck`   | TypeScript prüfen                                 |
| `npm run lint`        | ESLint                                            |
| `npm run db:generate` | Neue Migration aus dem Schema erzeugen            |
| `npm run db:migrate`  | Migrationen anwenden                              |
| `npm run db:push`     | Schema direkt in die DB pushen (ohne Migration)   |
| `npm run db:studio`   | Drizzle Studio (DB-Browser)                       |
| `npm run icons`       | PWA-Icons neu generieren                          |

## Deployment

### 1. PostgreSQL auf Railway

1. Auf [Railway](https://railway.app) ein Projekt anlegen → **New → Database → PostgreSQL**.
2. Unter **Variables** die `DATABASE_URL` kopieren (öffentliche URL nutzen, damit
   Netlify-Functions sie erreichen).
3. Schema anlegen — lokal mit gesetzter Railway-`DATABASE_URL`:
   ```bash
   DATABASE_URL="postgresql://…railway…" npm run db:migrate
   ```

### 2. App auf Netlify

1. Repository in Netlify importieren. Das offizielle Next.js-Runtime-Plugin
   (`@netlify/plugin-nextjs`) wird automatisch erkannt (siehe `netlify.toml`).
2. **Site settings → Environment variables** setzen:
   | Variable        | Wert                                             |
   | --------------- | ------------------------------------------------ |
   | `DATABASE_URL`  | die Railway-Postgres-URL                          |
   | `APP_PASSWORD`  | dein Login-Passwort                               |
   | `AUTH_SECRET`   | langes Zufalls-Secret (`openssl rand -base64 48`) |
   | `SESSION_DAYS`  | optional, Standard `30`                           |
3. **Deploy** auslösen. Build-Command `npm run build`, Node 22 (in `netlify.toml`).

Nach dem Deploy: Seite im Browser öffnen → mit `APP_PASSWORD` anmelden → über
„Zum Startbildschirm hinzufügen" als PWA installieren.

## Zugriffsschutz

Die gesamte App liegt hinter einer Passwort-Hürde (`src/proxy.ts` prüft bei jedem
Request das Session-Cookie). Es gibt bewusst **keine Registrierung** — nur das eine
`APP_PASSWORD`. Halte `AUTH_SECRET` geheim; ein Wechsel invalidiert alle Sessions.

## Projektstruktur

```
src/
├── app/
│   ├── (app)/            # geschützter Bereich (Dashboard, Decks, Spiele)
│   │   ├── decks/        # Deck-Verwaltung + Server Actions
│   │   └── games/        # Spielerfassung + Server Actions
│   ├── login/            # Login-Seite + Auth-Actions
│   ├── offline/          # Offline-Fallback der PWA
│   ├── manifest.ts       # Web App Manifest
│   └── layout.tsx        # Root-Layout, SW-Registrierung
├── components/           # UI + Charts (Client Components)
├── db/                   # Drizzle Schema, Client, Queries (cached)
├── lib/                  # Auth, Validierung (zod), Deck-Import, Stats
└── proxy.ts              # Auth-Gate (Next.js 16 „proxy", früher middleware)
public/
├── sw.js                 # Service Worker (Caching-Strategien)
└── icons/                # generierte PWA-Icons
drizzle/                  # SQL-Migrationen
```
