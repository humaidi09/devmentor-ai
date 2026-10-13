import { accountModeEnabled } from "./auth/mode";
export const APP_NAME = "Close AI";
export const APP_TAGLINE = "From student barriers to real support.";

// .trim() guards against the classic whitespace-in-env-var bug that makes a
// URL/key silently malformed in production.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Opt in only after migrations/Auth configuration; old deployment flags are insufficient.
export const DEMO_MODE = !accountModeEnabled(
  process.env.NEXT_PUBLIC_ACCOUNT_MODE_ENABLED,
  process.env.NEXT_PUBLIC_DEMO_MODE,
  SUPABASE_CONFIGURED,
);
