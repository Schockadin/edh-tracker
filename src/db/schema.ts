import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- Enums -----------------------------------------------------------------

export const platformEnum = pgEnum("platform", [
  "moxfield",
  "manabox",
  "archidekt",
  "other",
]);

export const winnerTypeEnum = pgEnum("winner_type", ["me", "opponent", "draw"]);

/**
 * How the game was won. Covers the common EDH win vectors.
 */
export const winTypeEnum = pgEnum("win_type", [
  "combat_damage",
  "commander_damage",
  "burn",
  "infect",
  "combo",
  "mill",
  "poison",
  "alt_win", // e.g. Approach of the Second Sun, Thassa's Oracle, Coalition Victory
  "decking",
  "concession",
  "other",
]);

export const constructionTypeEnum = pgEnum("construction_type", [
  "constructed",
  "limited",
]);

// --- Decks -----------------------------------------------------------------

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Only required for Commander(-style) formats; null for e.g. Standard/Modern.
  commander: text("commander"),
  partnerCommander: text("partner_commander"),
  formatId: integer("format_id")
    .notNull()
    .references(() => formats.id),
  // Optional free-text deck theme/archetype, available for every format.
  theme: text("theme"),
  platform: platformEnum("platform").notNull().default("other"),
  url: text("url").notNull(),
  // Color identity as WUBRG letters, e.g. ["W","U","B"].
  colorIdentity: text("color_identity").array(),
  // Scryfall art-crop image URLs for the commander(s), for display.
  commanderImage: text("commander_image"),
  partnerImage: text("partner_image"),
  // Typical bracket of the deck (1-5, WOTC Commander Brackets).
  bracket: integer("bracket"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Games -----------------------------------------------------------------

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  // My deck used in this game.
  deckId: integer("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  playedAt: timestamp("played_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // WOTC Commander Bracket the pod agreed on (1-5).
  bracket: integer("bracket"),
  // Total number of turns the game lasted (optional).
  turnCount: integer("turn_count"),
  // Who won.
  winnerType: winnerTypeEnum("winner_type").notNull(),
  // If an opponent won, which one (references game_opponents.id at app level).
  winnerOpponentId: integer("winner_opponent_id"),
  // The turn on which the game was decided.
  winTurn: integer("win_turn"),
  // How the game was won.
  winType: winTypeEnum("win_type"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Opponents in a game ---------------------------------------------------

export const gameOpponents = pgTable("game_opponents", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  // Free-text player name (optional).
  playerName: text("player_name"),
  // Opponent commander — only for Commander(-style) games; null otherwise.
  commander: text("commander"),
  partnerCommander: text("partner_commander"),
  // Optional deck theme for non-Commander opponents (no commander there).
  theme: text("theme"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Player Groups ----------------------

export const playerGroups = pgTable("player_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Nur Namen — keine Commander, die kommen weiterhin manuell in game-form.
  playerNames: text("player_names").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Formats -----------------------------------------------------------

export const formats = pgTable("formats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  constructionType: constructionTypeEnum("construction_type").notNull(),
  multiplayer: boolean("multiplayer").notNull().default(false),
  // Whether decks/opponents in this format have a Commander (EDH-style).
  hasCommander: boolean("has_commander").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- App settings (single-user key/value store) ----------------------------

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Relations (for the drizzle relational query API) ----------------------

export const decksRelations = relations(decks, ({ many, one }) => ({
  games: many(games),
  format: one(formats, {
    fields: [decks.formatId],
    references: [formats.id],
  }),
}));

export const formatsRelations = relations(formats, ({ many }) => ({
  decks: many(decks),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  deck: one(decks, {
    fields: [games.deckId],
    references: [decks.id],
  }),
  opponents: many(gameOpponents),
}));

export const gameOpponentsRelations = relations(gameOpponents, ({ one }) => ({
  game: one(games, {
    fields: [gameOpponents.gameId],
    references: [games.id],
  }),
}));

// --- Inferred types --------------------------------------------------------

export type Format = typeof formats.$inferSelect;
export type NewFormat = typeof formats.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type PlayerGroup = typeof playerGroups.$inferSelect;
export type NewPlayerGroup = typeof playerGroups.$inferInsert;
export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameOpponent = typeof gameOpponents.$inferSelect;
export type NewGameOpponent = typeof gameOpponents.$inferInsert;

export type Platform = (typeof platformEnum.enumValues)[number];
export type WinnerType = (typeof winnerTypeEnum.enumValues)[number];
export type WinType = (typeof winTypeEnum.enumValues)[number];
export type ConstructionType = (typeof constructionTypeEnum.enumValues)[number];
