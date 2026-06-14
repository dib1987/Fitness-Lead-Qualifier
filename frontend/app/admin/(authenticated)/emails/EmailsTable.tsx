"use client";

import { useEffect, useState } from "react";
import { statusMeta } from "@/lib/leadStatus";

type EmailLog = {
  id: string;
  to_address: string;
  subject: string;
  body_preview: string | null;
  step_number: number;
  status: string;
  sent_at: string;
};

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "bounce", label: "Bounce" },
  { value: "complaint", label: "Complaint" },
];

export default function EmailsTable() {
  const [items, setItems] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (status) params.set("status", status);

    fetch(`/api/admin/email-logs?${params.toString()}`)
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
  }, [page, status]);

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
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No emails found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              items.map((email) => {
                const meta = statusMeta(email.status);
                return (
                  <tr
                    key={email.id}
                    onClick={() => setPreviewEmail(email)}
                    className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 text-stone-600">{email.to_address}</td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-stone-900">{email.subject}</td>
                    <td className="px-4 py-3 text-stone-700">{email.step_number}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{new Date(email.sent_at).toLocaleString()}</td>
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

      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPreviewEmail(null)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">{previewEmail.subject}</h3>
              <button
                onClick={() => setPreviewEmail(null)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:border-amber-500 hover:text-amber-700"
              >
                Close
              </button>
            </div>
            <div className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-stone-700">
              {previewEmail.body_preview ?? "No preview available."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
