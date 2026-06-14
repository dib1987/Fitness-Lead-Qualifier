// Service-role Supabase client for Trigger.dev jobs. Mirrors
// frontend/lib/supabase.ts's createServiceClient — same env var names so one
// Supabase project config works for both the frontend and the worker.
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
