// F7 — Admin: export leads (current tenant's, RLS-scoped) as CSV.
import { NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase";

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: NextRequest) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const q = params.get("q")?.trim();

  let query = supabase
    .from("leads")
    .select("id, email_address, form_data, status, lead_score, created_at, utm_source, booked_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`email_address.ilike.%${q}%,form_data->>full_name.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: "Query failed" }, { status: 500 });

  const header = ["id", "full_name", "email", "status", "lead_score", "utm_source", "booked_at", "created_at"];
  const lines = [header.join(",")];
  for (const lead of data ?? []) {
    const formData = (lead.form_data ?? {}) as Record<string, unknown>;
    lines.push(
      [
        lead.id,
        formData.full_name,
        lead.email_address,
        lead.status,
        lead.lead_score,
        lead.utm_source,
        lead.booked_at,
        lead.created_at,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
}
