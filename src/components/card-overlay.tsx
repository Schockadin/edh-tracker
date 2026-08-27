"use client";

import { useState } from "react";

import type { CardView } from "@/lib/types";
import { ColorPips } from "./ui";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function scryfallUrl(card: CardView): string {
  if (card.setCode && card.collectorNumber) {
    return `https://scryfall.com/card/${card.setCode.toLowerCase()}/${card.collectorNumber}`;
  }
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${card.name}"`)}`;
}

/** Full-screen overlay with the card's Scryfall image and metadata. */
export function CardOverlay({
  card,
  onClose,
}: {
  card: CardView;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card w-full max-w-sm space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full rounded-lg"
            loading="lazy"
          />
        ) : null}
        <div className="space-y-1">
          <h3 className="font-semibold text-strong">{card.name}</h3>
          {card.typeLine ? (
            <p className="text-sm text-muted">{card.typeLine}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {card.manaValue != null ? (
              <span className="badge">MV {card.manaValue}</span>
            ) : null}
            {card.colorIdentity.length > 0 ? (
              <ColorPips colors={card.colorIdentity} />
            ) : null}
            {card.rarity ? <span className="badge">{cap(card.rarity)}</span> : null}
            {card.setCode ? (
              <span className="badge">
                {card.setCode.toUpperCase()} {card.collectorNumber ?? ""}
              </span>
            ) : null}
          </div>
          <a
            href={scryfallUrl(card)}
            target="_blank"
            rel="noopener noreferrer"
            className="link text-xs"
          >
            Auf Scryfall ansehen ↗
          </a>
        </div>
        <button type="button" className="btn-ghost w-full" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}

/**
 * A clickable card name that shows an image preview on hover (desktop) and
 * opens the full overlay on click. `children` overrides the displayed label.
 */
export function CardName({
  card,
  children,
}: {
  card: CardView;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className="group relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left text-strong hover:underline"
        >
          {children ?? card.name}
        </button>
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 hidden w-44 rounded-xl shadow-2xl group-hover:block"
          />
        ) : null}
      </span>
      {open ? <CardOverlay card={card} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
