"use client";

import { ExternalLink, RefreshCw, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast";
import { Badge, Spinner } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { CPRecommendation, Page } from "@/lib/types";

interface CPProfile {
  handle: string | null;
  rating: number | null;
  max_rating: number | null;
  rank: string | null;
}
interface CPPrefs {
  morning_time: string;
  evening_time: string;
  min_rating: number;
  max_rating: number;
  problems_per_session: number;
  preferred_tags: string[];
  weak_tags: string[];
  notifications_enabled: boolean;
  contest_reminders_enabled: boolean;
}
interface Contest {
  id: number | null;
  name: string | null;
  start_time_seconds: number | null;
  duration_seconds: number | null;
}

const STATUS_ACTIONS: { label: string; value: CPRecommendation["status"] }[] = [
  { label: "Start", value: "started" },
  { label: "Solved", value: "solved" },
  { label: "Attempted", value: "attempted" },
  { label: "Skip", value: "skipped" },
];

export default function CPPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CPProfile | null>(null);
  const [prefs, setPrefs] = useState<CPPrefs | null>(null);
  const [recs, setRecs] = useState<CPRecommendation[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, pr, rc, ct] = await Promise.all([
        api.get<CPProfile>("/api/cp/profile"),
        api.get<CPPrefs>("/api/cp/preferences"),
        api.get<Page<CPRecommendation>>("/api/cp/recommendations?limit=50"),
        api.get<{ items: Contest[] }>("/api/cp/contests"),
      ]);
      setProfile(p);
      setPrefs(pr);
      setRecs(rc.items);
      setContests(ct.items);
    } catch {
      toast("Could not load Codeforces data.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setBusy(true);
    try {
      await api.post("/api/cp/recommendations/generate");
      toast("Fresh problems ready.", "success");
      await load();
    } catch {
      toast("Could not generate problems.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: CPRecommendation["status"]) {
    setRecs((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      await api.patch(`/api/cp/recommendations/${id}`, { status });
    } catch {
      toast("Could not update.", "error");
      load();
    }
  }

  async function savePrefs() {
    if (!prefs) return;
    setBusy(true);
    try {
      await api.post("/api/cp/preferences", prefs);
      toast("Preferences saved.", "success");
    } catch {
      toast("Could not save preferences.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const morning = recs.filter((r) => r.session === "morning");
  const evening = recs.filter((r) => r.session === "evening");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Codeforces coach"
        subtitle="Two sessions a day, matched to your rating. No guaranteed gains — just steady practice."
      >
        <Button variant="outline" onClick={load} disabled={busy}>
          <RefreshCw className="h-4 w-4" /> Sync
        </Button>
        <Button onClick={generate} disabled={busy}>
          <Sparkles className="h-4 w-4" /> Generate problems
        </Button>
      </PageHeader>

      {/* Profile */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-6 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{profile?.handle ?? "No handle linked"}</p>
              <p className="text-sm text-muted-foreground">
                {profile?.rating != null
                  ? `Rating ${profile.rating}${profile.rank ? ` · ${profile.rank}` : ""}`
                  : profile?.handle
                    ? "Sync for live stats (needs real keys)"
                    : "Add your handle in Settings"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SessionCard title="Morning session" recs={morning} onStatus={setStatus} />
          <SessionCard title="Evening session" recs={evening} onStatus={setStatus} />
          {recs.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No problems yet. Click <strong>Generate problems</strong> to get started.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preferences */}
        {prefs && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Min rating</Label>
                  <Input
                    type="number"
                    value={prefs.min_rating}
                    onChange={(e) => setPrefs({ ...prefs, min_rating: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max rating</Label>
                  <Input
                    type="number"
                    value={prefs.max_rating}
                    onChange={(e) => setPrefs({ ...prefs, max_rating: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Morning</Label>
                  <Input
                    type="time"
                    value={prefs.morning_time}
                    onChange={(e) => setPrefs({ ...prefs, morning_time: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Evening</Label>
                  <Input
                    type="time"
                    value={prefs.evening_time}
                    onChange={(e) => setPrefs({ ...prefs, evening_time: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.notifications_enabled}
                  onChange={(e) =>
                    setPrefs({ ...prefs, notifications_enabled: e.target.checked })
                  }
                />
                Daily session reminders
              </label>
              <Button className="w-full" onClick={savePrefs} disabled={busy}>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming contests */}
        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Upcoming contests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contests loaded. In demo mode this list is empty — deploy with
                real keys to see live Codeforces contests.
              </p>
            ) : (
              contests.map((c) => (
                <a
                  key={c.id ?? c.name}
                  href={c.id ? `https://codeforces.com/contest/${c.id}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-border p-2.5 hover:bg-muted"
                >
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.start_time_seconds
                      ? new Date(c.start_time_seconds * 1000).toLocaleString()
                      : "Time TBA"}
                  </p>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SessionCard({
  title,
  recs,
  onStatus,
}: {
  title: string;
  recs: CPRecommendation[];
  onStatus: (id: string, s: CPRecommendation["status"]) => void;
}) {
  if (recs.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={r.problem_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-primary hover:underline"
                  >
                    {r.problem_name}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                  {r.problem_rating && <Badge variant="muted">{r.problem_rating}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <span key={t} className="text-xs text-muted-foreground">#{t}</span>
                  ))}
                </div>
              </div>
              {r.status !== "suggested" && (
                <Badge variant={r.status === "solved" ? "success" : "default"}>
                  {r.status}
                </Badge>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_ACTIONS.map((a) => (
                <Button
                  key={a.value}
                  size="sm"
                  variant={r.status === a.value ? "primary" : "outline"}
                  onClick={() => onStatus(r.id, a.value)}
                >
                  {a.label}
                </Button>
              ))}
              <Link href="/chat">
                <Button size="sm" variant="ghost">Need a hint</Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
