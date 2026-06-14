-- ============================================================================
-- lead-engine — initial schema (Phase 1)
-- Translated from the 8 Alembic migrations of lead-generation-fitness.
-- The critical change vs. the FastAPI app: tenant isolation moves OUT of
-- application code (WHERE tenant_id = ...) and INTO RLS policies below.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── tenants ─────────────────────────────────────────────────────────────────
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  config      jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── admin_users: links a Supabase Auth user to the tenant(s) they manage ─────
-- Replaces the single shared x-admin-key. Each admin is a real auth.users row.
create table admin_users (
  user_id     uuid not null references auth.users (id) on delete cascade,
  tenant_id   uuid not null references tenants (id) on delete cascade,
  role        text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- ── leads ───────────────────────────────────────────────────────────────────
create table leads (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants (id) on delete cascade,
  form_data          jsonb not null,
  status             text not null default 'received',
  email_address      text not null,
  lead_score         int,
  crm_contact_id     text,
  crm_synced_at      timestamptz,
  unsubscribe_token  uuid unique default gen_random_uuid(),
  unsubscribed_at    timestamptz,
  booked_at          timestamptz,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  fb_leadgen_id      text unique,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index leads_tenant_idx        on leads (tenant_id);
create index leads_email_idx         on leads (email_address);
create index leads_status_idx        on leads (status);
create index leads_created_idx       on leads (created_at);

-- ── campaigns ───────────────────────────────────────────────────────────────
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  slug        text not null,
  name        text not null,
  steps       jsonb not null default '[]'::jsonb,   -- [{step, delay_days, subject_template, prompt_template}]
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index campaigns_tenant_idx on campaigns (tenant_id);

-- ── campaign_enrollments ────────────────────────────────────────────────────
create table campaign_enrollments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants (id) on delete cascade,
  lead_id       uuid not null references leads (id) on delete cascade,
  campaign_id   uuid not null references campaigns (id) on delete cascade,
  current_step  int not null default 0,
  status        text not null default 'active',   -- active / paused / completed / replied
  next_send_at  timestamptz,
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  replied_at    timestamptz
);
create index enrollments_tenant_idx   on campaign_enrollments (tenant_id);
create index enrollments_lead_idx     on campaign_enrollments (lead_id);
create index enrollments_status_idx   on campaign_enrollments (status);
create index enrollments_due_idx      on campaign_enrollments (next_send_at);

-- ── email_logs ──────────────────────────────────────────────────────────────
create table email_logs (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants (id) on delete cascade,
  lead_id                 uuid not null references leads (id) on delete cascade,
  campaign_enrollment_id  uuid references campaign_enrollments (id) on delete set null,
  step_number             int not null default 0,
  to_address              text not null,
  subject                 text not null,
  body_preview            text,
  provider_message_id     text,                 -- was ses_message_id; now Resend message id
  status                  text not null default 'sent',   -- sent / failed / bounce / complaint
  sent_at                 timestamptz not null default now()
);
create index email_logs_tenant_idx  on email_logs (tenant_id);
create index email_logs_lead_idx    on email_logs (lead_id);
create index email_logs_msgid_idx   on email_logs (provider_message_id);   -- reply matching

-- ── audit_logs ──────────────────────────────────────────────────────────────
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  lead_id     uuid not null references leads (id) on delete cascade,
  event       text not null,
  old_status  text,
  new_status  text not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_tenant_idx on audit_logs (tenant_id);
create index audit_logs_lead_idx   on audit_logs (lead_id);

-- ── llm_cost_logs ───────────────────────────────────────────────────────────
create table llm_cost_logs (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants (id) on delete cascade,
  lead_id             uuid not null references leads (id) on delete cascade,
  model               text not null,
  input_tokens        int not null default 0,
  output_tokens       int not null default 0,
  cache_read_tokens   int not null default 0,
  estimated_cost_usd  numeric(10,6) not null default 0,
  created_at          timestamptz not null default now()
);
create index llm_cost_tenant_idx on llm_cost_logs (tenant_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Model: writes happen server-side via the service-role client (which bypasses
-- RLS) AFTER the API route/job has authenticated the actor. Admin *reads* are
-- scoped to the tenant(s) the logged-in user administers. Anon gets nothing.
-- This is the database-enforced version of A's app-layer "WHERE tenant_id = ".
-- ============================================================================

-- helper: tenant ids the current auth user manages
create or replace function current_admin_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select tenant_id from admin_users where user_id = auth.uid();
$$;

alter table tenants               enable row level security;
alter table admin_users           enable row level security;
alter table leads                 enable row level security;
alter table campaigns             enable row level security;
alter table campaign_enrollments  enable row level security;
alter table email_logs            enable row level security;
alter table audit_logs            enable row level security;
alter table llm_cost_logs         enable row level security;

-- admins can read their own membership rows
create policy admin_self on admin_users
  for select using (user_id = auth.uid());

-- admins read the tenants they manage
create policy tenant_read on tenants
  for select using (id in (select current_admin_tenant_ids()));

-- tenant-scoped read policies (one per table)
create policy leads_read on leads
  for select using (tenant_id in (select current_admin_tenant_ids()));
create policy campaigns_read on campaigns
  for select using (tenant_id in (select current_admin_tenant_ids()));
create policy enrollments_read on campaign_enrollments
  for select using (tenant_id in (select current_admin_tenant_ids()));
create policy email_logs_read on email_logs
  for select using (tenant_id in (select current_admin_tenant_ids()));
create policy audit_logs_read on audit_logs
  for select using (tenant_id in (select current_admin_tenant_ids()));
create policy llm_cost_read on llm_cost_logs
  for select using (tenant_id in (select current_admin_tenant_ids()));

-- NOTE: no INSERT/UPDATE/DELETE policies for anon/authenticated on purpose.
-- The public lead form and all pipeline writes go through the service-role
-- client in API routes / Trigger.dev jobs, after validation. Admin mutations
-- (mark-booked, notes) also go through service-role routes that first verify
-- the session AND that the target row's tenant_id is in current_admin_tenant_ids().
