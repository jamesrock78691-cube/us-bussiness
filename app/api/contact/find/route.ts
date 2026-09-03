import { NextRequest, NextResponse } from "next/server";
import {
  googlePhoneUrl,
  googleEmailUrl,
  googleMapsUrl,
} from "@/lib/enrichment";

/**
 * Builds public search links to find phone / email for a business.
 * SOS open data almost never includes phone numbers.
 */
export async function GET(req: NextRequest) {
  const companyName = req.nextUrl.searchParams.get("name") || "";
  const city = req.nextUrl.searchParams.get("city");
  const state = req.nextUrl.searchParams.get("state");
  const address = req.nextUrl.searchParams.get("address");
  const zip = req.nextUrl.searchParams.get("zip");

  if (!companyName.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  return NextResponse.json({
    companyName,
    phoneSearchUrl: googlePhoneUrl({ companyName, city, state, address }),
    emailSearchUrl: googleEmailUrl({ companyName, city, state }),
    mapsUrl: googleMapsUrl({ companyName, city, state, address, zip }),
    message:
      "Use these Google searches to find public phone/email. Official SOS data rarely includes direct phone numbers.",
  });
}
