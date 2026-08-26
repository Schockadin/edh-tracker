"use server";

import { updateTag } from "next/cache";

import { db } from "@/db";
import { CACHE_TAGS, DEFAULT_FORMAT_SETTING } from "@/db/queries";
import { appSettings } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { settingsInputSchema } from "@/lib/validation";

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

export async function setDefaultFormat(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const format = await db.query.formats.findFirst({
    where: (f, { eq }) => eq(f.id, parsed.data.defaultFormatId),
  });
  if (!format) return { ok: false, error: "Format nicht gefunden." };

  await db
    .insert(appSettings)
    .values({
      key: DEFAULT_FORMAT_SETTING,
      value: String(parsed.data.defaultFormatId),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: String(parsed.data.defaultFormatId),
        updatedAt: new Date(),
      },
    });

  updateTag(CACHE_TAGS.settings);
  return { ok: true };
}
