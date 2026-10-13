"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ExternalLink, Search, Sparkles } from "lucide-react";

import { api, useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { KNOWLEDGE_CATEGORIES, type KnowledgeCategory, type KnowledgeCollection, type KnowledgeResponse, type KnowledgeResult } from "@/lib/knowledge/types";
import type { KnowledgeExplanation } from "@/lib/knowledge/explanation-schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

const labels: Record<KnowledgeCategory, [string, string]> = {
  all: ["All", "সব"], research: ["Research", "গবেষণা"],
  programming: ["Programming", "প্রোগ্রামিং"], economics: ["Economics", "অর্থনীতি"],
  technology: ["Technology", "প্রযুক্তি"], "competitive-programming": ["CP", "সিপি"],
  "learning-resources": ["Learning resources", "শেখার রিসোর্স"],
};

function visualTopic(text: string) {
  if (/\bdfs\b|depth.first/i.test(text)) return "dfs";
  if (/\bbfs\b|breadth.first/i.test(text)) return "bfs";
  if (/binary search/i.test(text)) return "binary-search";
  if (/bubble sort/i.test(text)) return "bubble-sort";
  if (/normalization|normalisation/i.test(text)) return "normalization";
  if (/inner join/i.test(text)) return "sql-inner-join";
  return null;
}

interface SavedRow {
  external_id: string; provider: KnowledgeResult["provider"]; category: KnowledgeCategory;
  title: string; url: string; source: string; summary: string;
  published_at: string | null; retrieved_at: string; saved_at: string;
  collection: KnowledgeCollection;
}

export default function KnowledgePage() {
  const { demo } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("all");
  const [response, setResponse] = useState<KnowledgeResponse | null>(null);
  const [saved, setSaved] = useState<KnowledgeResult[]>([]);
  const [tab, setTab] = useState<"search" | "saved">("search");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [shareWithAi, setShareWithAi] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<KnowledgeExplanation | null>(null);
  const [explanationSources, setExplanationSources] = useState<KnowledgeResult[]>([]);

  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("topic");
    if (topic && topic.length <= 100) setQuery(topic);
  }, []);

  useEffect(() => {
    if (demo) return;
    void api<{ available: boolean }>("/api/knowledge/explain")
      .then((value) => setAiAvailable(value.available)).catch(() => {});
  }, [demo]);

  useEffect(() => {
    if (demo) {
      try {
        const rows: unknown = JSON.parse(sessionStorage.getItem("close-ai-saved-knowledge") ?? "[]");
        if (Array.isArray(rows)) setSaved(rows.filter((r) => r && typeof r === "object" && typeof r.id === "string").slice(0, 100));
      } catch { /* session storage unavailable */ }
      return;
    }
    void api<{ items: SavedRow[] }>("/api/knowledge/saved")
      .then(({ items }) => setSaved(items.map((item) => ({
        id: item.external_id, provider: item.provider, category: item.category,
        title: item.title, url: item.url, source: item.source, summary: item.summary,
        authors: [], publishedAt: item.published_at, updatedAt: null,
        retrievedAt: item.retrieved_at, stale: false, collection: item.collection,
      }))))
      .catch(() => {});
  }, [demo]);

  async function search() {
    if (query.trim().length < 3 || busy) return;
    setBusy(true);
    setError("");
    setExplanation(null);
    setExplanationSources([]);
    try {
      setResponse(await api<KnowledgeResponse>(`/api/knowledge?q=${encodeURIComponent(query.trim())}&category=${category}`));
      setTab("search");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable.");
      setResponse(null);
    } finally { setBusy(false); }
  }

  async function explain() {
    if (!response || !shareWithAi || explaining) return;
    setExplaining(true);
    setError("");
    try {
      const value = await api<{ explanation: KnowledgeExplanation; sources: KnowledgeResult[] }>("/api/knowledge/explain", {
        query: response.query, category: response.category, confirmed: true,
      });
      setExplanation(value.explanation);
      setExplanationSources(value.sources);
    } catch (e) { setError(e instanceof Error ? e.message : "AI explanation unavailable."); }
    finally { setExplaining(false); }
  }

  async function saveItem(item: KnowledgeResult, collection: KnowledgeCollection, remove = false) {
    const next = remove ? saved.filter((entry) => entry.id !== item.id) : [{ ...item, collection }, ...saved.filter((entry) => entry.id !== item.id)].slice(0, 100);
    setError("");
    try {
      if (demo) sessionStorage.setItem("close-ai-saved-knowledge", JSON.stringify(next));
      else if (remove) await api("/api/knowledge/saved", { id: item.id }, "DELETE");
      else await api("/api/knowledge/saved", {
        id: item.id, provider: item.provider, category: item.category,
        title: item.title, url: item.url, source: item.source,
        summary: item.summary, publishedAt: item.publishedAt, retrievedAt: item.retrievedAt, collection,
      });
      setSaved(next);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save."); }
  }

  const items = tab === "saved" ? saved : (response?.results ?? []);
  const compared = response ? [...new Set(response.results.map((item) => item.provider))].map((provider) => ({
    provider, items: response.results.filter((item) => item.provider === provider).slice(0, 2),
  })) : [];
  return (
    <div className="space-y-6">
      <PageHeader title={bn ? "লাইভ নলেজ" : "Live Knowledge"}
        subtitle={bn ? "গবেষণা, ডেটা ও কোডের উৎস খুঁজুন—তারিখ ও মূল লিংকসহ।" : "Find research, public data and code with dates and original sources."} />
      <Card className="space-y-4 overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" aria-hidden /><h2 className="font-bold">{bn ? "কী শিখতে বা জানতে চান?" : "What do you want to learn or research?"}</h2></div>
        <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="knowledge-query" className="sr-only">{bn ? "নলেজ অনুসন্ধান" : "Knowledge search"}</label>
          <Input id="knowledge-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={160}
            placeholder={bn ? "যেমন: বাংলাদেশে মূল্যস্ফীতি" : "Try: recent AI research, Bangladesh inflation, React projects"} className="flex-1" />
          <Button type="submit" disabled={busy || query.trim().length < 3}><Search className="h-4 w-4" aria-hidden />{busy ? (bn ? "খুঁজছে…" : "Searching…") : (bn ? "খুঁজুন" : "Search")}</Button>
        </form>
        <div className="flex flex-wrap gap-2" role="group" aria-label={bn ? "উৎসের ধরন" : "Source category"}>
          {KNOWLEDGE_CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
            {labels[item][bn ? 1 : 0]}
          </button>)}
        </div>
        <p className="text-xs text-muted-foreground">{bn ? "শুধু এই অনুসন্ধানের কথাগুলো বাহ্যিক উৎসে যায়। ব্যক্তিগত তথ্য লিখবেন না।" : "Only these search words go to external providers. Do not include personal details."}</p>
      </Card>

      <div className="flex gap-2 border-b border-border" role="group" aria-label={bn ? "নলেজ ভিউ" : "Knowledge views"}>
        {(["search", "saved"] as const).map((item) => <button key={item} aria-pressed={tab === item} type="button" onClick={() => setTab(item)}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          {item === "search" ? (bn ? "ফলাফল" : "Results") : (bn ? "সংরক্ষিত" : "Saved")} {item === "saved" ? `(${saved.length})` : ""}
        </button>)}
      </div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {tab === "search" && response && <div className="space-y-2 text-sm text-muted-foreground" role="status">
        <p>{bn ? `${response.results.length}টি উৎস পাওয়া গেছে।` : `${response.results.length} source results found.`} {bn ? "সারাংশ মেটাডেটা থেকে; সিদ্ধান্তের আগে মূল উৎস দেখুন।" : "Summaries come from source metadata; open the original before relying on it."}</p>
        {response.unavailable.length > 0 && <p>{bn ? "এই উৎসগুলো এখন পাওয়া যায়নি: " : "Currently unavailable: "}{response.unavailable.join(", ")}</p>}
      </div>}
      {tab === "search" && compared.length > 1 && <section className="space-y-3" aria-label={bn ? "উৎস তুলনা" : "Source comparison"}>
        <div><h2 className="font-bold">{bn ? "উৎস তুলনা" : "Compare sources"}</h2><p className="text-xs text-muted-foreground">{bn ? "বিভিন্ন উৎস ভিন্ন ধরনের প্রমাণ দেয়। মতভেদ থাকলে মূল লিংক খুলে যাচাই করুন।" : "These providers offer different kinds of evidence. Open the originals to check apparent disagreements."}</p></div>
        <div className="grid gap-3 lg:grid-cols-3">{compared.map(({ provider, items }) => <Card key={provider} className="space-y-3 p-4">
          <h3 className="text-sm font-bold capitalize">{provider.replace("-", " ")}</h3>
          {items.map((item) => <div key={item.id} className="space-y-1 border-t border-border pt-2 text-xs">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">{item.title}</a>
            <p className="text-muted-foreground">{item.summary}</p>
            <p className="text-muted-foreground">{item.publishedAt ? `${bn ? "প্রকাশিত" : "Published"}: ${item.publishedAt} · ` : ""}{bn ? "আনা হয়েছে" : "Retrieved"}: {new Date(item.retrievedAt).toLocaleDateString(bn ? "bn-BD" : "en-US")}{item.stale ? ` · ${bn ? "পুরোনো ক্যাশ" : "Stale cache"}` : ""}</p>
          </div>)}
        </Card>)}</div>
      </section>}
      {tab === "search" && aiAvailable && response && response.results.length > 0 && <Card className="space-y-3 p-4">
        <h2 className="font-bold">{bn ? "উৎসভিত্তিক AI ব্যাখ্যা" : "Source-backed AI explanation"}</h2>
        <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={shareWithAi} onChange={(event) => setShareWithAi(event.target.checked)} />{bn ? "এই অনুসন্ধান ও পাবলিক উৎসের metadata AI provider-কে পাঠাতে সম্মত। ব্যক্তিগত profile পাঠানো হবে না।" : "I agree to share this query and public source metadata with the AI provider. No private profile is sent."}</label>
        <Button size="sm" disabled={!shareWithAi || explaining} onClick={() => void explain()}>{explaining ? (bn ? "ব্যাখ্যা তৈরি হচ্ছে…" : "Explaining…") : (bn ? "AI দিয়ে ব্যাখ্যা করুন" : "Explain with AI")}</Button>
      </Card>}
      {tab === "search" && explanation && <Card className="space-y-3 border-primary/30 bg-primary/5 p-5" aria-label={bn ? "AI ব্যাখ্যা" : "AI explanation"}>
        <p className="text-xs font-semibold text-primary">{bn ? "AI খসড়া—প্রতিটি উদ্ধৃত উৎস যাচাই করুন" : "AI draft — verify every cited source"}</p>
        <p className="text-sm">{explanation.summary}</p>
        <ul className="list-inside list-disc space-y-2 text-sm">{explanation.findings.map((finding, index) => <li key={`${index}-${finding.text}`}>{finding.text}<span className="ml-1 text-xs text-muted-foreground">({finding.sourceIds.map((id, sourceIndex) => {
          const source = explanationSources.find((item) => item.id === id);
          return source ? <a key={id} href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{source.source}{sourceIndex < finding.sourceIds.length - 1 ? ", " : ""}</a> : null;
        })})</span></li>)}</ul>
        {explanation.differences.length > 0 && <div><h3 className="text-sm font-bold">{bn ? "উৎসের পার্থক্য" : "Source differences"}</h3><ul className="list-inside list-disc text-sm">{explanation.differences.map((difference) => <li key={difference}>{difference}</li>)}</ul></div>}
      </Card>}
      {items.length === 0 && <Card className="p-7 text-center text-sm text-muted-foreground">
        {tab === "saved" ? (bn ? "এখনো কিছু সংরক্ষণ করেননি।" : "No saved sources yet.") : response ? (bn ? "এই অনুসন্ধানে ফল পাওয়া যায়নি। অন্য শব্দ চেষ্টা করুন।" : "No results found. Try different search terms.") : (bn ? "একটি বিষয় লিখে অনুসন্ধান শুরু করুন।" : "Enter a topic to start searching.")}
      </Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const topic = visualTopic(`${query} ${item.title}`);
          const isSaved = saved.some((entry) => entry.id === item.id);
          return <Card key={item.id} className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary"><span className="rounded-full bg-primary/10 px-2 py-1">{item.provider}</span><span>{labels[item.category][bn ? 1 : 0]}</span>{item.stale && <span className="rounded-full bg-warning/10 px-2 py-1 text-warning">{bn ? "পুরোনো ক্যাশ" : "Stale cache"}</span>}</div>
            <h2 className="text-lg font-bold leading-snug">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
            <p className="text-xs text-muted-foreground">{bn ? "উৎস" : "Source"}: {item.source}{item.authors.length ? ` · ${item.authors.join(", ")}` : ""}<br />{item.publishedAt ? `${bn ? "প্রকাশিত" : "Published"}: ${item.publishedAt} · ` : ""}{bn ? "আনা হয়েছে" : "Retrieved"}: {new Date(item.retrievedAt).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">{bn ? "মূল উৎস" : "Open source"}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
              <Button size="sm" variant="secondary" onClick={() => void saveItem(item, "general", isSaved)}>{isSaved ? (bn ? "সরান" : "Remove") : (bn ? "সংরক্ষণ" : "Save")}</Button>
              <Button size="sm" variant="secondary" onClick={() => void saveItem(item, "study")}>{bn ? "স্টাডিতে যোগ" : "Use in Study"}</Button>
              {item.provider === "github" && <Button size="sm" variant="secondary" onClick={() => void saveItem(item, "developer")}>{bn ? "ডেভেলপার পাথে যোগ" : "Add to Developer Path"}</Button>}
              {topic && <Link href={`/learn/visual-lab/${topic}?from=knowledge`} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><BookOpen className="h-3.5 w-3.5" aria-hidden />{bn ? "চিত্রে শিখুন" : "Learn visually"}</Link>}
              {(item.category === "programming" || topic) && <Link href={`/cp/library?topic=${topic ?? ""}`} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">{bn ? "অনুশীলন" : "Practice"}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}
            </div>
          </Card>;
        })}
      </div>
    </div>
  );
}
