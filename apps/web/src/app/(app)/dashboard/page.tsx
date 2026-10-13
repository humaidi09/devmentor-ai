"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Code2, GraduationCap, ListChecks, Play, Search, Trophy } from "lucide-react";

import { useAccount } from "@/lib/account";
import { useResources } from "@/lib/resources";
import { moduleVisible, usePreferences } from "@/lib/preferences";
import { useSavedResources } from "@/lib/saved-store";
import { ResourceCard } from "@/components/resource-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_NEXT_STEPS } from "@/lib/demo-data";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import type { SupportResource } from "@/lib/types";

export default function DashboardPage() {
  const { demo, data } = useAccount();
  const { resources } = useResources();
  const { preferences } = usePreferences();
  const { ids } = useSavedResources();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const saved = ids
    .map((id) => resources.find((r) => r.id === id))
    .filter(Boolean) as SupportResource[];
  const activeSteps = (demo ? DEMO_NEXT_STEPS : (data?.steps ?? [])).filter(
    (s) => s.status !== "completed" && s.status !== "not_relevant",
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="section-kicker mb-2">{bn ? "আপনার শেখার ওয়ার্কস্পেস" : "YOUR LEARNING WORKSPACE"}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {bn
            ? "আজ কী শিখতে চান?"
            : "What will you explore today?"}
        </h1>
        <p className="mt-1 text-muted-foreground">{bn ? "উৎস খুঁজুন, ধারণা দেখুন, তারপর অনুশীলন করুন।" : "Find sources, see the idea, then put it into practice."}</p>
      </section>

      <Card className="dashboard-hero relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold">{bn ? "একটি প্রশ্ন দিয়ে শুরু করুন" : "Start with a question"}</h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {bn
                  ? "মূল উৎস দেখুন, বিষয়টি বুঝুন, তারপর নিজের মতো পরের ধাপ নিন।"
                  : "Explore original sources, understand the topic, then choose your next step."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/knowledge" className={buttonVariants({ size: "lg" })}>
              {bn ? "নলেজ খুঁজুন" : "Explore knowledge"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {preferences.support && (
              <Link href="/support" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {bn ? "এআই সহকারীকে জিজ্ঞেস করুন" : "Ask the AI assistant"}
              </Link>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-primary/10 pt-4">
          <span className="mr-1 self-center text-xs font-semibold text-muted-foreground">{bn ? "দ্রুত শুরু" : "Quick start"}</span>
          <Link href="/knowledge?topic=BFS" className="dashboard-starter rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-muted">BFS</Link>
          {moduleVisible("/learn", preferences) && <Link href="/learn/visual-lab/bfs" className="dashboard-starter rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-muted">{bn ? "BFS ভিজ্যুয়াল" : "Visualize BFS"}</Link>}
          {moduleVisible("/cp", preferences) && <Link href="/cp/topics/bfs" className="dashboard-starter rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-muted">{bn ? "BFS অনুশীলন" : "Practice BFS"}</Link>}
        </div>
      </Card>

      <section aria-labelledby="dashboard-tools-heading">
        <p className="section-kicker">{bn ? "পরের ধাপ" : "YOUR NEXT MOVE"}</p>
        <h2 id="dashboard-tools-heading" className="mb-3 mt-1 text-lg font-bold">{bn ? "একটি টুল বেছে নিন" : "Choose a tool"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/study", icon: GraduationCap, title: bn ? "একাডেমিক স্টাডি" : "Academic study", desc: bn ? "কোর্স ও ডেডলাইন সাজান" : "Organize courses and deadlines", module: "/study" },
            { href: "/learn", icon: Code2, title: bn ? "ডেভেলপার পাথ" : "Developer path", desc: bn ? "ধাপে ধাপে দক্ষতা গড়ুন" : "Build skills step by step", module: "/learn" },
            { href: "/learn/visual-lab", icon: Play, title: bn ? "ভিজ্যুয়াল ল্যাব" : "Visual lab", desc: bn ? "ধারণা চোখের সামনে দেখুন" : "See concepts in action", module: "/learn" },
            { href: "/cp/library", icon: Trophy, title: bn ? "সিপি লাইব্রেরি" : "CP library", desc: bn ? "সমস্যা খুঁজে অনুশীলন করুন" : "Find problems and practice", module: "/cp" },
          ].filter((item) => moduleVisible(item.module, preferences)).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="dashboard-tool group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="mt-auto flex items-center justify-between gap-2 font-bold">{item.title}<ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden /></span>
                <span className="mt-1 text-sm text-muted-foreground">{item.desc}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/70 pt-6 lg:grid-cols-2" aria-label={bn ? "সংরক্ষিত কাজ" : "Saved work"}>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden />
              {t("nextSteps")}
            </h2>
            <Link
              href="/support/steps"
              className="text-sm font-medium text-primary hover:underline"
            >
              {bn ? "সব দেখুন" : "View all"}
            </Link>
          </div>
          {activeSteps.length === 0 ? (
            <Card className="p-5 text-sm text-muted-foreground">
              {bn ? "এখনো কোনো ধাপ নেই।" : "No next steps yet."}
            </Card>
          ) : (
            <div className="space-y-2">
              {activeSteps.slice(0, 3).map((step) => (
                <Card key={step.id} className="flex items-start gap-3 p-4">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {localize(step.title, lang)}
                    </p>
                    {step.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {localize(step.detail, lang)}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Bookmark className="h-4 w-4 text-primary" aria-hidden />
              {t("savedResources")}
            </h2>
            <Link
              href="/support/saved"
              className="text-sm font-medium text-primary hover:underline"
            >
              {bn ? "সব দেখুন" : "View all"}
            </Link>
          </div>
          {saved.length === 0 ? (
            <Card className="p-5 text-sm text-muted-foreground">
              {bn ? "কোনো সংরক্ষিত রিসোর্স নেই।" : "No saved resources."}
            </Card>
          ) : (
            <div className="space-y-3">
              {saved.slice(0, 2).map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>
      </section>


    </div>
  );
}
