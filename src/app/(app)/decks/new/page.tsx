import type { Metadata } from "next";

import { DeckForm } from "@/components/deck-form";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Neues Deck" };

export default function NewDeckPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Neues Deck" />
      <DeckForm />
    </div>
  );
}
