import type {
  ConstructionType,
  Platform,
  WinnerType,
  WinType,
} from "@/db/schema";

// Serializable view models passed from server components to client components.
// Timestamps are ISO strings so they survive the Next.js data cache and the
// server → client boundary cleanly.

export interface DeckView {
  id: number;
  name: string;
  commander: string;
  partnerCommander: string | null;
  formatId: number;
  platform: Platform;
  url: string;
  colorIdentity: string[];
  commanderImage: string | null;
  partnerImage: string | null;
  bracket: number | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpponentView {
  id: number;
  playerName: string | null;
  commander: string;
  partnerCommander: string | null;
}

export interface GameView {
  id: number;
  deckId: number;
  deckName: string;
  deckCommander: string;
  formatId: number;
  playedAt: string;
  bracket: number | null;
  turnCount: number | null;
  winnerType: WinnerType;
  winnerOpponentId: number | null;
  winTurn: number | null;
  winType: WinType | null;
  notes: string | null;
  opponents: OpponentView[];
  createdAt: string;
}

export interface PlayerGroupView {
  id: number;
  name: string;
  playerNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FormatView {
  id: number;
  name: string;
  constructionType: ConstructionType;
  multiplayer: boolean;
  createdAt: string;
  updatedAt: string;
}

export const WIN_TYPE_LABELS: Record<WinType, string> = {
  combat_damage: "Combat Damage",
  commander_damage: "Commander Damage",
  burn: "Burn",
  infect: "Infect",
  combo: "Combo",
  mill: "Mill",
  poison: "Poison",
  alt_win: "Alternative Win",
  decking: "Decking Out",
  concession: "Concession",
  other: "Sonstiges",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  moxfield: "Moxfield",
  manabox: "ManaBox",
  archidekt: "Archidekt",
  other: "Sonstige",
};

export const FORMAT_LABELS: Record<number, string> = {
  1: "Commander",
  2: "Pauper",
  3: "Pre-Release",
};

export const WINNER_TYPE_LABELS: Record<WinnerType, string> = {
  me: "Ich",
  opponent: "Gegner",
  draw: "Unentschieden",
};

export const CONSTRUCTION_TYPE_LABELS: Record<ConstructionType, string> = {
  constructed: "Constructed",
  limited: "Limited",
};

export const COLOR_HEX: Record<string, string> = {
  W: "#f8f4e3",
  U: "#3b82f6",
  B: "#4b5563",
  R: "#ef4444",
  G: "#22c55e",
};
