"use client";

import { useCallback, useEffect, useState } from "react";

import { AUTH_ENABLED } from "./config";
import { useAuth } from "./auth-context";
import { DEMO_SAVED_IDS } from "./demo-data";
import { supabase } from "./supabase";

const KEY = "close-ai-saved";

/** Saved-resource ids, persisted per-user to Supabase when signed in, else
 *  localStorage (seeded with the demo saves). DB calls are defensive so the
 *  UI keeps working even if a query fails. */
export function useSavedResources() {
  const { session, loading } = useAuth();
  const authed = AUTH_ENABLED && !!session && !!supabase;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      if (authed && supabase && session) {
        const { data, error } = await supabase
          .from("ca_saved_resources")
          .select("resource_id")
          .eq("user_id", session.user.id);
        if (!error && active) {
          setIds((data ?? []).map((r) => r.resource_id as string));
          return;
        }
      }
      if (!active) return;
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(KEY);
        if (raw) {
          try {
            setIds(JSON.parse(raw) as string[]);
            return;
          } catch {
            /* fall through to seed */
          }
        }
      }
      setIds(authed ? [] : DEMO_SAVED_IDS);
    })();
    return () => {
      active = false;
    };
  }, [authed, loading, session]);

  const toggle = useCallback(
    (id: string) => {
      const has = ids.includes(id);
      const next = has ? ids.filter((x) => x !== id) : [...ids, id];
      setIds(next);
      if (authed && supabase && session) {
        const sb = supabase;
        const uid = session.user.id;
        void (async () => {
          try {
            if (has) {
              await sb.from("ca_saved_resources").delete().eq("user_id", uid).eq("resource_id", id);
            } else {
              await sb.from("ca_saved_resources").insert({ user_id: uid, resource_id: id });
            }
          } catch {
            /* keep optimistic local state */
          }
        })();
      } else if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
    },
    [authed, session, ids],
  );

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, isSaved };
}
