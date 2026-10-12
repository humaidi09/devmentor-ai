"use client";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
const FOCUS = 25 * 60, BREAK = 5 * 60;
export function FocusTimer({ task, onClose, onCompleted }: { task?: Task | null; onClose: () => void; onCompleted?: () => void }) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const segment = useRef<{ id: string; started: number; seconds: number; stoppedSeconds?: number } | null>(null);
  const deadline = useRef(0);
  const stopping = useRef(false);

  const stopSegment = useCallback(async () => {
    setRunning(false);
    const current = segment.current;
    if (!current) return;
    current.stoppedSeconds ??= Math.min(current.seconds, Math.floor((Date.now() - current.started) / 1000));
    await api.post("/api/focus/stop", { session_id: current.id, active_seconds: current.stoppedSeconds });
    segment.current = null;
    onCompleted?.();
  }, [onCompleted]);
  const pause = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    setBusy(true); setError(null);
    try { await stopSegment(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save this session. Try pausing again."); }
    finally { stopping.current = false; setBusy(false); }
  }, [stopSegment]);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
      if (!remaining) void pause();
    };
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [running, pause]);
  async function start() {
    setBusy(true); setError(null);
    try {
      if (segment.current) await stopSegment();
      const seconds = left || (mode === "focus" ? FOCUS : BREAK);
      if (mode === "focus") {
        const session = await api.post<{ id: string }>("/api/focus/start", { task_id: task?.id ?? null });
        segment.current = { id: session.id, started: Date.now(), seconds };
      }
      setLeft(seconds); deadline.current = Date.now() + seconds * 1000; setRunning(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start focus."); }
    finally { setBusy(false); }
  }
  async function changeMode(next: "focus" | "break") {
    setBusy(true); setError(null);
    try { await stopSegment(); setMode(next); setLeft(next === "focus" ? FOCUS : BREAK); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save session."); }
    finally { setBusy(false); }
  }
  async function finish(markDone: boolean) {
    setBusy(true); setError(null);
    try {
      await stopSegment();
      if (markDone && task) await api.post(`/api/tasks/${task.id}/complete`, {});
      onCompleted?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save progress. Try again."); }
    finally { setBusy(false); }
  }
  return <div role="dialog" aria-modal="true" aria-label="Focus timer" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-xl">
      <div className="mb-4 flex justify-between"><div className="flex gap-1 rounded-md bg-muted p-1 text-xs">{(["focus", "break"] as const).map(m => <button type="button" key={m} disabled={busy} onClick={() => void changeMode(m)} className={cn("rounded px-3 py-1 capitalize", mode === m && "bg-card shadow-sm")}>{m}</button>)}</div><button type="button" disabled={busy} onClick={() => void finish(false)} aria-label="Close"><X className="h-4 w-4" /></button></div>
      {task && <p className="truncate text-sm text-muted-foreground">{task.title}</p>}
      <div className="my-6 font-mono text-6xl font-bold tabular-nums">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</div>
      <div className="flex justify-center gap-2"><Button aria-label="Reset timer" disabled={busy} variant="outline" size="icon" onClick={() => void changeMode(mode)}><RotateCcw className="h-4 w-4" /></Button><Button disabled={busy} onClick={() => void (running ? pause() : start())}>{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{busy ? "Saving…" : running ? "Pause" : "Start"}</Button></div>
      {task && <Button disabled={busy} variant="ghost" className="mt-4 w-full" onClick={() => void finish(true)}>Finish &amp; mark task done</Button>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <p className="mt-4 text-xs text-muted-foreground">Pause or close to save. Breaks do not count as study time.</p>
    </div>
  </div>;
}
