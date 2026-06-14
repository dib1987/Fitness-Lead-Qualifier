// E2E for F7 (admin API) / F8 (admin UI) / RLS tenant isolation.
// F8 admin UI and the /sign-in page are still stubs, so the authenticated
// flows below are skipped until those exist — TODO unskip once built.
import { test, expect } from "@playwright/test";

test.describe("F7 admin API — /api/admin/leads", () => {
  test("unauthenticated request is rejected", async ({ request }) => {
    const res = await request.get("/api/admin/leads");
    expect(res.status()).toBe(401);
  });

  // TODO once /sign-in exists: sign in as a tenant-A admin (seed an
  // admin_users row + auth user), then assert:
  //  - GET /api/admin/leads returns only tenant A's leads
  //  - a tenant-B lead inserted via the service client is NOT in the response
  //    (this is the RLS tenant-isolation guardrail from CLAUDE.md)
  test.skip("authenticated admin sees only their tenant's leads (RLS)", async () => {
    // 1. sign in via Supabase Auth (session cookie)
    // 2. GET /api/admin/leads -> assert leads belong to admin's tenant only
  });
});

test.describe("F8 admin UI — /admin", () => {
  test.skip("redirects unauthenticated users to /sign-in", async ({ page }) => {
    // middleware.ts gates /admin/* — but /sign-in page doesn't exist yet.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test.skip("dashboard renders leads for the logged-in admin's tenant", async () => {
    // TODO once F8 renders from /api/admin/*
  });
});
