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
    {"step":0,"delay_days":0,"subject_template":"Welcome to Crunch, {first_name}!","prompt_template":"Write a warm, excited welcome email (~120 words) to {first_name} who just expressed interest in {fitness_goal} at {preferred_gym_location}. Tone: genuine, energetic, human — not corporate. Tell them you are thrilled they reached out, briefly mention that Crunch is a place where real people hit real goals, and invite them to reply with any questions. CTA: Hit reply if you have questions — we would love to hear from you. No hard sell. End with a warm sign-off."},
    {"step":1,"delay_days":3,"subject_template":"{first_name}, here s what makes Crunch different","prompt_template":"Write an enthusiastic club spotlight email (~120 words) to {first_name} who is interested in {fitness_goal}. Tone: proud but not boastful, like a friend who loves their gym. Highlight 2-3 things that make Crunch stand out: world-class equipment, no-judgment atmosphere, expert coaches who actually care. Tie one point specifically to {fitness_goal} to make it feel personal. CTA: Come see it for yourself — book a free tour at {preferred_gym_location} this week. Keep it punchy."},
    {"step":2,"delay_days":5,"subject_template":"How someone just like you crushed their goal","prompt_template":"Write a social-proof email (~120 words) to {first_name}. Invent a brief, believable success story about a member with a similar goal of {fitness_goal} — give them a first name, make the transformation specific and realistic (not miraculous), and make it relatable. Tone: inspiring but grounded, like a coach sharing a genuine story. End with a direct line connecting that story to {first_name} s journey. CTA: Ready to write your own story? Let s talk — book a 15-min call with our team. No fluff."},
    {"step":3,"delay_days":8,"subject_template":"{first_name}, here s exactly what your first session looks like","prompt_template":"Write a reassuring, practical email (~120 words) to {first_name} walking them through what their very first session at Crunch would look like. Tone: calm, welcoming, zero pressure — like a friendly orientation. Cover: arriving, meeting a coach, a quick goals chat, a light introductory workout suited to {fitness_goal}, and what happens after. CTA: Book your intro session at {preferred_gym_location} — it s free and no commitment. Keep sentences short."},
    {"step":4,"delay_days":11,"subject_template":"Quick heads-up, {first_name} — this won t last","prompt_template":"Write a friendly urgency email (~120 words) to {first_name}. Tone: warm but honest — like a friend giving a heads-up, not a pushy salesperson. Mention that Crunch occasionally opens up a limited number of spots for new members who get a discounted first month or a free PT session. Connect the offer to {fitness_goal}. CTA: Claim your spot before it s gone — reply to this email or call us at {preferred_gym_location}."},
    {"step":5,"delay_days":14,"subject_template":"No pressure, {first_name} — but the door s always open","prompt_template":"Write a low-pressure goodbye email (~100 words) to {first_name}. Tone: warm, zero guilt, genuinely kind. Acknowledge that timing is not always right, wish them well on their {fitness_goal} journey, and let them know the team is always here when they are ready. CTA: When the time feels right, just reply to this email — we will pick up right where we left off. No urgency. No sales pitch."}
  ]'::jsonb,
  true
from tenants where slug = 'crunch_fitness';

-- A second, inactive tenant — used by E2E tests to assert tenant isolation
-- (RLS: an admin of tenant A must not see this tenant's data).
insert into tenants (slug, name, is_active)
values ('other_tenant', 'Other Tenant', true);
