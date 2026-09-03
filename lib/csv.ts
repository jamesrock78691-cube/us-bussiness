export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return "";

  const cols =
    columns ||
    Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );

  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = cols.join(",");
  const body = rows.map((row) => cols.map((c) => escape(row[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export const EXPORT_COLUMNS = [
  "companyName",
  "state",
  "entityType",
  "entityNumber",
  "status",
  "formationDate",
  "principalAddress",
  "city",
  "zip",
  "registeredAgent",
  "website",
  "businessEmail",
  "businessPhone",
  "source",
  "recordId",
];
