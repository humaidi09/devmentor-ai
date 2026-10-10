import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./config";

/** Browser Supabase client, or null when Supabase isn't configured (demo),
 *  or when the configured URL/key is invalid. Wrapped so a bad env value can
 *  never crash the production build (static prerender) or the app. */
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
