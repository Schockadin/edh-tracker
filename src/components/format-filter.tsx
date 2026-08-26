"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { FormatView } from "@/lib/types";

/**
 * Format filter used on the dashboard and deck list. Drives the `format` query
 * param (`all` or a format id); navigation re-renders the server component,
 * which recomputes stats/decks for the chosen format.
 */
export function FormatFilter({
  formats,
  value,
}: {
  formats: FormatView[];
  value: string; // "all" or a format id as string
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams);
    params.set("format", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <label htmlFor="format-filter" className="label">
        Format
      </label>
      <select
        id="format-filter"
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">Alle Formate</option>
        {formats.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
