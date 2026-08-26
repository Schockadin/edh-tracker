"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { collectionCards } from "@/db/schema";
import { parseCardImport } from "@/lib/decklist";
import { resolveCards } from "@/lib/scryfall-server";
import { requireSession } from "@/lib/session";
import type { CardZone } from "@/db/schema";

export interface ImportState {
  ok: boolean;
  added?: number;
  unresolved?: string[];
  error?: string;
}

const ZONES: CardZone[] = ["used", "free"];

/**
 * Add pasted/uploaded cards to the collection with the given zone. Cards with a
 * name already present in that zone have their quantity increased; new names are
 * inserted. Names Scryfall cannot resolve are reported back.
 */
export async function importCollection(
  content: string,
  zone: CardZone,
): Promise<ImportState> {
  await requireSession();
  if (!ZONES.includes(zone)) return { ok: false, error: "Ungültige Zone." };
  if (!content.trim()) return { ok: false, error: "Keine Karten gefunden." };

  const lines = parseCardImport(content);
  if (lines.length === 0) return { ok: false, error: "Keine Karten gefunden." };

  const { resolved, unresolved } = await resolveCards(lines);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(collectionCards)
      .where(eq(collectionCards.zone, zone));
    const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

    for (const c of resolved) {
      const found = byName.get(c.name.toLowerCase());
      if (found) {
        await tx
          .update(collectionCards)
          .set({ quantity: found.quantity + c.quantity })
          .where(eq(collectionCards.id, found.id));
      } else {
        await tx.insert(collectionCards).values({
          name: c.name,
          quantity: c.quantity,
          zone,
          scryfallId: c.scryfallId,
          setCode: c.setCode,
          collectorNumber: c.collectorNumber,
          manaValue: c.manaValue,
          typeLine: c.typeLine,
          colorIdentity: c.colorIdentity,
          imageUrl: c.imageUrl,
          rarity: c.rarity,
        });
      }
    }
  });

  updateTag(CACHE_TAGS.collection);
  return { ok: true, added: resolved.length, unresolved };
}

export async function setCollectionCardZone(
  id: number,
  zone: CardZone,
): Promise<void> {
  await requireSession();
  if (!ZONES.includes(zone)) return;
  await db
    .update(collectionCards)
    // Clearing the deck link when a card becomes free keeps the data honest.
    .set({ zone, deckId: zone === "free" ? null : undefined })
    .where(eq(collectionCards.id, id));
  updateTag(CACHE_TAGS.collection);
}

export async function setCollectionCardQuantity(
  id: number,
  quantity: number,
): Promise<void> {
  await requireSession();
  const q = Math.max(0, Math.floor(quantity));
  if (q === 0) {
    await db.delete(collectionCards).where(eq(collectionCards.id, id));
  } else {
    await db
      .update(collectionCards)
      .set({ quantity: q })
      .where(eq(collectionCards.id, id));
  }
  updateTag(CACHE_TAGS.collection);
}

export async function deleteCollectionCard(id: number): Promise<void> {
  await requireSession();
  await db.delete(collectionCards).where(eq(collectionCards.id, id));
  updateTag(CACHE_TAGS.collection);
}

export async function clearCollection(zone?: CardZone): Promise<void> {
  await requireSession();
  if (zone && ZONES.includes(zone)) {
    await db.delete(collectionCards).where(eq(collectionCards.zone, zone));
  } else {
    await db.delete(collectionCards);
  }
  updateTag(CACHE_TAGS.collection);
}
