"use client";

import {
  Check,
  Clock,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  study: "Study",
  cp: "Codeforces",
  revision: "Revision",
  quiz: "Quiz",
  project: "Project",
  focus: "Focus",
  rest: "Rest",
};

const RECOVERY = [
  { action: "move_tomorrow", label: "Tomorrow" },
  { action: "move_weekend", label: "Weekend" },
  { action: "reduce_scope", label: "Shorten" },
  { action: "skip", label: "Skip" },
];

export function TaskRow({
  task,
  tz,
  onChanged,
  onFocus,
  manage = false,
}: {
  task: Task;
  tz?: string | null;
  onChanged: () => void;
  onFocus?: (task: Task) => void;
  manage?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [when, setWhen] = useState("");
  const done = task.status === "completed";
  const skipped = task.status === "skipped";

  async function act(run: () => Promise<unknown>) {
    setBusy(true);
    try {
      await run();
      setReschedOpen(false);
      setRecoverOpen(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30",
        (done || skipped) && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            done
              ? "bg-[hsl(var(--success))]"
              : task.task_type === "cp"
                ? "bg-accent"
                : "bg-primary",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("truncate text-sm font-medium", done && "line-through")}>
              {task.title}
            </span>
            <Badge variant="muted" className="shrink-0">
              {TYPE_LABEL[task.task_type] ?? task.task_type}
            </Badge>
            <span className="shrink-0 text-xs text-muted-foreground">P{task.priority}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            {task.scheduled_start && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(task.scheduled_start, tz ?? undefined)}
                {task.scheduled_end && ` – ${formatTime(task.scheduled_end, tz ?? undefined)}`}
              </span>
            )}
            {task.estimated_minutes ? <span>{task.estimated_minutes} min</span> : null}
            {task.topic && <span className="capitalize">{task.topic}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!done && !skipped && (
            <>
              {onFocus && (
                <Button size="icon" variant="ghost" title="Focus" onClick={() => onFocus(task)}>
                  <Timer className="h-4 w-4" />
                </Button>
              )}
              {manage && (
                <Button
                  size="icon"
                  variant="ghost"
                  title="Reschedule"
                  onClick={() => setReschedOpen((o) => !o)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                title="Skip"
                disabled={busy}
                onClick={() => act(() => api.post(`/api/tasks/${task.id}/skip`, {}))}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => act(() => api.post(`/api/tasks/${task.id}/complete`, {}))}
              >
                <Check className="h-4 w-4" /> Done
              </Button>
            </>
          )}
          {done && <Badge variant="success">Completed</Badge>}
          {skipped && manage && (
            <Button size="sm" variant="outline" onClick={() => setRecoverOpen((o) => !o)}>
              Recover
            </Button>
          )}
          {skipped && !manage && <Badge variant="outline">Skipped</Badge>}
          {manage && (
            <Button
              size="icon"
              variant="ghost"
              title="Delete"
              disabled={busy}
              onClick={() => act(() => api.del(`/api/tasks/${task.id}`))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {reschedOpen && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="max-w-xs"
          />
          <Button
            size="sm"
            disabled={!when || busy}
            onClick={() =>
              act(() =>
                api.post(`/api/tasks/${task.id}/reschedule`, {
                  scheduled_start: new Date(when).toISOString(),
                }),
              )
            }
          >
            Save
          </Button>
        </div>
      )}

      {recoverOpen && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            No problem — pick what works:
          </p>
          <div className="flex flex-wrap gap-2">
            {RECOVERY.map((r) => (
              <Button
                key={r.action}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(() => api.post(`/api/tasks/${task.id}/recover`, { action: r.action }))
                }
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
