import type { Metadata } from "next";

import { DeckForm } from "@/components/deck-form";
import { SectionHeader } from "@/components/ui";
import { getFormats } from "@/db/queries";

export const metadata: Metadata = { title: "Neues Deck" };

export default async function NewDeckPage() {
  const formats = await getFormats();
  return (
    <div className="space-y-6">
      <SectionHeader title="Neues Deck" />
      <DeckForm formats={formats} />
    </div>
  );
}
