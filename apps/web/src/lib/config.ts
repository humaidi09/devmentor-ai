export const APP_NAME = "Close AI";
export const APP_TAGLINE = "From student barriers to real support.";

// .trim() guards against the classic whitespace-in-env-var bug that makes a
// URL/key silently malformed in production.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Demo mode is on when Supabase isn't configured, or when explicitly forced.
// In demo mode the whole app works with no account and no secrets.
export const DEMO_MODE =
  !SUPABASE_CONFIGURED || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
