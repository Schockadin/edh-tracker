import type {
  ConstructionType,
  Platform,
  WinnerType,
  WinType,
} from "@/db/schema";

/**
 * Wire format for syncing with offline clients (e.g. the Android app).
 *
 * Every record is identified by its stable `uuid` rather than the serial `id`,
 * and foreign keys are expressed as the referenced row's `uuid` so identity is
 * portable across devices. Timestamps are ISO-8601 strings.
 */

export interface SyncFormat {
  uuid: string;
  name: string;
  constructionType: ConstructionType;
  multiplayer: boolean;
  hasCommander: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncDeck {
  uuid: string;
  name: string;
  commander: string | null;
  partnerCommander: string | null;
  formatUuid: string;
  theme: string | null;
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

export interface SyncGame {
  uuid: string;
  deckUuid: string;
  playedAt: string;
  bracket: number | null;
  turnCount: number | null;
  winnerType: WinnerType;
  // uuid of the winning opponent, when `winnerType === "opponent"`.
  winnerOpponentUuid: string | null;
  winTurn: number | null;
  winType: WinType | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncOpponent {
  uuid: string;
  gameUuid: string;
  playerName: string | null;
  commander: string | null;
  partnerCommander: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncGroup {
  uuid: string;
  name: string;
  playerNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncDeletion {
  table: string;
  uuid: string;
  deletedAt: string;
}

/** Response of `GET /api/sync/pull`. */
export interface SyncPullResponse {
  serverTime: string;
  formats: SyncFormat[];
  decks: SyncDeck[];
  games: SyncGame[];
  opponents: SyncOpponent[];
  groups: SyncGroup[];
  deletions: SyncDeletion[];
}

/**
 * Body of `POST /api/sync/push`. The client sends the records it changed
 * locally since the last sync plus any pending deletions. All arrays are
 * optional.
 */
export interface SyncPushRequest {
  formats?: SyncFormat[];
  decks?: SyncDeck[];
  games?: SyncGame[];
  opponents?: SyncOpponent[];
  groups?: SyncGroup[];
  deletions?: { table: string; uuid: string }[];
}

export interface SyncPushResponse {
  ok: true;
  applied: {
    formats: number;
    decks: number;
    games: number;
    opponents: number;
    groups: number;
    deletions: number;
  };
  serverTime: string;
}
