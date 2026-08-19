import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormatForm } from "@/components/format-form";
import { SectionHeader } from "@/components/ui";
import { getFormat } from "@/db/queries";

export const metadata: Metadata = { title: "Format bearbeiten" };

export default async function EditFormatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formatId = Number(id);
  if (!Number.isInteger(formatId)) notFound();

  const format = await getFormat(formatId);
  if (!format) notFound();

  return (
    <div className="space-y-6">
      <SectionHeader title="Format bearbeiten" />
      <FormatForm format={format} />
    </div>
  );
}
