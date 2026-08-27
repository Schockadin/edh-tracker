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
  commander: string | null;
  partnerCommander: string | null;
  formatId: number;
  formatName: string;
  formatHasCommander: boolean;
  theme: string | null;
  platform: Platform;
  url: string | null;
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
  commander: string | null;
  partnerCommander: string | null;
  theme: string | null;
}

export interface GameView {
  id: number;
  deckId: number;
  deckName: string;
  deckCommander: string | null;
  deckTheme: string | null;
  formatId: number;
  formatName: string;
  formatHasCommander: boolean;
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

export interface CardView {
  id: number;
  uuid: string;
  name: string;
  quantity: number;
  scryfallId: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  manaValue: number | null;
  typeLine: string | null;
  colorIdentity: string[];
  imageUrl: string | null;
  rarity: string | null;
}

export interface CollectionCardView extends CardView {
  // `quantity` is how many are owned; used/free are derived from the decklists:
  // a card counts as used up to the total quantity built into decks.
  usedQty: number;
  freeQty: number;
  // True when this entry is not a real collection row but was synthesised from a
  // decklist (a card that is in a deck but has no collection entry of its own).
  virtual: boolean;
}

export interface FormatView {
  id: number;
  name: string;
  constructionType: ConstructionType;
  multiplayer: boolean;
  hasCommander: boolean;
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

export const WINNER_TYPE_LABELS: Record<WinnerType, string> = {
  me: "Ich",
  opponent: "Gegner",
  draw: "Unentschieden",
};

export const CONSTRUCTION_TYPE_LABELS: Record<ConstructionType, string> = {
  constructed: "Constructed",
  limited: "Limited",
};

/** Best display label for an opponent: commander, else theme, else name. */
export function opponentLabel(o: OpponentView): string {
  return o.commander ?? o.theme ?? o.playerName ?? "Gegner";
}

/** Best display label for a deck's identity: commander, else theme. */
export function deckIdentity(deck: {
  commander: string | null;
  theme: string | null;
}): string | null {
  return deck.commander ?? deck.theme ?? null;
}

export const COLOR_HEX: Record<string, string> = {
  W: "#f8f4e3",
  U: "#3b82f6",
  B: "#4b5563",
  R: "#ef4444",
  G: "#22c55e",
};
