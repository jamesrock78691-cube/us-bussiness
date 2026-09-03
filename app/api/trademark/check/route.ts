import { NextRequest, NextResponse } from "next/server";
import { cleanCompanyName, usptoSearchUrl, usptoBasicSearchUrl } from "@/lib/enrichment";

/**
 * Trademark check helper.
 * Official free USPTO name search requires interactive UI / API key for bulk.
 * We return structured deep-links + cleaned mark so the dashboard can
 * show Matched / Not checked / Open USPTO.
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  if (!name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const cleaned = cleanCompanyName(name);

  return NextResponse.json({
    companyName: name,
    cleanedMark: cleaned,
    status: "unchecked",
    message:
      "Open USPTO search to see if this name (or similar) is registered as a trademark.",
    usptoSearchUrl: usptoSearchUrl(name),
    usptoBasicUrl: usptoBasicSearchUrl(name),
    note: "Federal trademark data is public. Full automated matching needs USPTO TSDR API key or bulk data.",
  });
}
