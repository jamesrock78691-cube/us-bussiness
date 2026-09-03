/** Pennsylvania Registered Businesses — free open data (Public Domain)
 * https://data.pa.gov/resource/xvd7-5r2c.json
 * Officer-level rows; we dedupe by filing_number
 */

export const PA_ENDPOINT = "https://data.pa.gov/resource/xvd7-5r2c.json";

export interface PennsylvaniaRaw {
  business_name?: string;
  filing_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  typeofbusinessregistration?: string;
  creationdate?: string;
  party_type?: string;
  last_name?: string;
  middle_name?: string;
  first_name?: string;
  county_name?: string;
}

export function mapPennsylvania(row: PennsylvaniaRaw) {
  let entityType = row.typeofbusinessregistration || null;
  if (entityType) {
    const t = entityType.toUpperCase();
    if (t.includes("LIMITED LIABILITY") || t.includes("LLC")) entityType = "LLC";
    else if (t.includes("NONPROFIT") || t.includes("NON-PROFIT")) entityType = "Nonprofit";
    else if (t.includes("CORPORATION") || t.includes("CORP")) entityType = "Corporation";
    else if (t.includes("LIMITED PARTNERSHIP") || t === "LP") entityType = "LP";
    else if (t.includes("LLP")) entityType = "LLP";
  }

  const officer = [row.first_name, row.middle_name, row.last_name]
    .filter(Boolean)
    .join(" ");
  const address = [row.address_line1, row.address_line2].filter(Boolean).join(", ");

  return {
    id: `PA-${row.filing_number}`,
    recordId: row.filing_number || null,
    companyName: row.business_name || "Unknown",
    state: "PA",
    entityType,
    entityNumber: row.filing_number || null,
    status: "Active",
    formationDate: row.creationdate ? row.creationdate.slice(0, 10) : null,
    principalAddress: address || null,
    city: row.city || null,
    zip: row.zip || null,
    registeredAgent: officer || null,
    website: null as string | null,
    businessEmail: null as string | null,
    businessPhone: null as string | null,
    trademarkStatus: null as string | null,
    trademarkMatch: null as string | null,
    source: "Pennsylvania DOS (Open Data)",
    sourceUrl: `https://data.pa.gov/resource/xvd7-5r2c.json?filing_number=${row.filing_number}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function searchPennsylvania(params: {
  q?: string;
  entityType?: string;
  city?: string;
  zip?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;
  const where: string[] = [];

  if (params.q) {
    const safe = params.q.replace(/'/g, "''");
    where.push(`upper(business_name) like upper('%${safe}%')`);
  }
  if (params.city) {
    const safe = params.city.replace(/'/g, "''");
    where.push(`upper(city) like upper('%${safe}%')`);
  }
  if (params.zip) {
    where.push(`zip like '${params.zip.replace(/'/g, "''")}%'`);
  }
  if (params.entityType) {
    const t = params.entityType.toUpperCase();
    if (t === "LLC") where.push(`upper(typeofbusinessregistration) like '%LIMITED LIABILITY%'`);
    else if (t === "CORPORATION") where.push(`upper(typeofbusinessregistration) like '%CORPORATION%'`);
    else if (t === "NONPROFIT") where.push(`upper(typeofbusinessregistration) like '%NONPROFIT%'`);
    else if (t === "LP") where.push(`upper(typeofbusinessregistration) like '%LIMITED PARTNERSHIP%'`);
  }

  const qs = new URLSearchParams();
  qs.set("$limit", String(limit * 3)); // over-fetch then dedupe officers
  qs.set("$offset", String(offset));
  qs.set("$order", "business_name");
  if (where.length) qs.set("$where", where.join(" AND "));

  const countQs = new URLSearchParams();
  if (where.length) countQs.set("$where", where.join(" AND "));
  countQs.set("$select", "count(*) as total");

  const [dataRes, countRes] = await Promise.all([
    fetch(`${PA_ENDPOINT}?${qs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
    fetch(`${PA_ENDPOINT}?${countQs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
  ]);

  if (!dataRes.ok) throw new Error(`Pennsylvania API error: ${dataRes.status}`);

  const rows: PennsylvaniaRaw[] = await dataRes.json();
  let total = rows.length;
  try {
    const c = await countRes.json();
    total = parseInt(c?.[0]?.total || String(rows.length), 10);
  } catch {}

  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    const key = r.filing_number || r.business_name || Math.random().toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);

  return {
    total,
    data: deduped.map(mapPennsylvania),
    source: "pennsylvania-open-data" as const,
  };
}
