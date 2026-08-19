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
} as const;

function serializeDeck(deck: Deck): DeckView {
  return {
    id: deck.id,
    name: deck.name,
    commander: deck.commander,
    partnerCommander: deck.partnerCommander,
    formatId: deck.formatId,
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
    createdAt: format.createdAt.toISOString(),
    updatedAt: format.updatedAt.toISOString(),
  };
}

function serializeGame(
  game: Game & { deck: Deck; opponents: GameOpponent[] },
): GameView {
  return {
    id: game.id,
    deckId: game.deckId,
    deckName: game.deck.name,
    deckCommander: game.deck.commander,
    formatId: game.deck.formatId,
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
    })),
    createdAt: game.createdAt.toISOString(),
  };
}

/** All decks, newest first. Cached; invalidated via the `decks` tag. */
export const getDecks = unstable_cache(
  async (): Promise<DeckView[]> => {
    const rows = await db.query.decks.findMany({
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
    return rows.map(serializeDeck);
  },
  ["decks:list"],
  { tags: [CACHE_TAGS.decks] },
);

/** A single deck by id (or null). Cached; invalidated via the `decks` tag. */
export const getDeck = unstable_cache(
  async (id: number): Promise<DeckView | null> => {
    const row = await db.query.decks.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });
    return row ? serializeDeck(row) : null;
  },
  ["decks:one"],
  { tags: [CACHE_TAGS.decks] },
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
      with: { deck: true, opponents: true },
      orderBy: (g) => [desc(g.playedAt), desc(g.id)],
    });
    return rows.map(serializeGame);
  },
  ["games:list"],
  { tags: [CACHE_TAGS.games, CACHE_TAGS.decks] },
);

/**
 * Get a single game based on its ID
 */
export const getGame = unstable_cache(
  async (id: number): Promise<GameView | null> => {
    const row = await db.query.games.findFirst({
      where: (g, { eq }) => eq(g.id, id),
      with: { deck: true, opponents: true },
    });
    return row ? serializeGame(row) : null;
  },
  ["games:one"],
  { tags: [CACHE_TAGS.games, CACHE_TAGS.decks] },
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
