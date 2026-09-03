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

  // Human-readable headers matching Google Sheet / Excel template
  const headerLabels = cols.map((c) => COLUMN_LABELS[c] || c);
  const header = headerLabels.join(",");
  const body = rows.map((row) => cols.map((c) => escape(row[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

/** Internal keys → Excel / Google Sheet column titles */
export const COLUMN_LABELS: Record<string, string> = {
  companyName: "Company Name",
  state: "State",
  entityType: "Entity Type",
  entityNumber: "Entity Number",
  status: "Status",
  formationDate: "Formation Date",
  principalAddress: "Principal Address",
  city: "City",
  zip: "ZIP",
  registeredAgent: "Registered Agent",
  website: "Website",
  businessEmail: "Business Email",
  businessPhone: "Business Phone",
  trademarkStatus: "Trademark Status",
  trademarkMatch: "Trademark Match",
  source: "Source",
  sourceUrl: "Source URL",
  lastChecked: "Last Checked",
  recordId: "Record ID",
  mapsUrl: "Google Maps",
};

/** All 19 template fields + Maps */
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

export const SHEET_HEADER_LABELS = EXPORT_COLUMNS.map(
  (c) => COLUMN_LABELS[c] || c
);
