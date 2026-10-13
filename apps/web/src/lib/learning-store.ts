"use client";
import { useEffect, useState } from "react";
import { useAccount } from "./account";
import {
  validStoredProgress,
  type VisualProgress,
} from "./recommendations/learning";
export function useLearningProgress() {
  const { demo, userId, data, request, refresh } = useAccount();
  const [local, setLocal] = useState<VisualProgress[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) {
      try {
        const rows = JSON.parse(
          sessionStorage.getItem("close-ai-learning-progress") || "[]",
        );
        setLocal(validStoredProgress(rows));
      } catch {
        /* demo session-only */
      }
    }
  }, [demo]);
  async function save(
    kind: "visual" | "project",
    key: string,
    status: string,
    position = 0,
  ) {
    setBusy(true);
    setError("");
    try {
      if (demo) {
        const rows = [
          ...local.filter((p) => !(p.kind === kind && p.topic_key === key)),
          {
            kind,
            topic_key: key,
            status,
            position,
            updated_at: new Date().toISOString(),
          },
        ];
        setLocal(rows);
        try {
          sessionStorage.setItem(
            "close-ai-learning-progress",
            JSON.stringify(rows),
          );
        } catch {
          /* session-only */
        }
      } else {
        if (!userId) throw Error("Sign in to remember progress.");
        await request("/api/learning", { kind, key, status, position });
        await refresh();
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save progress.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: "visual" | "project", key: string) {
    setBusy(true);
    setError("");
    try {
      if (demo) {
        const rows = local.filter(
          (p) => !(p.kind === kind && p.topic_key === key),
        );
        setLocal(rows);
        sessionStorage.setItem(
          "close-ai-learning-progress",
          JSON.stringify(rows),
        );
      } else {
        await request("/api/learning", { kind, key }, "DELETE");
        await refresh();
      }
    } catch {
      setError("Unable to remove progress.");
    } finally {
      setBusy(false);
    }
  }
  return {
    progress: demo ? local : (data?.learningProgress ?? []),
    save,
    remove,
    busy,
    error,
    demo,
    userId,
  };
}
