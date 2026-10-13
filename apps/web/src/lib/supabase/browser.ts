"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";
let client: ReturnType<typeof createBrowserClient> | undefined;
export function browserSupabase() {
  return (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY));
}
