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

/** Matches Google Sheet template columns + Maps URL */
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
  "trademarkStatus",
  "trademarkMatch",
  "source",
  "sourceUrl",
  "lastChecked",
  "recordId",
  "mapsUrl",
];

export const SHEET_HEADER_LABELS = [
  "Company Name",
  "State",
  "Entity Type",
  "Entity Number",
  "Status",
  "Formation Date",
  "Principal Address",
  "City",
  "ZIP",
  "Registered Agent",
  "Website",
  "Business Email",
  "Business Phone",
  "Trademark Status",
  "Trademark Match",
  "Source",
  "Source URL",
  "Last Checked",
  "Record ID",
  "Google Maps",
];
