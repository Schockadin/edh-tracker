"use client";

import { useState, useTransition } from "react";

import {
  createFormat,
  updateFormat,
} from "@/app/(app)/settings/formats/actions";
import type { ConstructionType } from "@/db/schema";
import { CONSTRUCTION_TYPE_LABELS, type FormatView } from "@/lib/types";
import { CONSTRUCTION_TYPES } from "@/lib/validation";

export function FormatForm({ format }: { format?: FormatView }) {
  const editing = Boolean(format);
  const [name, setName] = useState(format?.name ?? "");
  const [constructionType, setConstructionType] = useState<ConstructionType>(
    format?.constructionType ?? "constructed",
  );
  const [multiplayer, setMultiplayer] = useState(format?.multiplayer ?? false);
  const [hasCommander, setHasCommander] = useState(
    format?.hasCommander ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = { name, constructionType, multiplayer, hasCommander };
    startTransition(async () => {
      const result = editing
        ? await updateFormat(format!.id, input)
        : await createFormat(input);
      if (result && !result.ok)
        setError(result.error ?? "Fehler beim Speichern.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label htmlFor="formatName" className="label">
            Name
          </label>
          <input
            id="formatName"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Commander, Standard, Draft"
            required
          />
        </div>

        <div>
          <label htmlFor="constructionType" className="label">
            Auswahl
          </label>
          <select
            id="constructionType"
            className="select"
            value={constructionType}
            onChange={(e) =>
              setConstructionType(e.target.value as ConstructionType)
            }
          >
            {CONSTRUCTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONSTRUCTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={multiplayer}
            onChange={(e) => setMultiplayer(e.target.checked)}
          />
          Multiplayer
        </label>

        <label className="flex cursor-pointer items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={hasCommander}
            onChange={(e) => setHasCommander(e.target.checked)}
          />
          Hat Commander
        </label>
        <p className="text-xs text-muted">
          Nur Commander-Formate haben einen Commander und ein Deck-Bild.
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending
            ? "Speichern…"
            : editing
              ? "Änderungen speichern"
              : "Format speichern"}
        </button>
        <a href="/settings" className="btn-ghost">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
