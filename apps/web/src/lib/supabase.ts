import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./config";

/** Browser Supabase client, or null in demo mode / on invalid config.
 *  Wrapped in try/catch so a bad env value can never crash the static
 *  prerender or the running app. */
function createBrowserSupabase(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = createBrowserSupabase();
