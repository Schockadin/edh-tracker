"use client";

import { useTransition } from "react";

import { deleteGame } from "@/app/(app)/games/actions";

export function DeleteGameButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="text-xs text-red-400 hover:text-red-300"
      disabled={pending}
      onClick={() => {
        if (confirm("Dieses Spiel wirklich löschen?")) {
          startTransition(async () => {
            await deleteGame(id);
          });
        }
      }}
    >
      Löschen
    </button>
  );
}
