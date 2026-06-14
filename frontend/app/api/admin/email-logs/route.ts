// F7 — Admin: paginated list of sent emails for the logged-in admin's tenant.
// RLS-scoped via the session client — no manual tenant filter needed.
import { NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("page_size") ?? "25") || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("email_logs")
    .select("id, to_address, subject, body_preview, step_number, status, sent_at", { count: "exact" })
    .order("sent_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return Response.json({ error: "Query failed" }, { status: 500 });
  return Response.json({ items: data, total: count ?? 0 });
}
