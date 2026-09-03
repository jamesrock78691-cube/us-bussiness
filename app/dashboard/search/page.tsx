"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { US_STATES, ENTITY_TYPES, BUSINESS_STATUSES } from "@/lib/utils";
import { toCSV, EXPORT_COLUMNS } from "@/lib/csv";

interface Business {
  id: string;
  companyName: string;
  state: string;
  entityType: string | null;
  entityNumber: string | null;
  status: string | null;
  formationDate: string | null;
  principalAddress: string | null;
  city: string | null;
  zip: string | null;
  registeredAgent: string | null;
  website: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  trademarkStatus: string | null;
  trademarkMatch: string | null;
  source: string | null;
  recordId?: string | null;
}

interface SearchResponse {
  source: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Business[];
  message?: string;
}

const LIVE_STATES = new Set(["CO", "NY", "CT", "OR"]);

function cleanName(name: string) {
  return name
    .replace(/,\s*(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Ltd\.?|LP|LLP)\.?$/i, "")
    .replace(/\s+(LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Ltd\.?|LP|LLP)\.?$/i, "")
    .trim();
}

function usptoUrl(name: string) {
  return `https://tmsearch.uspto.gov/search/search-information?query=${encodeURIComponent(cleanName(name))}`;
}

function phoneSearchUrl(b: Business) {
  const q = `"${b.companyName}" ${b.city || ""} ${b.state} (phone OR tel OR "call us" OR "(")`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function emailSearchUrl(b: Business) {
  const q = `"${b.companyName}" ${b.city || ""} ${b.state} (email OR "@" OR contact@ OR info@)`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function mapsUrl(b: Business) {
  const q = `${b.companyName} ${b.principalAddress || ""} ${b.city || ""} ${b.state} ${b.zip || ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function downloadCSV(rows: Business[], filename: string) {
  const csv = toCSV(rows as unknown as Record<string, unknown>[], [
    ...EXPORT_COLUMNS,
    "trademarkStatus",
    "trademarkMatch",
  ]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SearchPage() {
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    entityType: "",
    status: "",
    city: "",
    zip: "",
    hasEmail: false,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  // Local trademark marks set by user after checking USPTO
  const [tmLocal, setTmLocal] = useState<Record<string, string>>({});

  const doSearch = useCallback(async (f: typeof filters, p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (f.q) params.set("q", f.q);
      if (f.state) params.set("state", f.state);
      if (f.entityType) params.set("entityType", f.entityType);
      if (f.status) params.set("status", f.status);
      if (f.city) params.set("city", f.city);
      if (f.zip) params.set("zip", f.zip);
      if (f.hasEmail) params.set("hasEmail", "1");
      params.set("page", String(p));
      params.set("limit", "20");

      const res = await fetch(`/api/businesses/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      setResult(await res.json());
    } catch {
      setError("Search request failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(appliedFilters, page);
  }, [appliedFilters, page, doSearch]);

  function handleSearch() {
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClear() {
    const empty = { q: "", state: "", entityType: "", status: "", city: "", zip: "", hasEmail: false };
    setFilters(empty);
    setPage(1);
    setAppliedFilters(empty);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  async function handleExportCSV() {
    if (!result || result.data.length === 0) return;
    setExporting(true);
    try {
      const withTm = result.data.map((b) => ({
        ...b,
        trademarkStatus: tmLocal[b.id] || b.trademarkStatus,
      }));
      downloadCSV(withTm, `us-businesses-${appliedFilters.state || "all"}-page${page}.csv`);

      if (result.totalPages > 1 && result.total > 20) {
        const maxPages = Math.min(result.totalPages, 5);
        const all: Business[] = [...withTm];
        for (let p = 1; p <= maxPages; p++) {
          if (p === page) continue;
          const params = new URLSearchParams();
          if (appliedFilters.q) params.set("q", appliedFilters.q);
          if (appliedFilters.state) params.set("state", appliedFilters.state);
          if (appliedFilters.entityType) params.set("entityType", appliedFilters.entityType);
          if (appliedFilters.status) params.set("status", appliedFilters.status);
          if (appliedFilters.city) params.set("city", appliedFilters.city);
          if (appliedFilters.zip) params.set("zip", appliedFilters.zip);
          if (appliedFilters.hasEmail) params.set("hasEmail", "1");
          params.set("page", String(p));
          params.set("limit", "20");
          const res = await fetch(`/api/businesses/search?${params}`);
          if (res.ok) {
            const data: SearchResponse = await res.json();
            all.push(...data.data);
          }
        }
        const unique = Array.from(new Map(all.map((b) => [b.id, b])).values());
        downloadCSV(unique, `us-businesses-${appliedFilters.state || "all"}-${unique.length}-rows.csv`);
      }
    } finally {
      setExporting(false);
    }
  }

  function markTrademark(id: string, status: string) {
    setTmLocal((prev) => ({ ...prev, [id]: status }));
  }

  const statusColor = (s: string | null) => {
    if (!s) return "bg-slate-100 text-slate-600";
    const lower = s.toLowerCase();
    if (lower === "active") return "bg-emerald-50 text-emerald-700";
    if (lower === "inactive" || lower === "dissolved") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
  };

  const tmBadge = (s: string | null | undefined) => {
    if (!s || s === "unchecked") return "bg-slate-100 text-slate-500";
    if (s === "Matched" || s.toLowerCase().includes("live") || s.toLowerCase().includes("registered"))
      return "bg-violet-100 text-violet-800";
    if (s === "Not Found" || s.toLowerCase().includes("none")) return "bg-slate-100 text-slate-600";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Businesses</h1>
          <p className="text-slate-500 mt-1">
            Live: <strong>CO, NY, CT, OR</strong> · Phone + Trademark tools on each row
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!result || result.data.length === 0 || exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Company name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Search by company name..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">All states</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}{LIVE_STATES.has(s.code) ? " ✓ LIVE" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">All types</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">All statuses</option>
              {BUSINESS_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="City"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ZIP</label>
            <input
              type="text"
              value={filters.zip}
              onChange={(e) => setFilters({ ...filters, zip: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="ZIP code"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasEmail}
            onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Only with business email (best on <strong>CT</strong>)
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
          <button type="button" onClick={handleClear} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
            Clear
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {result?.message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg">{result.message}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Results</span>
          <span className="text-xs text-slate-400">{result ? `${result.total.toLocaleString()} records` : "—"}</span>
        </div>

        {loading && !result ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Searching...</p>
          </div>
        ) : result && result.data.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No businesses found</p>
          </div>
        ) : result ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Trademark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((b) => {
                    const tm = tmLocal[b.id] || b.trademarkStatus;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 max-w-[200px]">{b.companyName}</div>
                          <div className="text-xs text-slate-400">{b.entityType || ""} {b.entityNumber || ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{b.state}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor(b.status)}`}>
                            {b.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{b.city || "—"}{b.zip ? ` ${b.zip}` : ""}</td>
                        <td className="px-4 py-3">
                          {b.businessEmail ? (
                            <a href={`mailto:${b.businessEmail}`} className="text-xs text-emerald-700 hover:underline font-medium inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {b.businessEmail}
                            </a>
                          ) : (
                            <a href={emailSearchUrl(b)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Find email
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.businessPhone ? (
                            <a href={`tel:${b.businessPhone}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {b.businessPhone}
                            </a>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <a href={phoneSearchUrl(b)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Find phone
                              </a>
                              <a href={mapsUrl(b)} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Maps
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${tmBadge(tm)}`}>
                              <BadgeCheck className="w-3 h-3" />
                              {tm || "Not checked"}
                            </span>
                            <a
                              href={usptoUrl(b.companyName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markTrademark(b.id, "Checked — see USPTO")}
                              className="text-xs text-violet-700 hover:underline inline-flex items-center gap-1"
                            >
                              Check USPTO ↗
                            </a>
                            <div className="flex gap-2 text-[10px]">
                              <button type="button" onClick={() => markTrademark(b.id, "Matched")} className="text-violet-600 hover:underline">
                                Mark: Has TM
                              </button>
                              <button type="button" onClick={() => markTrademark(b.id, "Not Found")} className="text-slate-500 hover:underline">
                                No TM
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {result.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {result.page} of {result.totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button disabled={page >= result.totalPages || loading} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p><strong>Phone:</strong> Official SOS data rarely has phone. Use <em>Find phone</em> → Google public listings / Maps.</p>
        <p><strong>Trademark:</strong> <em>Check USPTO</em> opens official trademark search. Then mark <em>Has TM</em> / <em>No TM</em> for your CSV export.</p>
        <p>Full auto phone + bulk USPTO matching needs paid APIs (Hunter/Apollo + USPTO TSDR key).</p>
      </div>
    </div>
  );
}
