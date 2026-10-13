"use client";

import { useCallback, useEffect, useState } from "react";

import { useAccount } from "./account";
import { DEMO_SAVED_IDS } from "./demo-data";

const KEY = "close-ai-saved";

/** Saved-resource ids backed by localStorage, seeded with demo saves.
 *  Keeps the demo interactive without any backend. */
export function useSavedResources() {
  const { demo, data, mutate } = useAccount();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!demo || typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      /* session-only */
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === "string")
        ) {
          setIds(parsed);
          return;
        }
      } catch {
        /* fall through to demo seed */
      }
    }
    setIds(DEMO_SAVED_IDS);
  }, [demo]);

  const toggle = useCallback(
    (id: string) => {
      if (!demo) {
        void mutate(
          "saved",
          { resourceId: id },
          data?.savedIds.includes(id) ? "DELETE" : "POST",
        );
        return;
      }
      setIds((cur) => {
        const next = cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id];
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(KEY, JSON.stringify(next));
          } catch {
            /* session-only */
          }
        }
        return next;
      });
    },
    [demo, data, mutate],
  );

  const isSaved = useCallback(
    (id: string) => (demo ? ids : (data?.savedIds ?? [])).includes(id),
    [demo, ids, data],
  );

  return { ids: demo ? ids : (data?.savedIds ?? []), toggle, isSaved };
}
