"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { CACHE_TAGS } from "@/db/queries";
import { gameOpponents, games } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { gameInputSchema } from "@/lib/validation";

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
    return (error as { issues: { message: string }[] }).issues[0]?.message ?? "Ungültige Eingabe";
  }
  return "Ungültige Eingabe";
}

export async function createGame(input: unknown): Promise<ActionState> {
  await requireSession();
  const parsed = gameInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({
        deckId: data.deckId,
        playedAt: data.playedAt ? new Date(data.playedAt) : undefined,
        bracket: data.bracket,
        turnCount: data.turnCount,
        winnerType: data.winnerType,
        winTurn: data.winTurn,
        winType: data.winType,
        notes: data.notes,
      })
      .returning({ id: games.id });

    let winnerOpponentId: number | null = null;
    if (data.opponents.length > 0) {
      const inserted = await tx
        .insert(gameOpponents)
        .values(
          data.opponents.map((o) => ({
            gameId: game.id,
            playerName: o.playerName,
            commander: o.commander,
            partnerCommander: o.partnerCommander,
          })),
        )
        .returning({ id: gameOpponents.id });

      if (
        data.winnerType === "opponent" &&
        data.winnerOpponentIndex !== null &&
        inserted[data.winnerOpponentIndex]
      ) {
        winnerOpponentId = inserted[data.winnerOpponentIndex].id;
      }
    }

    if (winnerOpponentId !== null) {
      await tx
        .update(games)
        .set({ winnerOpponentId })
        .where(eq(games.id, game.id));
    }
  });

  updateTag(CACHE_TAGS.games);
  redirect("/games");
}

export async function deleteGame(id: number): Promise<void> {
  await requireSession();
  // Opponents cascade-delete via the FK.
  await db.delete(games).where(eq(games.id, id));
  updateTag(CACHE_TAGS.games);
  redirect("/games");
}
