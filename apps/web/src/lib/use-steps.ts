"use client";

import { useCallback, useEffect, useState } from "react";

import { AUTH_ENABLED } from "./config";
import { useAuth } from "./auth-context";
import { DEMO_NEXT_STEPS } from "./demo-data";
import { supabase } from "./supabase";
import type { NextStep, StepStatus } from "./types";

/** Next steps, persisted per-user to Supabase when signed in, otherwise an
 *  in-memory demo list. DB calls are defensive: on any error we keep the UI
 *  working with local state. */
export function useSteps() {
  const { session, loading } = useAuth();
  const authed = AUTH_ENABLED && !!session && !!supabase;
  const [steps, setSteps] = useState<NextStep[]>([]);

  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      if (authed && supabase && session) {
        const { data, error } = await supabase
          .from("ca_action_steps")
          .select("*")
          .eq("user_id", session.user.id)
          .order("position", { ascending: true });
        if (!error && active) {
          setSteps(
            (data ?? []).map((r) => ({
              id: r.id,
              title: r.title,
              detail: r.detail ?? undefined,
              status: r.status as StepStatus,
              source: r.source,
              resourceId: r.resource_id ?? undefined,
            })),
          );
          return;
        }
      }
      if (active) setSteps(authed ? [] : DEMO_NEXT_STEPS);
    })();
    return () => {
      active = false;
    };
  }, [authed, loading, session]);

  const add = useCallback(
    async (title: string) => {
      if (authed && supabase && session) {
        const { data } = await supabase
          .from("ca_action_steps")
          .insert({ user_id: session.user.id, title, status: "not_started", source: "ai_suggestion", position: steps.length })
          .select()
          .single();
        if (data) setSteps((s) => [...s, { id: data.id, title: data.title, status: data.status, source: data.source }]);
      } else {
        setSteps((s) => [...s, { id: `s_${Date.now()}`, title, status: "not_started", source: "ai_suggestion" }]);
      }
    },
    [authed, session, steps.length],
  );

  const setStatus = useCallback(
    async (id: string, status: StepStatus) => {
      setSteps((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
      if (authed && supabase && session) {
        try {
          await supabase.from("ca_action_steps").update({ status }).eq("id", id);
        } catch {
          /* keep optimistic local state */
        }
      }
    },
    [authed, session],
  );

  const remove = useCallback(
    async (id: string) => {
      setSteps((s) => s.filter((x) => x.id !== id));
      if (authed && supabase && session) {
        try {
          await supabase.from("ca_action_steps").delete().eq("id", id);
        } catch {
          /* already removed locally */
        }
      }
    },
    [authed, session],
  );

  return { steps, add, setStatus, remove };
}
