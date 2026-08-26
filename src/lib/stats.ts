import type { WinType } from "@/db/schema";
import { WIN_TYPE_LABELS, type DeckView, type GameView } from "./types";

export interface Overview {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0..1
  avgWinTurn: number | null;
}

export interface DeckStat {
  deckId: number;
  name: string;
  commander: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface WinTypeStat {
  key: WinType;
  label: string;
  total: number; // across all players
  mine: number; // games I won this way
}

export interface TurnStat {
  turn: number;
  mine: number;
  opponents: number;
}

export interface BracketStat {
  bracket: string; // "1".."5" or "—"
  games: number;
  wins: number;
}

export interface TimeStat {
  period: string; // YYYY-MM
  games: number;
  wins: number;
}

export interface Stats {
  overview: Overview;
  deckStats: DeckStat[];
  winTypeStats: WinTypeStat[];
  turnStats: TurnStat[];
  bracketStats: BracketStat[];
  timeStats: TimeStat[];
}

function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function computeStats(games: GameView[], decks: DeckView[]): Stats {
  const total = games.length;
  const wins = games.filter((g) => g.winnerType === "me").length;
  const losses = games.filter((g) => g.winnerType === "opponent").length;
  const draws = games.filter((g) => g.winnerType === "draw").length;

  const winTurns = games
    .map((g) => g.winTurn)
    .filter((t): t is number => typeof t === "number");
  const avgWinTurn =
    winTurns.length > 0
      ? round(winTurns.reduce((a, b) => a + b, 0) / winTurns.length, 1)
      : null;

  const overview: Overview = {
    total,
    wins,
    losses,
    draws,
    winRate: total > 0 ? round(wins / total) : 0,
    avgWinTurn,
  };

  // Per-deck aggregation. Seed with all decks so unplayed decks show up as 0.
  const deckMap = new Map<number, DeckStat>();
  for (const d of decks) {
    deckMap.set(d.id, {
      deckId: d.id,
      name: d.name,
      commander: d.commander ?? d.theme ?? "",
      games: 0,
      wins: 0,
      winRate: 0,
    });
  }
  for (const g of games) {
    let stat = deckMap.get(g.deckId);
    if (!stat) {
      stat = {
        deckId: g.deckId,
        name: g.deckName,
        commander: g.deckCommander ?? g.deckTheme ?? "",
        games: 0,
        wins: 0,
        winRate: 0,
      };
      deckMap.set(g.deckId, stat);
    }
    stat.games += 1;
    if (g.winnerType === "me") stat.wins += 1;
  }
  const deckStats = Array.from(deckMap.values())
    .map((s) => ({ ...s, winRate: s.games > 0 ? round(s.wins / s.games) : 0 }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate);

  // Win-type distribution.
  const winTypeStats: WinTypeStat[] = (
    Object.keys(WIN_TYPE_LABELS) as WinType[]
  )
    .map((key) => ({
      key,
      label: WIN_TYPE_LABELS[key],
      total: games.filter((g) => g.winType === key).length,
      mine: games.filter((g) => g.winType === key && g.winnerType === "me")
        .length,
    }))
    .filter((s) => s.total > 0);

  // Wins by turn, split by who won.
  const turnMap = new Map<number, TurnStat>();
  for (const g of games) {
    if (typeof g.winTurn !== "number") continue;
    const stat = turnMap.get(g.winTurn) ?? {
      turn: g.winTurn,
      mine: 0,
      opponents: 0,
    };
    if (g.winnerType === "me") stat.mine += 1;
    else if (g.winnerType === "opponent") stat.opponents += 1;
    turnMap.set(g.winTurn, stat);
  }
  const turnStats = Array.from(turnMap.values()).sort((a, b) => a.turn - b.turn);

  // Bracket distribution.
  const bracketMap = new Map<string, BracketStat>();
  for (const g of games) {
    const key = g.bracket != null ? String(g.bracket) : "—";
    const stat = bracketMap.get(key) ?? { bracket: key, games: 0, wins: 0 };
    stat.games += 1;
    if (g.winnerType === "me") stat.wins += 1;
    bracketMap.set(key, stat);
  }
  const bracketStats = Array.from(bracketMap.values()).sort((a, b) =>
    a.bracket.localeCompare(b.bracket),
  );

  // Games over time, by month.
  const timeMap = new Map<string, TimeStat>();
  for (const g of games) {
    const period = g.playedAt.slice(0, 7); // YYYY-MM
    const stat = timeMap.get(period) ?? { period, games: 0, wins: 0 };
    stat.games += 1;
    if (g.winnerType === "me") stat.wins += 1;
    timeMap.set(period, stat);
  }
  const timeStats = Array.from(timeMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  return {
    overview,
    deckStats,
    winTypeStats,
    turnStats,
    bracketStats,
    timeStats,
  };
}
