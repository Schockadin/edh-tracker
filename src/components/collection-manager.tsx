"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  deleteCollectionCard,
  importCollection,
} from "@/app/(app)/collection/actions";
import type { CollectionCardView } from "@/lib/types";
import { CardImportBox } from "./card-import-box";
import { ColorPips } from "./ui";

type Filter = "all" | "used" | "free";

export function CollectionManager({ cards }: { cards: CollectionCardView[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [, startTransition] = useTransition();

  const totals = useMemo(() => {
    let free = 0;
    let used = 0;
    for (const c of cards) {
      free += c.freeQty;
      used += c.usedQty;
    }
    return { free, used, all: free + used };
  }, [cards]);

  const visible = cards.filter(
    (c) =>
      filter === "all" ||
      (filter === "used" ? c.usedQty > 0 : c.freeQty > 0),
  );

  function mutate(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-strong">Karten importieren</h2>
        <p className="text-xs text-muted">
          Ob eine Karte <strong>verbaut</strong> oder <strong>verfügbar</strong>{" "}
          ist, wird automatisch aus deinen Decklisten abgeleitet.
        </p>
        <CardImportBox
          submitLabel="In Sammlung importieren"
          onImport={async (content) => {
            const result = await importCollection(content);
            if (result.ok) router.refresh();
            return result;
          }}
        />
      </div>

      <div className="card space-y-4">
        <div className="flex gap-1">
          {(
            [
              ["all", `Alle (${totals.all})`],
              ["free", `Verfügbar (${totals.free})`],
              ["used", `Verbaut (${totals.used})`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === key
                  ? "bg-arcane-600 text-white"
                  : "text-soft hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-muted">Keine Karten.</p>
        ) : (
          <ul className="divide-y divider-soft rounded-lg border divider">
            {visible.map((c) => (
              <li
                key={c.uuid}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="w-8 shrink-0 text-right font-mono text-muted">
                  {c.quantity}×
                </span>
                <span className="flex-1 text-strong">{c.name}</span>
                {c.colorIdentity.length > 0 ? (
                  <ColorPips colors={c.colorIdentity} />
                ) : null}
                <span className="shrink-0 text-xs text-muted">
                  {c.usedQty > 0 ? (
                    <span className="badge mr-1">{c.usedQty} verbaut</span>
                  ) : null}
                  {c.freeQty > 0 ? (
                    <span className="badge">{c.freeQty} frei</span>
                  ) : null}
                </span>
                {c.virtual ? (
                  <span
                    className="text-xs text-muted"
                    title="Aus einer Deckliste – kein eigener Sammlungseintrag"
                  >
                    aus Deck
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-muted hover:text-red-500"
                    title="Entfernen"
                    onClick={() => mutate(() => deleteCollectionCard(c.id))}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
