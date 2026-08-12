/**
 * Loads environment variables for standalone scripts (drizzle-kit, the migrate
 * runner). Next.js loads `.env.local` / `.env` on its own, but tools run via
 * tsx / drizzle-kit do not — so `DATABASE_URL` would otherwise be undefined.
 *
 * Precedence matches Next.js: real environment variables win over `.env.local`,
 * which wins over `.env`. Nothing already set is overwritten. No dependency.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseAndApply(file: string) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;

  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    if (key in process.env) continue; // never override existing values

    let value = match[2].trim();
    // Strip surrounding matching quotes; unescape \n inside double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, "\n");
    }
    process.env[key] = value;
  }
}

// `.env.local` first so it wins over `.env` (real env already wins over both).
parseAndApply(".env.local");
parseAndApply(".env");
