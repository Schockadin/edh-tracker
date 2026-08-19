"use client";

import { useTransition } from "react";

import { deleteFormat } from "@/app/(app)/settings/formats/actions";

export function FormatActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="text-xs text-red-400 hover:text-red-300"
      disabled={pending}
      onClick={() => {
        if (confirm("Dieses Format wirklich löschen?")) {
          startTransition(async () => {
            const result = await deleteFormat(id);
            if (result && !result.ok) alert(result.error);
          });
        }
      }}
    >
      Löschen
    </button>
  );
}
