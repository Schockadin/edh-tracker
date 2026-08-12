import type { Platform } from "@/db/schema";

export interface DeckImportResult {
  platform: Platform;
  name?: string;
  commander?: string;
  partnerCommander?: string;
  colorIdentity?: string[];
}

const WUBRG = ["W", "U", "B", "R", "G"];

function sortColors(colors: Iterable<string>): string[] {
  const set = new Set(
    Array.from(colors, (c) => c.toUpperCase()).filter((c) => WUBRG.includes(c)),
  );
  return WUBRG.filter((c) => set.has(c));
}

export function detectPlatform(rawUrl: string): Platform {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("moxfield")) return "moxfield";
  if (host.includes("archidekt")) return "archidekt";
  if (host.includes("manabox")) return "manabox";
  return "other";
}

async function fetchJson(
  url: string,
  referer?: string,
  timeoutMs = 8000,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // A browser-like UA improves the odds against bot filtering. Note that
        // Moxfield fronts its API with Cloudflare and may still return 403 for
        // server-side requests — callers must handle that gracefully. Card
        // data (colors, images) is sourced from Scryfall on the client, so a
        // failed platform import never degrades the saved deck.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        ...(referer ? { Referer: referer } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// --- Moxfield --------------------------------------------------------------

function moxfieldPublicId(url: string): string | null {
  // https://moxfield.com/decks/<publicId>
  const match = url.match(/moxfield\.com\/decks\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function importMoxfield(url: string): Promise<DeckImportResult> {
  const id = moxfieldPublicId(url);
  const base: DeckImportResult = { platform: "moxfield" };
  if (!id) return base;
  try {
    const data = (await fetchJson(
      `https://api2.moxfield.com/v3/decks/all/${id}`,
      "https://www.moxfield.com/",
    )) as MoxfieldDeck;
    const commanderCards = Object.values(data.boards?.commanders?.cards ?? {})
      .map((entry) => entry.card)
      .filter(Boolean);
    const names = commanderCards.map((c) => c.name);
    const colors = new Set<string>();
    for (const c of commanderCards) {
      for (const color of c.color_identity ?? []) colors.add(color);
    }
    return {
      platform: "moxfield",
      name: data.name,
      commander: names[0],
      partnerCommander: names[1],
      colorIdentity: sortColors(colors),
    };
  } catch {
    return base;
  }
}

interface MoxfieldCard {
  name: string;
  color_identity?: string[];
}
interface MoxfieldDeck {
  name?: string;
  boards?: {
    commanders?: { cards?: Record<string, { card: MoxfieldCard }> };
  };
}

// --- Archidekt -------------------------------------------------------------

function archidektId(url: string): string | null {
  // https://archidekt.com/decks/<id>-<slug>
  const match = url.match(/archidekt\.com\/decks\/(\d+)/);
  return match ? match[1] : null;
}

async function importArchidekt(url: string): Promise<DeckImportResult> {
  const id = archidektId(url);
  const base: DeckImportResult = { platform: "archidekt" };
  if (!id) return base;
  try {
    const data = (await fetchJson(
      `https://archidekt.com/api/decks/${id}/`,
      "https://archidekt.com/",
    )) as ArchidektDeck;
    const commanders = (data.cards ?? []).filter((c) =>
      (c.categories ?? []).some((cat) => cat.toLowerCase() === "commander"),
    );
    const names = commanders.map((c) => c.card?.oracleCard?.name).filter(Boolean) as string[];
    const colors = new Set<string>();
    for (const c of commanders) {
      for (const color of c.card?.oracleCard?.colorIdentity ?? []) {
        colors.add(color);
      }
    }
    return {
      platform: "archidekt",
      name: data.name,
      commander: names[0],
      partnerCommander: names[1],
      colorIdentity: sortColors(colors),
    };
  } catch {
    return base;
  }
}

interface ArchidektCard {
  categories?: string[];
  card?: { oracleCard?: { name?: string; colorIdentity?: string[] } };
}
interface ArchidektDeck {
  name?: string;
  cards?: ArchidektCard[];
}

// --- Public entry point ----------------------------------------------------

/**
 * Best-effort import of deck metadata from a supported platform link.
 * Never throws — on any failure it returns just the detected platform so the
 * caller can fall back to manual entry.
 */
export async function importDeckFromUrl(url: string): Promise<DeckImportResult> {
  const platform = detectPlatform(url);
  try {
    switch (platform) {
      case "moxfield":
        return await importMoxfield(url);
      case "archidekt":
        return await importArchidekt(url);
      default:
        // Manabox and unknown hosts: no reliable public API — manual entry.
        return { platform };
    }
  } catch {
    return { platform };
  }
}
