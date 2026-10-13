"use client";

import { RecentTopics } from "@/components/visual/recent-topics";
import Link from "next/link";
import { ArrowUpRight, Film, Play, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { TOPICS } from "@/lib/visual/topics";
import dsaGuides from "@/lib/visual/dsa-guides.json";
import patternGuides from "@/lib/visual/dsa-pattern-guides.json";

const CATEGORIES = ["DSA", "Algorithms", "DBMS"] as const;

export default function VisualLabPage() {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="space-y-6">
      <section className="studio-hero overflow-hidden rounded-3xl border border-primary/25 p-6 sm:p-9">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-4 w-4" aria-hidden />{bn ? "ভিজ্যুয়াল লার্নিং স্টুডিও" : "Visual learning studio"}</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{bn ? "দেখে বুঝুন। তারপর নিজে করে দেখুন।" : "See the idea. Then make it yours."}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{bn ? `${Object.keys(dsaGuides).length + Object.keys(patternGuides).length}টি মূল ও pattern lesson-এ আলাদা ৬৪ সেকেন্ডের ভিডিও, সহজ উদাহরণ ও হাতে চালানোর animation।` : `${Object.keys(dsaGuides).length + Object.keys(patternGuides).length} main and pattern lessons, each with its own 64-second video, simple example and hands-on animation.`}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-primary">
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">{bn ? "নিজে চালান" : "Interactive playback"}</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">{bn ? "বাংলা + English" : "Bangla + English"}</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">{bn ? "টেক্সট ধাপ" : "Text alternative"}</span>
        </div>
      </section>
      <RecentTopics />
      {CATEGORIES.map((cat) => {
        const items = TOPICS.filter((t) => t.category === cat && !(t.id in patternGuides));
        if (!items.length) return null;
        return (
          <section key={localize(cat, lang)}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {localize(cat, lang)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/learn/visual-lab/${t.id}`}
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="studio-card h-full rounded-2xl p-3 shadow-none">
                    <div className="studio-thumbnail relative grid h-28 place-items-center rounded-xl border border-border/70 sm:h-32">
                      <span className="absolute left-3 top-3 rounded-md border border-border bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.id in dsaGuides ? (bn ? "৬৪ সেকেন্ডের ভিডিও" : "64-second video") : `${t.steps.length} ${bn ? "ধাপ" : "frames"}`}</span>
                      <span className="studio-play grid h-12 w-12 place-items-center rounded-full border border-primary/45 bg-primary/20 text-primary"><Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden /></span>
                      <span className="absolute bottom-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-primary">{bn ? "দেখুন" : "Watch"}</span>
                    </div>
                    <div className="px-1 pb-1 pt-4">
                      <h3 className="flex items-start justify-between gap-2 font-bold">{localize(t.title, lang)}<ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden /></h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                      {localize(t.summary, lang)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <section id="dsa-patterns" aria-labelledby="pattern-heading" className="space-y-4">
        <div>
          <h2 id="pattern-heading" className="text-2xl font-bold">{bn ? "আরও গভীরে: DSA pattern" : "Go deeper: DSA patterns"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{bn ? "প্রতিটি ছোট pattern-এর নিজস্ব এক মিনিটের ভিডিও ও উদাহরণ আছে। বিভাগ খুলে বেছে নিন।" : "Every smaller pattern has its own one-minute video and example. Open a category to explore."}</p>
        </div>
        {Object.entries(dsaGuides).map(([parentId]) => {
          const entries = Object.entries(patternGuides).filter(([, guide]) => guide.parent === parentId);
          if (!entries.length) return null;
          const parent = TOPICS.find((topic) => topic.id === parentId);
          return <details key={parentId} className="group rounded-2xl border border-border bg-card/70 p-4 open:border-primary/40">
            <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">{localize(parent?.title ?? parentId, lang)} <span className="ml-2 text-xs font-normal text-muted-foreground">{entries.length} {bn ? "টি ভিডিও" : "videos"}</span><span className="float-right text-primary group-open:rotate-90" aria-hidden>›</span></summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map(([id, guide]) => <Link key={id} href={`/learn/visual-lab/${id}`} className="studio-card rounded-xl border border-border bg-background p-4 focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center gap-2 text-xs font-semibold text-primary"><Film className="h-4 w-4" aria-hidden />{bn ? "৬৪ সেকেন্ডের ভিডিও" : "64-second video"}</span>
                <span className="mt-2 block font-bold">{guide.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{bn ? guide.conceptBn : guide.concept}</span>
              </Link>)}
            </div>
          </details>;
        })}
      </section>
    </div>
  );
}
