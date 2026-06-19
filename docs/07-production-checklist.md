# Production Checklist — Fitness Lead Qualifier

Two sections:
1. **Claude Checklist** — steps Claude runs through when deploying this system
2. **Human Guide** — what the human owner needs to do

---

## Section A — Claude Deployment Checklist

*For Claude Code: run through these in order before declaring the system production-ready.*

### Pre-Deploy Verification

- [ ] `npm test` passes from `frontend/` — all unit tests green
- [ ] `npm run build` passes from `frontend/` — no TypeScript errors
- [ ] `grep -r SUPABASE_SERVICE_ROLE_KEY frontend/` — only hits server files (no `'use client'` files)
- [ ] `grep -r ANTHROPIC_API_KEY frontend/` — zero results (only in trigger/)
- [ ] Webhook routes have hard-fail if secret not set (not `if (secret) { ... }`)
- [ ] Rate limiter is wired into the leads route (not commented out)
- [ ] Unsubscribe footer uses `process.env.APP_URL` (not `NEXT_PUBLIC_APP_URL`) in both trigger jobs

### Database

- [ ] Migration `supabase/migrations/0001_init.sql` applied to production Supabase project
- [ ] RLS enabled on all 8 tables: tenants, admin_users, leads, campaigns, campaign_enrollments, email_logs, audit_logs, llm_cost_logs
- [ ] `current_admin_tenant_ids()` function exists in the production database
- [ ] At least one tenant row exists in `tenants` table
- [ ] At least one campaign row exists with `is_active = true` and `steps` array populated
- [ ] At least one admin user exists in `admin_users` linked to the tenant

### Vercel Environment Variables

Verify ALL of these are set in Vercel → Settings → Environment Variables (Production):

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TRIGGER_SECRET_KEY` — must start with `tr_prod_` (not `tr_dev_`)
- [ ] `RESEND_WEBHOOK_SECRET` — from Resend webhook endpoint
- [ ] `FB_APP_SECRET` — from Facebook App Settings (can be placeholder if F2 not active)
- [ ] `FB_WEBHOOK_VERIFY_TOKEN` — any random string matching Facebook webhook setup

### Trigger.dev Environment Variables

Verify ALL of these are set in app.trigger.dev → Environment Variables (Production):

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `APP_URL` — the production URL (NOT `NEXT_PUBLIC_APP_URL`)

### Trigger.dev Jobs

- [ ] Jobs deployed with `npx trigger.dev@latest deploy` from a path WITHOUT spaces
- [ ] `process-lead` task visible in app.trigger.dev → Tasks
- [ ] `run-followup` task visible with correct cron (`*/15 * * * *`)
- [ ] Latest deployment version matches expected version (check app.trigger.dev → Deployments)

### Post-Deploy Smoke Test

Run these in order and verify each:

1. [ ] Submit a test lead at `/lead/[tenant]` with a real email address
2. [ ] Confirm `leads` table has a new row with status `received`
3. [ ] Wait 2 minutes — confirm status changed to `email_sent`
4. [ ] Confirm email arrived in the test inbox with unsubscribe link at the bottom
5. [ ] Check `email_logs` — body_preview should end with `To stop receiving emails:`
6. [ ] Click the unsubscribe link — confirm branded page loads and lead is marked `unsubscribed`
7. [ ] Log in to `/admin/sign-in` with admin credentials
8. [ ] Confirm test lead appears in the leads table
9. [ ] Open the lead detail panel — confirm email history shows the sent email
10. [ ] Mark the lead as Booked — confirm status changes in the table
11. [ ] Export leads CSV — confirm it downloads with the test lead included

### Cleanup After Smoke Test

- [ ] Delete the test lead from the database (or mark as internal test in notes)

---

## Section B — Human Setup Guide

*For the system owner: what you need to do to take this live on a new environment.*

### What You Need Before Starting

- A **GitHub account** — free at github.com
- A **Vercel account** — free at vercel.com (connect with GitHub)
- A **Supabase account** — free at supabase.com
- A **Trigger.dev account** — free at trigger.dev
- A **Resend account** — free at resend.com
- An **Anthropic account** with API access — platform.anthropic.com

### Step 1 — Set Up the Database (Supabase)

1. Log in to [supabase.com](https://supabase.com) → New Project
2. Name it `lead-engine-prod`
3. Choose a strong database password and save it somewhere safe
4. Wait 2 minutes for the project to start
5. Go to **SQL Editor** → New Query
6. Copy the entire contents of `supabase/migrations/0001_init.sql` and paste it → Run
7. Go to **Authentication → Users** → Add User → create the admin email/password
8. Go to **SQL Editor** again and run:
   ```sql
   -- Replace with your actual values
   INSERT INTO tenants (slug, name, config) VALUES ('crunch', 'Crunch Fitness', '{"company": {"signature_name": "Crunch Fitness"}}');
   
   INSERT INTO admin_users (user_id, tenant_id)
   SELECT u.id, t.id FROM auth.users u, tenants t WHERE u.email = 'your-admin@email.com' AND t.slug = 'crunch';
   ```
9. Go to **Project Settings → API** → copy:
   - `URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → this is `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Deploy the Website (Vercel)

1. Push the code to GitHub (or connect the existing repo)
2. Log in to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select the repository → Framework: **Next.js** → Root directory: `frontend`
4. Do NOT deploy yet — add environment variables first:
   - Click **Environment Variables** → add all variables from the Vercel list above
5. Click **Deploy**
6. Go to **Settings → Deployment Protection** → turn OFF "Require Log In"

### Step 3 — Deploy Background Jobs (Trigger.dev)

1. Log in to [app.trigger.dev](https://app.trigger.dev) → New Project
2. Follow the setup wizard to connect your project
3. Go to **Environment Variables** → add all variables from the Trigger.dev list above
4. Open a terminal in the `trigger/` folder (must be a path with NO spaces)
5. Run: `npx trigger.dev@latest deploy`
6. Confirm both `process-lead` and `run-followup` appear in the Tasks list
7. Copy the **Production API key** (starts with `tr_prod_`) from API Keys
8. Go back to Vercel → update `TRIGGER_SECRET_KEY` to the `tr_prod_` key
9. Redeploy Vercel

### Step 4 — Set Up Email Delivery (Resend)

1. Log in to [resend.com](https://resend.com) → Domains → Add your domain
2. Follow DNS verification steps for your domain
3. Go to **Webhooks** → Add Endpoint → paste your production URL + `/api/webhooks/email`
4. Select events: `email.delivered`, `email.bounced`, `email.complained`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add it to Vercel as `RESEND_WEBHOOK_SECRET`
7. Redeploy Vercel

### Step 5 — Test Everything

Follow the smoke test checklist in Section A above.

### Who to Call If Something Breaks

| Problem | Where to look |
|---|---|
| Email not sending | Trigger.dev → Runs → check logs for the `process-lead` run |
| Website not loading | Vercel → Deployments → check build logs |
| Database error | Supabase → Logs → API logs |
| Wrong data in admin | Supabase → Table Editor → check the leads table directly |
