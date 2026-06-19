# Project Workflow — Fitness Lead Qualifier (with WAT Skills)

This document describes how the WAT skills were used to build this project, and how to use them when building similar systems in the future.

---

## What Are WAT Skills?

WAT skills are reusable Claude Code playbooks stored at `C:\Users\dibye\.claude\skills\`. Each skill is a folder with a `SKILL.md` file containing step-by-step instructions, code patterns, and architectural rules.

When Claude sees a task that matches a skill, it loads the skill and follows its playbook instead of inventing a solution from scratch. This ensures:
- Consistent patterns across projects
- Proven security practices applied automatically
- Faster implementation (no re-discovering the same solutions)

Invoke a skill by typing `/WAT_skill-name` in the chat.

---

## Skills Used in This Project

### `/WAT_lead-capture-pipeline`

**What it built:**
- `frontend/app/api/leads/[tenant]/route.ts` — the public form submission endpoint
- `T/scoring.ts` — lead scoring (0–100)
- `T/dedup.ts` — duplicate detection
- `frontend/lib/ratelimit.ts` — rate limiting with Upstash

**When to reuse:** Any project that captures enquiries from a web form (fitness, travel, legal, dental, real estate).

**How it saves time:** The dedup + validate + insert + enqueue pattern is identical across all domains. Only the Zod schema fields and scoring weights change.

---

### `/WAT_ai-email-generation`

**What it built:**
- `trigger/jobs/process-lead.ts` — Day-0 personalised welcome email
- `trigger/jobs/run-followup.ts` — 14-day follow-up sequence
- `trigger/lib/utils.ts` — `interpolate()` helper for template variables
- `T/cost.ts` — LLM cost estimation

**When to reuse:** Any project that needs AI-written personalised emails — onboarding sequences, follow-up nurture, outreach campaigns.

**Key pattern the skill enforces:**
- Forced tool call (not free text generation)
- Zod validation of all LLM output
- Unsubscribe footer on every email
- Daily cost cap per tenant

---

### `/WAT_admin-dashboard`

**What it built:**
- `frontend/app/admin/` — all admin pages (sign-in, sign-up, dashboard, leads, account)
- `frontend/app/api/admin/` — all admin API routes (list, detail, export, booked, notes, email-logs)
- `frontend/middleware.ts` — route protection
- `supabase/migrations/0001_init.sql` — RLS policies

**When to reuse:** Any project where staff need to log in and manage records scoped to their organisation.

**Key pattern the skill enforces:**
- Two-layer auth (middleware + layout)
- Session client for reads (RLS enforces tenant scope automatically)
- Service client for writes (only after session proof)
- No anon INSERT/UPDATE/DELETE policies in the database

---

### `/WAT_production-deployment`

**What it built (process, not code):**
- The deployment workflow for Vercel + Supabase + Trigger.dev
- Environment variable checklist
- Security audit process
- Smoke test procedure

**When to reuse:** Before launching any Next.js + Supabase + Trigger.dev project to production.

**Key problems the skill prevents:**
- Forgetting to disable Vercel Deployment Protection
- Using `tr_dev_` key in production (emails go to local machine, not cloud)
- Spaces in path breaking Trigger.dev deploy
- Webhook secrets not set (silent bypass)

---

## How Skills Were Combined

```
New project request
        ↓
/WAT_lead-capture-pipeline → builds the form + API + scoring + dedup
        ↓
/WAT_ai-email-generation → builds the Day-0 and follow-up email jobs
        ↓
/WAT_admin-dashboard → builds the admin login + dashboard + API
        ↓
/WAT_production-deployment → deploys and validates everything
```

Each skill is independent — you can use them in any combination. For example:
- A booking system might only need `WAT_admin-dashboard` (no email generation)
- A cold outreach tool might only need `WAT_ai-email-generation` (no lead form)

---

## Workflow for a New Similar Project

If you want to build a lead capture + email nurture system for a new business (e.g., a dental clinic):

1. **Type `/WAT_lead-capture-pipeline`** → give it the business details (dental clinic, form fields: treatment_interest, preferred_day, phone)
   - Claude generates the Zod schema, API route, scoring function, and dedup logic
   
2. **Type `/WAT_ai-email-generation`** → give it the campaign steps and tone (clinical, reassuring, ~120 words per email)
   - Claude generates the campaign JSON, Trigger.dev job code, and cost tracking

3. **Type `/WAT_admin-dashboard`** → specify the entity (appointments/enquiries) and any custom columns needed
   - Claude generates the admin pages, API routes, middleware, and RLS policies

4. **Before going live, type `/WAT_production-deployment`** → Claude runs through the full checklist
   - Verifies env vars, deploys Trigger.dev jobs, runs smoke test

---

## Skills That Pre-Existed and Were Referenced

These existing skills were checked before building — some overlapped but used the old FastAPI/Celery stack:

| Existing Skill | Overlap | Decision |
|---|---|---|
| `lead-gen-domain-scaffold` | Campaign JSON + tenant config | Not used — generates for FastAPI/Celery, not Next.js/Trigger.dev |
| `lead-qualification-scorer` | Lead scoring | Not used — the WAT skill includes scoring as part of the full pipeline |
| `deduplication-skill` | Dedup logic | Not used — included in WAT_lead-capture-pipeline |
| `email-automation-skill` | Email sequencing | Not used — WAT_ai-email-generation is Claude-specific |
| `follow-up-email-sequence` | Email nurture | Not used — WAT_ai-email-generation is the concrete implementation |
| `business-guide-generator` | Documentation | Used to inform doc structure for this project |
