/** Oregon Active Businesses — free open data
 * https://data.oregon.gov/resource/tckn-sxa6.json
 */

export const OR_ENDPOINT = "https://data.oregon.gov/resource/tckn-sxa6.json";

export interface OregonRaw {
  registry_number?: string;
  business_name?: string;
  entity_type?: string;
  registry_date?: string;
  associated_name_type?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  address?: string;
  address_continued?: string;
  city?: string;
}

export function mapOregon(row: OregonRaw) {
  let entityType = row.entity_type || null;
  if (entityType) {
    const t = entityType.toUpperCase();
    if (t.includes("LIMITED LIABILITY") || t.includes("LLC")) entityType = "LLC";
    else if (t.includes("BUSINESS CORPORATION") || t.includes("CORPORATION")) entityType = "Corporation";
    else if (t.includes("LIMITED PARTNERSHIP")) entityType = "LP";
    else if (t.includes("ASSUMED BUSINESS NAME")) entityType = "DBA";
  }

  const agent =
    [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || null;

  const address = [row.address, row.address_continued].filter(Boolean).join(", ");

  return {
    id: `OR-${row.registry_number}-${row.associated_name_type || "main"}`,
    recordId: row.registry_number || null,
    companyName: row.business_name || "Unknown",
    state: "OR",
    entityType,
    entityNumber: row.registry_number || null,
    status: "Active",
    formationDate: row.registry_date ? row.registry_date.slice(0, 10) : null,
    principalAddress: address || null,
    city: row.city || null,
    zip: null as string | null,
    registeredAgent: agent,
    website: null as string | null,
    businessEmail: null as string | null,
    businessPhone: null as string | null,
    trademarkStatus: null as string | null,
    trademarkMatch: null as string | null,
    source: "Oregon SOS (Open Data)",
    sourceUrl: `https://data.oregon.gov/resource/tckn-sxa6.json?registry_number=${row.registry_number}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function searchOregon(params: {
  q?: string;
  entityType?: string;
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;
  const where: string[] = [];

  // Prefer principal / entity rows when possible
  where.push(`(associated_name_type = 'PRINCIPAL PLACE OF BUSINESS' OR associated_name_type = 'ENTITY' OR associated_name_type is null OR associated_name_type = 'MAILING ADDRESS')`);

  if (params.q) {
    const safe = params.q.replace(/'/g, "''");
    where.push(`upper(business_name) like upper('%${safe}%')`);
  }
  if (params.city) {
    const safe = params.city.replace(/'/g, "''");
    where.push(`upper(city) like upper('%${safe}%')`);
  }
  if (params.entityType) {
    const t = params.entityType.toUpperCase();
    if (t === "LLC") where.push(`upper(entity_type) like '%LIMITED LIABILITY%'`);
    else if (t === "CORPORATION") where.push(`upper(entity_type) like '%CORPORATION%'`);
    else if (t === "LP") where.push(`upper(entity_type) like '%LIMITED PARTNERSHIP%'`);
  }

  const qs = new URLSearchParams();
  qs.set("$limit", String(limit));
  qs.set("$offset", String(offset));
  qs.set("$order", "business_name");
  if (where.length) qs.set("$where", where.join(" AND "));

  const countQs = new URLSearchParams();
  if (where.length) countQs.set("$where", where.join(" AND "));
  countQs.set("$select", "count(*) as total");

  const [dataRes, countRes] = await Promise.all([
    fetch(`${OR_ENDPOINT}?${qs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
    fetch(`${OR_ENDPOINT}?${countQs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
  ]);

  if (!dataRes.ok) throw new Error(`Oregon API error: ${dataRes.status}`);

  const rows: OregonRaw[] = await dataRes.json();
  let total = rows.length;
  try {
    const c = await countRes.json();
    total = parseInt(c?.[0]?.total || String(rows.length), 10);
  } catch {}

  // Dedupe by registry_number keeping first
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    const key = r.registry_number || Math.random().toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { total, data: deduped.map(mapOregon), source: "oregon-open-data" as const };
}
