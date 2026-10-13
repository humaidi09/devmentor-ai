"use client";
import Link from "next/link";
import { ExternalLink, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { PageHeader } from "@/components/page-header";
import { CodeforcesConnection } from "@/components/codeforces-connection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { DEMO_CP_PROBLEMS, type CPStatus } from "@/lib/modules-data";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  practiceProblems,
  conceptTopic,
  weakTopics,
} from "@/lib/recommendations/cp";
import {
  CF_TOPICS,
  type PublicProblem,
  type PublicProfile,
  type PublicSubmission,
} from "@/lib/integrations/codeforces/adapter";
const STATUS_OPTIONS: { key: CPStatus; en: string; bn: string }[] = [
  { key: "solved", en: "Solved", bn: "সমাধান" },
  { key: "attempted", en: "Attempted", bn: "চেষ্টা" },
  { key: "skipped", en: "Skipped", bn: "বাদ" },
  { key: "need_hint", en: "Need Hint", bn: "হিন্ট প্রয়োজন" },
  { key: "upsolved", en: "Upsolved", bn: "Upsolve হয়েছে" },
];
export default function CPPage() {
  const { demo, data, mutate, request, busy } = useAccount(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const [localStatus, setStatus] = useState<Record<string, CPStatus>>({}),
    [hint, setHint] = useState<Record<string, number>>({}),
    [topic, setTopic] = useState(""),
    [range, setRange] = useState("800-1200"),
    [mode, setMode] = useState("topic"),
    [seed, setSeed] = useState(0.5),
    [profile, setProfile] = useState<PublicProfile | null>(null),
    [history, setHistory] = useState<PublicSubmission[]>([]),
    [external, setExternal] = useState<PublicProblem[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const status = demo ? localStatus : (data?.cpStatus ?? {});
  const catalog = [
    ...DEMO_CP_PROBLEMS,
    ...external
      .filter((p) => !DEMO_CP_PROBLEMS.some((d) => d.url === p.url))
      .map((p) => ({
        ...p,
        rating: p.rating ?? 800,
        hint: bn
          ? "একটি ছোট উদাহরণ দিয়ে input/output বোঝার চেষ্টা করুন।"
          : "Restate the input/output and try a small example.",
      })),
  ];
  const [showCompleted, setShowCompleted] = useState(true);
  const [min, max] = range.split("-").map(Number);
  const accepted = history
    .filter((s) => s.verdict === "OK")
    .flatMap((s) => [
      s.problem.id,
      ...catalog.filter((p) => p.url === s.problem.url).map((p) => p.id),
    ]);
  const problems = practiceProblems(
    catalog,
    { topic, min, max, mode, includeSolved: showCompleted },
    status,
    accepted,
    seed,
  );
  useEffect(() => {
    if (demo) {
      try {
        const stored = JSON.parse(
          sessionStorage.getItem("close-ai-cp-progress") || "{}",
        );
        if (stored && typeof stored === "object" && !Array.isArray(stored))
          setStatus(
            Object.fromEntries(
              Object.entries(stored).filter(
                ([key, value]) =>
                  /^[a-zA-Z0-9_-]{1,100}$/.test(key) &&
                  [
                    "none",
                    "attempted",
                    "solved",
                    "skipped",
                    "need_hint",
                    "upsolved",
                  ].includes(String(value)),
              ),
            ) as Record<string, CPStatus>,
          );
      } catch {
        /* session-only */
      }
    }
  }, [demo]);
  useEffect(() => {
    function clear() {
      setProfile(null);
      setHistory([]);
      setExternal([]);
    }
    window.addEventListener("close-ai-codeforces-disconnected", clear);
    if (!data?.cpConnected) clear();
    return () =>
      window.removeEventListener("close-ai-codeforces-disconnected", clear);
  }, [data?.cpConnected]);
  function mark(id: string, st: CPStatus) {
    const next = status[id] === st ? "none" : st;
    if (demo)
      setStatus((s) => {
        const value = { ...s, [id]: next };
        try {
          sessionStorage.setItem("close-ai-cp-progress", JSON.stringify(value));
        } catch {
          /* session-only */
        }
        return value;
      });
    else void mutate("cp", { problem: id, status: next });
  }
  async function load(action: "history" | "problems") {
    setLoading(true);
    setError("");
    try {
      if (action === "history") {
        const value = await request<{ submissions: PublicSubmission[] }>(
          "/api/codeforces",
          { action },
        );
        setHistory(value.submissions);
      } else {
        const value = await request<{ problems: PublicProblem[] }>(
          "/api/codeforces",
          { action, topic: topic || "implementation" },
        );
        setExternal(value.problems);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Codeforces unavailable. Manual practice remains available.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title={bn ? "CP কোচ" : "CP Coach"}
        subtitle={
          bn
            ? "নিজের practice ট্র্যাক করুন। হিন্ট আগে; manual catalog বাহ্যিক API ছাড়াও চলে।"
            : "Track your practice. Hints first; the manual catalog works without external APIs."
        }
      />
      <CodeforcesConnection onProfile={setProfile} />
      {profile && (
        <p className="text-sm">
          {profile.handle} · Rating: {profile.rating ?? "Unrated"} · Max:{" "}
          {profile.maxRating ?? "Unknown"}
        </p>
      )}
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">
          {bn ? "Practice পছন্দ" : "Practice preferences"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            {bn ? "Practice mode" : "Practice mode"}
            <Select
              aria-label={bn ? "Practice mode" : "Practice mode"}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="topic">
                {bn ? "বিষয় অনুযায়ী" : "Topic practice"}
              </option>
              <option value="difficulty">
                {bn ? "কঠিনতা অনুযায়ী" : "Difficulty practice"}
              </option>
              <option value="random">
                {bn ? "এলোমেলো" : "Random practice"}
              </option>
              <option value="weak">
                {bn ? "নিজের অসম্পূর্ণ বিষয়" : "Weak-topic practice"}
              </option>
            </Select>
          </label>
          <label className="text-sm">
            {bn ? "বিষয়" : "Practice topic"}
            <Select
              aria-label={bn ? "বিষয়" : "Practice topic"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">{bn ? "সব" : "All topics"}</option>
              {CF_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            {bn ? "Rating range" : "Difficulty range"}
            <Select
              aria-label={bn ? "Rating range" : "Difficulty range"}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              {[
                "800-1200",
                "800-1000",
                "1000-1200",
                "1200-1400",
                "1400-2000",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          {bn
            ? "সম্পন্ন practice-ও দেখান"
            : "Show solved/upsolved practice too"}
        </label>
        {mode === "random" && (
          <Button variant="secondary" onClick={() => setSeed(Math.random())}>
            {bn ? "অন্য problem" : "Pick another problem"}
          </Button>
        )}
        {mode === "weak" && (
          <p className="text-xs">
            {bn
              ? "শুধু আপনার Attempted/Need Hint রেকর্ড থেকে বিষয়: "
              : "Topics from your Attempted/Need Hint records only: "}
            {weakTopics(catalog, status).join(", ") ||
              (bn ? "এখনও তথ্য নেই।" : "No practice evidence yet.")}
          </p>
        )}
        {!demo && data?.cpConnected && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => void load("history")}
            >
              {bn ? "Public submission লোড" : "Load public submission sample"}
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => void load("problems")}
            >
              {bn ? "Public practice লোড" : "Load public practice"}
            </Button>
          </div>
        )}
        <Link
          href="/notifications?module=cp"
          className="text-sm text-primary underline"
        >
          {bn ? "CP reminder অনুমোদন" : "Set a CP practice reminder"}
        </Link>
        {loading && (
          <p role="status">{bn ? "লোড হচ্ছে…" : "Loading public data…"}</p>
        )}
        {error && <p role="alert">{error}</p>}
        {history.length > 0 && (
          <p className="text-xs">
            {bn
              ? "সাম্প্রতিক public submission-এর সীমিত নমুনা; মোট performance নয়।"
              : "Limited sample of recent public submissions; not lifetime performance."}{" "}
            {history.length} submissions, {new Set(accepted).size} accepted
            problems.
          </p>
        )}
      </Card>
      <section
        className="space-y-3"
        aria-label={bn ? "Practice problem" : "Practice problems"}
      >
        {!problems.length && (
          <p>
            {bn
              ? "এই পছন্দে problem নেই। Filter বদলান; rating উন্নতির নিশ্চয়তা নেই।"
              : "No problems match these preferences. Change filters; no rating improvement is guaranteed."}
          </p>
        )}
        {problems.map((p) => {
          const st = status[p.id] ?? "none",
            level = hint[p.id] ?? 0,
            visual = conceptTopic(p.tags);
          return (
            <Card key={p.id} className="p-4">
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                {p.name}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="info">{p.rating}</Badge>
                {p.tags.map((t) => (
                  <Badge key={t} variant="muted">
                    {localize(t, lang)}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs">
                {bn ? "নিজের record" : "Your record"}: {st}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={busy}
                    onClick={() => mark(p.id, s.key)}
                    aria-pressed={st === s.key}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      st === s.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {bn ? s.bn : s.en}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setHint((h) => ({ ...h, [p.id]: level ? 0 : 1 }));
                    if (
                      !level &&
                      st !== "solved" &&
                      st !== "upsolved" &&
                      st !== "need_hint"
                    )
                      mark(p.id, "need_hint");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                  {level
                    ? bn
                      ? "হিন্ট লুকান"
                      : "Hide hint"
                    : bn
                      ? "হিন্ট দরকার"
                      : "Need a hint"}
                </button>
              </div>
              {level > 0 && (
                <div className="mt-2 space-y-2 rounded-md bg-warning/10 p-2 text-xs">
                  <p>{localize(p.hint, lang)}</p>
                  {level > 1 && (
                    <p>
                      {bn
                        ? "ছোট test case লিখুন, edge case যাচাই করুন, তারপর complexity হিসাব করুন।"
                        : "Write a small test case, check edge cases, then estimate complexity."}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setHint((h) => ({ ...h, [p.id]: 2 }))}
                  >
                    {bn ? "হিন্ট ২" : "Hint 2"}
                  </Button>
                  {visual && (
                    <Link
                      href={`/learn/visual-lab/${visual}`}
                      className="text-primary underline"
                    >
                      {bn
                        ? "সংশ্লিষ্ট ধারণা দৃশ্যমানভাবে দেখুন"
                        : "Review related concept visually"}
                    </Link>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
