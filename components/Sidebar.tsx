"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Search,
  Database,
  FileSpreadsheet,
  Settings,
  LayoutDashboard,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/search", label: "Search Businesses", icon: Search },
  { href: "/dashboard/states", label: "States", icon: Map },
  { href: "/dashboard/export", label: "Export / Sheets", icon: FileSpreadsheet },
  { href: "/dashboard/sources", label: "Data Sources", icon: Database },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">US Business DB</div>
            <div className="text-[11px] text-slate-400">50-State Dashboard</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-blue-600/20 text-blue-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500">
        v0.1.0 · Step 1 Setup
      </div>
    </aside>
  );
}
