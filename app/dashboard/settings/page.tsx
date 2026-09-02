import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Settings, User, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Account and application settings</p>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Account</h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">
              {session?.user?.email || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">
              {session?.user?.name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-slate-900 capitalize">
              {(session?.user as any)?.role || "user"}
            </span>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Security</h2>
        </div>
        <div className="p-5 text-sm text-slate-600">
          <p>
            Default seed password is{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              admin123
            </code>
            . Change it immediately after first login in production.
          </p>
        </div>
      </div>

      {/* App */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Application</h2>
        </div>
        <div className="p-5 space-y-2 text-sm text-slate-600">
          <p>
            <span className="text-slate-500">Version:</span>{" "}
            <span className="font-medium text-slate-800">0.1.0</span>
          </p>
          <p>
            <span className="text-slate-500">Stack:</span> Next.js 16 · Prisma ·
            NextAuth · Tailwind · PostgreSQL
          </p>
          <p className="pt-2 text-slate-500">
            Google Sheets is for reporting only — PostgreSQL is the source of
            truth.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Settings className="w-3.5 h-3.5" />
        More settings (password change, team members, API keys) can be added
        later.
      </div>
    </div>
  );
}
