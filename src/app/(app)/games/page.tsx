import type { Metadata } from "next";
import Link from "next/link";

import { DeleteGameButton } from "@/components/game-actions";
import { SectionHeader } from "@/components/ui";
import { getGames } from "@/db/queries";
import { WIN_TYPE_LABELS, type GameView } from "@/lib/types";

export const metadata: Metadata = { title: "Spiele" };

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function ResultBadge({ game }: { game: GameView }) {
  const map = {
    me: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    opponent: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    draw: "bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/40",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[game.winnerType]}`}
    >
      {game.winnerType === "me"
        ? "Sieg"
        : game.winnerType === "opponent"
          ? "Niederlage"
          : "Unentschieden"}
    </span>
  );
}

function GameCard({ game }: { game: GameView }) {
  const winner =
    game.winnerType === "opponent" && game.winnerOpponentId != null
      ? game.opponents.find((o) => o.id === game.winnerOpponentId)
      : null;

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ResultBadge game={game} />
            <span className="text-xs text-muted">
              {dateFmt.format(new Date(game.playedAt))}
            </span>
          </div>
          <h3 className="mt-1 font-semibold">
            {game.deckName}{" "}
            <span className="font-normal text-muted">
              — {game.deckCommander}
            </span>
          </h3>
        </div>
        <DeleteGameButton id={game.id} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {game.bracket ? (
          <span className="badge">Bracket {game.bracket}</span>
        ) : null}
        {game.winTurn ? (
          <span className="badge">Sieg in Turn {game.winTurn}</span>
        ) : null}
        {game.winType ? (
          <span className="badge">{WIN_TYPE_LABELS[game.winType]}</span>
        ) : null}
      </div>

      {winner ? (
        <p className="text-sm text-soft">
          Gewonnen von <span className="font-medium">{winner.commander}</span>
          {winner.playerName ? ` (${winner.playerName})` : ""}
        </p>
      ) : null}

      {game.opponents.length > 0 ? (
        <div className="text-sm text-muted">
          <span className="text-subtle">Gegner: </span>
          {game.opponents.map((o) => o.commander).join(", ")}
        </div>
      ) : null}

      {game.notes ? (
        <p className="border-t divider-soft pt-2 text-sm text-soft">
          {game.notes}
        </p>
      ) : null}
    </div>
  );
}

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Spiele"
        action={
          <Link href="/games/new" className="btn-primary">
            + Spiel erfassen
          </Link>
        }
      />

      {games.length === 0 ? (
        <div className="card text-center text-muted">
          Noch keine Spiele erfasst.
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
