"use client";

import { useTransition } from "react";

import { deleteGroup } from "@/app/(app)/groups/actions";

export function GroupActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="text-xs text-red-400 hover:text-red-300"
      disabled={pending}
      onClick={() => {
        if (confirm("Diese Gruppe wirklich löschen?")) {
          startTransition(async () => {
            await deleteGroup(id);
          });
        }
      }}
    >
      Löschen
    </button>
  );
}
