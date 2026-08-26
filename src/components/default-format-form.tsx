"use client";

import { useState, useTransition } from "react";

import { setDefaultFormat } from "@/app/(app)/settings/actions";
import type { FormatView } from "@/lib/types";

/**
 * Settings control for the default format shown on the dashboard and deck list.
 */
export function DefaultFormatForm({
  formats,
  defaultFormatId,
}: {
  formats: FormatView[];
  defaultFormatId: number | null;
}) {
  const [value, setValue] = useState<string>(
    defaultFormatId != null ? String(defaultFormatId) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setDefaultFormat({ defaultFormatId: Number(value) });
      if (result && !result.ok) {
        setError(result.error ?? "Fehler beim Speichern.");
      } else {
        setSaved(true);
      }
    });
  }

  if (formats.length === 0) {
    return (
      <div className="card text-center text-muted">
        Lege zuerst ein Format an.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="defaultFormat" className="label">
          Standard-Format (Dashboard &amp; Deckliste)
        </label>
        <select
          id="defaultFormat"
          className="select"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
        >
          {formats.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Speichern…" : "Speichern"}
      </button>
      {saved ? <p className="text-sm accent">Gespeichert.</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </form>
  );
}
