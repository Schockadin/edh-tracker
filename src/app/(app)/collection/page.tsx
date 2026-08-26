import type { Metadata } from "next";

import { CollectionManager } from "@/components/collection-manager";
import { SectionHeader } from "@/components/ui";
import { getCollectionCards } from "@/db/queries";

export const metadata: Metadata = { title: "Sammlung" };

export default async function CollectionPage() {
  const cards = await getCollectionCards();

  return (
    <div className="space-y-6">
      <SectionHeader title="Sammlung" />
      <p className="text-sm text-muted">
        Erfasse deine gesamte Sammlung per Einfügen oder Datei-Upload (.txt /
        .csv). Ob eine Karte <strong>verbaut</strong> oder{" "}
        <strong>verfügbar</strong> ist, wird automatisch aus deinen Decklisten
        abgeleitet.
      </p>
      <CollectionManager cards={cards} />
    </div>
  );
}
