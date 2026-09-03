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
  FileSpreadsheet,
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
  sourceUrl?: string | null;
  lastChecked?: string | null;
  recordId?: string | null;
  mapsUrl?: string | null;
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

const LIVE_STATES = new Set(["CO", "NY", "CT", "OR", "PA"]);
const EXPORT_PAGE_SIZE = 100;
const EXPORT_HARD_MAX = 5000;
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1D0pRC_NEuG9HJK8hVVxedlIUWNU3UjLhohahYS9akGM/edit";

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
  if (b.mapsUrl) return b.mapsUrl;
  const q = `${b.companyName} ${b.principalAddress || ""} ${b.city || ""} ${b.state} ${b.zip || ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function withMaps(rows: Business[]): Business[] {
  return rows.map((b) => ({ ...b, mapsUrl: mapsUrl(b) }));
}

function downloadCSV(rows: Business[], filename: string) {
  const csv = toCSV(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function cell(v: string | null | undefined) {
  return v && String(v).trim() ? String(v) : "—";
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
    dateFrom: "",
    dateTo: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportCount, setExportCount] = useState(100);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [tmLocal, setTmLocal] = useState<Record<string, string>>({});
  const [sheetsStatus, setSheetsStatus] = useState<{ configured: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/sheets/sync")
      .then((r) => r.json())
      .then((d) => setSheetsStatus({ configured: Boolean(d.configured) }))
      .catch(() => setSheetsStatus({ configured: false }));
  }, []);

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
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);
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
    const empty = {
      q: "",
      state: "",
      entityType: "",
      status: "",
      city: "",
      zip: "",
      hasEmail: false,
      dateFrom: "",
      dateTo: "",
    };
    setFilters(empty);
    setPage(1);
    setAppliedFilters(empty);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  async function fetchBatch(wanted: number): Promise<Business[]> {
    const all: Business[] = [];
    const totalPagesNeeded = Math.ceil(wanted / EXPORT_PAGE_SIZE);
    for (let p = 1; p <= totalPagesNeeded; p++) {
      setExportProgress(`Fetching page ${p} of ${totalPagesNeeded} (${all.length}/${wanted})...`);
      const params = new URLSearchParams();
      if (appliedFilters.q) params.set("q", appliedFilters.q);
      if (appliedFilters.state) params.set("state", appliedFilters.state);
      if (appliedFilters.entityType) params.set("entityType", appliedFilters.entityType);
      if (appliedFilters.status) params.set("status", appliedFilters.status);
      if (appliedFilters.city) params.set("city", appliedFilters.city);
      if (appliedFilters.zip) params.set("zip", appliedFilters.zip);
      if (appliedFilters.hasEmail) params.set("hasEmail", "1");
      if (appliedFilters.dateFrom) params.set("dateFrom", appliedFilters.dateFrom);
      if (appliedFilters.dateTo) params.set("dateTo", appliedFilters.dateTo);
      params.set("page", String(p));
      params.set("limit", String(EXPORT_PAGE_SIZE));
      const res = await fetch(`/api/businesses/search?${params}`);
      if (!res.ok) break;
      const data: SearchResponse = await res.json();
      if (!data.data?.length) break;
      all.push(...data.data);
      if (all.length >= wanted) break;
      if (data.data.length < EXPORT_PAGE_SIZE) break;
    }
    return Array.from(new Map(all.map((b) => [b.id, b])).values()).slice(0, wanted);
  }

  async function handleExportCSV() {
    if (!result || result.data.length === 0) return;
    let wanted = Math.floor(Number(exportCount) || 100);
    if (wanted < 1) wanted = 1;
    if (wanted > EXPORT_HARD_MAX) wanted = EXPORT_HARD_MAX;
    wanted = Math.min(wanted, result.total || wanted);

    setExporting(true);
    try {
      const unique = withMaps(await fetchBatch(wanted)).map((b) => ({
        ...b,
        trademarkStatus: tmLocal[b.id] || b.trademarkStatus,
      }));
      setExportProgress(`Downloading ${unique.length} rows (all 19 fields + Maps)...`);
      downloadCSV(unique, `us-businesses-${appliedFilters.state || "all"}-${unique.length}-rows.csv`);
      setExportProgress(`Done — ${unique.length} rows with full columns`);
    } catch {
      setError("Export failed.");
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress(""), 5000);
    }
  }

  async function handleSyncSheet() {
    if (!result || result.data.length === 0) return;
    if (!appliedFilters.state || !LIVE_STATES.has(appliedFilters.state)) {
      setError("Google Sheet sync ke liye ek LIVE state select karo (CO / NY / CT / OR / PA).");
      return;
    }

    let wanted = Math.floor(Number(exportCount) || 100);
    if (wanted < 1) wanted = 1;
    if (wanted > EXPORT_HARD_MAX) wanted = EXPORT_HARD_MAX;
    wanted = Math.min(wanted, result.total || wanted);

    setSyncing(true);
    setExportProgress(`Sending ${wanted} rows to Google Sheet...`);
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: wanted,
          state: appliedFilters.state,
          q: appliedFilters.q,
          entityType: appliedFilters.entityType,
          status: appliedFilters.status,
          city: appliedFilters.city,
          zip: appliedFilters.zip,
          hasEmail: appliedFilters.hasEmail,
          dateFrom: appliedFilters.dateFrom,
          dateTo: appliedFilters.dateTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sheet sync failed");
        setExportProgress("");
        return;
      }
      setExportProgress(data.message || `Synced ${data.appended} rows`);
      window.open(data.sheetUrl || SHEET_URL, "_blank");
    } catch {
      setError("Sheet sync request failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setExportProgress(""), 8000);
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

  const quickCounts = [50, 100, 250, 500, 1000, 2000];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Businesses</h1>
          <p className="text-slate-500 mt-1">
            All <strong>19 fields</strong> + Google Maps · Live: CO, NY, CT, OR, PA
          </p>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Rows:</label>
            <input
              type="number"
              min={1}
              max={EXPORT_HARD_MAX}
              value={exportCount}
              onChange={(e) => setExportCount(Number(e.target.value) || 1)}
              className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleExportCSV}
              disabled={!result || result.data.length === 0 || exporting || syncing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              CSV (19 cols)
            </button>
            <button
              onClick={handleSyncSheet}
              disabled={!result || result.data.length === 0 || exporting || syncing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Google Sheet
            </button>
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-2 text-xs text-blue-600 hover:underline">
              Open sheet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {quickCounts.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setExportCount(n)}
                className={`px-2 py-0.5 rounded text-[11px] border transition ${
                  exportCount === n
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {exportProgress && <span className="text-xs text-slate-500 text-right">{exportProgress}</span>}
          {sheetsStatus && !sheetsStatus.configured && (
            <span className="text-[11px] text-amber-700 text-right max-w-sm">
              Sheet push: Vercel pe GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY set karo.
            </span>
          )}
        </div>
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
              <input type="text" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onKeyDown={handleKeyDown} placeholder="Search by company name..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
            <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
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
            <select value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option value="">All types</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option value="">All statuses</option>
              {BUSINESS_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
            <input type="text" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} onKeyDown={handleKeyDown} placeholder="City" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ZIP</label>
            <input type="text" value={filters.zip} onChange={(e) => setFilters({ ...filters, zip: e.target.value })} onKeyDown={handleKeyDown} placeholder="ZIP code" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Formation date from</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Formation date to</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={filters.hasEmail} onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Only with business email (best on <strong>CT</strong>)
        </label>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleSearch} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
          <button type="button" onClick={handleClear} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Clear</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {result?.message && <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg">{result.message}</div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Results — all 19 columns</span>
          <span className="text-xs text-slate-400">
            {result ? `${result.total.toLocaleString()} total · scroll → for all fields` : "—"}
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
          </div>
        ) : result ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1800px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-3 py-2 whitespace-nowrap sticky left-0 bg-slate-50 z-10">Company Name</th>
                    <th className="px-3 py-2 whitespace-nowrap">State</th>
                    <th className="px-3 py-2 whitespace-nowrap">Entity Type</th>
                    <th className="px-3 py-2 whitespace-nowrap">Entity Number</th>
                    <th className="px-3 py-2 whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 whitespace-nowrap">Formation Date</th>
                    <th className="px-3 py-2 whitespace-nowrap">Principal Address</th>
                    <th className="px-3 py-2 whitespace-nowrap">City</th>
                    <th className="px-3 py-2 whitespace-nowrap">ZIP</th>
                    <th className="px-3 py-2 whitespace-nowrap">Registered Agent</th>
                    <th className="px-3 py-2 whitespace-nowrap">Website</th>
                    <th className="px-3 py-2 whitespace-nowrap">Business Email</th>
                    <th className="px-3 py-2 whitespace-nowrap">Business Phone</th>
                    <th className="px-3 py-2 whitespace-nowrap">Trademark Status</th>
                    <th className="px-3 py-2 whitespace-nowrap">Trademark Match</th>
                    <th className="px-3 py-2 whitespace-nowrap">Source</th>
                    <th className="px-3 py-2 whitespace-nowrap">Source URL</th>
                    <th className="px-3 py-2 whitespace-nowrap">Last Checked</th>
                    <th className="px-3 py-2 whitespace-nowrap">Record ID</th>
                    <th className="px-3 py-2 whitespace-nowrap">Google Maps</th>
                    <th className="px-3 py-2 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((b) => {
                    const tm = tmLocal[b.id] || b.trademarkStatus;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2 font-medium text-slate-900 max-w-[180px] sticky left-0 bg-white z-10">
                          <div className="truncate" title={b.companyName}>{b.companyName}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{b.state}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{cell(b.entityType)}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">{cell(b.entityNumber)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${statusColor(b.status)}`}>{cell(b.status)}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">{cell(b.formationDate)}</td>
                        <td className="px-3 py-2 text-slate-600 max-w-[160px] truncate" title={b.principalAddress || ""}>{cell(b.principalAddress)}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{cell(b.city)}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{cell(b.zip)}</td>
                        <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate" title={b.registeredAgent || ""}>{cell(b.registeredAgent)}</td>
                        <td className="px-3 py-2 text-xs">
                          {b.website ? (
                            <a href={b.website.startsWith("http") ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[120px]">{b.website}</a>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {b.businessEmail ? (
                            <a href={`mailto:${b.businessEmail}`} className="text-emerald-700 hover:underline">{b.businessEmail}</a>
                          ) : (
                            <a href={emailSearchUrl(b)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Find</a>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {b.businessPhone ? (
                            <a href={`tel:${b.businessPhone}`} className="text-blue-600 hover:underline">{b.businessPhone}</a>
                          ) : (
                            <a href={phoneSearchUrl(b)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Find</a>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{cell(tm)}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{cell(b.trademarkMatch)}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[120px] truncate" title={b.source || ""}>{cell(b.source)}</td>
                        <td className="px-3 py-2 text-xs">
                          {b.sourceUrl ? (
                            <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                          {b.lastChecked ? b.lastChecked.slice(0, 10) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{cell(b.recordId)}</td>
                        <td className="px-3 py-2 text-xs">
                          <a href={mapsUrl(b)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                            Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-3 py-2 text-[10px] whitespace-nowrap">
                          <a href={usptoUrl(b.companyName)} target="_blank" rel="noopener noreferrer" onClick={() => markTrademark(b.id, "Checked — see USPTO")} className="text-violet-700 hover:underline mr-2">USPTO</a>
                          <button type="button" onClick={() => markTrademark(b.id, "Matched")} className="text-violet-600 hover:underline mr-1">Has TM</button>
                          <button type="button" onClick={() => markTrademark(b.id, "Not Found")} className="text-slate-500 hover:underline">No TM</button>
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
                  <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Prev</button>
                  <button disabled={page >= result.totalPages || loading} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next <ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p><strong>Columns (19 + Maps):</strong> Company Name · State · Entity Type · Entity Number · Status · Formation Date · Principal Address · City · ZIP · Registered Agent · Website · Business Email · Business Phone · Trademark Status · Trademark Match · Source · Source URL · Last Checked · Record ID · Google Maps</p>
        <p>CSV export aur Google Sheet sync bhi inhi headers ke sath jaate hain. Table pe right-scroll karo saari fields dekhne ke liye.</p>
      </div>
    </div>
  );
}
