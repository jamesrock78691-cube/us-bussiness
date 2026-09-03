const CO_COUNT_URL =
  "https://data.colorado.gov/resource/4ykn-tg5h.json?$select=count(*)%20as%20total";
const NY_COUNT_URL =
  "https://data.ny.gov/resource/n9v6-gdp6.json?$select=count(*)%20as%20total";
const CT_COUNT_URL =
  "https://data.ct.gov/resource/n7gp-d28j.json?$select=count(*)%20as%20total";
const OR_COUNT_URL =
  "https://data.oregon.gov/resource/tckn-sxa6.json?$select=count(*)%20as%20total";

export async function getOpenDataStats() {
  const defaults = {
    colorado: 3_100_000,
    newYork: 4_200_000,
    connecticut: 1_280_000,
    oregon: 1_560_000,
    liveStates: 4,
    totalApprox: 10_140_000,
  };

  try {
    const [coRes, nyRes, ctRes, orRes] = await Promise.all([
      fetch(CO_COUNT_URL, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
      fetch(NY_COUNT_URL, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
      fetch(CT_COUNT_URL, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
      fetch(OR_COUNT_URL, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }),
    ]);

    let colorado = defaults.colorado;
    let newYork = defaults.newYork;
    let connecticut = defaults.connecticut;
    let oregon = defaults.oregon;

    if (coRes.ok) {
      const j = await coRes.json();
      const n = parseInt(j?.[0]?.total, 10);
      if (!isNaN(n)) colorado = n;
    }
    if (nyRes.ok) {
      const j = await nyRes.json();
      const n = parseInt(j?.[0]?.total, 10);
      if (!isNaN(n)) newYork = n;
    }
    if (ctRes.ok) {
      const j = await ctRes.json();
      const n = parseInt(j?.[0]?.total, 10);
      if (!isNaN(n)) connecticut = n;
    }
    if (orRes.ok) {
      const j = await orRes.json();
      const n = parseInt(j?.[0]?.total, 10);
      if (!isNaN(n)) oregon = n;
    }

    return {
      colorado,
      newYork,
      connecticut,
      oregon,
      liveStates: 4,
      totalApprox: colorado + newYork + connecticut + oregon,
      sources: [
        { code: "CO", name: "Colorado", records: colorado, status: "live" as const, type: "Open Data API" },
        { code: "NY", name: "New York", records: newYork, status: "live" as const, type: "Open Data API" },
        { code: "CT", name: "Connecticut", records: connecticut, status: "live" as const, type: "Open Data API (+ emails)" },
        { code: "OR", name: "Oregon", records: oregon, status: "live" as const, type: "Open Data API" },
      ],
    };
  } catch {
    return {
      ...defaults,
      sources: [
        { code: "CO", name: "Colorado", records: defaults.colorado, status: "live" as const, type: "Open Data API" },
        { code: "NY", name: "New York", records: defaults.newYork, status: "live" as const, type: "Open Data API" },
        { code: "CT", name: "Connecticut", records: defaults.connecticut, status: "live" as const, type: "Open Data API (+ emails)" },
        { code: "OR", name: "Oregon", records: defaults.oregon, status: "live" as const, type: "Open Data API" },
      ],
    };
  }
}
