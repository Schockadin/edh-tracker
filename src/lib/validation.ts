import { z } from "zod";

export const COLORS = ["W", "U", "B", "R", "G"] as const;
export const PLATFORMS = ["moxfield", "manabox", "archidekt", "other"] as const;
export const WINNER_TYPES = ["me", "opponent", "draw"] as const;
export const WIN_TYPES = [
  "combat_damage",
  "commander_damage",
  "burn",
  "infect",
  "combo",
  "mill",
  "poison",
  "alt_win",
  "decking",
  "concession",
  "other",
] as const;

/** Coerce "" / null / undefined to null, otherwise validate as a bounded int. */
function nullableInt(min: number, max: number) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(min).max(max).nullable(),
  );
}

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));
}

export const deckInputSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  commander: z.string().trim().min(1, "Commander fehlt").max(160),
  partnerCommander: optionalText(160),
  url: z.string().trim().url("Ungültige URL").max(500),
  platform: z.enum(PLATFORMS),
  colorIdentity: z.array(z.enum(COLORS)).default([]),
  bracket: nullableInt(1, 5),
});

export type DeckInput = z.infer<typeof deckInputSchema>;

export const opponentInputSchema = z.object({
  playerName: optionalText(120),
  commander: z.string().trim().min(1, "Gegner-Commander fehlt").max(160),
  partnerCommander: optionalText(160),
});

export const gameInputSchema = z
  .object({
    deckId: z.coerce.number().int().positive("Bitte ein Deck wählen"),
    playedAt: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    bracket: nullableInt(1, 5),
    turnCount: nullableInt(1, 100),
    winnerType: z.enum(WINNER_TYPES),
    winnerOpponentIndex: nullableInt(0, 50),
    winTurn: nullableInt(1, 100),
    winType: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.enum(WIN_TYPES).nullable(),
    ),
    notes: optionalText(2000),
    opponents: z.array(opponentInputSchema).max(12).default([]),
  })
  .refine(
    (data) =>
      data.winnerType !== "opponent" ||
      (data.winnerOpponentIndex !== null &&
        data.winnerOpponentIndex < data.opponents.length),
    {
      message: "Bitte den siegreichen Gegner auswählen",
      path: ["winnerOpponentIndex"],
    },
  );

export type GameInput = z.infer<typeof gameInputSchema>;
