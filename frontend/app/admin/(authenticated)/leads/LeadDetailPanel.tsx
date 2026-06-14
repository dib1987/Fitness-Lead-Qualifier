"use client";

import { useEffect, useState } from "react";
import { statusMeta } from "@/lib/leadStatus";

type Lead = {
  id: string;
  email_address: string;
  form_data: Record<string, unknown>;
  status: string;
  lead_score: number | null;
  notes: string | null;
  booked_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type EmailLog = {
  id: string;
  step_number: number;
  subject: string;
  body_preview: string | null;
  status: string;
  sent_at: string;
};

type AuditLog = {
  id: string;
  event: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
};

type Detail = {
  lead: Lead;
  email_logs: EmailLog[];
  audit_logs: AuditLog[];
};

export default function LeadDetailPanel({
  leadId,
  onClose,
  onChanged,
}: {
  leadId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [marking, setMarking] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/leads/${leadId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((data: Detail) => {
        setDetail(data);
        setNotes(data.lead.notes ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = await res.json();
      setDetail((d) => (d ? { ...d, lead: data.lead } : d));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingNotes(false);
    }
  }

  async function markBooked() {
    setMarking(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/booked`, { method: "PATCH" });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      load();
      onChanged();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Lead Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:border-amber-500 hover:text-amber-700"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && <p className="text-stone-500">Loading…</p>}
          {!loading && error && <p className="text-red-600">{error}</p>}

          {!loading && !error && detail && (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-stone-900">
                    {String(detail.lead.form_data?.full_name ?? detail.lead.email_address)}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta(detail.lead.status).badgeClass}`}
                  >
                    {statusMeta(detail.lead.status).label}
                  </span>
                  {detail.lead.status !== "booked" && (
                    <button
                      onClick={markBooked}
                      disabled={marking}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                    >
                      {marking ? "Saving…" : "Mark as Booked"}
                    </button>
                  )}
                  {detail.lead.status === "booked" && detail.lead.booked_at && (
                    <span className="text-sm text-violet-700">
                      Booked {new Date(detail.lead.booked_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {detail.lead.email_address} · Score:{" "}
                  <strong className="text-stone-900">{detail.lead.lead_score ?? "—"}</strong>
                </p>
                {(detail.lead.utm_source || detail.lead.utm_medium || detail.lead.utm_campaign) && (
                  <p className="mt-1 text-xs text-stone-500">
                    Source: <strong>{detail.lead.utm_source ?? "—"}</strong>
                    {detail.lead.utm_medium && (
                      <>
                        {" "}
                        · Medium: <strong>{detail.lead.utm_medium}</strong>
                      </>
                    )}
                    {detail.lead.utm_campaign && (
                      <>
                        {" "}
                        · Campaign: <strong>{detail.lead.utm_campaign}</strong>
                      </>
                    )}
                  </p>
                )}
              </div>

              <section className="mb-6">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Form Data</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(detail.lead.form_data ?? {})
                      .filter(([key]) => key !== "email_address")
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td className="w-40 py-1 align-top text-stone-500">{key.replace(/_/g, " ")}</td>
                          <td className="py-1 text-stone-900">{String(value ?? "—")}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </section>

              <section className="mb-6">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note about this lead…"
                  className="h-24 w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="mt-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  {savingNotes ? "Saving…" : "Save Note"}
                </button>
              </section>

              <section className="mb-6">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Emails ({detail.email_logs.length})
                </h4>
                {detail.email_logs.length === 0 && <p className="text-sm text-stone-500">No emails sent yet.</p>}
                <div className="space-y-2">
                  {detail.email_logs.map((email) => (
                    <div key={email.id} className="rounded-lg border border-stone-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-stone-900">
                          Step {email.step_number} — {email.subject}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta(email.status).badgeClass}`}>
                          {statusMeta(email.status).label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-stone-500">{new Date(email.sent_at).toLocaleString()}</div>
                      {email.body_preview && (
                        <button
                          onClick={() => setPreviewEmail(email)}
                          className="mt-2 rounded-lg border border-stone-300 px-3 py-1 text-xs text-stone-600 hover:border-amber-500 hover:text-amber-700"
                        >
                          Preview ▸
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Audit Trail</h4>
                {detail.audit_logs.length === 0 && <p className="text-sm text-stone-500">No audit events.</p>}
                <div className="space-y-2">
                  {detail.audit_logs.map((entry) => (
                    <div key={entry.id} className="flex gap-3 border-b border-stone-100 pb-2 text-sm last:border-0">
                      <div>
                        <div className="font-medium text-stone-900">{entry.event}</div>
                        <div className="text-xs text-stone-500">
                          {entry.old_status ?? "—"} → {entry.new_status} · {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
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
              {previewEmail.body_preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
