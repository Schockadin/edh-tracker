import "server-only";

import { desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import type {
  DeckView,
  FormatView,
  GameView,
  PlayerGroupView,
} from "@/lib/types";
import { db } from "./index";
import type { Deck, Game, Format, GameOpponent, PlayerGroup } from "./schema";

export const CACHE_TAGS = {
  decks: "decks",
  games: "games",
  groups: "groups",
  formats: "formats",
  settings: "settings",
} as const;

function serializeDeck(deck: Deck & { format: Format }): DeckView {
  return {
    id: deck.id,
    name: deck.name,
    commander: deck.commander,
    partnerCommander: deck.partnerCommander,
    formatId: deck.formatId,
    formatName: deck.format.name,
    formatHasCommander: deck.format.hasCommander,
    theme: deck.theme,
    platform: deck.platform,
    url: deck.url,
    colorIdentity: deck.colorIdentity ?? [],
    commanderImage: deck.commanderImage,
    partnerImage: deck.partnerImage,
    bracket: deck.bracket,
    archived: deck.archived,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
  };
}

function serializeFormat(format: Format): FormatView {
  return {
    id: format.id,
    name: format.name,
    constructionType: format.constructionType,
    multiplayer: format.multiplayer,
    hasCommander: format.hasCommander,
    createdAt: format.createdAt.toISOString(),
    updatedAt: format.updatedAt.toISOString(),
  };
}

function serializeGame(
  game: Game & {
    deck: Deck & { format: Format };
    opponents: GameOpponent[];
  },
): GameView {
  return {
    id: game.id,
    deckId: game.deckId,
    deckName: game.deck.name,
    deckCommander: game.deck.commander,
    deckTheme: game.deck.theme,
    formatId: game.deck.formatId,
    formatName: game.deck.format.name,
    formatHasCommander: game.deck.format.hasCommander,
    playedAt: game.playedAt.toISOString(),
    bracket: game.bracket,
    turnCount: game.turnCount,
    winnerType: game.winnerType,
    winnerOpponentId: game.winnerOpponentId,
    winTurn: game.winTurn,
    winType: game.winType,
    notes: game.notes,
    opponents: game.opponents.map((o) => ({
      id: o.id,
      playerName: o.playerName,
      commander: o.commander,
      partnerCommander: o.partnerCommander,
      theme: o.theme,
    })),
    createdAt: game.createdAt.toISOString(),
  };
}

/** All decks, newest first. Cached; invalidated via the `decks` tag. */
export const getDecks = unstable_cache(
  async (): Promise<DeckView[]> => {
    const rows = await db.query.decks.findMany({
      with: { format: true },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
    return rows.map(serializeDeck);
  },
  ["decks:list"],
  { tags: [CACHE_TAGS.decks, CACHE_TAGS.formats] },
);

/** A single deck by id (or null). Cached; invalidated via the `decks` tag. */
export const getDeck = unstable_cache(
  async (id: number): Promise<DeckView | null> => {
    const row = await db.query.decks.findFirst({
      where: (d, { eq }) => eq(d.id, id),
      with: { format: true },
    });
    return row ? serializeDeck(row) : null;
  },
  ["decks:one"],
  { tags: [CACHE_TAGS.decks, CACHE_TAGS.formats] },
);

/**
 * All games with their deck and opponents, newest first. This is the single
 * source of truth that the stats module derives every chart from.
 * Cached; invalidated via the `games` tag (and `decks`, since deck edits
 * change the denormalised deck name shown on a game).
 */
export const getGames = unstable_cache(
  async (): Promise<GameView[]> => {
    const rows = await db.query.games.findMany({
      with: { deck: { with: { format: true } }, opponents: true },
      orderBy: (g) => [desc(g.playedAt), desc(g.id)],
    });
    return rows.map(serializeGame);
  },
  ["games:list"],
  { tags: [CACHE_TAGS.games, CACHE_TAGS.decks, CACHE_TAGS.formats] },
);

/**
 * Get a single game based on its ID
 */
export const getGame = unstable_cache(
  async (id: number): Promise<GameView | null> => {
    const row = await db.query.games.findFirst({
      where: (g, { eq }) => eq(g.id, id),
      with: { deck: { with: { format: true } }, opponents: true },
    });
    return row ? serializeGame(row) : null;
  },
  ["games:one"],
  { tags: [CACHE_TAGS.games, CACHE_TAGS.decks, CACHE_TAGS.formats] },
);

function serializePlayerGroup(group: PlayerGroup): PlayerGroupView {
  return {
    id: group.id,
    name: group.name,
    playerNames: group.playerNames ?? [],
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

/** Alle Gruppen, alphabetisch. Cached; invalidiert über den `groups`-Tag. */
export const getPlayerGroups = unstable_cache(
  async (): Promise<PlayerGroupView[]> => {
    const rows = await db.query.playerGroups.findMany({
      orderBy: (g, { asc }) => [asc(g.name)],
    });
    return rows.map(serializePlayerGroup);
  },
  ["groups:list"],
  { tags: [CACHE_TAGS.groups] },
);

/** Eine einzelne Gruppe (oder null). Cached; invalidiert über den `groups`-Tag. */
export const getPlayerGroup = unstable_cache(
  async (id: number): Promise<PlayerGroupView | null> => {
    const row = await db.query.playerGroups.findFirst({
      where: (g, { eq }) => eq(g.id, id),
    });
    return row ? serializePlayerGroup(row) : null;
  },
  ["groups:one"],
  { tags: [CACHE_TAGS.groups] },
);

/** Alle Formate, alphabetisch. Cached; invalidiert über den `formats`-Tag. */
export const getFormats = unstable_cache(
  async (): Promise<FormatView[]> => {
    const rows = await db.query.formats.findMany({
      orderBy: (f, { asc }) => [asc(f.name)],
    });
    return rows.map(serializeFormat);
  },
  ["formats:list"],
  { tags: [CACHE_TAGS.formats] },
);

/** Ein einzelnes Format (oder null). Cached; invalidiert über `formats`. */
export const getFormat = unstable_cache(
  async (id: number): Promise<FormatView | null> => {
    const row = await db.query.formats.findFirst({
      where: (f, { eq }) => eq(f.id, id),
    });
    return row ? serializeFormat(row) : null;
  },
  ["formats:one"],
  { tags: [CACHE_TAGS.formats] },
);

/** Key of the app setting holding the default format filter. */
export const DEFAULT_FORMAT_SETTING = "default_format_id";

/** A single app setting value (or null). Cached; invalidated via `settings`. */
export const getSetting = unstable_cache(
  async (key: string): Promise<string | null> => {
    const row = await db.query.appSettings.findFirst({
      where: (s, { eq }) => eq(s.key, key),
    });
    return row?.value ?? null;
  },
  ["settings:one"],
  { tags: [CACHE_TAGS.settings] },
);

/**
 * The configured default format id for the dashboard/deck-list filter, falling
 * back to the Commander format (or the first format) when unset or stale.
 * Cached; invalidated via the `settings` and `formats` tags.
 */
export const getDefaultFormatId = unstable_cache(
  async (): Promise<number | null> => {
    const [formats, raw] = await Promise.all([
      db.query.formats.findMany({ orderBy: (f, { asc }) => [asc(f.id)] }),
      db.query.appSettings.findFirst({
        where: (s, { eq }) => eq(s.key, DEFAULT_FORMAT_SETTING),
      }),
    ]);
    if (formats.length === 0) return null;

    const configured = raw?.value ? Number(raw.value) : null;
    if (configured && formats.some((f) => f.id === configured)) {
      return configured;
    }
    const commander = formats.find((f) => f.name === "Commander");
    return commander?.id ?? formats[0].id;
  },
  ["settings:default-format"],
  { tags: [CACHE_TAGS.settings, CACHE_TAGS.formats] },
);
