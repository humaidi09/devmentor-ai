"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

// Recharts is heavy — load it only on the client, as its own chunk.
const StudyChart = dynamic(
  () => import("@/components/analytics/study-chart").then((m) => m.StudyChart),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-64 place-items-center text-muted-foreground">
        <Spinner className="h-5 w-5" />
      </div>
    ),
  },
);

interface Weekly {
  week_start: string;
  tasks: { planned: number; completed: number; skipped: number; completion_rate: number };
  study_minutes_by_day: Record<string, number>;
  study_minutes_total: number;
  cp: { planned: number; completed: number };
}
interface Topic {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState<Weekly | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Weekly>("/api/analytics/weekly"),
      api.get<{ items: Topic[] }>("/api/analytics/topics"),
    ])
      .then(([w, t]) => {
        setWeekly(w);
        setTopics(t.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!weekly) return null;

  const start = new Date(weekly.week_start);
  const chartData = DAY_LABELS.map((label, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { day: label, minutes: weekly.study_minutes_by_day[key] ?? 0 };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics"
        subtitle="Honest numbers from what you've actually logged — no inflation."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Study this week" value={`${weekly.study_minutes_total} min`} />
        <Metric
          label="Tasks completed"
          value={`${weekly.tasks.completed}/${weekly.tasks.planned}`}
        />
        <Metric label="Completion rate" value={`${Math.round(weekly.tasks.completion_rate * 100)}%`} />
        <Metric label="CP solved" value={`${weekly.cp.completed}/${weekly.cp.planned}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study minutes by day</CardTitle>
          </CardHeader>
          <CardContent>
            <StudyChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topics.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Take some quizzes and we&apos;ll chart your weak topics here.
              </p>
            ) : (
              topics.map((t) => (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize">{t.topic}</span>
                    <span className="text-muted-foreground">
                      {Math.round(t.accuracy * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(t.accuracy * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
