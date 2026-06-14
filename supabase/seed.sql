-- ============================================================================
-- E2E seed data — applied automatically by `supabase start` / `supabase db reset`.
-- Mirrors frontend/lib/config/{tenants,campaigns}/crunch_*.json so the F1 lead
-- route (which resolves tenant by slug) has a row to find.
-- ============================================================================

insert into tenants (slug, name, is_active)
values ('crunch_fitness', 'Crunch Fitness', true);

insert into campaigns (tenant_id, slug, name, steps, is_active)
select id, 'crunch_14day', 'Crunch 14-Day Journey',
  '[
    {"step": 0, "delay_days": 0, "subject_template": "Welcome to Crunch, {first_name}", "prompt_template": "Write a warm welcome email for {first_name} interested in {fitness_goal} at {preferred_gym_location}."},
    {"step": 1, "delay_days": 3, "subject_template": "{first_name}, your first session", "prompt_template": "Encourage {first_name} to book a first session for {fitness_goal}."}
  ]'::jsonb,
  true
from tenants where slug = 'crunch_fitness';

-- A second, inactive tenant — used by E2E tests to assert tenant isolation
-- (RLS: an admin of tenant A must not see this tenant's data).
insert into tenants (slug, name, is_active)
values ('other_tenant', 'Other Tenant', true);
