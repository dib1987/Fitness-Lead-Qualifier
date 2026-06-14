// F4 — Day-0 pipeline. Replaces the Celery process_lead task.
// Flow (identical to A): fetch lead+tenant -> idempotency guard -> score ->
// generate email (Claude, validated) -> send (Resend) -> enroll -> status -> CRM (non-blocking).
// Trigger.dev retry config mirrors A's Celery: 3 retries, 60s backoff.
import { task, logger } from "@trigger.dev/sdk/v3";
import { scoreLead } from "../../T/scoring";
// import { createClient } from "@supabase/supabase-js";
// import { estimateCostUsd } from "../../T/cost";

export const processLead = task({
  id: "process-lead",
  retry: { maxAttempts: 3, minTimeoutInMs: 60_000, maxTimeoutInMs: 60_000, factor: 1 },
  run: async (payload: { leadId: string }) => {
    logger.info("process-lead start", { leadId: payload.leadId });

    // 1. service-role supabase client (server context)
    // 2. fetch lead + tenant; bail if missing
    // 3. IDEMPOTENCY: skip if an 'email_sent' audit_log already exists for this lead
    // 4. score (pure):  const score = scoreLead(lead.form_data)
    // 5. generate email via Claude — VALIDATE output with zod; log llm_cost (+ per-tenant cap)
    // 6. send via Resend; write email_log with provider_message_id
    // 7. create campaign_enrollment; set next_send_at from step[1].delay_days
    // 8. update lead.status = 'email_sent'; write audit_log
    // 9. CRM upsert (non-blocking) -> set crm_contact_id / crm_synced_at
    void scoreLead;
    return { ok: true };
  },
});
