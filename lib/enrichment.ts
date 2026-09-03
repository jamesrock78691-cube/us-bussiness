/** Contact + Trademark enrichment helpers (public sources / deep links) */

export function cleanCompanyName(name: string): string {
  return name
    .replace(/,\s*(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Ltd\.?|LP|LLP)\.?$/i, "")
    .replace(/\s+(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Ltd\.?|LP|LLP)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function usptoSearchUrl(companyName: string): string {
  const q = encodeURIComponent(cleanCompanyName(companyName));
  return `https://tmsearch.uspto.gov/search/search-information?query=${q}`;
}

export function usptoBasicSearchUrl(companyName: string): string {
  const q = encodeURIComponent(cleanCompanyName(companyName));
  return `https://www.uspto.gov/trademarks/search?searchText=${q}`;
}

export function googlePhoneUrl(opts: {
  companyName: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
}): string {
  const parts = [
    `"${opts.companyName}"`,
    opts.city || "",
    opts.state || "",
    '(phone OR tel OR "call us" OR "contact us")',
  ];
  return `https://www.google.com/search?q=${encodeURIComponent(
    parts.filter(Boolean).join(" ")
  )}`;
}

export function googleEmailUrl(opts: {
  companyName: string;
  city?: string | null;
  state?: string | null;
}): string {
  const parts = [
    `"${opts.companyName}"`,
    opts.city || "",
    opts.state || "",
    '(email OR contact@ OR info@ OR "@")',
  ];
  return `https://www.google.com/search?q=${encodeURIComponent(
    parts.filter(Boolean).join(" ")
  )}`;
}

export function googleMapsUrl(opts: {
  companyName: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  zip?: string | null;
}): string {
  const q = [opts.companyName, opts.address, opts.city, opts.state, opts.zip]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
