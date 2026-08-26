import Link from "next/link";

import {
  BracketChart,
  DeckWinRateChart,
  TimeChart,
  TurnChart,
  WinRateDonut,
  WinTypeChart,
} from "@/components/charts";
import { FormatFilter } from "@/components/format-filter";
import { getDecks, getDefaultFormatId, getFormats, getGames } from "@/db/queries";
import { resolveFormatFilter } from "@/lib/format-filter";
import { computeStats } from "@/lib/stats";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-value mt-1">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-3">
        <h2 className="font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const [{ format: formatParam }, allGames, allDecks, formats, defaultFormatId] =
    await Promise.all([
      searchParams,
      getGames(),
      getDecks(),
      getFormats(),
      getDefaultFormatId(),
    ]);

  const { value: filterValue, formatId } = resolveFormatFilter(
    formatParam,
    defaultFormatId,
  );

  const games =
    formatId == null
      ? allGames
      : allGames.filter((g) => g.formatId === formatId);
  const decks =
    formatId == null
      ? allDecks
      : allDecks.filter((d) => d.formatId === formatId);

  const stats = computeStats(games, decks);
  const { overview } = stats;

  if (allDecks.length === 0) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <div className="mb-2 text-4xl">🃏</div>
        <h1 className="text-xl font-bold">Willkommen beim EDH Tracker</h1>
        <p className="mt-2 text-sm text-muted">
          Lege zuerst ein Deck an, indem du einen Moxfield-, ManaBox- oder
          Archidekt-Link speicherst. Danach kannst du Spielrunden erfassen und
          deine Statistiken auswerten.
        </p>
        <Link href="/decks/new" className="btn-primary mt-4">
          Erstes Deck anlegen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/games/new" className="btn-primary">
          + Spiel erfassen
        </Link>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <FormatFilter formats={formats} value={filterValue} />
        <p className="text-xs text-muted">
          {games.length} Spiele · {decks.length} Decks in dieser Auswahl
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Spiele" value={String(overview.total)} />
        <StatTile
          label="Winrate"
          value={`${Math.round(overview.winRate * 100)}%`}
          hint={`${overview.wins} S · ${overview.losses} N · ${overview.draws} U`}
        />
        <StatTile label="Decks" value={String(decks.length)} />
        <StatTile
          label="Ø Sieg-Turn"
          value={overview.avgWinTurn != null ? String(overview.avgWinTurn) : "–"}
          hint="über alle Spiele"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Ergebnisse"
          subtitle="Siege, Niederlagen und Unentschieden"
        >
          <WinRateDonut overview={overview} />
        </ChartCard>

        <ChartCard
          title="Siege pro Deck"
          subtitle="Winrate je gespieltem Deck"
        >
          <DeckWinRateChart data={stats.deckStats} />
        </ChartCard>

        <ChartCard
          title="Art des Siegs"
          subtitle="Wie Spiele entschieden wurden"
        >
          <WinTypeChart data={stats.winTypeStats} />
        </ChartCard>

        <ChartCard
          title="Siege nach Turn"
          subtitle="In welchem Turn Spiele entschieden werden"
        >
          <TurnChart data={stats.turnStats} />
        </ChartCard>

        <ChartCard title="Brackets" subtitle="Spiele und Siege pro Bracket">
          <BracketChart data={stats.bracketStats} />
        </ChartCard>

        <ChartCard title="Verlauf" subtitle="Spiele und Siege pro Monat">
          <TimeChart data={stats.timeStats} />
        </ChartCard>
      </div>
    </div>
  );
}
