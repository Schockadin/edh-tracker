// Scryfall API client. Runs in the browser (Scryfall sends permissive CORS
// headers), so card autocomplete, validation and images never touch our own
// server — which also sidesteps platform bot-blocking on the import path.
//
// Scryfall asks callers to be gentle (a request every ~50–100ms); the UI
// debounces autocomplete, so occasional calls stay well within that.

const BASE = "https://api.scryfall.com";

export interface ScryCard {
  id: string;
  name: string;
  colorIdentity: string[]; // e.g. ["W","U","B"]
  typeLine: string;
  artCrop?: string;
  normal?: string;
  small?: string;
  /** True if the card can legally be a Commander. */
  canBeCommander: boolean;
}

interface RawImageUris {
  art_crop?: string;
  normal?: string;
  small?: string;
}
interface RawCard {
  id: string;
  name: string;
  color_identity?: string[];
  type_line?: string;
  image_uris?: RawImageUris;
  card_faces?: { image_uris?: RawImageUris; type_line?: string }[];
}

function pickImages(raw: RawCard): RawImageUris {
  if (raw.image_uris) return raw.image_uris;
  const face = raw.card_faces?.find((f) => f.image_uris);
  return face?.image_uris ?? {};
}

function normalize(raw: RawCard): ScryCard {
  const img = pickImages(raw);
  const typeLine = raw.type_line ?? raw.card_faces?.[0]?.type_line ?? "";
  const canBeCommander =
    /Legendary/.test(typeLine) &&
    (/Creature/.test(typeLine) || /can be your commander/i.test(typeLine)) ;
  return {
    id: raw.id,
    name: raw.name,
    colorIdentity: raw.color_identity ?? [],
    typeLine,
    artCrop: img.art_crop,
    normal: img.normal,
    small: img.small,
    canBeCommander,
  };
}

/** Card-name suggestions for a partial query. Returns [] on any failure. */
export async function autocompleteCards(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `${BASE}/cards/autocomplete?q=${encodeURIComponent(q)}`,
      { signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: string[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Resolve an exact card by name. Returns null if the name is not a real card.
 * Falls back to a fuzzy match so minor typos still resolve to the intended card.
 */
export async function getCardByName(
  name: string,
  signal?: AbortSignal,
): Promise<ScryCard | null> {
  const q = name.trim();
  if (!q) return null;
  try {
    let res = await fetch(
      `${BASE}/cards/named?exact=${encodeURIComponent(q)}`,
      { signal, headers: { Accept: "application/json" } },
    );
    if (res.status === 404) {
      res = await fetch(`${BASE}/cards/named?fuzzy=${encodeURIComponent(q)}`, {
        signal,
        headers: { Accept: "application/json" },
      });
    }
    if (!res.ok) return null;
    return normalize((await res.json()) as RawCard);
  } catch {
    return null;
  }
}

const WUBRG = ["W", "U", "B", "R", "G"];
export function sortColorIdentity(colors: Iterable<string>): string[] {
  const set = new Set(Array.from(colors, (c) => c.toUpperCase()));
  return WUBRG.filter((c) => set.has(c));
}
