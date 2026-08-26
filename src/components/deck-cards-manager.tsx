"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { clearDeckList, importDeckList } from "@/app/(app)/decks/actions";
import type { CardView } from "@/lib/types";
import { CardImportBox } from "./card-import-box";
import { ColorPips } from "./ui";

export function DeckCardsManager({
  deckId,
  cards,
}: {
  deckId: number;
  cards: CardView[];
}) {
  const router = useRouter();
  const [clearing, startClear] = useTransition();
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-strong">
          Deckliste{" "}
          <span className="text-sm font-normal text-muted">
            ({total} Karten)
          </span>
        </h2>
        {cards.length > 0 ? (
          <button
            type="button"
            className="btn-ghost text-sm"
            disabled={clearing}
            onClick={() =>
              startClear(async () => {
                await clearDeckList(deckId);
                router.refresh();
              })
            }
          >
            Liste leeren
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Deckliste einfügen oder als Datei hochladen — die Kartendaten kommen von
        Scryfall. Ein Import ersetzt die bestehende Liste.
      </p>

      <CardImportBox
        submitLabel="Deckliste importieren"
        onImport={async (content) => {
          const result = await importDeckList(deckId, content);
          if (result.ok) router.refresh();
          return result;
        }}
      />

      {cards.length > 0 ? (
        <ul className="divide-y divider-soft rounded-lg border divider">
          {cards.map((c) => (
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
              {c.typeLine ? (
                <span className="hidden shrink-0 text-xs text-muted sm:block">
                  {c.typeLine}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
