import type { Metadata } from "next";
import Link from "next/link";

import { DecksBrowser, type DeckWithStats } from "@/components/decks-browser";
import { FormatFilter } from "@/components/format-filter";
import { SectionHeader } from "@/components/ui";
import { getDecks, getDefaultFormatId, getFormats, getGames } from "@/db/queries";
import { resolveFormatFilter } from "@/lib/format-filter";
import { computeStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Decks" };

export default async function DecksPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const [{ format: formatParam }, decks, games, formats, defaultFormatId] =
    await Promise.all([
      searchParams,
      getDecks(),
      getGames(),
      getFormats(),
      getDefaultFormatId(),
    ]);
  const { value: filterValue, formatId } = resolveFormatFilter(
    formatParam,
    defaultFormatId,
  );
  const { deckStats } = computeStats(games, decks);
  const statById = new Map(deckStats.map((s) => [s.deckId, s]));

  // Most recent play date per deck.
  const lastPlayedById = new Map<number, string>();
  for (const g of games) {
    const prev = lastPlayedById.get(g.deckId);
    if (!prev || g.playedAt > prev) lastPlayedById.set(g.deckId, g.playedAt);
  }

  const visibleDecks =
    formatId == null ? decks : decks.filter((d) => d.formatId === formatId);

  const enriched: DeckWithStats[] = visibleDecks.map((deck) => {
    const s = statById.get(deck.id);
    return {
      ...deck,
      games: s?.games ?? 0,
      wins: s?.wins ?? 0,
      winRate: s?.winRate ?? 0,
      lastPlayed: lastPlayedById.get(deck.id) ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Decks"
        action={
          <Link href="/decks/new" className="btn-primary">
            + Neues Deck
          </Link>
        }
      />

      {decks.length === 0 ? (
        <div className="card text-center text-muted">
          Noch keine Decks. Lege dein erstes Deck über einen Moxfield-, ManaBox-
          oder Archidekt-Link an.
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-end gap-4">
            <FormatFilter formats={formats} value={filterValue} />
          </div>
          {enriched.length === 0 ? (
            <div className="card text-center text-muted">
              Keine Decks für dieses Format.
            </div>
          ) : (
            <DecksBrowser decks={enriched} />
          )}
        </>
      )}
    </div>
  );
}
