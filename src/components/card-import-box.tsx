"use client";

import { useRef, useState, useTransition } from "react";

export interface ImportOutcome {
  ok: boolean;
  added?: number;
  unresolved?: string[];
  error?: string;
}

/**
 * Paste-or-upload card import box. Accepts plain-text decklists or CSV exports,
 * hands the raw content to `onImport` and shows the outcome (added count +
 * unresolvable names).
 */
export function CardImportBox({
  onImport,
  submitLabel = "Importieren",
}: {
  onImport: (content: string) => Promise<ImportOutcome>;
  submitLabel?: string;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImportOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      const r = await onImport(text);
      setResult(r);
      if (r.ok) setText("");
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        className="input min-h-32 font-mono text-sm"
        placeholder={"1 Sol Ring\n1 Arcane Signet\n1 Command Tower\n…\n\noder eine CSV (ManaBox / Moxfield) einfügen"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={pending || !text.trim()}
        >
          {pending ? "Importiere…" : submitLabel}
        </button>
        <label className="btn-ghost cursor-pointer">
          Datei wählen (.txt / .csv)
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      </div>

      {result ? (
        result.ok ? (
          <div className="text-sm">
            <p className="accent">{result.added ?? 0} Karten importiert.</p>
            {result.unresolved && result.unresolved.length > 0 ? (
              <p className="mt-1 text-muted">
                Nicht gefunden ({result.unresolved.length}):{" "}
                {result.unresolved.join(", ")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-red-500">
            {result.error ?? "Import fehlgeschlagen."}
          </p>
        )
      ) : null}
    </div>
  );
}
