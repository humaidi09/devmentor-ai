"use client";

import { Film, Lightbulb, ListChecks } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import guides from "@/lib/visual/dsa-guides.json";

type Guide = {
  concept: string;
  conceptBn: string;
  example: string;
  exampleBn: string;
  visual: string[];
  patterns: string[];
};

export function DsaVideoLesson({ topicId, title }: { topicId: string; title: string }) {
  const guide = (guides as Record<string, Guide>)[topicId];
  const { lang } = useLanguage();
  const bn = lang === "bn";
  if (!guide) return null;

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
          <h3 className="flex items-center gap-2 font-bold"><ListChecks className="h-4 w-4 text-primary" aria-hidden />{bn ? "ছোট উদাহরণ" : "A tiny example"}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bn ? guide.exampleBn : guide.example}</p>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 font-semibold text-muted-foreground">{bn ? "এরপর শিখুন:" : "Explore next:"}</span>
        {guide.patterns.map((pattern) => <span key={pattern} className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">{pattern}</span>)}
      </div>
    </section>
  );
}
