import { DEMO_MODE } from "./config";
import { supabase } from "./supabase";

export async function getAccessToken(): Promise<string | null> {
  if (DEMO_MODE || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Auth is not configured.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Auth is not configured.");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function isAuthenticated(): Promise<boolean> {
  if (DEMO_MODE || !supabase) return true; // demo: always "in"
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
