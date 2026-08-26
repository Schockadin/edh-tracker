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
export const CONSTRUCTION_TYPES = ["constructed", "limited"] as const;

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

function optionalUrl(max: number) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().url().max(max).nullable(),
  );
}

export const deckInputSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  // Optional at the schema level; the server action enforces that Commander
  // formats have a commander (based on the selected format).
  commander: optionalText(160),
  partnerCommander: optionalText(160),
  formatId: z.coerce.number().int().positive("Bitte ein Format wählen"),
  theme: optionalText(120),
  url: z.string().trim().url("Ungültige URL").max(500),
  platform: z.enum(PLATFORMS),
  colorIdentity: z.array(z.enum(COLORS)).default([]),
  commanderImage: optionalUrl(500),
  partnerImage: optionalUrl(500),
  bracket: nullableInt(1, 5),
});

export const opponentInputSchema = z.object({
  playerName: optionalText(120),
  // Optional: non-Commander opponents have no commander, only a theme.
  commander: optionalText(160),
  partnerCommander: optionalText(160),
  theme: optionalText(120),
});

export const gameInputSchema = z
  .object({
    deckId: z.coerce.number().int().positive("Bitte ein Deck wählen"),
    playedAt: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    bracket: nullableInt(1, 5),
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

export const playerGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  playerNames: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
});

export const formatInputSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(80),
  constructionType: z.enum(CONSTRUCTION_TYPES),
  multiplayer: z.boolean().default(false),
  hasCommander: z.boolean().default(false),
});

export const settingsInputSchema = z.object({
  defaultFormatId: z.coerce.number().int().positive("Bitte ein Format wählen"),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type FormatInput = z.infer<typeof formatInputSchema>;
export type PlayerGroupInput = z.infer<typeof playerGroupInputSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
export type DeckInput = z.infer<typeof deckInputSchema>;
