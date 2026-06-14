"use client";

import { useEffect, useState } from "react";
import { statusMeta } from "@/lib/leadStatus";
import LeadDetailPanel from "./LeadDetailPanel";

type Lead = {
  id: string;
  email_address: string;
  form_data: Record<string, unknown>;
  status: string;
  lead_score: number | null;
  created_at: string;
  utm_source: string | null;
};

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "received", label: "Received" },
  { value: "processing", label: "Processing" },
  { value: "email_sent", label: "Email Sent" },
  { value: "email_failed", label: "Email Failed" },
  { value: "completed", label: "Completed" },
  { value: "booked", label: "Booked" },
];

export default function LeadsTable() {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (status) params.set("status", status);
      if (search.trim()) params.set("q", search.trim());

      fetch(`/api/admin/leads?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          return res.json();
        })
        .then((data) => {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [page, status, search, refreshKey]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    const url = `/api/admin/leads/export${params.toString() ? `?${params.toString()}` : ""}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = "leads.csv";
        a.click();
        URL.revokeObjectURL(objectUrl);
      })
      .catch((e) => alert(e.message));
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
          className="min-w-[220px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        <button
          onClick={exportCsv}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-500 hover:text-amber-700"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No leads found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              items.map((lead) => {
                const meta = statusMeta(lead.status);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {String(lead.form_data?.full_name ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{lead.email_address}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{lead.lead_score ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-500">{lead.utm_source ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
        <span>{total ? `${start}–${end} of ${total}` : "0 results"}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={end >= total}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
