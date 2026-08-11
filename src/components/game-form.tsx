"use client";

import { useMemo, useState, useTransition } from "react";

import { createGame } from "@/app/(app)/games/actions";
import type { WinType } from "@/db/schema";
import {
  WINNER_TYPE_LABELS,
  WIN_TYPE_LABELS,
  type DeckView,
} from "@/lib/types";
import { WIN_TYPES } from "@/lib/validation";

interface OpponentRow {
  playerName: string;
  commander: string;
  partnerCommander: string;
}

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const emptyOpponent: OpponentRow = {
  playerName: "",
  commander: "",
  partnerCommander: "",
};

export function GameForm({ decks }: { decks: DeckView[] }) {
  const [deckId, setDeckId] = useState<string>(
    decks[0] ? String(decks[0].id) : "",
  );
  const [playedAt, setPlayedAt] = useState<string>(nowLocal());
  const [bracket, setBracket] = useState<string>("");
  const [turnCount, setTurnCount] = useState<string>("");
  const [opponents, setOpponents] = useState<OpponentRow[]>([
    { ...emptyOpponent },
    { ...emptyOpponent },
    { ...emptyOpponent },
  ]);
  const [winnerType, setWinnerType] = useState<"me" | "opponent" | "draw">(
    "me",
  );
  const [winnerOpponentIndex, setWinnerOpponentIndex] = useState<string>("");
  const [winTurn, setWinTurn] = useState<string>("");
  const [winType, setWinType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Only send opponent rows that actually have a commander.
    const filledOpponents = opponents
      .map((o, idx) => ({ ...o, _idx: idx }))
      .filter((o) => o.commander.trim().length > 0);

    // Map the selected winner (by original row index) to its new position.
    let winnerIndex: number | null = null;
    if (winnerType === "opponent" && winnerOpponentIndex !== "") {
      const origIdx = Number(winnerOpponentIndex);
      const pos = filledOpponents.findIndex((o) => o._idx === origIdx);
      winnerIndex = pos >= 0 ? pos : null;
    }

    const input = {
      deckId: Number(deckId),
      playedAt: playedAt || null,
      bracket: bracket === "" ? null : Number(bracket),
      turnCount: turnCount === "" ? null : Number(turnCount),
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

    if (winnerType === "opponent" && winnerIndex === null) {
      setError("Bitte den siegreichen Gegner auswählen (mit Commander).");
      return;
    }

    startTransition(async () => {
      const result = await createGame(input);
      if (result && !result.ok)
        setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  if (decks.length === 0) {
    return (
      <div className="card text-center text-slate-400">
        Du brauchst zuerst mindestens ein Deck.{" "}
        <a href="/decks/new" className="text-arcane-300">
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
                const d = decks.find(
                  (x) => String(x.id) === e.target.value,
                );
                if (d?.bracket) setBracket(String(d.bracket));
              }}
              required
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.commander}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="playedAt" className="label">
              Datum &amp; Uhrzeit
            </label>
            <input
              id="playedAt"
              type="datetime-local"
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
          <div>
            <label htmlFor="turnCount" className="label">
              Anzahl Turns (optional)
            </label>
            <input
              id="turnCount"
              type="number"
              min={1}
              className="input"
              value={turnCount}
              onChange={(e) => setTurnCount(e.target.value)}
              placeholder="z. B. 8"
            />
          </div>
        </div>
        {selectedDeck ? (
          <p className="text-xs text-slate-400">
            Farbidentität: {selectedDeck.colorIdentity.join("") || "farblos"}
          </p>
        ) : null}
      </div>

      {/* Opponents */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Gegner</h2>
          <button type="button" className="btn-ghost" onClick={addOpponent}>
            + Gegner
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Trage die gegnerischen Commander ein. Leere Zeilen werden ignoriert.
        </p>
        <div className="space-y-3">
          {opponents.map((o, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-white/5 p-3 sm:grid-cols-[1fr_1.4fr_1.4fr_auto]"
            >
              <input
                className="input"
                placeholder="Spieler (optional)"
                value={o.playerName}
                onChange={(e) =>
                  updateOpponent(i, { playerName: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Commander"
                value={o.commander}
                onChange={(e) =>
                  updateOpponent(i, { commander: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Partner (optional)"
                value={o.partnerCommander}
                onChange={(e) =>
                  updateOpponent(i, { partnerCommander: e.target.value })
                }
              />
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300"
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

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Speichern…" : "Spiel speichern"}
        </button>
        <a href="/games" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
