"use client";

import { useRef } from "react";
import { Film, Lightbulb, ListChecks, Play, TriangleAlert } from "lucide-react";

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
  visual: string[];
  patterns: string[];
};
type PatternGuide = Omit<Guide, "patterns"> & { parent: string; title: string };
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

export function DsaVideoLesson({ topicId, title }: { topicId: string; title: string }) {
  const pattern = (patternGuides as Record<string, PatternGuide>)[topicId];
  const guide = (guides as Record<string, Guide>)[topicId] ?? (pattern ? {
    ...pattern,
    patterns: (guides as Record<string, Guide>)[pattern.parent].patterns,
  } : undefined);
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const videoRef = useRef<HTMLVideoElement>(null);
  const deep = (deepLessons as Record<string, DeepLesson>)[topicId];
  if (!guide) return null;

  function replayStep(index: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = (index + 1) * 8;
    videoRef.current.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    void videoRef.current.play().catch(() => {});
  }

  return (
    <section className="mb-6 space-y-4" aria-labelledby="dsa-video-heading">
      <Card className="studio-player overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <h2 id="dsa-video-heading" className="flex items-center gap-2 text-base font-bold">
            <Film className="h-4 w-4 text-primary" aria-hidden />
            {bn ? "১ মিনিটের অ্যানিমেশন ভিডিও" : "One-minute animated lesson"}
          </h2>
          <span className="text-xs text-muted-foreground">{bn ? "৬৪ সেকেন্ড · প্রতি টপিকে আলাদা" : "64 seconds · unique to this topic"}</span>
        </div>
        <video
          ref={videoRef}
          className="mx-auto block aspect-[9/16] max-h-[75vh] max-w-full bg-black"
          controls
          playsInline
          preload="metadata"
          poster={`/videos/dsa/${topicId}.jpg`}
          aria-label={bn ? `${title} ধারণার অ্যানিমেশন ভিডিও` : `${title} concept animation video`}
        >
          <source src={`/videos/dsa/${topicId}.mp4`} type="video/mp4" />
          {bn ? "আপনার ব্রাউজারে ভিডিও চালানো যাচ্ছে না। নিচে লিখিত ব্যাখ্যা আছে।" : "Your browser cannot play this video. The written explanation is below."}
        </video>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-primary" aria-hidden />{bn ? "সহজ ধারণা" : "The simple idea"}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? guide.conceptBn : guide.concept}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-primary" aria-hidden />{bn ? "বিস্তারিত ব্যাখ্যা" : "Understand the concept"}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{deep ? (bn ? deep.explanationBn : deep.explanationEn) : (bn ? guide.conceptBn : guide.concept)}</p>
        </Card>
      </div>
      {deep && (
        <>
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold"><Film className="h-4 w-4 text-primary" aria-hidden />{bn ? "ভিডিওতে যা ঘটছে" : "Follow the video, step by step"}</h3>
              <span className="text-xs text-muted-foreground">{bn ? "ধাপে চাপলে ভিডিও সেই অংশে যাবে" : "Select a step to replay that moment"}</span>
            </div>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {(bn ? deep.videoStepsBn : deep.videoStepsEn).map((step, index) => (
                <li key={index}>
                  <button type="button" onClick={() => replayStep(index)} className="group flex h-full w-full gap-3 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-primary">0:{String((index + 1) * 8).padStart(2, "0")} <Play className="inline h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden /></span><span className="mt-1 block text-sm leading-relaxed">{step}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold"><ListChecks className="h-4 w-4 text-primary" aria-hidden />{bn ? "উদাহরণ ১" : "Example 1"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? guide.exampleBn : guide.example}</p>
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold"><ListChecks className="h-4 w-4 text-primary" aria-hidden />{bn ? "আরেকটি বিস্তারিত উদাহরণ" : "Another worked example"}</h3>
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
