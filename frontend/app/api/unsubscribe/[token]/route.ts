// F9 — One-click unsubscribe. Ported from unsubscribe.py.
// Looks up the lead by unsubscribe_token, marks unsubscribed_at, pauses enrollments.
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const db = createServiceClient();

  const { data: lead } = await db
    .from("leads")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (lead) {
    await db.from("leads").update({ unsubscribed_at: new Date().toISOString() }).eq("id", lead.id);
    await db
      .from("campaign_enrollments")
      .update({ status: "paused" })
      .eq("lead_id", lead.id)
      .eq("status", "active");
  }

  // Always show a friendly page even if token is unknown (no enumeration).
  return new Response("<h1>You have been unsubscribed.</h1>", {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
