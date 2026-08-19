import type { Metadata } from "next";

import { GroupForm } from "@/components/group-form";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Neue Gruppe" };

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Neue Gruppe" />
      <GroupForm />
    </div>
  );
}
