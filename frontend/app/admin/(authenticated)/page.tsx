import { createSessionClient } from "@/lib/supabase";
import { statusMeta } from "@/lib/leadStatus";

// F8 — Admin dashboard: KPIs + leads-by-status breakdown for the admin's tenant(s).
// Auth is already verified by middleware.ts + admin/layout.tsx — no need to re-check here.
export default async function AdminDashboard() {
  const supabase = await createSessionClient();

  const { data: leads } = await supabase.from("leads").select("status, lead_score, booked_at");
  const { count: emailsSent } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent");

  const rows = leads ?? [];
  const total = rows.length;
  const booked = rows.filter((l) => l.booked_at !== null).length;
  const scored = rows.filter((l) => l.lead_score !== null);
  const avgScore = scored.length
    ? scored.reduce((sum, l) => sum + (l.lead_score ?? 0), 0) / scored.length
    : null;

  const byStatus = rows.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const kpis = [
    { label: "Total Leads", value: total },
    { label: "Emails Sent", value: emailsSent ?? 0 },
    { label: "Avg Lead Score", value: avgScore != null ? avgScore.toFixed(1) : "—" },
    { label: "Booked", value: booked },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Overview</h1>
      <p className="mt-1 text-sm text-stone-600">Live snapshot of your lead pipeline.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-semibold text-stone-900">{k.value}</div>
            <div className="mt-1 text-sm text-stone-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Leads by Status</h2>
        <div className="mt-4 space-y-3">
          {total === 0 && <p className="text-sm text-stone-500">No leads yet.</p>}
          {Object.entries(byStatus).map(([status, count]) => {
            const meta = statusMeta(status);
            const pct = Math.round((count / total) * 100);
            return (
              <div key={status}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-stone-700">{meta.label}</span>
                  <span className="text-stone-500">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: meta.barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
