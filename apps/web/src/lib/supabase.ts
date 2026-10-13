// Phase 3 consolidates browser authentication on the SSR cookie utility.
// The old eagerly-created localStorage client could create a second session.
export { browserSupabase } from "./supabase/browser";
