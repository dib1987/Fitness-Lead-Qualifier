# lead-engine

Multi-tenant lead capture + AI nurture. Migrated from `lead-generation-fitness`
(FastAPI + Celery) to the `ai-lead-qualifier` stack: **Next.js (Vercel) · Supabase ·
Trigger.dev · Resend · HubSpot · Anthropic**. No Celery, no Clerk, no Redis broker.

This repo is the **new home** for the Crunch Fitness system (and later the travel
vertical, as a second tenant). The old repo stays as the reference/fallback until
this reaches parity.

## Structure (mirrors ai-lead-qualifier, with 3 deliberate fixes)

```
frontend/            Next.js app  → Vercel
  app/               pages + API routes
  app/api/           leads, webhooks/{facebook,email}, unsubscribe, admin/*
  components/        admin UI
  lib/               supabase, resend, crm, config (tenant/campaign JSON)
  middleware.ts      admin auth  (B names this proxy.ts and it never runs — fixed)
T/                   shared pure logic (scoring, dedup, cost, types)  [B convention]
W/                   prompts                                          [B convention]
trigger/             Trigger.dev jobs — process-lead, run-followup (cron */15)
supabase/migrations/ SQL schema + RLS  (B has no migrations — added)
tests/               vitest on the pure core  (B has none — added)
```

## Decisions baked in
- Reply/bounce detection → **Resend inbound** (was AWS SES).
- Admin access → **Supabase Auth users** (was a single shared `x-admin-key`).
- Stripe billing → **not included** this round (parity first).
- Rate limiting → **Upstash**. Tenant/campaign config → **JSON files** for now.

## Feature parity map (the contract from the migration plan)

| Feature | Lives in |
|---|---|
| F1 web lead capture | `frontend/app/api/leads/[tenant]/route.ts` |
| F2 Facebook ingestion | `frontend/app/api/webhooks/facebook/route.ts` |
| F3 reply/bounce | `frontend/app/api/webhooks/email/route.ts` (Resend) |
| F4 Day-0 pipeline | `trigger/jobs/process-lead.ts` |
| F5 follow-up sequence | `trigger/jobs/run-followup.ts` |
| F6 scoring | `T/scoring.ts` (tested) |
| F7 admin API | `frontend/app/api/admin/*` (Supabase-auth) |
| F8 admin UI | `frontend/app/admin/*` |
| F9 unsubscribe | `frontend/app/api/unsubscribe/[token]/route.ts` |
| F10 multi-tenant config | `frontend/lib/config/**` |
| F11 HubSpot CRM | `frontend/lib/crm.ts` |
| F12 email send | `frontend/lib/resend.ts` |
| F13 LLM + cost | `trigger/jobs/process-lead.ts` + `T/cost.ts` |
| F14 audit log | `supabase` `audit_logs` table |
| F15 rate limiting | Upstash in the lead route |
| F16 data model | `supabase/migrations/0001_init.sql` |

## Status of this scaffold
- **Done & tested:** the pure core (`T/scoring.ts`, `T/dedup.ts`) + their tests; the
  full Supabase schema with RLS; the F1 lead route wired end to end; the auth +
  service-role pattern; all route/job files in place.
- **Stubbed with TODOs (the real migration work):** F2/F3 webhook bodies, the F4/F5
  job internals, the admin UI, the email-generation call. Each stub names its source
  file in the old repo and the exact steps.

## Run
```
cd frontend && npm install && npm run dev
npx trigger.dev@latest dev      # separate terminal
npm test                        # from frontend/ — runs the T/ tests
```

## Before you ship — the checklist that matters
- [ ] RLS verified: a logged-in admin of tenant A cannot read tenant B (write a test).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server files (`grep` clean).
- [ ] Resend webhook signature verified before trusting payloads.
- [ ] LLM output validated; per-tenant cost cap in `process-lead`.
- [ ] No secrets / build output / debug junk in git.
