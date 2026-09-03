/** Build a Google Maps search URL for a business row */
export function buildMapsUrl(b: {
  companyName?: string | null;
  principalAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  const q = [
    b.companyName,
    b.principalAddress,
    b.city,
    b.state,
    b.zip,
  ]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
