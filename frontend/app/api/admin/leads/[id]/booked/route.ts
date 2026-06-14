// F7 — Admin: mark a lead as booked.
// Verify the lead is visible via the RLS-scoped session client (proves tenant
// ownership), then write via the service client per guardrail #1, recording
// the status change in audit_logs.
import { createSessionClient, createServiceClient } from "@/lib/supabase";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: lead, error: readError } = await supabase
    .from("leads")
    .select("id, tenant_id, status")
    .eq("id", id)
    .single();
  if (readError || !lead) return Response.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const service = createServiceClient();
  const { data: updated, error } = await service
    .from("leads")
    .update({ status: "booked", booked_at: now, updated_at: now })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return Response.json({ error: "Update failed" }, { status: 500 });

  await service.from("audit_logs").insert({
    tenant_id: lead.tenant_id,
    lead_id: id,
    event: "marked_booked",
    old_status: lead.status,
    new_status: "booked",
    meta: {},
  });

  return Response.json({ lead: updated });
}
