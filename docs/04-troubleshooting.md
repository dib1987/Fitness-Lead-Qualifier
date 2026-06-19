# Troubleshooting Guide — Fitness Lead Qualifier

All real issues encountered during implementation, with exact solutions.

---

## Issue 1 — Production URL Redirecting to Vercel Login Page

**Symptom:** Visiting the production URL shows a Vercel login page instead of the website. All routes (including the lead form) are blocked.

**Root cause:** Vercel "Deployment Protection" was enabled by default. The "Standard Protection" setting requires a Vercel account login to view any page — even public ones.

**Solution:**
1. Go to [vercel.com](https://vercel.com) → your project → **Settings**
2. Click **Deployment Protection** in the left sidebar
3. Find the **"Require Log In"** toggle (set to "Standard Protection")
4. **Turn it OFF** (toggle to disabled)
5. Click Save
6. The production URL is now publicly accessible

**Lesson:** Always check Deployment Protection immediately after first Vercel deploy.

---

## Issue 2 — Emails Sent by Local Dev Server Instead of Cloud

**Symptom:** Lead submitted in production → email arrives, but Trigger.dev cloud shows no runs. The local `npx trigger.dev@latest dev` terminal is handling the job instead of the cloud.

**Root cause:** After deploying Trigger.dev jobs with `npx trigger.dev@latest deploy`, the `TRIGGER_SECRET_KEY` in Vercel was still set to the **development** key (`tr_dev_...`). Development keys route jobs to your local machine, not the cloud.

**Solution:**
1. Go to [app.trigger.dev](https://app.trigger.dev) → your project → **API Keys**
2. Copy the **Production** key (starts with `tr_prod_...`)
3. Go to Vercel → your project → **Settings → Environment Variables**
4. Find `TRIGGER_SECRET_KEY` → edit it → paste the `tr_prod_...` key
5. Redeploy Vercel (Settings → Deployments → Redeploy)
6. From now on, leads trigger cloud jobs, not local ones

**Lesson:** Development (`tr_dev_`) and Production (`tr_prod_`) keys are completely separate. Always use `tr_prod_` in Vercel production environment.

---

## Issue 3 — Unsubscribe Link Missing from Emails (Part 1: Wrong Env Var Name)

**Symptom:** Emails arrive but have no unsubscribe link at the bottom. Checking `email_logs.body_preview` in the database confirms the footer was never appended.

**Root cause:** The env var was named `NEXT_PUBLIC_APP_URL` in the Trigger.dev dashboard. The `NEXT_PUBLIC_` prefix is a Next.js convention for exposing variables to the browser. In Trigger.dev's Node.js runtime (a separate process), this prefix causes the variable to not be read reliably.

**Solution:**
1. Rename the env var in Trigger.dev dashboard from `NEXT_PUBLIC_APP_URL` to `APP_URL`
2. Update the code in `trigger/jobs/process-lead.ts` and `trigger/jobs/run-followup.ts`:
   ```ts
   // Before (wrong):
   const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
   // After (correct):
   const appUrl = process.env.APP_URL ?? "";
   ```
3. Redeploy Trigger.dev jobs

**Lesson:** Never use `NEXT_PUBLIC_` prefixed env vars in Trigger.dev jobs. That prefix only works in Next.js client-side bundles.

---

## Issue 4 — Unsubscribe Link Still Missing After Fix (Part 2: Code Not Synced)

**Symptom:** Even after fixing the env var name in the code and redeploying, the unsubscribe link still does not appear.

**Root cause:** There were TWO copies of the Trigger.dev jobs:
- `c:\CLAUDE COWORK\OUTPUTS\lead-engine\trigger\jobs\` — where the code edits were made
- `C:\le\trigger\jobs\` — where deployments were run from (due to spaces in the path causing Docker URL encoding issues)

The updated files were never copied from the working folder to the deployment folder before running `npx trigger.dev@latest deploy`.

**Solution:**
1. Copy the updated files to the deployment folder:
   ```powershell
   Copy-Item "c:\CLAUDE COWORK\OUTPUTS\lead-engine\trigger\jobs\process-lead.ts" "C:\le\trigger\jobs\process-lead.ts" -Force
   Copy-Item "c:\CLAUDE COWORK\OUTPUTS\lead-engine\trigger\jobs\run-followup.ts" "C:\le\trigger\jobs\run-followup.ts" -Force
   ```
2. Verify the fix is in the deployment copy:
   ```powershell
   Select-String -Path "C:\le\trigger\jobs\process-lead.ts" -Pattern "APP_URL"
   ```
3. Deploy from the correct folder:
   ```powershell
   cd "C:\le\trigger"
   npx trigger.dev@latest deploy
   ```

**Lesson:** When the project folder has spaces in the path, maintain a second copy in a path without spaces for Trigger.dev deployments. Always verify the deployment copy contains the latest changes before deploying.

---

## Issue 5 — Trigger.dev Deploy Fails Due to Spaces in Path

**Symptom:** Running `npx trigger.dev@latest deploy` from `c:\CLAUDE COWORK\OUTPUTS\lead-engine\trigger` fails with Docker-related URL encoding errors.

**Root cause:** Docker (used internally by Trigger.dev's build system) does not handle spaces in file paths correctly on Windows.

**Solution:** Always deploy Trigger.dev jobs from a path without spaces. In this project, use `C:\le\trigger` which is a copy of the trigger folder.

**Prevention for future projects:** Keep Trigger.dev projects in a path with no spaces, e.g., `C:\projects\my-app\trigger`.

---

## Issue 6 — email_logs Query Fails with "column does not exist"

**Symptom:** Querying `email_logs` with `.order('created_at', ...)` returns error: `column email_logs.created_at does not exist`.

**Root cause:** The `email_logs` table uses `sent_at` as the timestamp column (not `created_at`). The schema was designed this way to match the Resend delivery event naming.

**Solution:** Always use `sent_at` when ordering or filtering `email_logs`:
```ts
// Wrong:
.order('created_at', { ascending: true })
// Correct:
.order('sent_at', { ascending: true })
```

**Reference:** See `supabase/migrations/0001_init.sql` line 98: `sent_at timestamptz not null default now()`

---

## Issue 7 — Node.js Script Fails to Require Supabase (Wrong Working Directory)

**Symptom:** Running `node -e "require('./node_modules/@supabase/supabase-js')"` from the repo root fails with "Cannot find module".

**Root cause:** The `node_modules` folder is inside `frontend/`, not at the repo root. The relative path `./node_modules` does not exist from the repo root.

**Solution:** Always use the absolute path when requiring packages from a one-liner:
```powershell
cd "c:/CLAUDE COWORK/OUTPUTS/lead-engine/frontend"
node -e "const { createClient } = require('./node_modules/@supabase/supabase-js'); ..."
```

Or use the absolute path directly:
```js
require('c:/CLAUDE COWORK/OUTPUTS/lead-engine/frontend/node_modules/@supabase/supabase-js')
```

---

## Issue 8 — Webhook Signature Verification Silently Bypassed

**Symptom:** The Facebook and Resend webhooks accept any POST request without verifying the signature, when the secret env var is not configured in Vercel.

**Root cause:** Both webhook routes had `if (secret) { ... verify ... }` — meaning if the env var is missing, verification is skipped entirely and any attacker can post fake events.

**Solution:** Changed both routes to fail hard (return 500) if the secret is not configured:
```ts
// Before (insecure):
if (secret) { /* verify */ }
// continue processing...

// After (secure):
if (!secret) {
  return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
}
// verify always runs now
```

**Files changed:**
- `frontend/app/api/webhooks/facebook/route.ts`
- `frontend/app/api/webhooks/email/route.ts`

---

## Issue 9 — Lead Form Has No Rate Limiting

**Symptom:** The public lead submission endpoint (`/api/leads/[tenant]`) had rate limiting code commented out. Anyone could flood the system with thousands of fake submissions.

**Root cause:** The Upstash rate limiter was planned (F15) but never wired up.

**Solution:**
1. Created `frontend/lib/ratelimit.ts` using `@upstash/ratelimit` (already installed)
2. Wired it into the leads route — 10 requests per minute per IP per tenant
3. Fails open (allows requests) if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set — so local dev works without Upstash

**To fully activate in production:** Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel environment variables from your Upstash Redis dashboard.

---

## Quick Reference — Environment Variable Checklist

If something is not working, run through this checklist:

| Service | Variable | Where to check |
|---|---|---|
| Supabase DB connection | `NEXT_PUBLIC_SUPABASE_URL` | Vercel env vars |
| Supabase public access | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env vars |
| Supabase server writes | `SUPABASE_SERVICE_ROLE_KEY` | Vercel env vars + Trigger.dev env vars |
| Trigger.dev (must be prod) | `TRIGGER_SECRET_KEY` | Vercel env vars — must start with `tr_prod_` |
| Email sending | `RESEND_API_KEY` | Vercel env vars + Trigger.dev env vars |
| Claude AI | `ANTHROPIC_API_KEY` | Trigger.dev env vars only |
| Unsubscribe link | `APP_URL` | Trigger.dev env vars only (NOT `NEXT_PUBLIC_APP_URL`) |
| Resend webhook | `RESEND_WEBHOOK_SECRET` | Vercel env vars |
| Facebook webhook | `FB_APP_SECRET` | Vercel env vars |
| Facebook verify | `FB_WEBHOOK_VERIFY_TOKEN` | Vercel env vars |
| Rate limiting | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Vercel env vars |
