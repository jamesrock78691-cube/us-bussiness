/** Connecticut Business Registry — free open data
 * https://data.ct.gov/resource/n7gp-d28j.json
 * Includes business_email_address when filed
 */

export const CT_ENDPOINT = "https://data.ct.gov/resource/n7gp-d28j.json";

export interface ConnecticutRaw {
  id?: string;
  name?: string;
  business_type?: string;
  status?: string;
  accountnumber?: string;
  billingstreet?: string;
  billingcity?: string;
  billingstate?: string;
  billingpostalcode?: string;
  business_email_address?: string;
  annual_report_due_date?: string;
  began_transacting_in_ct?: string;
}

export function mapConnecticut(row: ConnecticutRaw) {
  let entityType = row.business_type || null;
  if (entityType) {
    const t = entityType.toUpperCase();
    if (t.includes("LLC")) entityType = "LLC";
    else if (t.includes("STOCK") || t.includes("CORP")) entityType = "Corporation";
    else if (t.includes("LIMITED PARTNERSHIP") || t === "LP") entityType = "LP";
    else if (t.includes("LLP")) entityType = "LLP";
    else if (t.includes("NONSTOCK") || t.includes("NONPROFIT")) entityType = "Nonprofit";
  }

  let status = row.status || null;
  if (status) {
    const s = status.toLowerCase();
    if (s.includes("active")) status = "Active";
    else if (s.includes("dissolved") || s.includes("forfeit") || s.includes("cancelled"))
      status = "Dissolved";
    else if (s.includes("inactive") || s.includes("suspend")) status = "Inactive";
  }

  return {
    id: `CT-${row.accountnumber || row.id}`,
    recordId: row.accountnumber || row.id || null,
    companyName: row.name || "Unknown",
    state: "CT",
    entityType,
    entityNumber: row.accountnumber || null,
    status,
    formationDate: null as string | null,
    principalAddress: row.billingstreet || null,
    city: row.billingcity || null,
    zip: row.billingpostalcode || null,
    registeredAgent: null as string | null,
    website: null as string | null,
    businessEmail: row.business_email_address || null,
    businessPhone: null as string | null,
    trademarkStatus: null as string | null,
    trademarkMatch: null as string | null,
    source: "Connecticut SOS (Open Data)",
    sourceUrl: `https://data.ct.gov/resource/n7gp-d28j.json?accountnumber=${row.accountnumber}`,
    lastChecked: new Date().toISOString(),
  };
}

export async function searchConnecticut(params: {
  q?: string;
  entityType?: string;
  status?: string;
  city?: string;
  zip?: string;
  hasEmail?: boolean;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;
  const where: string[] = [];

  if (params.q) {
    const safe = params.q.replace(/'/g, "''");
    where.push(`upper(name) like upper('%${safe}%')`);
  }
  if (params.city) {
    const safe = params.city.replace(/'/g, "''");
    where.push(`upper(billingcity) like upper('%${safe}%')`);
  }
  if (params.zip) {
    where.push(`billingpostalcode like '${params.zip.replace(/'/g, "''")}%'`);
  }
  if (params.status) {
    const s = params.status.toLowerCase();
    if (s === "active") where.push(`upper(status) like '%ACTIVE%'`);
    else if (s === "dissolved")
      where.push(
        `(upper(status) like '%DISSOLVED%' OR upper(status) like '%FORFEIT%' OR upper(status) like '%CANCEL%')`
      );
    else if (s === "inactive") where.push(`upper(status) like '%INACTIVE%'`);
  }
  if (params.entityType) {
    const t = params.entityType.toUpperCase();
    if (t === "LLC") where.push(`upper(business_type) like '%LLC%'`);
    else if (t === "CORPORATION")
      where.push(`(upper(business_type) like '%STOCK%' OR upper(business_type) like '%CORP%')`);
    else if (t === "NONPROFIT")
      where.push(`(upper(business_type) like '%NONSTOCK%' OR upper(business_type) like '%NONPROFIT%')`);
  }
  if (params.hasEmail) {
    where.push(`business_email_address is not null AND business_email_address != ''`);
  }

  const qs = new URLSearchParams();
  qs.set("$limit", String(limit));
  qs.set("$offset", String(offset));
  qs.set("$order", "name");
  if (where.length) qs.set("$where", where.join(" AND "));

  const countQs = new URLSearchParams();
  if (where.length) countQs.set("$where", where.join(" AND "));
  countQs.set("$select", "count(*) as total");

  const [dataRes, countRes] = await Promise.all([
    fetch(`${CT_ENDPOINT}?${qs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
    fetch(`${CT_ENDPOINT}?${countQs}`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
  ]);

  if (!dataRes.ok) throw new Error(`Connecticut API error: ${dataRes.status}`);

  const rows: ConnecticutRaw[] = await dataRes.json();
  let total = rows.length;
  try {
    const c = await countRes.json();
    total = parseInt(c?.[0]?.total || String(rows.length), 10);
  } catch {}

  return { total, data: rows.map(mapConnecticut), source: "connecticut-open-data" as const };
}
