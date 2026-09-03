import { Database, ExternalLink, CheckCircle2 } from "lucide-react";
import { getOpenDataStats } from "@/lib/sources/stats";

export const dynamic = "force-dynamic";

const upcoming = [
  { state: "CT", name: "Connecticut", notes: "Free open data (Socrata)" },
  { state: "PA", name: "Pennsylvania", notes: "Free open data (Socrata)" },
  { state: "OR", name: "Oregon", notes: "Free open data (Socrata)" },
  { state: "FL", name: "Florida Sunbiz", notes: "Free bulk files available" },
  { state: "CA", name: "California", notes: "Paid bulk / gated API" },
  { state: "TX", name: "Texas", notes: "Paid SOSDirect" },
  { state: "DE", name: "Delaware", notes: "No free bulk — paid only" },
];

export default async function SourcesPage() {
  const open = await getOpenDataStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
        <p className="text-slate-500 mt-1">
          Official free open-data collectors and planned sources
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>2 live free sources</strong> connected. Search page se State =
          CO ya NY select karke real data query hota hai (no scraping, official
          APIs).
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Live sources</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {open.sources.map((src) => (
            <div
              key={src.code}
              className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/80"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{src.code}</span>
                  <span className="text-slate-700">{src.name} SOS</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                    LIVE
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {src.type} · {src.records.toLocaleString()} records
                </p>
              </div>
              <a
                href={`/dashboard/search?state=${src.code}`}
                className="text-blue-600 p-1.5 rounded hover:bg-blue-50"
                title="Search this state"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            Upcoming / planned
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {upcoming.map((src) => (
            <div
              key={src.state}
              className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/80"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{src.state}</span>
                  <span className="text-slate-700">{src.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                    planned
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{src.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
