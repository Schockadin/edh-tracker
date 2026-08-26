"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  deleteCollectionCard,
  importCollection,
  setCollectionCardZone,
} from "@/app/(app)/collection/actions";
import type { CardZone } from "@/db/schema";
import { CARD_ZONE_LABELS, type CollectionCardView } from "@/lib/types";
import { CardImportBox } from "./card-import-box";
import { ColorPips } from "./ui";

type Filter = "all" | CardZone;

export function CollectionManager({ cards }: { cards: CollectionCardView[] }) {
  const router = useRouter();
  const [importZone, setImportZone] = useState<CardZone>("free");
  const [filter, setFilter] = useState<Filter>("all");
  const [, startTransition] = useTransition();

  const totals = useMemo(() => {
    let free = 0;
    let used = 0;
    for (const c of cards) {
      if (c.zone === "free") free += c.quantity;
      else used += c.quantity;
    }
    return { free, used, all: free + used };
  }, [cards]);

  const visible = cards.filter((c) => filter === "all" || c.zone === filter);

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
        <div className="flex items-center gap-2 text-sm">
          <span className="label mb-0">Als</span>
          {(["free", "used"] as CardZone[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setImportZone(z)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                importZone === z
                  ? "bg-arcane-600 text-white"
                  : "text-soft hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {CARD_ZONE_LABELS[z]}
            </button>
          ))}
        </div>
        <CardImportBox
          submitLabel="In Sammlung importieren"
          onImport={async (content) => {
            const result = await importCollection(content, importZone);
            if (result.ok) router.refresh();
            return result;
          }}
        />
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            {(
              [
                ["all", `Alle (${totals.all})`],
                ["free", `${CARD_ZONE_LABELS.free} (${totals.free})`],
                ["used", `${CARD_ZONE_LABELS.used} (${totals.used})`],
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
                <span className="flex-1 text-strong">
                  {c.name}
                  {c.zone === "used" && c.deckName ? (
                    <span className="text-muted"> · {c.deckName}</span>
                  ) : null}
                </span>
                {c.colorIdentity.length > 0 ? (
                  <ColorPips colors={c.colorIdentity} />
                ) : null}
                <button
                  type="button"
                  className="badge"
                  title="Zone umschalten"
                  onClick={() =>
                    mutate(() =>
                      setCollectionCardZone(
                        c.id,
                        c.zone === "free" ? "used" : "free",
                      ),
                    )
                  }
                >
                  {CARD_ZONE_LABELS[c.zone]}
                </button>
                <button
                  type="button"
                  className="text-muted hover:text-red-500"
                  title="Entfernen"
                  onClick={() => mutate(() => deleteCollectionCard(c.id))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
