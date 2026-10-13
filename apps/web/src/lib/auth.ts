import { supabase } from "./supabase";

/** Thin auth helpers over Supabase. All throw in demo mode (no client). */

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Auth is not available in demo mode.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Auth is not available in demo mode.");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
