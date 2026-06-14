// E2E for F9 — GET /api/unsubscribe/[token]. Requires local Supabase running
// with `supabase/seed.sql` applied.
import { test, expect } from "@playwright/test";
import { testDb } from "./helpers/db";

const TENANT = "crunch_fitness";

test.describe("F9 unsubscribe — GET /api/unsubscribe/[token]", () => {
  test("valid token marks lead unsubscribed and pauses active enrollments", async ({ request }) => {
    const db = testDb();

    const { data: tenant } = await db.from("tenants").select("id").eq("slug", TENANT).single();
    const { data: lead } = await db
      .from("leads")
      .insert({
        tenant_id: tenant!.id,
        email_address: `e2e-unsub-${Date.now()}@example.com`,
        form_data: { full_name: "Unsub Test" },
        status: "email_sent",
      })
      .select("id, unsubscribe_token")
      .single();

    const { data: campaign } = await db
      .from("campaigns")
      .select("id")
      .eq("tenant_id", tenant!.id)
      .single();
    const { data: enrollment } = await db
      .from("campaign_enrollments")
      .insert({ tenant_id: tenant!.id, lead_id: lead!.id, campaign_id: campaign!.id, status: "active" })
      .select("id")
      .single();

    const res = await request.get(`/api/unsubscribe/${lead!.unsubscribe_token}`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("unsubscribed");

    const { data: updatedLead } = await db.from("leads").select("unsubscribed_at").eq("id", lead!.id).single();
    expect(updatedLead!.unsubscribed_at).not.toBeNull();

    const { data: updatedEnrollment } = await db
      .from("campaign_enrollments")
      .select("status")
      .eq("id", enrollment!.id)
      .single();
    expect(updatedEnrollment!.status).toBe("paused");
  });

  test("unknown token still returns 200 (no enumeration)", async ({ request }) => {
    const res = await request.get(`/api/unsubscribe/00000000-0000-0000-0000-000000000000`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("unsubscribed");
  });
});
