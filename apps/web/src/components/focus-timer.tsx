"use client";

import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

export function FocusTimer({
  task,
  onClose,
  onCompleted,
}: {
  task?: Task | null;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    }
    return () => clearInterval(interval.current);
  }, [running]);

  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);

  async function start() {
    setRunning(true);
    if (mode === "focus" && !sessionId) {
      try {
        const s = await api.post<{ id: string }>("/api/focus/start", {
          task_id: task?.id ?? null,
        });
        setSessionId(s.id);
      } catch {
        /* ignore */
      }
    }
  }

  function switchMode(next: "focus" | "break") {
    setMode(next);
    setLeft(next === "focus" ? FOCUS : BREAK);
    setRunning(false);
  }

  async function finish(markDone: boolean) {
    setRunning(false);
    if (sessionId) {
      try {
        await api.post("/api/focus/stop", { session_id: sessionId });
      } catch {
        /* ignore */
      }
    }
    if (markDone && task) {
      try {
        await api.post(`/api/tasks/${task.id}/complete`, {});
        onCompleted?.();
      } catch {
        /* ignore */
      }
    }
    onClose();
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-md bg-muted p-1 text-xs">
            {(["focus", "break"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "rounded px-3 py-1 font-medium capitalize",
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <button onClick={() => finish(false)} aria-label="Close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {task && (
          <p className="mb-2 truncate text-sm text-muted-foreground">{task.title}</p>
        )}
        <div className="my-4 font-mono text-6xl font-bold tabular-nums">
          {mm}:{ss}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => switchMode(mode)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {running ? (
            <Button className="gap-2" onClick={() => setRunning(false)}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          ) : (
            <Button className="gap-2" onClick={start}>
              <Play className="h-4 w-4" /> Start
            </Button>
          )}
        </div>

        {task && (
          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => finish(true)}
          >
            Finish &amp; mark task done
          </Button>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Task completion is always yours to confirm.
        </p>
      </div>
    </div>
  );
}
