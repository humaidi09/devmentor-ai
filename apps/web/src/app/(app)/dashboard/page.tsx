"use client";

import {
  Flame,
  Sparkles,
  Timer,
  TrendingUp,
  CalendarClock,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FocusTimer } from "@/components/focus-timer";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/tasks/task-row";
import { useToast } from "@/components/toast";
import { Badge, Spinner } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { DashboardData, Task } from "@/lib/types";
import { relativeDays } from "@/lib/utils";

export default function DashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [showFocus, setShowFocus] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.get<DashboardData>("/api/dashboard"));
    } catch {
      toast("Could not load dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function generatePlan() {
    setGenerating(true);
    try {
      await api.post("/api/tasks/generate-daily", { replace_existing: false });
      toast("Today's plan generated.", "success");
      await load();
    } catch {
      toast("Could not generate plan.", "error");
    } finally {
      setGenerating(false);
    }
  }

  function startFocus() {
    const pending = data?.tasks.find((t) => t.status === "pending") ?? null;
    setFocusTask(pending);
    setShowFocus(true);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!data) return null;

  const goalPct = data.weekly_goal_minutes
    ? Math.min(100, Math.round((data.study_minutes_week / data.weekly_goal_minutes) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Today's plan"
        subtitle="Focus on what matters now — everything else can wait."
      >
        <Button variant="outline" onClick={generatePlan} disabled={generating}>
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating…" : "Generate plan"}
        </Button>
        <Button onClick={startFocus}>
          <Timer className="h-4 w-4" /> Start focus
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Flame} label="Streak" value={`${data.streak_days} days`} />
        <StatTile
          icon={TrendingUp}
          label="Studied today"
          value={`${data.study_minutes_today} min`}
        />
        <StatTile
          icon={CalendarClock}
          label="Weekly goal"
          value={`${goalPct}%`}
          sub={`${data.study_minutes_week}/${data.weekly_goal_minutes} min`}
        />
        <StatTile
          icon={Trophy}
          label="CP today"
          value={`${data.cp_progress.completed}/${data.cp_progress.planned}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tasks ({data.task_summary.completed}/{data.task_summary.planned})</CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.tasks.length === 0 ? (
                <div className="rounded-md border border-dashed border-border py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tasks scheduled for today.
                  </p>
                  <Button className="mt-3" onClick={generatePlan} disabled={generating}>
                    <Sparkles className="h-4 w-4" /> Generate today&apos;s plan
                  </Button>
                </div>
              ) : (
                data.tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    tz={data.timezone}
                    onChanged={load}
                    onFocus={(task) => {
                      setFocusTask(task);
                      setShowFocus(true);
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcoming_deadlines.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing due soon. 🎉</p>
              )}
              {data.upcoming_deadlines.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{d.type}</p>
                  </div>
                  <Badge variant={relativeDays(d.due_at).includes("ago") ? "warning" : "muted"}>
                    {relativeDays(d.due_at)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weak areas</CardTitle>
            </CardHeader>
            <CardContent>
              {data.weak_areas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  We&apos;ll surface these as you practice.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.weak_areas.map((w) => (
                    <Badge key={w} variant="warning">{w}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {data.recommended_snippet && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snippet for you</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href="/snippets"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {data.recommended_snippet.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.recommended_snippet.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showFocus && (
        <FocusTimer
          task={focusTask}
          onClose={() => setShowFocus(false)}
          onCompleted={load}
        />
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
