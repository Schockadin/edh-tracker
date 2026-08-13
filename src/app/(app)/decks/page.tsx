import type { Metadata } from "next";
import Link from "next/link";

import { DecksBrowser, type DeckWithStats } from "@/components/decks-browser";
import { SectionHeader } from "@/components/ui";
import { getDecks, getGames } from "@/db/queries";
import { computeStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Decks" };

export default async function DecksPage() {
  const [decks, games] = await Promise.all([getDecks(), getGames()]);
  const { deckStats } = computeStats(games, decks);
  const statById = new Map(deckStats.map((s) => [s.deckId, s]));

  // Most recent play date per deck.
  const lastPlayedById = new Map<number, string>();
  for (const g of games) {
    const prev = lastPlayedById.get(g.deckId);
    if (!prev || g.playedAt > prev) lastPlayedById.set(g.deckId, g.playedAt);
  }

  const enriched: DeckWithStats[] = decks.map((deck) => {
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
        <DecksBrowser decks={enriched} />
      )}
    </div>
  );
}
