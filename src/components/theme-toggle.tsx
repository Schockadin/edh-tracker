"use client";

import { useTheme, type Theme } from "./theme";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Hell", icon: "☀️" },
  { value: "system", label: "System", icon: "🖥️" },
  { value: "dark", label: "Dunkel", icon: "🌙" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className="surface-2 inline-flex items-center rounded-lg border divider p-0.5"
      role="group"
      aria-label="Farbschema"
    >
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            title={o.label}
            className={`rounded-md px-2 py-1 text-xs transition ${
              active
                ? "bg-arcane-600 text-white"
                : "text-muted hover:text-strong"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
