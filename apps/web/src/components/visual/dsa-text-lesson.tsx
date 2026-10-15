"use client";

import { BookOpen, Lightbulb, ListChecks, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export type Guide = {
  concept: string;
  conceptBn: string;
  example: string;
  exampleBn: string;
  patterns: string[];
};
export type DeepLesson = {
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
export type ExpandedLesson = {
  intuitionEn: string;
  intuitionBn: string;
  methodEn: string;
  methodBn: string;
  whyEn: string;
  whyBn: string;
  complexityEn: string;
  complexityBn: string;
  edgeCaseEn: string;
  edgeCaseBn: string;
};

export function DsaTextLesson({ guide, deep, expanded }: { guide?: Guide; deep?: DeepLesson; expanded?: ExpandedLesson }) {
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
      {expanded && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h3 className="font-bold">{bn ? "সহজভাবে ভাবো" : "Picture the idea"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? expanded.intuitionBn : expanded.intuitionEn}</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="font-bold">{bn ? "কীভাবে করবে" : "How to do it"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? expanded.methodBn : expanded.methodEn}</p>
            </Card>
          </div>
          <Card className="p-4 sm:p-5">
            <h3 className="font-bold">{bn ? "কেন পদ্ধতিটি কাজ করে" : "Why it works"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? expanded.whyBn : expanded.whyEn}</p>
          </Card>
        </>
      )}
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
          {expanded && <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h3 className="font-bold">{bn ? "সময় ও জায়গার খরচ" : "Time and space cost"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? expanded.complexityBn : expanded.complexityEn}</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="font-bold">{bn ? "বিশেষ ক্ষেত্রে কী হবে" : "An edge case to check"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? expanded.edgeCaseBn : expanded.edgeCaseEn}</p>
            </Card>
          </div>}
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
