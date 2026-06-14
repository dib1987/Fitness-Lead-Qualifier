# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
All from `frontend/` unless noted:
- `npm install` · `npm run dev` (Next.js dev server)
- `npm test` (vitest run — covers `T/` pure logic via `tests/*.test.ts`)
- `npm test -- tests/scoring.test.ts` (single test file)
- `npm run lint` · `npm run build`

Trigger.dev jobs (from `trigger/`): `npx trigger.dev@latest dev` (separate terminal,
required for F4/F5 to run locally).

`T/` and `tests/` live at repo root (not under `frontend/`), but `npm test` (vitest)
runs from `frontend/` and resolves them by relative path — no vitest.config exists yet,
so don't assume path aliases for `T/*` are set up.

## Context

Context for Claude Code. This repo is a **migration** of `lead-generation-fitness`
(FastAPI + Celery) onto the `ai-lead-qualifier` stack. The old repo stays as the
reference/fallback until this reaches parity. Do not break the feature contract below.

## Stack (do not reintroduce the old one)
Next.js (Vercel) · Supabase (Postgres + Auth + RLS) · Trigger.dev (jobs) · Resend
(email send + inbound) · HubSpot (CRM) · Anthropic (email copy) · Upstash (rate limit).
**No Celery. No Clerk. No Redis broker.**

## Locked decisions
- Reply/bounce detection → **Resend inbound** webhooks (was AWS SES + SNS).
- Admin access → **Supabase Auth users** (was a single shared `x-admin-key`).
- Stripe billing → **not in scope** this round (parity first).
- Rate limiting → **Upstash**. Tenant/campaign config → **JSON files** for now.

## Structure (mirrors Repo B, with 3 deliberate fixes)
- `frontend/` Next.js app · `T/` shared pure logic · `W/` prompts · `trigger/` jobs ·
  `supabase/migrations/` schema+RLS · `tests/` vitest.
- Fixes vs B: `middleware.ts` (not `proxy.ts`, so it runs); `supabase/migrations/` added;
  `tests/` added. Keep these.

## Feature contract — status
| F | Feature | File | Status |
|---|---|---|---|
| F1 | Web lead capture | `frontend/app/api/leads/[tenant]/route.ts` | **Done** (reference pattern) |
| F2 | Facebook ingestion | `frontend/app/api/webhooks/facebook/route.ts` | Stub — HMAC done, body TODO |
| F3 | Reply/bounce (Resend) | `frontend/app/api/webhooks/email/route.ts` | Stub — verify sig + handlers TODO |
| F4 | Day-0 pipeline | `trigger/jobs/process-lead.ts` | **Done** (idempotency, cost cap, Realtime metadata) |
| F5 | Follow-up sequence | `trigger/jobs/run-followup.ts` | Stub — cron set, body TODO |
| F6 | Scoring | `T/scoring.ts` | **Done + tested** |
| F1 | Dedup | `T/dedup.ts` | **Done + tested** |
| F7 | Admin API | `frontend/app/api/admin/*` | Pattern done; add detail/export/booked/notes |
| F8 | Admin UI | `frontend/app/admin/*` | Stub |
| F9 | Unsubscribe | `frontend/app/api/unsubscribe/[token]/route.ts` | **Done** |
| F10 | Multi-tenant config | `frontend/lib/config/**` | Crunch seeded |
| F11 | HubSpot CRM | `frontend/lib/crm.ts` | **Done** (call from F4 job) |
| F12 | Email send | `frontend/lib/resend.ts` | Client done; wire in F4/F5 |
| F13 | LLM + cost | `trigger/jobs/process-lead.ts` + `T/cost.ts` | **Done** |
| F14 | Audit log | `audit_logs` table | Schema done; write from jobs |
| F16 | Data model | `supabase/migrations/0001_init.sql` | **Done** |

## Guardrails (enforce on every change)
1. **RLS is the tenant boundary now.** Reads go through the session client (RLS scopes
   to `current_admin_tenant_ids()`). Writes go through the service-role client in
   server code AFTER verifying the actor. Never add an anon insert/update policy.
2. **Service-role key is server-only.** `grep -rl SUPABASE_SERVICE_ROLE_KEY` must hit
   only API routes, server components, and `trigger/`. Never a `'use client'` file.
3. **Validate every external input with Zod** — including LLM output before trusting it.
4. **Resend webhook**: verify the signature on the raw body before acting.
5. **LLM cost**: log to `llm_cost_logs` and enforce a per-tenant daily cap in `process-lead`.
6. **Idempotency in F4**: skip if an `email_sent` audit row already exists for the lead.
7. No secrets, build output, or debug junk committed.

## Build order for the pending work
1. Wire Supabase project; run `supabase/migrations/0001_init.sql`; add a test proving
   tenant A admin cannot read tenant B.
2. `process-lead.ts` (F4) against the real local `process_lead.py`, with LLM validation + cost cap.
3. `run-followup.ts` (F5).
4. `webhooks/email` (F3) Resend inbound + bounce.
5. `webhooks/facebook` (F2).
6. Admin API detail/export/booked/notes (F7) + admin UI (F8).

## Verify before each PR
`npm test` (from `frontend/`) green · `grep` for service-role leak clean · RLS test green.

## E2E tests (Playwright)
Run against a **local Supabase stack** (Docker), not a cloud project.

1. **Start Docker Desktop**, then from repo root:
   ```
   npx supabase start      # applies supabase/migrations/0001_init.sql + supabase/seed.sql
   ```
   First run prints local API URL + anon/service-role keys — copy into `frontend/.env.local`
   (and `trigger/.env` if running jobs too).
2. From `frontend/`:
   ```
   npm install
   npx playwright install   # first time only, installs browsers
   npm run test:e2e          # headless run; starts `next dev` automatically
   npm run test:e2e:ui       # interactive UI mode
   ```
3. Specs live in `frontend/e2e/`:
   - `leads.spec.ts` — F1 lead capture + dedup (full coverage)
   - `unsubscribe.spec.ts` — F9 unsubscribe (full coverage)
   - `webhooks.spec.ts` — F2/F3, covers only what's implemented; TODOs mark the rest
   - `admin.spec.ts` — F7/F8, mostly `test.skip` until `/sign-in` and the admin UI exist
4. Reset DB state between runs (re-applies seed): `npx supabase db reset`.
5. Stop the stack: `npx supabase stop`.

`frontend/e2e/helpers/db.ts` holds a service-role client for test setup/assertions
(seeded with the Supabase CLI's standard local-dev keys — override via
`E2E_SUPABASE_URL`/`E2E_SUPABASE_SERVICE_ROLE_KEY` if your local keys differ).

As stubbed features (F2/F3/F7/F8) get implemented, fill in the TODOs in
`webhooks.spec.ts` and unskip the tests in `admin.spec.ts`.
