import type { Metadata } from "next";

import { GameForm } from "@/components/game-form";
import { SectionHeader } from "@/components/ui";
import { getDecks, getFormats, getPlayerGroups } from "@/db/queries";

export const metadata: Metadata = { title: "Spiel erfassen" };

export default async function NewGamePage() {
  const [decks, formats, groups] = await Promise.all([
    getDecks(),
    getFormats(),
    getPlayerGroups(),
  ]);
  const activeDecks = decks
    .filter((d) => !d.archived)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SectionHeader title="Spiel erfassen" />
      <GameForm decks={activeDecks} formats={formats} groups={groups} />
    </div>
  );
}
