/**
 * Resolve the active format filter from the `format` search param and the
 * configured default. Returns the select's current value (`"all"` or an id
 * string) and the numeric format id to filter by (`null` = show all formats).
 */
export function resolveFormatFilter(
  param: string | undefined,
  defaultFormatId: number | null,
): { value: string; formatId: number | null } {
  if (param === "all") return { value: "all", formatId: null };

  if (param != null && param !== "") {
    const id = Number(param);
    if (Number.isInteger(id) && id > 0) {
      return { value: String(id), formatId: id };
    }
  }

  // No (valid) param → fall back to the configured default.
  if (defaultFormatId == null) return { value: "all", formatId: null };
  return { value: String(defaultFormatId), formatId: defaultFormatId };
}
