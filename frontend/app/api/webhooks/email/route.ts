// F3 — Email delivery events via Resend webhooks.
// Handles: email.delivered, email.bounced, email.complained.
// Inbound replies are out of scope (no reply tracking configured).
// Resend uses Svix for webhook signing — secret starts with whsec_
import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase";

type ResendEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
  };
};

export async function POST(request: NextRequest) {
  const raw = await request.text();

  // 1. Verify Resend webhook signature (Svix)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixHeaders = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };
    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(raw, svixHeaders);
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(raw) as ResendEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = event;
  const resendMessageId = data?.email_id;
  if (!resendMessageId) return Response.json({ status: "ok" });

  const db = createServiceClient();

  // 2. Find the matching email_log by provider_message_id
  const { data: emailLog } = await db
    .from("email_logs")
    .select("id, lead_id, tenant_id")
    .eq("provider_message_id", resendMessageId)
    .maybeSingle();

  if (!emailLog) {
    // Not a message we sent — ignore
    return Response.json({ status: "ok" });
  }

  if (type === "email.delivered") {
    await db
      .from("email_logs")
      .update({ status: "delivered" })
      .eq("id", emailLog.id);
  } else if (type === "email.bounced") {
    // Mark email log + lead status, pause enrollment
    await Promise.all([
      db.from("email_logs").update({ status: "bounce" }).eq("id", emailLog.id),
      db
        .from("leads")
        .update({ status: "bounced" })
        .eq("id", emailLog.lead_id),
      db
        .from("campaign_enrollments")
        .update({ status: "paused" })
        .eq("lead_id", emailLog.lead_id)
        .eq("status", "active"),
      db.from("audit_logs").insert({
        tenant_id: emailLog.tenant_id,
        lead_id: emailLog.lead_id,
        event: "email_bounced",
        old_status: "email_sent",
        new_status: "bounced",
        meta: { resend_message_id: resendMessageId, email_to: data.to?.[0] },
      }),
    ]);
  } else if (type === "email.complained") {
    // Spam complaint — pause enrollment, mark lead, log
    await Promise.all([
      db
        .from("email_logs")
        .update({ status: "complaint" })
        .eq("id", emailLog.id),
      db
        .from("leads")
        .update({ status: "complained", unsubscribed_at: new Date().toISOString() })
        .eq("id", emailLog.lead_id),
      db
        .from("campaign_enrollments")
        .update({ status: "paused" })
        .eq("lead_id", emailLog.lead_id)
        .eq("status", "active"),
      db.from("audit_logs").insert({
        tenant_id: emailLog.tenant_id,
        lead_id: emailLog.lead_id,
        event: "spam_complaint",
        old_status: "email_sent",
        new_status: "complained",
        meta: { resend_message_id: resendMessageId, email_to: data.to?.[0] },
      }),
    ]);
  }

  return Response.json({ status: "ok" });
}
