// E2E for F2 (Facebook) / F3 (Resend email) webhooks.
// Both routes are stubs — only what's implemented today is asserted here.
// Extend these as the TODOs in the route files are filled in.
import { test, expect } from "@playwright/test";
import crypto from "crypto";

test.describe("F2 Facebook webhook — /api/webhooks/facebook", () => {
  test("GET verification challenge", async ({ request }) => {
    const verifyToken = process.env.FB_WEBHOOK_VERIFY_TOKEN;
    test.skip(!verifyToken, "FB_WEBHOOK_VERIFY_TOKEN not set in env");

    const res = await request.get("/api/webhooks/facebook", {
      params: { "hub.mode": "subscribe", "hub.verify_token": verifyToken!, "hub.challenge": "1234" },
    });
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("1234");
  });

  test("GET with wrong verify token is rejected", async ({ request }) => {
    const res = await request.get("/api/webhooks/facebook", {
      params: { "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "1234" },
    });
    expect(res.status()).toBe(403);
  });

  test("POST with valid signature returns 200 ok", async ({ request }) => {
    const secret = process.env.FB_APP_SECRET;
    test.skip(!secret, "FB_APP_SECRET not set in env");

    const body = JSON.stringify({ entry: [] });
    const sig = "sha256=" + crypto.createHmac("sha256", secret!).update(body).digest("hex");
    const res = await request.post("/api/webhooks/facebook", {
      data: body,
      headers: { "x-hub-signature-256": sig, "content-type": "application/json" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  // TODO once F2 body is implemented: assert a lead is inserted for the
  // tenant matching page_id, and process-lead is enqueued.
});

test.describe("F3 Resend email webhook — /api/webhooks/email", () => {
  test("POST returns 200 ok (signature verification not yet implemented)", async ({ request }) => {
    const res = await request.post("/api/webhooks/email", { data: JSON.stringify({ type: "email.bounced" }) });
    expect(res.status()).toBe(200);
  });

  // TODO once F3 is implemented:
  //  - reject requests with an invalid Resend (svix) signature
  //  - bounce/complaint events update email_logs.status + suppress the address
  //  - inbound reply matches provider_message_id and sets enrollment.status = 'replied'
});
