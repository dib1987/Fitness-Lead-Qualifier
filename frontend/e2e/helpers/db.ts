// Test-only helper: service-role client against the LOCAL Supabase instance
// (`supabase start`). Defaults are the standard local-dev keys printed by
// `supabase status` — override via env if your local setup differs.
import { createClient } from "@supabase/supabase-js";

const LOCAL_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
const LOCAL_SERVICE_ROLE_KEY =
  process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDE3Njk2MDAsImV4cCI6MTc5OTUzNjAwMH0.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

export function testDb() {
  return createClient(LOCAL_URL, LOCAL_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
