"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StepPlayer } from "@/components/visual/step-player";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getTopic } from "@/lib/visual/topics";

export default function TopicPage() {
  const params = useParams<{ topic: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const topic = getTopic(params.topic);

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
      <PageHeader title={topic.title} subtitle={topic.summary} />
      <StepPlayer topic={topic} />
    </div>
  );
}
