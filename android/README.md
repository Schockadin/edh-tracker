# 📱 EDH Tracker — Android App

Native Android-Companion zur [EDH-Tracker-WebApp](../README.md). Die App hält
eine **lokale Datenbank** (Room/SQLite) und **synchronisiert** sie bidirektional
mit der PostgreSQL-DB der WebApp – auch offline erfasste Spiele werden beim
nächsten Sync hochgeladen.

## Was die App kann

- **Offline-first**: Alle Daten liegen lokal in Room. Die UI liest immer aus der
  lokalen DB, funktioniert also ohne Netz.
- **Sync in beide Richtungen** mit dem Server über eine JSON-API
  (`/api/sync/*`). Lokale Änderungen werden hochgeladen, Server-Änderungen
  (auch von der WebApp) heruntergeladen. Löschungen werden über Tombstones
  propagiert.
- **Spiele erfassen**: Deck wählen, Gegner-Commander, Bracket, Turns, Sieg-Typ
  und siegreichen Gegner festhalten.
- **Decks ansehen & anlegen** (Deck-Link optional; vollständige Deck-Pflege mit
  Scryfall-Anbindung bleibt der WebApp vorbehalten).
- **Decklisten**: Deck antippen → Kartenliste ansehen und per Einfügen
  importieren (Auflösung über die `/api/cards/import`-Route des Servers).
- **Sammlung**: gesamte Sammlung per Einfügen erfassen; **verbaut** vs.
  **verfügbar** wird automatisch (mengenbewusst) aus den Decklisten abgeleitet.
  Deck-Karten ohne eigenen Sammlungseintrag erscheinen automatisch als Bestand.
- **Statistik**: Spiele, Siege, Winrate und Siege pro Deck.
- **Hintergrund-Sync** alle 6 Stunden via WorkManager, plus „Jetzt
  synchronisieren" in den Einstellungen.

## Tech-Stack

| Bereich       | Wahl                                             |
| ------------- | ------------------------------------------------ |
| Sprache       | Kotlin                                           |
| UI            | Jetpack Compose (Material 3) + Navigation Compose|
| Lokale DB     | Room (SQLite)                                     |
| Netzwerk      | Retrofit + Moshi + OkHttp                         |
| Hintergrund   | WorkManager                                       |
| Einstellungen | DataStore (Preferences)                          |
| Min SDK       | 26 (Android 8.0)                                  |

## Bauen

Voraussetzungen: **Android Studio** (Koala oder neuer) **oder** ein Android-SDK
mit `ANDROID_HOME` gesetzt und JDK 17+.

```bash
# In Android Studio:  "Open"  →  den Ordner  android/  öffnen  →  Run ▶

# Oder per Kommandozeile (SDK-Pfad in local.properties):
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleDebug          # APK unter app/build/outputs/apk/debug/
./gradlew installDebug           # auf verbundenes Gerät/Emulator installieren
```

> `local.properties` wird **nicht** eingecheckt – jede Umgebung setzt hier ihren
> eigenen SDK-Pfad.

## Einrichten

1. Die WebApp deployen (siehe [Haupt-README](../README.md)) und die neue
   Sync-Migration anwenden: `npm run db:migrate`.
2. App starten → auf dem Login-Screen die **Server-URL** (z. B.
   `https://dein-tracker.netlify.app`) und das **`APP_PASSWORD`** eingeben.
3. Die App holt sich per `POST /api/auth/login` ein JWT (gleiches Token wie die
   Web-Session), speichert es lokal und macht einen ersten vollständigen Sync.

## Wie der Sync funktioniert

Jeder Datensatz besitzt eine stabile `uuid` (geräteübergreifende Identität) und
ein `updatedAt`. Ein Sync-Durchlauf:

1. **Push** – alle lokal geänderten (`dirty`) Datensätze und ausstehenden
   Löschungen gehen an `POST /api/sync/push`. Der Server macht ein Upsert nach
   `uuid`.
2. **Pull** – `GET /api/sync/pull?since=<cursor>` liefert alle seit dem letzten
   Cursor geänderten Datensätze plus Tombstones. Die App spielt sie in Room ein
   und merkt sich `serverTime` als neuen Cursor.

Konflikte werden per *last-write-wins* aufgelöst – für eine Single-User-App die
pragmatische Wahl. Details zur API stehen im [Haupt-README](../README.md#sync-api).

## Projektstruktur

```
app/src/main/java/com/edhtracker/
├── EdhApp.kt              # Application + Service-Locator
├── MainActivity.kt
├── data/
│   ├── local/            # Room: Entities, DAOs, DB, TypeConverter
│   ├── remote/           # Retrofit-API + DTOs
│   ├── SettingsStore.kt  # DataStore (URL, Token, Sync-Cursor)
│   └── SyncRepository.kt  # Local-first Zugriff + Push/Pull-Sync
├── sync/                 # WorkManager-Worker + Scheduler
└── ui/                   # Compose-Screens, ViewModel, Theme
```
