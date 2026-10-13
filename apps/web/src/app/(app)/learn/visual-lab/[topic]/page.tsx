"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StepPlayer } from "@/components/visual/step-player";
import { DsaVideoLesson } from "@/components/visual/dsa-video-lesson";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localize } from "@/lib/content-bn";
import { useLanguage } from "@/lib/i18n";
import { getTopic } from "@/lib/visual/topics";
import { CP_TOPICS, type CPTopic } from "@/lib/cp/library";
import patternGuides from "@/lib/visual/dsa-pattern-guides.json";

export default function TopicPage() {
  const params = useParams<{ topic: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const topic = getTopic(params.topic);
  const pattern = (patternGuides as Record<string, { concept: string; conceptBn: string }>)[params.topic];
  const [returnTopic, setReturnTopic] = useState("");
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const value = search.get("topic") ?? "";
    if (search.get("from") === "cp" && CP_TOPICS.includes(value as CPTopic)) setReturnTopic(value);
  }, []);

  if (!topic) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-sm text-muted-foreground">{bn ? "এই টপিকটি এখনো নেই।" : "This topic isn't available yet."}</p>
        <Link href="/learn/visual-lab" className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}>
          {bn ? "ভিজ্যুয়াল ল্যাব" : "Visual Lab"}
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Link href="/learn/visual-lab" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {bn ? "ভিজ্যুয়াল ল্যাব" : "Visual Lab"}
      </Link>
      <PageHeader title={localize(topic.title, lang)} subtitle={pattern ? (bn ? pattern.conceptBn : pattern.concept) : localize(topic.summary, lang)} />
      <DsaVideoLesson topicId={topic.id} title={localize(topic.title, lang)} />
      <StepPlayer key={topic.id} topic={topic} />
      {returnTopic && <Link href={`/cp/topics/${returnTopic}`} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary underline"><ArrowLeft className="h-4 w-4" aria-hidden />{bn ? "সমস্যায় ফিরুন" : "Return to practice"}</Link>}
    </div>
  );
}
