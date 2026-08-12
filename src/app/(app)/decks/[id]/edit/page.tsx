import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeckForm } from "@/components/deck-form";
import { SectionHeader } from "@/components/ui";
import { getDeck } from "@/db/queries";

export const metadata: Metadata = { title: "Deck bearbeiten" };

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deckId = Number(id);
  if (!Number.isInteger(deckId)) notFound();

  const deck = await getDeck(deckId);
  if (!deck) notFound();

  return (
    <div className="space-y-6">
      <SectionHeader title="Deck bearbeiten" />
      <DeckForm deck={deck} />
    </div>
  );
}
