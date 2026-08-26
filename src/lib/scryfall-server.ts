import "server-only";

import type { CardLine } from "./decklist";

/**
 * Bulk resolution of card names against Scryfall's `/cards/collection`
 * endpoint (server-side). Used by the decklist / collection import so the same
 * canonical card data is available to both the web app and the Android client.
 */

export interface ResolvedCard {
  name: string;
  quantity: number;
  scryfallId: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  manaValue: number | null;
  typeLine: string | null;
  colorIdentity: string[];
  imageUrl: string | null;
  rarity: string | null;
}

export interface ResolveResult {
  resolved: ResolvedCard[];
  unresolved: string[];
}

interface RawImageUris {
  normal?: string;
  large?: string;
  small?: string;
}
interface RawCard {
  id: string;
  name: string;
  cmc?: number;
  type_line?: string;
  color_identity?: string[];
  set?: string;
  collector_number?: string;
  rarity?: string;
  image_uris?: RawImageUris;
  card_faces?: { image_uris?: RawImageUris }[];
}

const BATCH = 75; // Scryfall's per-request identifier limit.
const MAX_IDENTIFIERS = 2000; // safety cap.

function image(raw: RawCard): string | null {
  return (
    raw.image_uris?.normal ??
    raw.card_faces?.find((f) => f.image_uris)?.image_uris?.normal ??
    null
  );
}

function toResolved(raw: RawCard, quantity: number): ResolvedCard {
  return {
    name: raw.name,
    quantity,
    scryfallId: raw.id ?? null,
    setCode: raw.set ?? null,
    collectorNumber: raw.collector_number ?? null,
    manaValue: raw.cmc != null ? Math.round(raw.cmc) : null,
    typeLine: raw.type_line ?? null,
    colorIdentity: raw.color_identity ?? [],
    imageUrl: image(raw),
    rarity: raw.rarity ?? null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve `{ name, quantity }` entries into full card data. Names that Scryfall
 * cannot match are returned in `unresolved`; everything else in `resolved`.
 */
export async function resolveCards(lines: CardLine[]): Promise<ResolveResult> {
  const entries = lines.slice(0, MAX_IDENTIFIERS);
  const qtyByKey = new Map<string, number>();
  for (const l of entries) qtyByKey.set(l.name.toLowerCase(), l.quantity);

  const resolved: ResolvedCard[] = [];
  const matchedKeys = new Set<string>();

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const identifiers = batch.map((l) => ({ name: l.name }));
    let data: RawCard[] = [];
    try {
      const res = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ identifiers }),
        cache: "no-store",
      });
      if (res.ok) {
        data = ((await res.json()) as { data?: RawCard[] }).data ?? [];
      }
    } catch {
      // Network hiccup: treat this batch as unresolved (handled below).
      data = [];
    }

    for (const card of data) {
      // Match the returned card back to an input name (full name or front face).
      const keys = [card.name.toLowerCase(), card.name.split(" // ")[0].toLowerCase()];
      const key = keys.find((k) => qtyByKey.has(k));
      if (!key || matchedKeys.has(key)) continue;
      matchedKeys.add(key);
      resolved.push(toResolved(card, qtyByKey.get(key) ?? 1));
    }

    if (i + BATCH < entries.length) await sleep(100);
  }

  const unresolved = entries
    .filter((l) => !matchedKeys.has(l.name.toLowerCase()))
    .map((l) => l.name);

  return { resolved, unresolved };
}
