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
  const state = (searchParams.get("state") || "").toUpperCase();
  const entityType = searchParams.get("entityType") || "";
  const status = searchParams.get("status") || "";
  const city = searchParams.get("city") || "";
  const zip = searchParams.get("zip") || "";
  const hasEmail = searchParams.get("hasEmail") === "1";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
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
        message: "Live data from New York DOS Open Data (~4.2M active entities)",
      });
    }

    if (state === "CT") {
      const result = await searchConnecticut({
        q: q || undefined,
        entityType: entityType || undefined,
        status: status || undefined,
        city: city || undefined,
        zip: zip || undefined,
        hasEmail: hasEmail || undefined,
        limit,
        offset,
      });
      return NextResponse.json({
        source: "connecticut-open-data",
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit) || 1,
        data: result.data,
        message: hasEmail
          ? "Connecticut businesses with filed email addresses (official open data)"
          : "Live data from Connecticut SOS Open Data (~1.3M entities). Many records include business email.",
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
        message: "Live data from Oregon SOS Open Data (~1.5M active businesses)",
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
        message: "Live data from Pennsylvania DOS Open Data (~2–4M entity rows, public domain)",
      });
    }

    try {
      const where: any = {};
      if (q) where.companyName = { contains: q, mode: "insensitive" };
      if (state) where.state = state;
      if (entityType) where.entityType = entityType;
      if (status) where.status = { equals: status, mode: "insensitive" };
      if (city) where.city = { contains: city, mode: "insensitive" };
      if (zip) where.zip = { contains: zip };
      if (hasEmail) where.businessEmail = { not: null };
      if (dateFrom || dateTo) {
        where.formationDate = {};
        if (dateFrom) where.formationDate.gte = new Date(dateFrom);
        if (dateTo) where.formationDate.lte = new Date(dateTo);
      }

      const [total, rows] = await Promise.all([
        prisma.business.count({ where }),
        prisma.business.findMany({
          where,
          orderBy: { companyName: "asc" },
          skip: offset,
          take: limit,
        }),
      ]);

      if (total > 0) {
        return NextResponse.json({
          source: "database",
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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

    if (!state && (q || city || zip || entityType || status || hasEmail || dateFrom || dateTo)) {
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
          hasEmail: hasEmail || undefined,
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
      const merged: any[] = [];
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
            "Results from free open data (CO + NY + CT + OR + PA). Select one state for full pagination.",
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
        "Select State = CO, NY, CT, OR, or PA for live free open data. CT often includes business emails.",
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        source: "error",
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        data: [],
        message: error?.message || "Search failed",
      },
      { status: 500 }
    );
  }
}
