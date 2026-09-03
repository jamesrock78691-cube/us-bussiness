/**
 * Live stats from free open-data sources
 */

const CO_COUNT_URL =
  "https://data.colorado.gov/resource/4ykn-tg5h.json?$select=count(*)%20as%20total";
const NY_COUNT_URL =
  "https://data.ny.gov/resource/n9v6-gdp6.json?$select=count(*)%20as%20total";

export async function getOpenDataStats() {
  const defaults = {
    colorado: 3_100_000,
    newYork: 4_200_000,
    liveStates: 2,
    totalApprox: 7_300_000,
  };

  try {
    const [coRes, nyRes] = await Promise.all([
      fetch(CO_COUNT_URL, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }),
      fetch(NY_COUNT_URL, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }),
    ]);

    let colorado = defaults.colorado;
    let newYork = defaults.newYork;

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

    return {
      colorado,
      newYork,
      liveStates: 2,
      totalApprox: colorado + newYork,
      sources: [
        {
          code: "CO",
          name: "Colorado",
          records: colorado,
          status: "live" as const,
          type: "Open Data API",
        },
        {
          code: "NY",
          name: "New York",
          records: newYork,
          status: "live" as const,
          type: "Open Data API",
        },
      ],
    };
  } catch {
    return {
      ...defaults,
      sources: [
        {
          code: "CO",
          name: "Colorado",
          records: defaults.colorado,
          status: "live" as const,
          type: "Open Data API",
        },
        {
          code: "NY",
          name: "New York",
          records: defaults.newYork,
          status: "live" as const,
          type: "Open Data API",
        },
      ],
    };
  }
}
