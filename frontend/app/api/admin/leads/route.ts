// F7 — Admin: list leads for the logged-in admin's tenant.
// Auth pattern (replaces x-admin-key): verify Supabase session, then read.
// Because the session client honours RLS (current_admin_tenant_ids()), the query
// is automatically scoped to tenants this admin manages — no manual tenant filter.
import { NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  let query = supabase
    .from("leads")
    .select("id, email_address, status, lead_score, created_at, utm_source")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data, error } = await query; // RLS scopes to admin's tenant(s)
  if (error) return Response.json({ error: "Query failed" }, { status: 500 });
  return Response.json({ leads: data });
}
