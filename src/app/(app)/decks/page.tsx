import type { Metadata } from "next";
import Link from "next/link";

import { DeckActions } from "@/components/deck-actions";
import { ColorPips, PlatformBadge, SectionHeader } from "@/components/ui";
import { getDecks, getGames } from "@/db/queries";
import { computeStats } from "@/lib/stats";
import type { DeckView } from "@/lib/types";

export const metadata: Metadata = { title: "Decks" };

function DeckCard({
  deck,
  games,
  wins,
}: {
  deck: DeckView;
  games: number;
  wins: number;
}) {
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{deck.name}</h3>
          <p className="text-sm text-slate-400">
            {deck.commander}
            {deck.partnerCommander ? ` + ${deck.partnerCommander}` : ""}
          </p>
        </div>
        <ColorPips colors={deck.colorIdentity} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <PlatformBadge platform={deck.platform} />
        {deck.bracket ? (
          <span className="badge">Bracket {deck.bracket}</span>
        ) : null}
        <span className="badge">
          {games} Spiele · {winRate}% WR
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex gap-3 text-xs">
          <a
            href={deck.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-arcane-300 hover:text-arcane-200"
          >
            Deckliste ↗
          </a>
          <Link
            href={`/decks/${deck.id}/edit`}
            className="text-slate-300 hover:text-white"
          >
            Bearbeiten
          </Link>
        </div>
        <DeckActions id={deck.id} archived={deck.archived} />
      </div>
    </div>
  );
}

export default async function DecksPage() {
  const [decks, games] = await Promise.all([getDecks(), getGames()]);
  const { deckStats } = computeStats(games, decks);
  const statById = new Map(deckStats.map((s) => [s.deckId, s]));

  const active = decks.filter((d) => !d.archived);
  const archived = decks.filter((d) => d.archived);

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
        <div className="card text-center text-slate-400">
          Noch keine Decks. Lege dein erstes Deck über einen Moxfield-,
          ManaBox- oder Archidekt-Link an.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((deck) => {
            const s = statById.get(deck.id);
            return (
              <DeckCard
                key={deck.id}
                deck={deck}
                games={s?.games ?? 0}
                wins={s?.wins ?? 0}
              />
            );
          })}
        </div>
      )}

      {archived.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Archiviert
          </h2>
          <div className="grid gap-4 opacity-70 sm:grid-cols-2">
            {archived.map((deck) => {
              const s = statById.get(deck.id);
              return (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  games={s?.games ?? 0}
                  wins={s?.wins ?? 0}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
