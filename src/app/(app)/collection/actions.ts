"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { collectionCards } from "@/db/schema";
import { parseCardImport } from "@/lib/decklist";
import { resolveCards } from "@/lib/scryfall-server";
import { requireSession } from "@/lib/session";

export interface ImportState {
  ok: boolean;
  added?: number;
  unresolved?: string[];
  error?: string;
}

/**
 * Add pasted/uploaded cards to the collection. Cards with a name already present
 * have their owned quantity increased; new names are inserted. Whether a card is
 * "used" or "free" is derived from the decklists, not stored here. Names Scryfall
 * cannot resolve are reported back.
 */
export async function importCollection(
  content: string,
): Promise<ImportState> {
  await requireSession();
  if (!content.trim()) return { ok: false, error: "Keine Karten gefunden." };

  const lines = parseCardImport(content);
  if (lines.length === 0) return { ok: false, error: "Keine Karten gefunden." };

  const { resolved, unresolved } = await resolveCards(lines);

  await db.transaction(async (tx) => {
    const existing = await tx.select().from(collectionCards);
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

export async function clearCollection(): Promise<void> {
  await requireSession();
  await db.delete(collectionCards);
  updateTag(CACHE_TAGS.collection);
}
