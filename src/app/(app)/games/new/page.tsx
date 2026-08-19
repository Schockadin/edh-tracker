import type { Metadata } from "next";

import { GameForm } from "@/components/game-form";
import { SectionHeader } from "@/components/ui";
import { getDecks, getPlayerGroups } from "@/db/queries";

export const metadata: Metadata = { title: "Spiel erfassen" };

export default async function NewGamePage() {
  const [decks, groups] = await Promise.all([
    getDecks().then((all) =>
      all
        .filter((d) => !d.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),
    getPlayerGroups(),
  ]);
  return (
    <div className="space-y-6">
      <SectionHeader title="Spiel erfassen" />
      <GameForm decks={decks} groups={groups} />
    </div>
  );
}
