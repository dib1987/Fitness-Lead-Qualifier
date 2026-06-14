import { createBrowserClient } from "@supabase/ssr";

// Browser client — anon key, used from "use client" components (sign-in/sign-up forms).
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
