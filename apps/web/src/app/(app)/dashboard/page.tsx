"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, ListChecks, MessagesSquare } from "lucide-react";

import { ResourceCard } from "@/components/resource-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_NEXT_STEPS, DEMO_SAVED_IDS, getDemoResource } from "@/lib/demo-data";
import { useLanguage } from "@/lib/i18n";
import type { SupportResource } from "@/lib/types";

const STARTERS = {
  en: [
    "I'm worried about tuition fees",
    "I need help with a course",
    "I'm looking for an internship",
    "I want to talk to someone",
  ],
  bn: [
    "টিউশন ফি নিয়ে চিন্তিত",
    "একটা কোর্সে সাহায্য দরকার",
    "ইন্টার্নশিপ খুঁজছি",
    "কারো সাথে কথা বলতে চাই",
  ],
};

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const starters = STARTERS[lang];
  const saved = DEMO_SAVED_IDS.map(getDemoResource).filter(Boolean) as SupportResource[];
  const activeSteps = DEMO_NEXT_STEPS.filter(
    (s) => s.status !== "completed" && s.status !== "not_relevant",
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {bn ? "আজ কীসে সাহায্য দরকার?" : "What would you like help with today?"}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("tagline")}</p>
      </section>

      <Card className="bg-primary/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <MessagesSquare className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold">{t("getSupport")}</h2>
              <p className="text-sm text-muted-foreground">
                {bn
                  ? "আপনার বাধাটা বলুন — আমরা যাচাইকৃত সহায়তা খুঁজে দেব।"
                  : "Describe your barrier — we'll find verified support."}
              </p>
            </div>
          </div>
          <Link href="/support" className={buttonVariants({ size: "lg" })}>
            {t("getSupport")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {starters.map((s) => (
            <Link
              key={s}
              href={`/support?q=${encodeURIComponent(s)}`}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-muted"
            >
              {s}
            </Link>
          ))}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden />
              {t("nextSteps")}
            </h2>
            <Link href="/support/steps" className="text-sm font-medium text-primary hover:underline">
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
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    {step.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
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
            <Link href="/support/saved" className="text-sm font-medium text-primary hover:underline">
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

      <section>
        <h2 className="mb-3 font-bold">{bn ? "ঐচ্ছিক মডিউল" : "Optional modules"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: bn ? "একাডেমিক স্টাডি" : "Academic Study", desc: bn ? "কোর্স ও ডেডলাইন" : "Courses & deadlines" },
            { title: bn ? "ডেভেলপার পাথ" : "Developer Path", desc: bn ? "স্কিল ও ভিজ্যুয়াল ল্যাব" : "Skills & Visual Lab" },
            { title: bn ? "CP কোচ" : "CP Coach", desc: bn ? "প্র্যাকটিস ট্র্যাকিং" : "Practice tracking" },
          ].map((m) => (
            <Card key={m.title} className="p-4 opacity-80">
              <h3 className="text-sm font-bold">{m.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
              <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {bn ? "শীঘ্রই" : "Coming soon"}
              </span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
