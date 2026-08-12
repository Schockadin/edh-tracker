import { COLOR_HEX, PLATFORM_LABELS } from "@/lib/types";
import type { Platform } from "@/db/schema";

/** Small colored pips for a deck's color identity. */
export function ColorPips({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) {
    return <span className="text-xs text-subtle">farblos</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      {colors.map((c) => (
        <span
          key={c}
          title={c}
          className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-black/40"
          style={{ backgroundColor: COLOR_HEX[c] ?? "#94a3b8" }}
        />
      ))}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return <span className="badge">{PLATFORM_LABELS[platform]}</span>;
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  );
}
