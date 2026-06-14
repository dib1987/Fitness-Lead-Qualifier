// F1 — Web lead capture. Reference implementation of the route pattern:
// rate-limit -> validate -> resolve tenant -> dedup -> insert (service role) -> enqueue job.
// Ported from backend/app/api/v1/leads.py. Returns the same friendly messages.
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { LeadFormSchema } from "@shared/lead-types";
import { dedupDecision, type ExistingLead } from "@shared/dedup";
import { tasks, auth } from "@trigger.dev/sdk/v3";
// import { ratelimit } from "@/lib/ratelimit";  // Upstash limiter (F15)

export async function POST(request: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await ctx.params;

  // 1. Rate limit (F15 — Upstash). TODO wire limiter.
  // const { success } = await ratelimit.limit(`leads:${tenantSlug}`);
  // if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });

  // 2. Validate body (F1)
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = LeadFormSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const email = body.email_address.toLowerCase();

  const db = createServiceClient();

  // 3. Resolve tenant
  const { data: tenant } = await db
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!tenant) return Response.json({ error: `Tenant '${tenantSlug}' not found` }, { status: 404 });

  // 4. Dedup (F1) — fetch most recent lead for this email+tenant, decide outcome
  const { data: prior } = await db
    .from("leads")
    .select("id, status, created_at")
    .eq("tenant_id", tenant.id)
    .eq("email_address", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let existing: ExistingLead | null = null;
  if (prior) {
    const { data: active } = await db
      .from("campaign_enrollments")
      .select("id")
      .eq("lead_id", prior.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    existing = {
      createdAt: new Date(prior.created_at),
      status: prior.status,
      hasActiveEnrollment: !!active,
    };
  }

  const outcome = dedupDecision(existing);
  if (outcome === "already_enrolled") {
    return Response.json({
      status: "already_enrolled",
      message: "We already have your enquiry and our team is working on it. You will hear from us very soon.",
    });
  }
  if (outcome === "already_submitted") {
    return Response.json({
      status: "already_submitted",
      message: "You are already part of our journey sequence. Keep an eye on your inbox — we will be in touch.",
    });
  }

  // 5. Insert lead (service role). UTM in dedicated columns, not in form_data.
  const { utm_source, utm_medium, utm_campaign, email_address, ...formData } = body;
  const { data: lead, error } = await db
    .from("leads")
    .insert({
      tenant_id: tenant.id,
      email_address: email,
      form_data: formData,
      status: "received",
      utm_source, utm_medium, utm_campaign,
    })
    .select("id")
    .single();
  if (error || !lead) {
    return Response.json({ error: "Could not create lead" }, { status: 500 });
  }

  // 6. Enqueue the Day-0 pipeline (F4). Commit-before-enqueue is automatic here
  //    because the insert above already persisted.
  const handle = await tasks.trigger("process-lead", { leadId: lead.id });

  // Scoped, short-lived token so the browser can subscribe to this run's
  // Realtime updates without needing a full Trigger.dev secret key.
  const publicAccessToken = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "15m",
  });

  return Response.json(
    {
      id: lead.id,
      status: "received",
      message: "Thank you for your enquiry. You will receive a personalised email from us within the next few minutes.",
      runId: handle.id,
      publicAccessToken,
    },
    { status: 202 }
  );
}
