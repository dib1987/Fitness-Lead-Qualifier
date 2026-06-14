// F2 — Facebook Lead Ads webhook. Ported from webhooks_facebook.py.
// GET = Meta verification challenge. POST = lead events.
// Must verify X-Hub-Signature-256 (HMAC-SHA256) on the RAW body, then dedup,
// fetch from Graph API, resolve tenant by page_id, insert + enqueue.
// Always return 200 (a non-200 makes Meta retry and storm duplicates).
import { NextRequest } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.FB_WEBHOOK_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = process.env.FB_APP_SECRET;
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  if (secret) {
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      // Reject but still 200, exactly like A.
      return Response.json({ status: "ok" });
    }
  }
  // TODO: parse entries, dedup by fb_leadgen_id, Graph API fetch, tenant-by-page_id,
  //       insert lead, enqueue process-lead. See webhooks_facebook.py for the flow.
  return Response.json({ status: "ok" });
}
