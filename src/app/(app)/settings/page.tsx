import type { Metadata } from "next";
import Link from "next/link";

import { FormatActions } from "@/components/format-actions";
import { GroupActions } from "@/components/group-actions";
import { SectionHeader } from "@/components/ui";
import { getFormats, getPlayerGroups } from "@/db/queries";
import { CONSTRUCTION_TYPE_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const [formats, groups] = await Promise.all([
    getFormats(),
    getPlayerGroups(),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeader title="Einstellungen" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Formate</h2>
          <Link href="/settings/formats/new" className="btn-primary">
            + Neues Format
          </Link>
        </div>
        {formats.length === 0 ? (
          <div className="card text-center text-muted">
            Noch keine Formate angelegt.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {formats.map((f) => (
              <div key={f.id} className="card flex flex-col gap-2">
                <h3 className="font-semibold">{f.name}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge">
                    {CONSTRUCTION_TYPE_LABELS[f.constructionType]}
                  </span>
                  <span className="badge">
                    {f.multiplayer ? "Multiplayer" : "1 vs. 1"}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between border-t divider-soft pt-3">
                  <Link
                    href={`/settings/formats/${f.id}/edit`}
                    className="text-xs text-soft hover:text-strong"
                  >
                    Bearbeiten
                  </Link>
                  <FormatActions id={f.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Spielergruppen</h2>
          <Link href="/settings/groups/new" className="btn-primary">
            + Neue Gruppe
          </Link>
        </div>
        {groups.length === 0 ? (
          <div className="card text-center text-muted">
            Noch keine Gruppen angelegt. Gruppen bündeln Mitspieler-Namen für
            die Schnellauswahl beim Spiel-Erfassen.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="card flex flex-col gap-2">
                <h3 className="font-semibold">{g.name}</h3>
                <p className="text-sm text-muted">{g.playerNames.join(", ")}</p>
                <div className="mt-auto flex items-center justify-between border-t divider-soft pt-3">
                  <Link
                    href={`/settings/groups/${g.id}/edit`}
                    className="text-xs text-soft hover:text-strong"
                  >
                    Bearbeiten
                  </Link>
                  <GroupActions id={g.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
