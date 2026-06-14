// Lead scoring — ported 1:1 from lead-generation-fitness `_score_lead`
// (backend/app/workers/tasks/process_lead.py). Pure function, fully testable.
// F6 in the migration plan. Behavior must stay identical — see tests/scoring.test.ts.

const PREMIUM_GOALS = [
  "weight loss",
  "muscle gain",
  "body transformation",
  "competition prep",
  "athletic performance",
];

const STANDARD_GOALS = [
  "general fitness",
  "stay active",
  "health improvement",
  "flexibility",
  "flexibility & mobility",
];

const KNOWN_LOCATIONS = ["ballantyne", "gastonia", "tampa"];

export function scoreLead(formData: Record<string, unknown>): number {
  let score = 0;

  // Fitness goal — optional (35 max)
  const goal = String(formData.fitness_goal ?? "").toLowerCase();
  if (goal.trim()) {
    if (PREMIUM_GOALS.some((g) => goal.includes(g))) score += 35;
    else if (STANDARD_GOALS.some((g) => goal.includes(g))) score += 20;
    else score += 10;
  }

  // Phone number — contactable (20)
  if (String(formData.phone_number ?? "").trim()) score += 20;

  // Gym location — known Crunch location (25), else any (10)
  const location = String(formData.preferred_gym_location ?? "").toLowerCase();
  if (KNOWN_LOCATIONS.some((loc) => location.includes(loc))) score += 25;
  else if (location.trim()) score += 10;

  // Full name — first + last (20)
  if (String(formData.full_name ?? "").split(/\s+/).filter(Boolean).length >= 2) score += 20;

  return Math.min(score, 100);
}
