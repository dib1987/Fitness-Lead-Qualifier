// F7 — Admin: single lead detail (form data, email history, audit trail, enrollment).
// RLS-scoped via the session client — a 404 means either the lead doesn't exist or
// belongs to a tenant this admin doesn't manage.
import { createSessionClient } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error || !lead) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: emailLogs } = await supabase
    .from("email_logs")
    .select("id, step_number, to_address, subject, body_preview, status, sent_at")
    .eq("lead_id", id)
    .order("sent_at", { ascending: true });

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, event, old_status, new_status, meta, created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: true });

  const { data: enrollment } = await supabase
    .from("campaign_enrollments")
    .select("id, status, current_step, next_send_at, enrolled_at, completed_at, replied_at")
    .eq("lead_id", id)
    .maybeSingle();

  return Response.json({
    lead,
    email_logs: emailLogs ?? [],
    audit_logs: auditLogs ?? [],
    enrollment: enrollment ?? null,
  });
}
