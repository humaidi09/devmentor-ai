"use client";

import { BookOpen, Lightbulb, ListChecks, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import guides from "@/lib/visual/dsa-guides.json";
import patternGuides from "@/lib/visual/dsa-pattern-guides.json";
import deepLessons from "@/lib/visual/dsa-deep-lessons.json";

type Guide = {
  concept: string;
  conceptBn: string;
  example: string;
  exampleBn: string;
  patterns: string[];
};
type PatternGuide = Omit<Guide, "patterns"> & { parent: string };
type DeepLesson = {
  explanationEn: string;
  explanationBn: string;
  videoStepsEn: string[];
  videoStepsBn: string[];
  extraExampleEn: string;
  extraExampleBn: string;
  whenEn: string;
  whenBn: string;
  mistakeEn: string;
  mistakeBn: string;
};

export function DsaTextLesson({ topicId }: { topicId: string }) {
  const pattern = (patternGuides as Record<string, PatternGuide>)[topicId];
  const guide = (guides as Record<string, Guide>)[topicId] ?? (pattern ? {
    ...pattern,
    patterns: (guides as Record<string, Guide>)[pattern.parent].patterns,
  } : undefined);
  const deep = (deepLessons as Record<string, DeepLesson>)[topicId];
  const { lang } = useLanguage();
  const bn = lang === "bn";
  if (!guide) return null;

  return (
    <section className="mb-6 space-y-4" aria-labelledby="dsa-lesson-heading">
      <Card className="border-primary/25 bg-primary/5 p-4 sm:p-6">
        <h2 id="dsa-lesson-heading" className="flex items-center gap-2 text-lg font-bold">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden />
          {bn ? "সহজ ভাষায় পুরো ধারণা" : "The complete idea, simply explained"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed">{bn ? guide.conceptBn : guide.concept}</p>
        {deep && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bn ? deep.explanationBn : deep.explanationEn}</p>}
      </Card>
      {deep && (
        <>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold"><ListChecks className="h-4 w-4 text-primary" aria-hidden />{bn ? "একটি উদাহরণ: ধাপে ধাপে" : "A worked case, step by step"}</h3>
              <span className="text-xs text-muted-foreground">{bn ? `মোট ${deep.videoStepsBn.length}টি ধাপ` : `${deep.videoStepsEn.length} steps in total`}</span>
            </div>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {(bn ? deep.videoStepsBn : deep.videoStepsEn).map((step, index) => (
                <li key={index} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
                  <p className="min-w-0 pt-1 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-primary" aria-hidden />{bn ? "উদাহরণ ১" : "Example 1"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? guide.exampleBn : guide.example}</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-primary" aria-hidden />{bn ? "আরেকটি বিস্তারিত উদাহরণ" : "Another worked example"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? deep.extraExampleBn : deep.extraExampleEn}</p>
            </Card>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="border-primary/20 bg-primary/5 p-4 sm:p-5">
              <h3 className="font-bold">{bn ? "কখন ব্যবহার করবে" : "When to use it"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? deep.whenBn : deep.whenEn}</p>
            </Card>
            <Card className="border-warning/25 bg-warning/5 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold"><TriangleAlert className="h-4 w-4 text-warning" aria-hidden />{bn ? "যে ভুলটি এড়াবে" : "A common mistake"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? deep.mistakeBn : deep.mistakeEn}</p>
            </Card>
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 font-semibold text-muted-foreground">{bn ? "এরপর শিখুন:" : "Explore next:"}</span>
        {guide.patterns.map((pattern) => <span key={pattern} className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">{pattern}</span>)}
      </div>
    </section>
  );
}
