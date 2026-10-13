"use client";

import { useCallback, useEffect, useState } from "react";

import { DEMO_SAVED_IDS } from "./demo-data";

const KEY = "close-ai-saved";

/** Saved-resource ids backed by localStorage, seeded with demo saves.
 *  Keeps the demo interactive without any backend. */
export function useSavedResources() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(KEY); } catch { /* session-only */ }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(v => typeof v === "string")) { setIds(parsed); return; }
      } catch {
        /* fall through to demo seed */
      }
    }
    setIds(DEMO_SAVED_IDS);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      if (typeof window !== "undefined") { try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* session-only */ } }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, isSaved };
}
