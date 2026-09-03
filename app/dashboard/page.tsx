import {
  Building2,
  MapPin,
  Search,
  Database,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { US_STATES } from "@/lib/utils";
import { getOpenDataStats } from "@/lib/sources/stats";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const open = await getOpenDataStats();

  const stats = [
    {
      label: "Total Available",
      value: open.totalApprox.toLocaleString(),
      sub: "From free open-data sources",
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      label: "Live States",
      value: `${open.liveStates} / 51`,
      sub: "Colorado + New York live",
      icon: MapPin,
      color: "bg-emerald-500",
    },
    {
      label: "Colorado",
      value: open.colorado.toLocaleString(),
      sub: "SOS Open Data (live)",
      icon: Activity,
      color: "bg-violet-500",
    },
    {
      label: "New York",
      value: open.newYork.toLocaleString(),
      sub: "DOS Open Data (live)",
      icon: Database,
      color: "bg-amber-500",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/search",
      title: "Search Businesses",
      desc: "Filter by state (try CO or NY), entity type, city & more",
      icon: Search,
    },
    {
      href: "/dashboard/states",
      title: "States Coverage",
      desc: "See which states have live free data",
      icon: MapPin,
    },
    {
      href: "/dashboard/sources",
      title: "Data Sources",
      desc: "Live open-data collectors status",
      icon: Database,
    },
    {
      href: "/dashboard/export",
      title: "Export / Sheets",
      desc: "Download CSV or sync to Google Sheets",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 mt-1">
          50-state US business database — free open data live
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-white`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Live free data ready.</strong> Search page pe State ={" "}
          <code className="bg-emerald-100 px-1 rounded">CO</code> ya{" "}
          <code className="bg-emerald-100 px-1 rounded">NY</code> select karke
          real government records search karo (~
          {open.totalApprox.toLocaleString()} entities).
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition">
                  <link.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                    {link.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{link.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Live Sources
          </h2>
          <a
            href="/dashboard/sources"
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </a>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {open.sources.map((s) => (
            <div
              key={s.code}
              className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3"
            >
              <div>
                <div className="font-semibold text-slate-900">
                  {s.code} — {s.name}
                </div>
                <div className="text-xs text-slate-500">{s.type}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-700">
                  {s.records.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium">
                  LIVE
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            States ({US_STATES.length})
          </h2>
          <a
            href="/dashboard/states"
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {US_STATES.slice(0, 24).map((s) => {
            const live = s.code === "CO" || s.code === "NY";
            return (
              <span
                key={s.code}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  live
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {s.code}
                {live && " ✓"}
              </span>
            );
          })}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-400">
            +{US_STATES.length - 24} more
          </span>
        </div>
      </div>
    </div>
  );
}
