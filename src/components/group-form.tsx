"use client";

import { useState, useTransition } from "react";

import { createGroup, updateGroup } from "@/app/(app)/settings/groups/actions";
import type { PlayerGroupView } from "@/lib/types";

export function GroupForm({ group }: { group?: PlayerGroupView }) {
  const editing = Boolean(group);
  const [name, setName] = useState(group?.name ?? "");
  const [playerNames, setPlayerNames] = useState<string[]>(
    group && group.playerNames.length > 0 ? group.playerNames : ["", ""],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateName(i: number, value: string) {
    setPlayerNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }
  function addName() {
    setPlayerNames((prev) => [...prev, ""]);
  }
  function removeName(i: number) {
    setPlayerNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleaned = playerNames.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setError("Mindestens ein Spielername ist erforderlich.");
      return;
    }

    const input = { name, playerNames: cleaned };
    startTransition(async () => {
      const result = editing
        ? await updateGroup(group!.id, input)
        : await createGroup(input);
      if (result && !result.ok)
        setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label htmlFor="groupName" className="label">
            Gruppenname
          </label>
          <input
            id="groupName"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Freitagsrunde"
            required
          />
        </div>

        <div>
          <span className="label">Spieler</span>
          <div className="space-y-2">
            {playerNames.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  value={n}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Spieler ${i + 1}`}
                />
                <button
                  type="button"
                  className="text-xs text-red-500 hover:text-red-400"
                  onClick={() => removeName(i)}
                  aria-label="Spieler entfernen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-2" onClick={addName}>
            + Spieler
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending
            ? "Speichern…"
            : editing
              ? "Änderungen speichern"
              : "Gruppe speichern"}
        </button>
        <a href="/groups" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
