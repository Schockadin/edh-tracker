import type { Metadata } from "next";

import { FormatForm } from "@/components/format-form";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Neues Format" };

export default function NewFormatPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Neues Format" />
      <FormatForm />
    </div>
  );
}
