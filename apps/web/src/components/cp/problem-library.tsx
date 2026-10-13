"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Lightbulb, RotateCcw } from "lucide-react";

import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import {
  CP_TOPICS, CATALOG_RETRIEVED_AT, CURATED_PROBLEMS, LIBRARY_PROBLEMS, TOPIC_LABELS, VISUAL_TOPICS,
  dailyPractice, filterProblems, type CPLevel, type CPPlatform, type CPProgressStatus,
  type CPTopic, type LibraryProblem,
} from "@/lib/cp/library";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

const progressOptions: Array<[CPProgressStatus, string, string]> = [
  ["none", "Not started", "শুরু হয়নি"], ["attempted", "Attempted", "চেষ্টা"],
  ["solved", "Solved", "সমাধান"], ["need_hint", "Need hint", "হিন্ট দরকার"],
  ["upsolve", "Upsolve later", "পরে আপসলভ"], ["upsolved", "Upsolved", "আপসলভ হয়েছে"],
  ["skipped", "Skipped", "বাদ"],
];
const levels: CPLevel[] = ["beginner", "easy", "medium", "hard", "unrated"];
const curatedIds = new Set(CURATED_PROBLEMS.map((problem) => problem.id));

function ProblemCard({ problem, status, onStatus, busy, returnTopic }: {
  problem: LibraryProblem; status: CPProgressStatus; onStatus: (id: string, status: CPProgressStatus) => void;
  busy: boolean; returnTopic: string;
}) {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [hintStep, setHintStep] = useState(0);
  const visual = (returnTopic && VISUAL_TOPICS[returnTopic as CPTopic]) || problem.topics.map((topic) => VISUAL_TOPICS[topic]).find(Boolean);
  return <Card className="studio-card space-y-3 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h4 className="font-bold">{problem.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{problem.platform === "codeforces" ? "Codeforces" : problem.platform === "codechef" ? "CodeChef" : "LeetCode"} · {problem.source === "curated" ? (bn ? "যাচাই করা লিংক" : "Curated link") : problem.source === "catalog" ? (bn ? "সংরক্ষিত metadata" : "Metadata snapshot") : (bn ? "পাবলিক API" : "Public API")} · {problem.externalId}</p>
      </div>
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{problem.normalizedDifficulty === "unrated" ? (bn ? "রেটিং অজানা" : "Rating unavailable") : problem.normalizedDifficulty}{problem.rating !== null ? ` · ${problem.platform === "codechef" ? "CC" : "CF"} ${problem.rating}` : ""}</span>
    </div>
    <div className="flex flex-wrap gap-1.5">{problem.topics.map((topic) => <span key={topic} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{TOPIC_LABELS[topic]}</span>)}</div>
    <p className="text-xs">{bn ? "আপনার অবস্থা" : "Your status"}: <strong>{progressOptions.find(([key]) => key === status)?.[bn ? 2 : 1]}</strong></p>
    <div className="flex flex-wrap gap-2">
      <a href={problem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">{bn ? "প্রশ্ন খুলুন" : "Open problem"}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
      {(["attempted", "solved", "need_hint", "upsolve"] as CPProgressStatus[]).map((value) => <button key={value} type="button" disabled={busy} onClick={() => { onStatus(problem.id, value); if (value === "need_hint") setHintStep(1); }} aria-pressed={status === value}
        className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${status === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{progressOptions.find(([key]) => key === value)?.[bn ? 2 : 1]}</button>)}
      <Select aria-label={`${problem.title} status`} value={status} disabled={busy} onChange={(event) => onStatus(problem.id, event.target.value as CPProgressStatus)} className="h-8 w-auto min-w-[7rem] text-xs">
        {progressOptions.map(([key, en, bd]) => <option key={key} value={key}>{bn ? bd : en}</option>)}
      </Select>
    </div>
    {hintStep > 0 && <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
      <p><Lightbulb className="mr-1 inline h-4 w-4 text-warning" aria-hidden />{bn ? "হিন্ট ১: " : "Hint 1: "}{problem.hint}</p>
      {hintStep > 1 && <p>{bn ? "হিন্ট ২: ছোট উদাহরণে edge case লিখে state পরিবর্তন অনুসরণ করুন।" : "Hint 2: Trace the state changes on a small example and check edge cases."}</p>}
      {hintStep === 1 && <Button size="sm" variant="ghost" onClick={() => setHintStep(2)}>{bn ? "আরেকটি হিন্ট" : "Another hint"}</Button>}
      {visual && <Link href={`/learn/visual-lab/${visual}?from=cp&topic=${encodeURIComponent(returnTopic || problem.topics[0])}`} className="block text-sm font-medium text-primary underline">{bn ? "ধারণাটি চিত্রে দেখুন" : "Review concept visually"}</Link>}
    </div>}
    {visual && hintStep === 0 && <Link href={`/learn/visual-lab/${visual}?from=cp&topic=${encodeURIComponent(returnTopic || problem.topics[0])}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary underline">{bn ? "ধারণা পর্যালোচনা" : "Review concept"}<ArrowRight className="h-3 w-3" aria-hidden /></Link>}
  </Card>;
}

export function ProblemLibrary({ initialTopic = "" }: { initialTopic?: string }) {
  const { demo, data, mutate, busy: accountBusy, error: accountError } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [topic, setTopic] = useState(CP_TOPICS.includes(initialTopic as CPTopic) ? initialTopic : "");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<CPPlatform | "">("");
  const [difficulty, setDifficulty] = useState<CPLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<CPProgressStatus | "">("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [localProgress, setLocalProgress] = useState<Record<string, CPProgressStatus>>({});
  const [external, setExternal] = useState<LibraryProblem[]>([]);
  const [apiPage, setApiPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [live, setLive] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(12);
  const progress = demo ? localProgress : (data?.cpStatus ?? {});

  useEffect(() => {
    if (!demo) return;
    try {
      const value: unknown = JSON.parse(sessionStorage.getItem("close-ai-cp-progress") ?? "{}");
      if (value && typeof value === "object" && !Array.isArray(value)) setLocalProgress(value as Record<string, CPProgressStatus>);
    } catch { /* session storage unavailable */ }
  }, [demo]);

  useEffect(() => {
    setExternal([]); setApiPage(1); setHasMore(false); setShown(12);
    if (!topic) { setLive(false); setReason(""); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/cp/problems?topic=${encodeURIComponent(topic)}&page=1`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Problem source unavailable."); return response.json(); })
      .then((value: { problems: LibraryProblem[]; hasMore: boolean; live: boolean; reason: string | null }) => {
        setExternal(value.problems.filter((problem) => problem.source === "codeforces-api"));
        setHasMore(value.hasMore); setLive(value.live); setReason(value.reason ?? "");
      }).catch((error) => { if (error.name !== "AbortError") setReason("Codeforces unavailable. Curated links remain available."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [topic]);

  const all = useMemo(() => {
    const ids = new Set(LIBRARY_PROBLEMS.map((problem) => problem.id));
    return [...LIBRARY_PROBLEMS, ...external.filter((problem) => !ids.has(problem.id))];
  }, [external]);
  const filtered = filterProblems(all, {
    query, topic, platform, difficulty, status: statusFilter,
    minRating: minRating ? Number(minRating) : undefined,
    maxRating: maxRating ? Number(maxRating) : undefined, progress,
  }).sort((a, b) => topic ? Number(curatedIds.has(b.id)) - Number(curatedIds.has(a.id)) : 0);
  const shownProblems = filtered.slice(0, shown);
  const daily = dailyPractice(filtered, progress, topic);
  const counts = { solved: all.filter((problem) => ["solved", "upsolved"].includes(progress[problem.id])).length,
    attempted: all.filter((problem) => progress[problem.id] === "attempted").length,
    upsolve: all.filter((problem) => progress[problem.id] === "upsolve").length };

  function mark(id: string, value: CPProgressStatus) {
    if (demo) {
      const next = { ...localProgress, [id]: value };
      setLocalProgress(next);
      try { sessionStorage.setItem("close-ai-cp-progress", JSON.stringify(next)); } catch { /* session only */ }
    } else void mutate("cp", { problem: id, status: value });
  }
  async function loadMore() {
    if (!topic || !hasMore || loading) return;
    setLoading(true);
    try {
      const page = apiPage + 1;
      const response = await fetch(`/api/cp/problems?topic=${encodeURIComponent(topic)}&page=${page}`);
      if (!response.ok) throw new Error();
      const value = await response.json() as { problems: LibraryProblem[]; hasMore: boolean; live: boolean; reason: string | null };
      setExternal((current) => [...current, ...value.problems.filter((problem) => problem.source === "codeforces-api")]);
      setApiPage(page); setHasMore(value.hasMore); setLive(value.live); setReason(value.reason ?? "");
    } catch { setReason("Codeforces unavailable. Curated links remain available."); }
    finally { setLoading(false); }
  }
  async function clearProgress() {
    if (!window.confirm(bn ? "সব CP progress মুছবেন?" : "Clear all CP progress?")) return;
    if (demo) { setLocalProgress({}); try { sessionStorage.removeItem("close-ai-cp-progress"); } catch { /* session only */ } }
    else await mutate("cp", { confirmation: "CLEAR CP PROGRESS" }, "DELETE");
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3" aria-label={bn ? "আপনার অগ্রগতি" : "Your progress"}>
      {([["Solved", "সমাধান", counts.solved], ["Attempted", "চেষ্টা", counts.attempted], ["Upsolve later", "পরে আপসলভ", counts.upsolve]] as const).map(([en, bd, count]) => <Card key={en} className="p-4"><p className="text-xs text-muted-foreground">{bn ? bd : en}</p><p className="text-2xl font-bold">{count}</p></Card>)}
    </section>
    <Card className="space-y-4 p-4 sm:p-5">
      <h2 className="font-bold">{bn ? "সমস্যা খুঁজুন" : "Find problems"}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs">{bn ? "শিরোনাম" : "Title"}<Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={bn ? "সমস্যার নাম" : "Search title"} /></label>
        <label className="text-xs">{bn ? "বিষয়" : "Topic"}<Select aria-label={bn ? "বিষয়" : "Topic"} value={topic} onChange={(event) => setTopic(event.target.value)}><option value="">{bn ? "সব বিষয়" : "All topics"}</option>{CP_TOPICS.map((item) => <option value={item} key={item}>{TOPIC_LABELS[item]}</option>)}</Select></label>
        <label className="text-xs">{bn ? "প্ল্যাটফর্ম" : "Platform"}<Select aria-label={bn ? "প্ল্যাটফর্ম" : "Platform"} value={platform} onChange={(event) => setPlatform(event.target.value as CPPlatform | "")}><option value="">{bn ? "সব" : "All"}</option><option value="codeforces">Codeforces</option><option value="leetcode">LeetCode</option><option value="codechef">CodeChef</option></Select></label>
        <label className="text-xs">{bn ? "কঠিনতা" : "Difficulty"}<Select aria-label={bn ? "কঠিনতা" : "Difficulty"} value={difficulty} onChange={(event) => setDifficulty(event.target.value as CPLevel | "")}><option value="">{bn ? "সব" : "All"}</option>{levels.map((item) => <option key={item} value={item}>{item === "unrated" ? (bn ? "রেটিং অজানা" : "Rating unavailable") : item}</option>)}</Select></label>
        <label className="text-xs">{bn ? "অবস্থা" : "Status"}<Select aria-label={bn ? "অবস্থা" : "Status"} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CPProgressStatus | "")}><option value="">{bn ? "সব" : "All"}</option>{progressOptions.map(([key, en, bd]) => <option key={key} value={key}>{bn ? bd : en}</option>)}</Select></label>
        <div className="grid grid-cols-2 gap-2"><label className="text-xs">{bn ? "ন্যূনতম CF রেটিং" : "Min CF rating"}<Input inputMode="numeric" type="number" min="0" max="6000" value={minRating} onChange={(event) => setMinRating(event.target.value)} /></label><label className="text-xs">{bn ? "সর্বোচ্চ CF রেটিং" : "Max CF rating"}<Input inputMode="numeric" type="number" min="0" max="6000" value={maxRating} onChange={(event) => setMaxRating(event.target.value)} /></label></div>
      </div>
      <p className="text-xs text-muted-foreground">{bn ? `Codeforces, LeetCode ও CodeChef-এর problem metadata ${CATALOG_RETRIEVED_AT} তারিখে সংগ্রহ করা হয়েছে; মূল প্রশ্ন প্ল্যাটফর্মে খুলুন। রেটিং filter শুধু Codeforces-এর জন্য।` : `Codeforces, LeetCode and CodeChef metadata was retrieved on ${CATALOG_RETRIEVED_AT}. Open each platform for the full problem. Rating filters apply only to Codeforces.`}</p>
    </Card>
    {topic && <Card className="flex flex-wrap items-center justify-between gap-3 bg-primary/5 p-4"><div><h2 className="font-bold">{TOPIC_LABELS[topic as CPTopic]} {bn ? "শেখার পথ" : "learning path"}</h2><p className="text-xs text-muted-foreground">{bn ? "বুঝুন → চিত্রে দেখুন → অনুশীলন → ভুল ঠিক করুন" : "Understand → Visualize → Practice → Review"}</p></div><Link href={`/cp/topics/${topic}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">{bn ? "পথ খুলুন" : "Open path"}<ArrowRight className="h-4 w-4" aria-hidden /></Link></Card>}
    <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{bn ? "আজকের অনুশীলন" : "Today’s practice"}</h2><p className="text-xs text-muted-foreground">{bn ? "বর্তমান filter ও সংরক্ষিত অগ্রগতি থেকে বাছাই করা।" : "Selected from the current filters and your recorded progress."}</p></div><div className="grid gap-3 sm:grid-cols-3">{daily.map((problem) => <a key={problem.id} href={problem.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card p-3 text-sm font-medium hover:border-primary">{problem.title}<span className="mt-1 block text-xs text-muted-foreground">{problem.platform} · {problem.normalizedDifficulty === "unrated" ? (bn ? "রেটিং অজানা" : "Rating unavailable") : problem.normalizedDifficulty}</span></a>)}</div>{daily.length === 0 && <p className="text-sm text-muted-foreground">{bn ? "এই filter-এ অনুশীলনের সমস্যা নেই।" : "No practice problems match these filters."}</p>}</section>
    {reason && <p role="status" className="text-sm text-warning">{reason}</p>}
    {accountError && <p role="alert" className="text-sm text-destructive">{accountError}</p>}
    <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">{bn ? "সমস্যার লাইব্রেরি" : "Problem library"} <span className="text-sm font-normal text-muted-foreground">({filtered.length}{hasMore ? "+" : ""})</span></h2><Button size="sm" variant="ghost" onClick={() => void clearProgress()}><RotateCcw className="h-4 w-4" aria-hidden />{bn ? "অগ্রগতি মুছুন" : "Clear progress"}</Button></div>
      {loading && <p role="status" className="text-sm">{bn ? "Codeforces metadata আনা হচ্ছে…" : "Loading Codeforces metadata…"}</p>}
      {live && <p className="text-xs text-muted-foreground">{bn ? "Codeforces-এর পাবলিক API থেকে metadata; মূল প্রশ্ন দেখতে লিংক খুলুন।" : "Metadata from the public Codeforces API; open the source for the full problem."}</p>}
      {filtered.length === 0 && <Card className="p-5 text-sm text-muted-foreground">{bn ? "এই filter-এ সমস্যা নেই।" : "No problems match these filters."}</Card>}
      {levels.map((level) => {
        const section = shownProblems.filter((problem) => problem.normalizedDifficulty === level);
        if (!section.length) return null;
        return <div key={level} className="space-y-3"><h3 className="text-sm font-bold capitalize">{level === "unrated" ? (bn ? "রেটিং অজানা" : "Rating unavailable") : level} {bn ? "সমস্যা" : "problems"}</h3><div className="grid gap-3 lg:grid-cols-2">{section.map((problem) => <ProblemCard key={problem.id} problem={problem} status={(progress[problem.id] as CPProgressStatus) ?? "none"} onStatus={mark} busy={accountBusy} returnTopic={topic} />)}</div></div>;
      })}
      {shown < filtered.length && <Button variant="secondary" onClick={() => setShown((value) => value + 12)}>{bn ? "আরও দেখুন" : "Show more"}</Button>}
      {hasMore && <Button variant="secondary" disabled={loading} onClick={() => void loadMore()}>{bn ? "আরও Codeforces সমস্যা" : "Load more Codeforces problems"}</Button>}
    </section>
  </div>;
}
