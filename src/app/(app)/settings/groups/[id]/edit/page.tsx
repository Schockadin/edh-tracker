import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GroupForm } from "@/components/group-form";
import { SectionHeader } from "@/components/ui";
import { getPlayerGroup } from "@/db/queries";

export const metadata: Metadata = { title: "Gruppe bearbeiten" };

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const group = await getPlayerGroup(groupId);
  if (!group) notFound();

  return (
    <div className="space-y-6">
      <SectionHeader title="Gruppe bearbeiten" />
      <GroupForm group={group} />
    </div>
  );
}
