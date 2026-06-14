// F7 — Admin: update a lead's internal notes.
// Verify the lead is visible via the RLS-scoped session client (proves tenant
// ownership), then write via the service client per guardrail #1.
import { z } from "zod";
import { createSessionClient, createServiceClient } from "@/lib/supabase";

const bodySchema = z.object({ notes: z.string().max(5000) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: lead, error: readError } = await supabase.from("leads").select("id").eq("id", id).single();
  if (readError || !lead) return Response.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const service = createServiceClient();
  const { data: updated, error } = await service
    .from("leads")
    .update({ notes: parsed.data.notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return Response.json({ error: "Update failed" }, { status: 500 });
  return Response.json({ lead: updated });
}
