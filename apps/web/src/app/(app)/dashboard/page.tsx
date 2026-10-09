"use client";

import {
  CalendarClock,
  Flame,
  ListChecks,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FocusTimer } from "@/components/focus-timer";
import { TaskRow } from "@/components/tasks/task-row";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { DashboardData, Profile, Task } from "@/lib/types";
import { relativeDays } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [showFocus, setShowFocus] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, me] = await Promise.all([
        api.get<DashboardData>("/api/dashboard"),
        api.get<Profile>("/api/me").catch(() => null),
      ]);
      setData(d);
      if (me?.display_name) setName(me.display_name);
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
    setFocusTask(data?.tasks.find((t) => t.status === "pending") ?? null);
    setShowFocus(true);
  }

  const goalPct = data?.weekly_goal_minutes
    ? Math.min(100, Math.round((data.study_minutes_week / data.weekly_goal_minutes) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting header */}
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}{name ? `, ${name}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your focus for today — one task at a time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePlan} disabled={generating}>
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating…" : "Generate plan"}
          </Button>
          <Button variant="gradient" onClick={startFocus}>
            <Timer className="h-4 w-4" /> Start focus
          </Button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : !data ? null : (
        <>
          {/* Stat tiles */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={Flame}
              tint="text-warning"
              label="Current streak"
              value={`${data.streak_days}`}
              unit="days"
            />
            <StatTile
              icon={ListChecks}
              tint="text-primary"
              label="Studied today"
              value={`${data.study_minutes_today}`}
              unit="min"
            />
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <ProgressRing value={goalPct} size={52} stroke={5}>
                  <span className="text-xs font-bold">{goalPct}%</span>
                </ProgressRing>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Weekly goal</p>
                  <p className="text-sm font-semibold">
                    {data.study_minutes_week}/{data.weekly_goal_minutes} min
                  </p>
                </div>
              </CardContent>
            </Card>
            <StatTile
              icon={Trophy}
              tint="text-accent"
              label="CP today"
              value={`${data.cp_progress.completed}/${data.cp_progress.planned}`}
              unit="solved"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Today's plan */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>
                    Today&apos;s plan
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {data.task_summary.completed}/{data.task_summary.planned}
                    </span>
                  </CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">View all</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.tasks.length === 0 ? (
                    <EmptyState
                      icon={Sparkles}
                      title="No tasks scheduled for today"
                      description="Generate a realistic plan from your schedule, deadlines & CP settings."
                      action={
                        <Button onClick={generatePlan} disabled={generating}>
                          <Sparkles className="h-4 w-4" /> Generate today&apos;s plan
                        </Button>
                      }
                    />
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

            {/* Side column */}
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
                <Card className="border-primary/30 bg-primary/[0.03]">
                  <CardHeader>
                    <CardTitle className="text-base">Snippet for you</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/snippets" className="text-sm font-medium text-primary hover:underline">
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
        </>
      )}

      {showFocus && (
        <FocusTimer task={focusTask} onClose={() => setShowFocus(false)} onCompleted={load} />
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  tint,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold leading-tight">
            {value}
            {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-36" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </>
  );
}
