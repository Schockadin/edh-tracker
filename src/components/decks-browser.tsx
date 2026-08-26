"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { DeckActions } from "@/components/deck-actions";
import { ColorPips } from "@/components/ui";
import type { DeckView } from "@/lib/types";

export interface DeckWithStats extends DeckView {
  games: number;
  wins: number;
  winRate: number; // 0..1
  lastPlayed: string | null; // ISO string
}

type SortKey = "name" | "lastPlayed" | "winRate";
type BracketFilter = "all" | "1" | "2" | "3" | "4" | "5" | "none";

function DeckCard({
  deck,
  showImages,
}: {
  deck: DeckWithStats;
  showImages: boolean;
}) {
  const winRate = Math.round(deck.winRate * 100);
  // Only Commander decks have artwork.
  const images = deck.formatHasCommander
    ? [deck.commanderImage, deck.partnerImage].filter(
        (u): u is string => Boolean(u),
      )
    : [];
  const subtitle = deck.commander
    ? `${deck.commander}${deck.partnerCommander ? ` + ${deck.partnerCommander}` : ""}`
    : deck.theme;
  return (
    <div className="card flex flex-col gap-3">
      {showImages && images.length > 0 ? (
        <div className="-mx-5 -mt-5 mb-1 flex gap-px overflow-hidden rounded-t-xl">
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={deck.commander ?? deck.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{deck.name}</h3>
          {subtitle ? (
            <p className="text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
        <ColorPips colors={deck.colorIdentity} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* <PlatformBadge platform={deck.platform} /> */}
        <span className="badge">{deck.formatName}</span>
        {deck.commander && deck.theme ? (
          <span className="badge">{deck.theme}</span>
        ) : null}
        {deck.bracket ? (
          <span className="badge">Bracket {deck.bracket}</span>
        ) : null}
        <span className="badge">
          {deck.games} Spiele · {winRate}% WR
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t divider-soft pt-3">
        <div className="flex gap-3 text-xs">
          <a
            href={deck.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Deckliste ↗
          </a>
          <Link
            href={`/decks/${deck.id}/edit`}
            className="text-soft hover:text-strong"
          >
            Bearbeiten
          </Link>
        </div>
        <DeckActions id={deck.id} archived={deck.archived} />
      </div>
    </div>
  );
}

function applyControls(
  decks: DeckWithStats[],
  sort: SortKey,
  bracket: BracketFilter,
): DeckWithStats[] {
  const filtered = decks.filter((d) => {
    if (bracket === "all") return true;
    if (bracket === "none") return d.bracket == null;
    return String(d.bracket) === bracket;
  });

  const sorted = [...filtered];
  switch (sort) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "lastPlayed":
      // Most recently played first; decks never played go last.
      sorted.sort((a, b) => {
        if (a.lastPlayed && b.lastPlayed)
          return b.lastPlayed.localeCompare(a.lastPlayed);
        if (a.lastPlayed) return -1;
        if (b.lastPlayed) return 1;
        return a.name.localeCompare(b.name);
      });
      break;
    case "winRate":
      sorted.sort(
        (a, b) =>
          b.winRate - a.winRate ||
          b.games - a.games ||
          a.name.localeCompare(b.name),
      );
      break;
  }
  return sorted;
}

export function DecksBrowser({ decks }: { decks: DeckWithStats[] }) {
  const [sort, setSort] = useState<SortKey>("name");
  const [bracket, setBracket] = useState<BracketFilter>("all");
  const [showImages, setShowImages] = useState(false);

  const active = useMemo(
    () =>
      applyControls(
        decks.filter((d) => !d.archived),
        sort,
        bracket,
      ),
    [decks, sort, bracket],
  );
  const archived = useMemo(
    () =>
      applyControls(
        decks.filter((d) => d.archived),
        sort,
        bracket,
      ),
    [decks, sort, bracket],
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="deck-sort" className="label">
            Sortierung
          </label>
          <select
            id="deck-sort"
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="name">Name</option>
            <option value="lastPlayed">Zuletzt gespielt</option>
            <option value="winRate">Win-Rate</option>
          </select>
        </div>
        <div>
          <label htmlFor="deck-bracket" className="label">
            Bracket
          </label>
          <select
            id="deck-bracket"
            className="select"
            value={bracket}
            onChange={(e) => setBracket(e.target.value as BracketFilter)}
          >
            <option value="all">Alle</option>
            {["1", "2", "3", "4", "5"].map((b) => (
              <option key={b} value={b}>
                Bracket {b}
              </option>
            ))}
            <option value="none">Ohne Bracket</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 font-bold h-12">
          <input
            type="checkbox"
            checked={showImages}
            onChange={(e) => setShowImages(e.target.checked)}
          />
          Bilder anzeigen
        </label>
      </div>

      {active.length === 0 ? (
        <div className="card text-center text-muted">
          Keine Decks für diese Filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((deck) => (
            <DeckCard key={deck.id} deck={deck} showImages={showImages} />
          ))}
        </div>
      )}

      {archived.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
            Archiviert
          </h2>
          <div className="grid gap-4 opacity-70 sm:grid-cols-2">
            {archived.map((deck) => (
              <DeckCard key={deck.id} deck={deck} showImages={showImages} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
