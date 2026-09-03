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
} from "lucide-react";
import { US_STATES, ENTITY_TYPES, BUSINESS_STATUSES } from "@/lib/utils";

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
}

interface SearchResponse {
  source: "database" | "sample";
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Business[];
  message?: string;
}

export default function SearchPage() {
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    entityType: "",
    status: "",
    city: "",
    zip: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");

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
      params.set("page", String(p));
      params.set("limit", "20");

      const res = await fetch(`/api/businesses/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError("Search request failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    doSearch(appliedFilters, page);
  }, [appliedFilters, page, doSearch]);

  function handleSearch() {
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClear() {
    const empty = { q: "", state: "", entityType: "", status: "", city: "", zip: "" };
    setFilters(empty);
    setPage(1);
    setAppliedFilters(empty);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  const statusColor = (s: string | null) => {
    if (!s) return "bg-slate-100 text-slate-600";
    const lower = s.toLowerCase();
    if (lower === "active") return "bg-emerald-50 text-emerald-700";
    if (lower === "inactive" || lower === "dissolved") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Businesses</h1>
          <p className="text-slate-500 mt-1">
            Filter and find businesses across all 50 states
          </p>
        </div>
        <button
          disabled={!result || result.data.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
          title="CSV export coming soon"
        >
          <Download className="w-4 h-4" />
          Export results
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Company name
            </label>
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
                  {s.code} — {s.name}
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
                <option key={t} value={t}>
                  {t}
                </option>
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
                <option key={s} value={s}>
                  {s}
                </option>
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
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {result?.message && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
          {result.message}
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Results</span>
          <span className="text-xs text-slate-400">
            {result ? `${result.total} record${result.total !== 1 ? "s" : ""}` : "—"}
            {result?.source === "sample" && " (sample)"}
          </span>
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
            <p className="text-sm text-slate-400 mt-1">Try changing filters or clear them.</p>
          </div>
        ) : result ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Formed</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.companyName}</div>
                        {b.entityNumber && (
                          <div className="text-xs text-slate-400 mt-0.5">{b.entityNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {b.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.entityType || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor(
                            b.status
                          )}`}
                        >
                          {b.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.city || "—"}
                        {b.zip ? ` ${b.zip}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {b.formationDate || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          {b.businessEmail && <div>{b.businessEmail}</div>}
                          {b.businessPhone && <div>{b.businessPhone}</div>}
                          {!b.businessEmail && !b.businessPhone && <span className="text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {b.website ? (
                          <a
                            href={b.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {result.page} of {result.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={page >= result.totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
