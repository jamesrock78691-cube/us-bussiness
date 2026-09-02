import { US_STATES } from "@/lib/utils";
import { MapPin, Circle } from "lucide-react";

export default function StatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">States Coverage</h1>
        <p className="text-slate-500 mt-1">
          Track data collection progress across all 50 states + DC
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
          <Circle className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
          Not started ({US_STATES.length})
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
          <Circle className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          In progress (0)
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
          Complete (0)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {US_STATES.map((state) => (
          <div
            key={state.code}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">
                {state.code}
              </div>
              <div className="text-sm text-slate-500 truncate">{state.name}</div>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                  Not started
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
