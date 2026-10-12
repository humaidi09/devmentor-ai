export const APP_NAME = "Close AI";
export const APP_TAGLINE = "From student barriers to real support.";

// .trim() guards against the classic whitespace-in-env-var bug that makes a
// URL/key silently malformed in production.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Phase 2 is a frontend prototype regardless of any legacy Supabase variables.
export const DEMO_MODE = true;
