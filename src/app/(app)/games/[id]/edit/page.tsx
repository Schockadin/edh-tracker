import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameForm } from "@/components/game-form";
import { SectionHeader } from "@/components/ui";
import { getDecks, getGame, getFormats } from "@/db/queries";

export const metadata: Metadata = { title: "Spiel bearbeiten" };

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) notFound();

  const [game, formats, decks] = await Promise.all([
    getGame(gameId),
    getFormats(),
    getDecks(),
  ]);
  if (!game) notFound();

  // Auch archivierte Decks anzeigen, falls das Spiel eines referenziert.
  const sortedDecks = decks
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SectionHeader title="Spiel bearbeiten" />
      <GameForm decks={sortedDecks} game={game} formats={formats} />
    </div>
  );
}
