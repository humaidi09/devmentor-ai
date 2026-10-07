export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Demo mode: skip auth and use the backend's in-memory demo data. On by
 *  default, and forced on whenever Supabase isn't configured. */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !SUPABASE_CONFIGURED;
