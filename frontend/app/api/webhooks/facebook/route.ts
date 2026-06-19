// F2 — Facebook Lead Ads webhook. Ported from webhooks_facebook.py.
// GET = Meta verification challenge. POST = leadgen events.
// Must verify X-Hub-Signature-256 (HMAC-SHA256) on the RAW body, then dedup,
// fetch from Graph API, resolve tenant by config.fb_page_id, insert + enqueue.
// Always return 200 — a non-200 makes Meta retry and storm duplicates.
import { NextRequest } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase";
import { tasks } from "@trigger.dev/sdk/v3";

const GRAPH_API_VERSION = "v19.0";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === process.env.FB_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  // Always return 200 to prevent Meta retry storms. Process asynchronously.
  const ok = Response.json({ status: "ok" });

  // 1. Verify HMAC-SHA256 signature
  const secret = process.env.FB_APP_SECRET;
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  if (secret) {
    const expected =
      "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      return ok;
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return ok;
  }

  const entries = (body as Record<string, unknown>)?.entry;
  if (!Array.isArray(entries)) return ok;

  const db = createServiceClient();

  for (const entry of entries) {
    const pageId = (entry as Record<string, unknown>).id as string | undefined;
    const changes = (entry as Record<string, unknown>).changes;
    if (!pageId || !Array.isArray(changes)) continue;

    for (const change of changes) {
      if ((change as Record<string, unknown>).field !== "leadgen") continue;

      const value = (change as Record<string, unknown>).value as Record<string, unknown>;
      const leadgenId = value?.leadgen_id as string | undefined;
      if (!leadgenId) continue;

      // 2. Dedup: skip if we already processed this leadgen_id
      const { data: existing } = await db
        .from("leads")
        .select("id")
        .eq("fb_leadgen_id", leadgenId)
        .maybeSingle();
      if (existing) continue;

      // 3. Resolve tenant by page_id stored in tenants.config->>'fb_page_id'
      const { data: tenant } = await db
        .from("tenants")
        .select("id")
        .eq("is_active", true)
        .filter("config->>fb_page_id", "eq", pageId)
        .maybeSingle();
      if (!tenant) continue;

      // 4. Fetch lead field data from Facebook Graph API
      const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
      if (!accessToken) continue;

      let graphData: Record<string, unknown>;
      try {
        const graphRes = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?fields=field_data&access_token=${accessToken}`
        );
        if (!graphRes.ok) continue;
        graphData = await graphRes.json();
      } catch {
        continue;
      }

      const fieldDataArr = graphData.field_data;
      if (!Array.isArray(fieldDataArr)) continue;

      // Map Facebook field_data array to a flat object
      const fm: Record<string, string> = {};
      for (const f of fieldDataArr) {
        const name = (f as Record<string, unknown>).name as string;
        const values = (f as Record<string, unknown>).values;
        fm[name] = Array.isArray(values) ? (values[0] as string) ?? "" : "";
      }

      const email = (fm.email ?? "").toLowerCase().trim();
      if (!email) continue;

      // Build form_data matching our LeadFormSchema shape
      const fullName =
        fm.full_name ||
        [fm.first_name, fm.last_name].filter(Boolean).join(" ") ||
        "";
      const formData = {
        full_name: fullName,
        phone_number: fm.phone_number ?? fm.phone ?? "",
        fitness_goal:
          fm.fitness_goal ??
          fm.what_is_your_fitness_goal ??
          "general fitness",
        preferred_gym_location:
          fm.preferred_gym_location ?? fm.location ?? "",
        membership_type: fm.membership_type ?? "",
      };

      // 5. Insert lead (service role)
      const { data: lead, error } = await db
        .from("leads")
        .insert({
          tenant_id: tenant.id,
          email_address: email,
          form_data: formData,
          status: "received",
          fb_leadgen_id: leadgenId,
          utm_source: "facebook",
          utm_medium: "paid_social",
          utm_campaign: (value.ad_id as string | undefined) ?? null,
        })
        .select("id")
        .single();

      if (error || !lead) continue;

      // 6. Trigger Day-0 pipeline (same as web form)
      await tasks.trigger("process-lead", { leadId: lead.id });
    }
  }

  return ok;
}
