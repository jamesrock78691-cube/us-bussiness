import {
  Building2,
  MapPin,
  Search,
  Database,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import { US_STATES } from "@/lib/utils";

const stats = [
  {
    label: "Total Businesses",
    value: "—",
    sub: "Connect DB to load",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    label: "States Covered",
    value: "0 / 51",
    sub: "Including DC",
    icon: MapPin,
    color: "bg-emerald-500",
  },
  {
    label: "Active Records",
    value: "—",
    sub: "Status = Active",
    icon: Activity,
    color: "bg-violet-500",
  },
  {
    label: "Last Export",
    value: "Never",
    sub: "CSV / Sheets",
    icon: FileSpreadsheet,
    color: "bg-amber-500",
  },
];

const quickLinks = [
  {
    href: "/dashboard/search",
    title: "Search Businesses",
    desc: "Filter by state, entity type, status, city & more",
    icon: Search,
  },
  {
    href: "/dashboard/states",
    title: "States Coverage",
    desc: "See which states have data collectors ready",
    icon: MapPin,
  },
  {
    href: "/dashboard/sources",
    title: "Data Sources",
    desc: "Manage SOS collectors and update status",
    icon: Database,
  },
  {
    href: "/dashboard/export",
    title: "Export / Sheets",
    desc: "Download CSV or sync to Google Sheets",
    icon: FileSpreadsheet,
  },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 mt-1">
          50-state US business database dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
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

      {/* Quick links */}
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

      {/* States preview */}
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
          {US_STATES.slice(0, 20).map((s) => (
            <span
              key={s.code}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
            >
              {s.code}
            </span>
          ))}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-400">
            +{US_STATES.length - 20} more
          </span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Next step:</strong> Connect a real PostgreSQL database, run{" "}
        <code className="bg-amber-100 px-1 rounded">npx prisma db push</code>{" "}
        and <code className="bg-amber-100 px-1 rounded">npm run db:seed</code>,
        then start building state collectors.
      </div>
    </div>
  );
}
