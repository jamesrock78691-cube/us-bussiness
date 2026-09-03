/**
 * Colorado Business Entities — free open data (Public Domain)
 * Source: https://data.colorado.gov/resource/4ykn-tg5h.json
 * ~3.1M records
 */

export const COLORADO_ENDPOINT =
  "https://data.colorado.gov/resource/4ykn-tg5h.json";

export interface ColoradoRaw {
  entityid?: string;
  entityname?: string;
  entitytype?: string;
  entitystatus?: string;
  entityformdate?: string;
  principaladdress1?: string;
  principaladdress2?: string;
  principalcity?: string;
  principalstate?: string;
  principalzipcode?: string;
  agentfirstname?: string;
  agentmiddlename?: string;
  agentlastname?: string;
  agentorganizationname?: string;
}

export function mapColorado(row: ColoradoRaw) {
  const agentParts = [
    row.agentfirstname,
    row.agentmiddlename,
    row.agentlastname,
  ].filter(Boolean);

  const agentName =
    row.agentorganizationname ||
    (agentParts.length ? agentParts.join(" ") : null);

  const address = [row.principaladdress1, row.principaladdress2]
    .filter(Boolean)
    .join(", ");

  // Normalize common Colorado entity types
  let entityType = row.entitytype || null;
  if (entityType) {
    const t = entityType.toUpperCase();
    if (t.includes("LLC") || t === "DLLC" || t === "FLLC") entityType = "LLC";
    else if (t.includes("CORP") || t === "DPC" || t === "FPC") entityType = "Corporation";
    else if (t.includes("LP") || t === "DLP" || t === "FLP") entityType = "LP";
    else if (t.includes("LLP")) entityType = "LLP";
    else if (t.includes("NONPROFIT") || t.includes("NPC")) entityType = "Nonprofit";
  }

  let status = row.entitystatus || null;
  if (status) {
    const s = status.toLowerCase();
    if (s.includes("good standing") || s === "active") status = "Active";
    else if (s.includes("delinquent") || s.includes("suspended")) status = "Inactive";
    else if (s.includes("dissolved") || s.includes("withdrawn")) status = "Dissolved";
  }

  return {
    id: `CO-${row.entityid}`,
    recordId: row.entityid || null,
    companyName: row.entityname || "Unknown",
    state: "CO",
    entityType,
    entityNumber: row.entityid || null,
    status,
    formationDate: row.entityformdate
      ? row.entityformdate.slice(0, 10)
      : null,
    principalAddress: address || null,
    city: row.principalcity || null,
    zip: row.principalzipcode || null,
    registeredAgent: agentName,
    website: null,
    businessEmail: null,
    businessPhone: null,
    trademarkStatus: null,
    trademarkMatch: null,
    source: "Colorado SOS (Open Data)",
    sourceUrl: `https://data.colorado.gov/resource/4ykn-tg5h.json?entityid=${row.entityid}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function searchColorado(params: {
  q?: string;
  entityType?: string;
  status?: string;
  city?: string;
  zip?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;

  const where: string[] = [];

  if (params.q) {
    // Socrata text search — upper for case-insensitive
    const safe = params.q.replace(/'/g, "''");
    where.push(`upper(entityname) like upper('%${safe}%')`);
  }
  if (params.city) {
    const safe = params.city.replace(/'/g, "''");
    where.push(`upper(principalcity) like upper('%${safe}%')`);
  }
  if (params.zip) {
    where.push(`principalzipcode like '${params.zip.replace(/'/g, "''")}%'`);
  }
  if (params.status) {
    const s = params.status.toLowerCase();
    if (s === "active") where.push(`upper(entitystatus) like '%GOOD STANDING%'`);
    else if (s === "inactive") where.push(`(upper(entitystatus) like '%DELINQUENT%' OR upper(entitystatus) like '%SUSPENDED%')`);
    else if (s === "dissolved") where.push(`(upper(entitystatus) like '%DISSOLVED%' OR upper(entitystatus) like '%WITHDRAWN%')`);
  }
  if (params.entityType) {
    const t = params.entityType.toUpperCase();
    if (t === "LLC") where.push(`(entitytype = 'DLLC' OR entitytype = 'FLLC' OR upper(entitytype) like '%LLC%')`);
    else if (t === "CORPORATION") where.push(`(entitytype = 'DPC' OR entitytype = 'FPC' OR upper(entitytype) like '%CORP%')`);
    else if (t === "LP") where.push(`(entitytype = 'DLP' OR entitytype = 'FLP' OR upper(entitytype) like '%LIMITED PARTNERSHIP%')`);
  }

  const qs = new URLSearchParams();
  qs.set("$limit", String(limit));
  qs.set("$offset", String(offset));
  qs.set("$order", "entityname");
  if (where.length) qs.set("$where", where.join(" AND "));

  // Count query
  const countQs = new URLSearchParams();
  if (where.length) countQs.set("$where", where.join(" AND "));
  countQs.set("$select", "count(*) as total");

  const [dataRes, countRes] = await Promise.all([
    fetch(`${COLORADO_ENDPOINT}?${qs.toString()}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }),
    fetch(`${COLORADO_ENDPOINT}?${countQs.toString()}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }),
  ]);

  if (!dataRes.ok) {
    throw new Error(`Colorado API error: ${dataRes.status}`);
  }

  const rows: ColoradoRaw[] = await dataRes.json();
  let total = rows.length;
  try {
    const countJson = await countRes.json();
    total = parseInt(countJson?.[0]?.total || String(rows.length), 10);
  } catch {
    // ignore count failure
  }

  return {
    total,
    data: rows.map(mapColorado),
    source: "colorado-open-data" as const,
  };
}
