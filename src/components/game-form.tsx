"use client";

import { useMemo, useState, useTransition } from "react";

import { createGame, updateGame } from "@/app/(app)/games/actions";
import type { WinType } from "@/db/schema";
import {
  WINNER_TYPE_LABELS,
  WIN_TYPE_LABELS,
  type DeckView,
  type GameView,
  type PlayerGroupView,
} from "@/lib/types";
import { WIN_TYPES } from "@/lib/validation";
import { CardInput } from "./card-input";

interface OpponentRow {
  playerName: string;
  commander: string;
  partnerCommander: string;
  commanderValid: boolean;
  partnerValid: boolean;
}

function nowDate(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

const emptyOpponent: OpponentRow = {
  playerName: "",
  commander: "",
  partnerCommander: "",
  commanderValid: true,
  partnerValid: true,
};

export function GameForm({
  decks,
  game,
  groups,
}: {
  decks: DeckView[];
  game?: GameView;
  groups?: PlayerGroupView[];
}) {
  const editing = Boolean(game);
  const [deckId, setDeckId] = useState<string>(
    game ? String(game.deckId) : decks[0] ? String(decks[0].id) : "",
  );
  const [playedAt, setPlayedAt] = useState<string>(
    game ? game.playedAt.slice(0, 10) : nowDate(),
  );
  const [bracket, setBracket] = useState<string>(
    game?.bracket != null ? String(game.bracket) : "",
  );
  const [opponents, setOpponents] = useState<OpponentRow[]>(
    game && game.opponents.length > 0
      ? game.opponents.map((o) => ({
          playerName: o.playerName ?? "",
          commander: o.commander,
          partnerCommander: o.partnerCommander ?? "",
          commanderValid: true,
          partnerValid: true,
        }))
      : [{ ...emptyOpponent }, { ...emptyOpponent }, { ...emptyOpponent }],
  );
  const [winnerType, setWinnerType] = useState<"me" | "opponent" | "draw">(
    game?.winnerType ?? "me",
  );
  const initialWinnerIndex = useMemo(() => {
    if (!game || game.winnerOpponentId == null) return "";
    const idx = game.opponents.findIndex((o) => o.id === game.winnerOpponentId);
    return idx >= 0 ? String(idx) : "";
  }, [game]);
  const [winnerOpponentIndex, setWinnerOpponentIndex] =
    useState<string>(initialWinnerIndex);
  const [winTurn, setWinTurn] = useState<string>(
    game?.winTurn != null ? String(game.winTurn) : "",
  );
  const [winType, setWinType] = useState<string>(game?.winType ?? "");
  const [notes, setNotes] = useState<string>(game?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedDeck = useMemo(
    () => decks.find((d) => String(d.id) === deckId),
    [decks, deckId],
  );

  function updateOpponent(i: number, patch: Partial<OpponentRow>) {
    setOpponents((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );
  }
  function addOpponent() {
    setOpponents((prev) => [...prev, { ...emptyOpponent }]);
  }
  function removeOpponent(i: number) {
    setOpponents((prev) => prev.filter((_, idx) => idx !== i));
    setWinnerOpponentIndex("");
  }

  function applyGroup(group: PlayerGroupView) {
    setOpponents(
      group.playerNames.map((playerName) => ({
        playerName,
        commander: "",
        partnerCommander: "",
        commanderValid: true,
        partnerValid: true,
      })),
    );
    setWinnerOpponentIndex("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filledOpponents = opponents
      .map((o, idx) => ({ ...o, _idx: idx }))
      .filter((o) => o.commander.trim().length > 0);

    // Enforce that entered cards are real Scryfall cards.
    if (filledOpponents.some((o) => !o.commanderValid)) {
      setError("Ein Gegner-Commander ist keine gültige Karte.");
      return;
    }
    if (
      filledOpponents.some(
        (o) => o.partnerCommander.trim().length > 0 && !o.partnerValid,
      )
    ) {
      setError("Ein Gegner-Partner ist keine gültige Karte.");
      return;
    }

    let winnerIndex: number | null = null;
    if (winnerType === "opponent" && winnerOpponentIndex !== "") {
      const origIdx = Number(winnerOpponentIndex);
      const pos = filledOpponents.findIndex((o) => o._idx === origIdx);
      winnerIndex = pos >= 0 ? pos : null;
    }
    if (winnerType === "opponent" && winnerIndex === null) {
      setError("Bitte den siegreichen Gegner auswählen (mit Commander).");
      return;
    }

    const input = {
      deckId: Number(deckId),
      playedAt: playedAt || null,
      bracket: bracket === "" ? null : Number(bracket),
      winnerType,
      winnerOpponentIndex: winnerIndex,
      winTurn: winTurn === "" ? null : Number(winTurn),
      winType: winType === "" ? null : winType,
      notes,
      opponents: filledOpponents.map((o) => ({
        playerName: o.playerName,
        commander: o.commander,
        partnerCommander: o.partnerCommander,
      })),
    };

    startTransition(async () => {
      const result = editing
        ? await updateGame(game!.id, input)
        : await createGame(input);
      if (result && !result.ok)
        setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  if (decks.length === 0) {
    return (
      <div className="card text-center text-muted">
        Du brauchst zuerst mindestens ein Deck.{" "}
        <a href="/decks/new" className="link">
          Jetzt anlegen
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Setup */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Setup</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deck" className="label">
              Mein Deck
            </label>
            <select
              id="deck"
              className="select"
              value={deckId}
              onChange={(e) => {
                setDeckId(e.target.value);
                const d = decks.find((x) => String(x.id) === e.target.value);
                if (d?.bracket) setBracket(String(d.bracket));
              }}
              required
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="playedAt" className="label">
              Datum
            </label>
            <input
              id="playedAt"
              type="date"
              className="input"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bracket" className="label">
              Bracket (1–5)
            </label>
            <select
              id="bracket"
              className="select"
              value={bracket}
              onChange={(e) => setBracket(e.target.value)}
            >
              <option value="">– keins –</option>
              {[1, 2, 3, 4, 5].map((b) => (
                <option key={b} value={b}>
                  Bracket {b}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedDeck ? (
          <p className="text-xs text-muted">
            Farbidentität: {selectedDeck.colorIdentity.join("") || "farblos"}
          </p>
        ) : null}
      </div>

      {/* Opponents */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Gegner</h2>
          <div className="flex items-center gap-2">
            {groups && groups.length > 0 ? (
              <select
                className="select w-[200px]"
                value=""
                onChange={(e) => {
                  const group = groups.find(
                    (g) => String(g.id) === e.target.value,
                  );
                  if (group) applyGroup(group);
                  e.target.value = "";
                }}
              >
                <option value="">Gruppe laden…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button type="button" className="btn-ghost" onClick={addOpponent}>
              + Gegner
            </button>
          </div>
        </div>
        <p className="text-xs text-muted">
          Gegnerische Commander mit Scryfall-Vorschlägen. Leere Zeilen werden
          ignoriert.
        </p>
        <div className="space-y-3">
          {opponents.map((o, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border divider-soft p-3 sm:grid-cols-[1fr_1.4fr_1.4fr_auto]"
            >
              <input
                className="input"
                placeholder="Spieler (optional)"
                value={o.playerName}
                onChange={(e) =>
                  updateOpponent(i, { playerName: e.target.value })
                }
              />
              <CardInput
                value={o.commander}
                onChange={(v) => updateOpponent(i, { commander: v })}
                placeholder="Commander"
                ariaLabel={`Gegner ${i + 1} Commander`}
                onResolved={(card) =>
                  setOpponents((prev) =>
                    prev.map((row, idx) =>
                      idx === i
                        ? {
                            ...row,
                            commanderValid: card
                              ? true
                              : row.commander.trim() === "",
                          }
                        : row,
                    ),
                  )
                }
              />
              <CardInput
                value={o.partnerCommander}
                onChange={(v) => updateOpponent(i, { partnerCommander: v })}
                placeholder="Partner (optional)"
                ariaLabel={`Gegner ${i + 1} Partner`}
                onResolved={(card) =>
                  setOpponents((prev) =>
                    prev.map((row, idx) =>
                      idx === i
                        ? {
                            ...row,
                            partnerValid: card
                              ? true
                              : row.partnerCommander.trim() === "",
                          }
                        : row,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-400"
                onClick={() => removeOpponent(i)}
                aria-label="Gegner entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Ergebnis</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="winnerType" className="label">
              Wer hat gewonnen?
            </label>
            <select
              id="winnerType"
              className="select"
              value={winnerType}
              onChange={(e) =>
                setWinnerType(e.target.value as typeof winnerType)
              }
            >
              {(["me", "opponent", "draw"] as const).map((w) => (
                <option key={w} value={w}>
                  {WINNER_TYPE_LABELS[w]}
                </option>
              ))}
            </select>
          </div>

          {winnerType === "opponent" ? (
            <div>
              <label htmlFor="winnerOpp" className="label">
                Siegreicher Gegner
              </label>
              <select
                id="winnerOpp"
                className="select"
                value={winnerOpponentIndex}
                onChange={(e) => setWinnerOpponentIndex(e.target.value)}
              >
                <option value="">– auswählen –</option>
                {opponents.map((o, i) =>
                  o.commander.trim() ? (
                    <option key={i} value={i}>
                      {o.commander}
                      {o.playerName ? ` (${o.playerName})` : ""}
                    </option>
                  ) : null,
                )}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="winTurn" className="label">
              Sieg-Turn (optional)
            </label>
            <input
              id="winTurn"
              type="number"
              min={1}
              className="input"
              value={winTurn}
              onChange={(e) => setWinTurn(e.target.value)}
              placeholder="z. B. 7"
            />
          </div>

          <div>
            <label htmlFor="winType" className="label">
              Art des Siegs
            </label>
            <select
              id="winType"
              className="select"
              value={winType}
              onChange={(e) => setWinType(e.target.value)}
            >
              <option value="">– unbekannt –</option>
              {WIN_TYPES.map((w) => (
                <option key={w} value={w}>
                  {WIN_TYPE_LABELS[w as WinType]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="label">
            Notizen (optional)
          </label>
          <textarea
            id="notes"
            className="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Was ist passiert? Key-Cards, Politik, …"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending
            ? "Speichern…"
            : editing
              ? "Änderungen speichern"
              : "Spiel speichern"}
        </button>
        <a href="/games" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
