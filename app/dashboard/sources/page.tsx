import { Database, RefreshCw, ExternalLink } from "lucide-react";

const plannedSources = [
  {
    state: "CA",
    name: "California Secretary of State",
    status: "planned",
    notes: "Business search + entity details",
  },
  {
    state: "TX",
    name: "Texas Comptroller / SOS",
    status: "planned",
    notes: "Franchise tax & entity data",
  },
  {
    state: "NY",
    name: "New York Department of State",
    status: "planned",
    notes: "Corporation & business entity search",
  },
  {
    state: "FL",
    name: "Florida Division of Corporations",
    status: "planned",
    notes: "Sunbiz search",
  },
  {
    state: "DE",
    name: "Delaware Division of Corporations",
    status: "planned",
    notes: "Entity search (high volume)",
  },
];

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
          <p className="text-slate-500 mt-1">
            State SOS collectors and update status
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          Run all collectors
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Collectors are not implemented yet. Always respect official SOS terms of
        service and rate limits when you add them.
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            Planned collectors
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {plannedSources.map((src) => (
            <div
              key={src.state}
              className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/80"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">
                    {src.state}
                  </span>
                  <span className="text-slate-700">{src.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 capitalize">
                    {src.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{src.notes}</p>
              </div>
              <button
                disabled
                className="text-slate-300 p-1.5 rounded hover:bg-slate-100 cursor-not-allowed"
                title="Not available yet"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
