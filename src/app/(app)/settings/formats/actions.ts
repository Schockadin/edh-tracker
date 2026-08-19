"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { formats } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { formatInputSchema } from "@/lib/validation";

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

export async function createFormat(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = formatInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db.insert(formats).values(parsed.data);

  updateTag(CACHE_TAGS.formats);
  redirect("/settings");
}

export async function updateFormat(
  id: number,
  input: unknown,
): Promise<ActionState> {
  await requireSession();
  const parsed = formatInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db
    .update(formats)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(formats.id, id));

  updateTag(CACHE_TAGS.formats);
  redirect("/settings");
}

export async function deleteFormat(id: number): Promise<ActionState> {
  await requireSession();
  try {
    await db.delete(formats).where(eq(formats.id, id));
  } catch {
    return {
      ok: false,
      error:
        "Format wird noch von Decks verwendet und kann nicht gelöscht werden.",
    };
  }
  updateTag(CACHE_TAGS.formats);
  return { ok: true };
}
