// F3 — Email events via RESEND inbound webhooks (decision #1: moved off SES).
// Handles: delivered, bounced, complained, and inbound replies.
// On a reply: match the In-Reply-To / message id to email_logs.provider_message_id,
// find the active enrollment, set it to "replied" (pauses the sequence), alert staff.
// Verify the Resend webhook signature before trusting the payload.
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  // TODO: verify Resend webhook signature (svix headers) on `raw`.
  // TODO: switch on event type:
  //   email.bounced / email.complained -> mark email_log + suppress address
  //   inbound reply                    -> match provider_message_id -> enrollment.status = 'replied'
  //                                       + admin alert (F3)
  void raw;
  return Response.json({ status: "ok" });
}
