// Dedup decision — ported from lead-generation-fitness leads.py + webhooks_facebook.py.
// Pure function so the 24h / 30d windows are unit-tested (F1). The DB lookups stay
// in the route; this just decides the outcome from the facts.

export type DedupOutcome = "new" | "already_enrolled" | "already_submitted";

export interface ExistingLead {
  createdAt: Date;
  status: string;
  hasActiveEnrollment: boolean;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function dedupDecision(existing: ExistingLead | null, now: Date = new Date()): DedupOutcome {
  if (!existing) return "new";

  const ageMs = now.getTime() - existing.createdAt.getTime();

  // < 24h and not completed → still in the pipeline
  if (ageMs < 24 * HOUR && existing.status !== "completed") {
    return "already_enrolled";
  }

  // 24h–30d with an active enrollment → already in the sequence
  if (ageMs >= 24 * HOUR && ageMs <= 30 * DAY && existing.hasActiveEnrollment) {
    return "already_submitted";
  }

  return "new";
}
