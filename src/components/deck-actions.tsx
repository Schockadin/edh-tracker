"use client";

import { useTransition } from "react";

import { deleteDeck, setDeckArchived } from "@/app/(app)/decks/actions";

export function DeckActions({
  id,
  archived,
}: {
  id: number;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="text-xs text-slate-400 hover:text-slate-200"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setDeckArchived(id, !archived);
          })
        }
      >
        {archived ? "Reaktivieren" : "Archivieren"}
      </button>
      <button
        type="button"
        className="text-xs text-red-400 hover:text-red-300"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              "Dieses Deck wirklich löschen? Alle zugehörigen Spiele werden ebenfalls gelöscht.",
            )
          ) {
            startTransition(async () => {
              await deleteDeck(id);
            });
          }
        }}
      >
        Löschen
      </button>
    </div>
  );
}
