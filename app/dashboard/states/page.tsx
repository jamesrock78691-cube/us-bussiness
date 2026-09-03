import { US_STATES } from "@/lib/utils";
import { MapPin, Circle } from "lucide-react";
import { getOpenDataStats } from "@/lib/sources/stats";

export const dynamic = "force-dynamic";

export default async function StatesPage() {
  const open = await getOpenDataStats();

  const LIVE: Record<string, { records: number; label: string }> = {
    CO: { records: open.colorado, label: "Open Data API" },
    NY: { records: open.newYork, label: "Open Data API" },
    CT: { records: open.connecticut, label: "Open Data + Emails" },
    OR: { records: open.oregon, label: "Open Data API" },
    PA: { records: open.pennsylvania, label: "Open Data API" },
  };

  const liveCount = Object.keys(LIVE).length;
  const remaining = US_STATES.length - liveCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">States Coverage</h1>
        <p className="text-slate-500 mt-1">
          Track data collection across all 50 states + DC
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
          Live ({liveCount})
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
          <Circle className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
          Not started ({remaining})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {US_STATES.map((state) => {
          const live = LIVE[state.code];
          return (
            <div
              key={state.code}
              className={`rounded-xl border p-4 shadow-sm flex items-start gap-3 ${
                live
                  ? "bg-emerald-50/40 border-emerald-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  live
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{state.code}</div>
                <div className="text-sm text-slate-500 truncate">{state.name}</div>
                <div className="mt-1.5">
                  {live ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                      Live · {live.records.toLocaleString()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                      Not started
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
