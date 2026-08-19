"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { playerGroups } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { playerGroupInputSchema } from "@/lib/validation";

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

export async function createGroup(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = playerGroupInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db.insert(playerGroups).values({
    name: parsed.data.name,
    playerNames: parsed.data.playerNames,
  });

  updateTag(CACHE_TAGS.groups);
  redirect("/groups");
}

export async function updateGroup(
  id: number,
  input: unknown,
): Promise<ActionState> {
  await requireSession();
  const parsed = playerGroupInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await db
    .update(playerGroups)
    .set({
      name: parsed.data.name,
      playerNames: parsed.data.playerNames,
      updatedAt: new Date(),
    })
    .where(eq(playerGroups.id, id));

  updateTag(CACHE_TAGS.groups);
  redirect("/groups");
}

export async function deleteGroup(id: number): Promise<void> {
  await requireSession();
  await db.delete(playerGroups).where(eq(playerGroups.id, id));
  updateTag(CACHE_TAGS.groups);
}
