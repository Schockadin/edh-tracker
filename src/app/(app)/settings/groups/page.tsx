import type { Metadata } from "next";
import Link from "next/link";

import { GroupActions } from "@/components/group-actions";
import { SectionHeader } from "@/components/ui";
import { getPlayerGroups } from "@/db/queries";

export const metadata: Metadata = { title: "Spielergruppen" };

export default async function GroupsPage() {
  const groups = await getPlayerGroups();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Spielergruppen"
        action={
          <Link href="/groups/new" className="btn-primary">
            + Neue Gruppe
          </Link>
        }
      />

      {groups.length === 0 ? (
        <div className="card text-center text-muted">
          Noch keine Gruppen angelegt. Gruppen bündeln Mitspieler-Namen und
          lassen sich beim Spiel-Erfassen als Schnellauswahl nutzen.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="card flex flex-col gap-3">
              <h3 className="font-semibold">{group.name}</h3>
              <p className="text-sm text-muted">
                {group.playerNames.join(", ")}
              </p>
              <div className="mt-auto flex items-center justify-between border-t divider-soft pt-3">
                <Link
                  href={`/groups/${group.id}/edit`}
                  className="text-xs text-soft hover:text-strong"
                >
                  Bearbeiten
                </Link>
                <GroupActions id={group.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
