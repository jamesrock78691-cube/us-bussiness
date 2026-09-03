import { NextRequest, NextResponse } from "next/server";
import {
  appendBusinessesToSheet,
  isSheetsConfigured,
  getDefaultSheetId,
} from "@/lib/google-sheets";
import { buildMapsUrl } from "@/lib/maps";
import { searchColorado } from "@/lib/sources/colorado";
import { searchNewYork } from "@/lib/sources/newyork";
import { searchConnecticut } from "@/lib/sources/connecticut";
import { searchOregon } from "@/lib/sources/oregon";
import { searchPennsylvania } from "@/lib/sources/pennsylvania";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isSheetsConfigured(),
    sheetId: getDefaultSheetId(),
    sheetUrl: `https://docs.google.com/spreadsheets/d/${getDefaultSheetId()}/edit`,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!isSheetsConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets credentials missing. Add GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY on Vercel, share sheet with that email as Editor.",
          sheetId: getDefaultSheetId(),
          setup: true,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const state = String(body.state || "").toUpperCase();
    const q = body.q || "";
    const entityType = body.entityType || "";
    const status = body.status || "";
    const city = body.city || "";
    const zip = body.zip || "";
    const hasEmail = Boolean(body.hasEmail);
    const dateFrom = body.dateFrom || "";
    const dateTo = body.dateTo || "";
    const count = Math.min(5000, Math.max(1, parseInt(String(body.count || 100), 10)));

    if (!["CO", "NY", "CT", "OR", "PA"].includes(state)) {
      return NextResponse.json(
        { error: "Select one live state (CO, NY, CT, OR, PA) before syncing." },
        { status: 400 }
      );
    }

    const pageSize = 100;
    const pages = Math.ceil(count / pageSize);
    const all: Record<string, unknown>[] = [];

    for (let p = 0; p < pages; p++) {
      const offset = p * pageSize;
      const limit = Math.min(pageSize, count - all.length);
      let result: { data: Record<string, unknown>[]; total: number };

      if (state === "CO") {
        result = await searchColorado({
          q: q || undefined,
          entityType: entityType || undefined,
          status: status || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit,
          offset,
        });
      } else if (state === "NY") {
        result = await searchNewYork({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit,
          offset,
        });
      } else if (state === "CT") {
        result = await searchConnecticut({
          q: q || undefined,
          entityType: entityType || undefined,
          status: status || undefined,
          city: city || undefined,
          zip: zip || undefined,
          hasEmail: hasEmail || undefined,
          limit,
          offset,
        });
      } else if (state === "OR") {
        result = await searchOregon({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          limit,
          offset,
        });
      } else {
        result = await searchPennsylvania({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit,
          offset,
        });
      }

      all.push(...result.data);
      if (result.data.length < limit) break;
      if (all.length >= count) break;
    }

    const rows = all.slice(0, count).map((b) => ({
      ...b,
      mapsUrl: buildMapsUrl({
        companyName: b.companyName as string,
        principalAddress: b.principalAddress as string,
        city: b.city as string,
        state: b.state as string,
        zip: b.zip as string,
      }),
    }));

    const { appended, sheetId } = await appendBusinessesToSheet(rows);

    return NextResponse.json({
      ok: true,
      appended,
      sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      message: `${appended} rows written to Google Sheet (with Google Maps links).`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Sync failed";
    console.error("Sheets sync error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
