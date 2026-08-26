/**
 * Parsing of pasted / uploaded card lists into `{ name, quantity }` entries.
 * Supports plain-text decklists (Moxfield / Archidekt / ManaBox exports) and
 * CSV exports. Pure functions — safe to use on the client and the server.
 */

export interface CardLine {
  name: string;
  quantity: number;
}

const SECTION_HEADERS = new Set([
  "deck",
  "commander",
  "commanders",
  "companion",
  "sideboard",
  "maybeboard",
  "considering",
  "tokens",
  "token",
  "planes",
]);

/** Strip set codes, collector numbers, foil markers and category tags. */
function cleanName(raw: string): string {
  let s = raw.trim();
  // Archidekt category/tag suffixes: ^Have^, #tag, [Category].
  s = s.replace(/\s*\^[^^]*\^/g, "");
  s = s.replace(/\s*\[[^\]]*\]/g, "");
  // Foil / etched markers like *F* or *E*.
  s = s.replace(/\s*\*[A-Za-z]\*/g, "");
  // Trailing "(SET) 123" or "(SET)".
  s = s.replace(/\s*\([A-Za-z0-9]{2,6}\)\s*[A-Za-z0-9-]*\s*$/g, "");
  // Trailing bare collector like " 123" is ambiguous (could be part of a name)
  // so we leave it; Scryfall resolution tolerates the canonical name anyway.
  return s.replace(/\s{2,}/g, " ").trim();
}

/** Parse a plain-text decklist. */
export function parseDecklistText(text: string): CardLine[] {
  const out: CardLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("//") || line.startsWith("#")) continue;
    // Section header on its own line (no leading quantity).
    if (SECTION_HEADERS.has(line.toLowerCase())) continue;

    const match = /^(\d+)\s*[xX]?\s+(.+)$/.exec(line);
    const quantity = match ? parseInt(match[1], 10) : 1;
    const namePart = match ? match[2] : line;
    const name = cleanName(namePart);
    if (name) out.push({ name, quantity: quantity > 0 ? quantity : 1 });
  }
  return aggregate(out);
}

/** Split one CSV line into fields, honouring double-quoted values. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

const QTY_HEADERS = new Set(["count", "quantity", "qty", "amount", "number"]);

/** Parse a CSV export (ManaBox / Moxfield / Archidekt). */
export function parseCsv(text: string): CardLine[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Prefer an exact "name" column, else the first header containing "name".
  let nameIdx = headers.indexOf("name");
  if (nameIdx === -1) nameIdx = headers.findIndex((h) => h.includes("name"));
  if (nameIdx === -1) return [];

  const qtyIdx = headers.findIndex((h) => QTY_HEADERS.has(h));

  const out: CardLine[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    const name = cleanName(fields[nameIdx] ?? "");
    if (!name) continue;
    const quantity = qtyIdx >= 0 ? parseInt(fields[qtyIdx] ?? "1", 10) : 1;
    out.push({ name, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 });
  }
  return aggregate(out);
}

function firstNonEmptyLine(text: string): string {
  for (const l of text.split(/\r?\n/)) {
    if (l.trim()) return l;
  }
  return "";
}

/** Heuristic: does this look like a CSV export rather than a plain decklist? */
export function looksLikeCsv(text: string): boolean {
  const first = firstNonEmptyLine(text);
  if (!first.includes(",")) return false;
  const headers = splitCsvLine(first).map((h) => h.trim().toLowerCase());
  return headers.length >= 2 && headers.some((h) => h.includes("name"));
}

/** Auto-detect the format and parse. */
export function parseCardImport(content: string): CardLine[] {
  return looksLikeCsv(content) ? parseCsv(content) : parseDecklistText(content);
}

/** Sum quantities of duplicate names (case-insensitive), keep first spelling. */
function aggregate(lines: CardLine[]): CardLine[] {
  const byName = new Map<string, CardLine>();
  for (const line of lines) {
    const key = line.name.toLowerCase();
    const existing = byName.get(key);
    if (existing) existing.quantity += line.quantity;
    else byName.set(key, { ...line });
  }
  return Array.from(byName.values());
}
