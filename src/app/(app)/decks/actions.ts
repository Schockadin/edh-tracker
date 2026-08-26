"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { decks } from "@/db/schema";
import { importDeckFromUrl, type DeckImportResult } from "@/lib/deck-import";
import { requireSession } from "@/lib/session";
import { deckInputSchema, type DeckInput } from "@/lib/validation";

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

/**
 * Apply the format's rules to the deck payload: Commander formats require a
 * commander; non-Commander formats never carry commander/partner names or
 * artwork (only Commander decks have an image).
 */
async function normalizeDeckForFormat(
  data: DeckInput,
): Promise<{ ok: true; values: DeckInput } | { ok: false; error: string }> {
  const format = await db.query.formats.findFirst({
    where: (f, { eq }) => eq(f.id, data.formatId),
  });
  if (!format) return { ok: false, error: "Format nicht gefunden." };

  if (format.hasCommander) {
    if (!data.commander) {
      return { ok: false, error: "Commander fehlt" };
    }
    return { ok: true, values: data };
  }

  // Non-Commander deck: strip commander-only fields.
  return {
    ok: true,
    values: {
      ...data,
      commander: null,
      partnerCommander: null,
      commanderImage: null,
      partnerImage: null,
    },
  };
}

export async function createDeck(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = deckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const normalized = await normalizeDeckForFormat(parsed.data);
  if (!normalized.ok) return { ok: false, error: normalized.error };
  const data = normalized.values;

  await db.insert(decks).values({
    name: data.name,
    commander: data.commander,
    partnerCommander: data.partnerCommander,
    formatId: data.formatId,
    theme: data.theme,
    url: data.url,
    platform: data.platform,
    colorIdentity: data.colorIdentity,
    commanderImage: data.commanderImage,
    partnerImage: data.partnerImage,
    bracket: data.bracket,
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

  const normalized = await normalizeDeckForFormat(parsed.data);
  if (!normalized.ok) return { ok: false, error: normalized.error };
  const data = normalized.values;

  await db
    .update(decks)
    .set({
      name: data.name,
      commander: data.commander,
      partnerCommander: data.partnerCommander,
      formatId: data.formatId,
      theme: data.theme,
      url: data.url,
      platform: data.platform,
      colorIdentity: data.colorIdentity,
      commanderImage: data.commanderImage,
      partnerImage: data.partnerImage,
      bracket: data.bracket,
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
