import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchColorado } from "@/lib/sources/colorado";
import { searchNewYork } from "@/lib/sources/newyork";
import { searchConnecticut } from "@/lib/sources/connecticut";
import { searchOregon } from "@/lib/sources/oregon";
import { searchPennsylvania } from "@/lib/sources/pennsylvania";

const SAMPLE_FALLBACK = [
  {
    id: "sample-1",
    companyName: "Acme Technologies LLC",
    state: "DE",
    entityType: "LLC",
    entityNumber: "DE-7845123",
    status: "Active",
    formationDate: "2019-03-15",
    principalAddress: "1209 N Orange St",
    city: "Wilmington",
    zip: "19801",
    registeredAgent: "Corporation Service Company",
    website: null,
    businessEmail: null,
    businessPhone: null,
    trademarkStatus: null,
    trademarkMatch: null,
    source: "Sample Data",
    sourceUrl: null,
    lastChecked: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";
  let state = (searchParams.get("state") || "").toUpperCase();
  const entityType = searchParams.get("entityType") || "";
  const status = searchParams.get("status") || "";
  const city = searchParams.get("city") || "";
  const zip = searchParams.get("zip") || "";
  const hasEmail = searchParams.get("hasEmail") === "1";
  const hasGmail = searchParams.get("hasGmail") === "1";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const offset = (page - 1) * limit;

  // Official free registries: only CT publishes business emails publicly.
  // Email / Gmail filters always run against CT live data.
  const emailFilterActive = hasEmail || hasGmail;
  let emailAutoRouted = false;
  if (emailFilterActive && state !== "CT") {
    state = "CT";
    emailAutoRouted = true;
  }

  try {
    if (state === "CT" || emailFilterActive) {
      const result = await searchConnecticut({
        q: q || undefined,
        entityType: entityType || undefined,
        status: status || undefined,
        city: city || undefined,
        zip: zip || undefined,
        hasEmail: hasEmail && !hasGmail ? true : undefined,
        hasGmail: hasGmail || undefined,
        limit,
        offset,
      });

      const msgParts = [
        "Live data from Connecticut SOS Open Data",
        hasGmail
          ? "— Gmail only (~280k records with @gmail.com)"
          : hasEmail
            ? "— with business email (~800k records)"
            : "",
      ];
      if (emailAutoRouted) {
        msgParts.push(
          "Email filters only work on CT public data; search auto-switched to Connecticut."
        );
      }

      return NextResponse.json({
        source: "connecticut-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: msgParts.filter(Boolean).join(" "),
        autoState: emailAutoRouted ? "CT" : undefined,
      });
    }

    if (state === "CO") {
      const result = await searchColorado({
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
      return NextResponse.json({
        source: "colorado-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: "Live data from Colorado SOS Open Data (~3.1M entities)",
      });
    }

    if (state === "NY") {
      const result = await searchNewYork({
        q: q || undefined,
        entityType: entityType || undefined,
        city: city || undefined,
        zip: zip || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit,
        offset,
      });
      return NextResponse.json({
        source: "newyork-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: "Live data from New York DOS Open Data",
      });
    }

    if (state === "OR") {
      const result = await searchOregon({
        q: q || undefined,
        entityType: entityType || undefined,
        city: city || undefined,
        limit,
        offset,
      });
      return NextResponse.json({
        source: "oregon-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: "Live data from Oregon SOS Open Data",
      });
    }

    if (state === "PA") {
      const result = await searchPennsylvania({
        q: q || undefined,
        entityType: entityType || undefined,
        city: city || undefined,
        zip: zip || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit,
        offset,
      });
      return NextResponse.json({
        source: "pennsylvania-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: "Live data from Pennsylvania DOS Open Data",
      });
    }

    // Optional Prisma path when DB is seeded
    try {
      const where: Record<string, unknown> = {};
      if (q) where.companyName = { contains: q, mode: "insensitive" };
      if (state) where.state = state;
      if (entityType) where.entityType = entityType;
      if (status) where.status = status;
      if (city) where.city = { contains: city, mode: "insensitive" };
      if (zip) where.zip = { startsWith: zip };
      if (hasEmail) where.businessEmail = { not: null };
      if (dateFrom || dateTo) {
        where.formationDate = {};
        if (dateFrom)
          (where.formationDate as Record<string, Date>).gte = new Date(dateFrom);
        if (dateTo)
          (where.formationDate as Record<string, Date>).lte = new Date(dateTo);
      }

      const [total, rows] = await Promise.all([
        prisma.business.count({ where }),
        prisma.business.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { companyName: "asc" },
        }),
      ]);

      if (total > 0) {
        return NextResponse.json({
          source: "database",
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          data: rows.map((r) => ({
            ...r,
            formationDate: r.formationDate?.toISOString().slice(0, 10) ?? null,
            lastChecked: r.lastChecked?.toISOString() ?? null,
          })),
        });
      }
    } catch {
      // DB not ready
    }

    if (!state && (q || city || zip || entityType || status || dateFrom || dateTo)) {
      const jobs = [
        searchColorado({
          q: q || undefined,
          entityType: entityType || undefined,
          status: status || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: 4,
          offset: 0,
        }),
        searchNewYork({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: 4,
          offset: 0,
        }),
        searchConnecticut({
          q: q || undefined,
          entityType: entityType || undefined,
          status: status || undefined,
          city: city || undefined,
          zip: zip || undefined,
          limit: 4,
          offset: 0,
        }),
        searchOregon({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          limit: 4,
          offset: 0,
        }),
        searchPennsylvania({
          q: q || undefined,
          entityType: entityType || undefined,
          city: city || undefined,
          zip: zip || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: 4,
          offset: 0,
        }),
      ];

      const settled = await Promise.allSettled(jobs);
      const merged: unknown[] = [];
      let total = 0;
      for (const s of settled) {
        if (s.status === "fulfilled") {
          merged.push(...s.value.data);
          total += s.value.total;
        }
      }

      if (merged.length > 0) {
        return NextResponse.json({
          source: "multi-open-data",
          total,
          page: 1,
          limit,
          totalPages: 1,
          data: merged.slice(0, limit),
          message:
            "Results from free open data (CO + NY + CT + OR + PA). Select one state for full pagination. For email/Gmail use the email filters (CT).",
        });
      }
    }

    return NextResponse.json({
      source: "sample",
      total: SAMPLE_FALLBACK.length,
      page: 1,
      limit,
      totalPages: 1,
      data: SAMPLE_FALLBACK,
      message:
        "Select State = CO, NY, CT, OR, or PA for live free open data. Use Email/Gmail filters for Connecticut contact emails.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Search failed";
    console.error("Search error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
