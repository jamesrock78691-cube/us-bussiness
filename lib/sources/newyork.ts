/**
 * New York Active Corporations — free open data
 * Source: https://data.ny.gov/resource/n9v6-gdp6.json
 * ~4.2M active entities
 */

export const NY_ENDPOINT = "https://data.ny.gov/resource/n9v6-gdp6.json";

export interface NewYorkRaw {
  dos_id?: string;
  current_entity_name?: string;
  initial_dos_filing_date?: string;
  county?: string;
  jurisdiction?: string;
  entity_type?: string;
  dos_process_name?: string;
  dos_process_address_1?: string;
  dos_process_city?: string;
  dos_process_state?: string;
  dos_process_zip?: string;
  location_city?: string;
  location_state?: string;
  location_zip?: string;
  location_address1?: string;
}

export function mapNewYork(row: NewYorkRaw) {
  let entityType = row.entity_type || null;
  if (entityType) {
    const t = entityType.toUpperCase();
    if (t.includes("LIMITED LIABILITY") || t.includes("LLC")) entityType = "LLC";
    else if (t.includes("BUSINESS CORPORATION") || t.includes("CORPORATION")) entityType = "Corporation";
    else if (t.includes("LIMITED PARTNERSHIP") && !t.includes("LIABILITY")) entityType = "LP";
    else if (t.includes("LIMITED LIABILITY PARTNERSHIP") || t.includes("LLP")) entityType = "LLP";
    else if (t.includes("NOT-FOR-PROFIT") || t.includes("NONPROFIT")) entityType = "Nonprofit";
  }

  const address =
    row.location_address1 ||
    [row.dos_process_address_1].filter(Boolean).join(", ") ||
    null;

  const city = row.location_city || row.dos_process_city || null;
  const zip = row.location_zip || row.dos_process_zip || null;

  return {
    id: `NY-${row.dos_id}`,
    recordId: row.dos_id || null,
    companyName: row.current_entity_name || "Unknown",
    state: "NY",
    entityType,
    entityNumber: row.dos_id || null,
    status: "Active", // this dataset is active only
    formationDate: row.initial_dos_filing_date
      ? row.initial_dos_filing_date.slice(0, 10)
      : null,
    principalAddress: address,
    city,
    zip,
    registeredAgent: row.dos_process_name || null,
    website: null,
    businessEmail: null,
    businessPhone: null,
    trademarkStatus: null,
    trademarkMatch: null,
    source: "New York DOS (Open Data)",
    sourceUrl: `https://data.ny.gov/resource/n9v6-gdp6.json?dos_id=${row.dos_id}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function searchNewYork(params: {
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
    where.push(`upper(current_entity_name) like upper('%${safe}%')`);
  }
  if (params.city) {
    const safe = params.city.replace(/'/g, "''");
    where.push(
      `(upper(location_city) like upper('%${safe}%') OR upper(dos_process_city) like upper('%${safe}%'))`
    );
  }
  if (params.zip) {
    const safe = params.zip.replace(/'/g, "''");
    where.push(
      `(location_zip like '${safe}%' OR dos_process_zip like '${safe}%')`
    );
  }
  if (params.entityType) {
    const t = params.entityType.toUpperCase();
    if (t === "LLC") where.push(`upper(entity_type) like '%LIMITED LIABILITY%'`);
    else if (t === "CORPORATION") where.push(`upper(entity_type) like '%CORPORATION%'`);
    else if (t === "LP") where.push(`upper(entity_type) like '%LIMITED PARTNERSHIP%' AND upper(entity_type) not like '%LIABILITY%'`);
    else if (t === "NONPROFIT") where.push(`(upper(entity_type) like '%NOT-FOR-PROFIT%' OR upper(entity_type) like '%NONPROFIT%')`);
  }

  const qs = new URLSearchParams();
  qs.set("$limit", String(limit));
  qs.set("$offset", String(offset));
  qs.set("$order", "current_entity_name");
  if (where.length) qs.set("$where", where.join(" AND "));

  const countQs = new URLSearchParams();
  if (where.length) countQs.set("$where", where.join(" AND "));
  countQs.set("$select", "count(*) as total");

  const [dataRes, countRes] = await Promise.all([
    fetch(`${NY_ENDPOINT}?${qs.toString()}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }),
    fetch(`${NY_ENDPOINT}?${countQs.toString()}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }),
  ]);

  if (!dataRes.ok) {
    throw new Error(`New York API error: ${dataRes.status}`);
  }

  const rows: NewYorkRaw[] = await dataRes.json();
  let total = rows.length;
  try {
    const countJson = await countRes.json();
    total = parseInt(countJson?.[0]?.total || String(rows.length), 10);
  } catch {
    // ignore
  }

  return {
    total,
    data: rows.map(mapNewYork),
    source: "newyork-open-data" as const,
  };
}
