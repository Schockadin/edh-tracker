"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { decks } from "@/db/schema";
import { importDeckFromUrl, type DeckImportResult } from "@/lib/deck-import";
import { requireSession } from "@/lib/session";
import { deckInputSchema } from "@/lib/validation";

export interface ActionState {
  ok: boolean;
  error?: string;
}

function firstError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: { message: string }[] }).issues)
  ) {
    return (
      (error as { issues: { message: string }[] }).issues[0]?.message ??
      "Ungültige Eingabe"
    );
  }
  return "Ungültige Eingabe";
}

/** Best-effort metadata lookup used by the "Details laden" button. */
export async function fetchDeckMeta(url: string): Promise<DeckImportResult> {
  await requireSession();
  return importDeckFromUrl(url);
}

export async function createDeck(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = deckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db.insert(decks).values({
    name: parsed.data.name,
    commander: parsed.data.commander,
    partnerCommander: parsed.data.partnerCommander,
    formatId: parsed.data.formatId,
    url: parsed.data.url,
    platform: parsed.data.platform,
    colorIdentity: parsed.data.colorIdentity,
    commanderImage: parsed.data.commanderImage,
    partnerImage: parsed.data.partnerImage,
    bracket: parsed.data.bracket,
  });

  updateTag(CACHE_TAGS.decks);
  redirect("/decks");
}

export async function updateDeck(
  id: number,
  input: unknown,
): Promise<ActionState> {
  await requireSession();
  const parsed = deckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db
    .update(decks)
    .set({
      name: parsed.data.name,
      commander: parsed.data.commander,
      partnerCommander: parsed.data.partnerCommander,
      formatId: parsed.data.formatId,
      url: parsed.data.url,
      platform: parsed.data.platform,
      colorIdentity: parsed.data.colorIdentity,
      commanderImage: parsed.data.commanderImage,
      partnerImage: parsed.data.partnerImage,
      bracket: parsed.data.bracket,
      updatedAt: new Date(),
    })
    .where(eq(decks.id, id));

  updateTag(CACHE_TAGS.decks);
  updateTag(CACHE_TAGS.games);
  redirect("/decks");
}

export async function setDeckArchived(
  id: number,
  archived: boolean,
): Promise<void> {
  await requireSession();
  await db
    .update(decks)
    .set({ archived, updatedAt: new Date() })
    .where(eq(decks.id, id));
  updateTag(CACHE_TAGS.decks);
}

export async function deleteDeck(id: number): Promise<void> {
  await requireSession();
  // Games referencing this deck cascade-delete at the DB level.
  await db.delete(decks).where(eq(decks.id, id));
  updateTag(CACHE_TAGS.decks);
  updateTag(CACHE_TAGS.games);
  redirect("/decks");
}
