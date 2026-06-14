// E2E for F1 — POST /api/leads/[tenant]. Requires local Supabase running with
// `supabase/seed.sql` applied (provides the `crunch_fitness` tenant).
import { test, expect } from "@playwright/test";

const TENANT = "crunch_fitness";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe("F1 lead capture — POST /api/leads/[tenant]", () => {
  test("valid submission is accepted", async ({ request }) => {
    const res = await request.post(`/api/leads/${TENANT}`, {
      data: {
        full_name: "E2E Test User",
        email_address: uniqueEmail(),
        fitness_goal: "weight_loss",
        preferred_gym_location: "downtown",
      },
    });
    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.status).toBe("received");
    expect(body.id).toBeTruthy();
  });

  test("rejects invalid email", async ({ request }) => {
    const res = await request.post(`/api/leads/${TENANT}`, {
      data: { full_name: "Bad Email", email_address: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });

  test("unknown tenant returns 404", async ({ request }) => {
    const res = await request.post(`/api/leads/does-not-exist`, {
      data: { full_name: "Nobody", email_address: uniqueEmail() },
    });
    expect(res.status()).toBe(404);
  });

  test("duplicate submission within 24h returns already_enrolled", async ({ request }) => {
    const email = uniqueEmail();
    const payload = { full_name: "Dup User", email_address: email };

    const first = await request.post(`/api/leads/${TENANT}`, { data: payload });
    expect(first.status()).toBe(202);

    const second = await request.post(`/api/leads/${TENANT}`, { data: payload });
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.status).toBe("already_enrolled");
  });
});
