"use client";

import { FileSpreadsheet, Download, Table2 } from "lucide-react";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export / Sheets</h1>
        <p className="text-slate-500 mt-1">
          Download CSV or sync selected records to Google Sheets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CSV */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">CSV Export</h2>
              <p className="text-sm text-slate-500">
                Download filtered results as CSV
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Export matches the 19-column business template (Company Name, State,
            Entity Type, Status, Address, Trademark fields, etc.).
          </p>
          <button
            disabled
            className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed"
          >
            Export CSV (coming after data)
          </button>
        </div>

        {/* Google Sheets */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Google Sheets</h2>
              <p className="text-sm text-slate-500">
                Sync for reporting (not primary DB)
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Google Sheet is for reporting/sync only. Primary storage remains
            PostgreSQL.
          </p>
          <button
            disabled
            className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed"
          >
            Connect Google Sheets (later)
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-slate-400 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-800">Template columns</p>
            <p className="mt-1 leading-relaxed">
              Company Name, State, Entity Type, Entity Number, Status, Formation
              Date, Principal Address, City, ZIP, Registered Agent, Website,
              Business Email, Business Phone, Trademark Status, Trademark Match,
              Source, Source URL, Last Checked, Record ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
