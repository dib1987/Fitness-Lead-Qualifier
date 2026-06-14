// F5 — Follow-up sequence. Replaces the Celery BEAT schedule (every 15 min).
// schedules.task means no always-on beat process to host.
import { schedules, logger } from "@trigger.dev/sdk/v3";

export const runFollowup = schedules.task({
  id: "run-followup",
  cron: "*/15 * * * *", // same cadence as A's celery beat
  run: async () => {
    logger.info("run-followup tick");
    // 1. service-role supabase client
    // 2. select active enrollments where next_send_at <= now()
    // 3. for each (independently): load campaign step, generate+send next email,
    //    advance current_step, set next_send_at or mark completed, write audit_log
    return { ok: true };
  },
});
