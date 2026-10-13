import Link from "next/link";
import { notFound } from "next/navigation";

import { ProblemLibrary } from "@/components/cp/problem-library";
import { Card } from "@/components/ui/card";
import { CP_TOPICS, TOPIC_LABELS, VISUAL_TOPICS, type CPTopic } from "@/lib/cp/library";

export default async function CPTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!CP_TOPICS.includes(topic as CPTopic)) notFound();
  const name = TOPIC_LABELS[topic as CPTopic];
  const visual = VISUAL_TOPICS[topic as CPTopic];
  return <div className="space-y-6">
    <div><Link href="/cp/library" className="text-sm text-primary underline">← Problem Library</Link><h1 className="mt-3 text-3xl font-bold">{name}</h1><p className="text-sm text-muted-foreground">Explore the idea, watch its animation, practice at your pace, and review mistakes.</p></div>
    <div className="grid gap-3 sm:grid-cols-4">
      <Card className="studio-card p-4"><span className="text-xs font-bold text-primary">01 UNDERSTAND</span><p className="mt-2 text-sm">Find a reliable explanation and identify the core data structure or algorithm.</p><Link href={`/knowledge?topic=${encodeURIComponent(name)}`} className="mt-2 inline-block text-xs text-primary underline">Find sources</Link></Card>
      <Card className="studio-card p-4"><span className="text-xs font-bold text-primary">02 VISUALIZE</span><p className="mt-2 text-sm">{visual ? "Watch a 64-second concept video, then try the interactive steps." : "A visualization is being prepared."}</p>{visual && <Link href={`/learn/visual-lab/${visual}?from=cp&topic=${topic}`} className="mt-2 inline-block text-xs text-primary underline">Watch animation</Link>}</Card>
      <Card className="studio-card p-4"><span className="text-xs font-bold text-primary">03 PRACTICE</span><p className="mt-2 text-sm">Begin with an approachable problem, then progress to harder ones.</p></Card>
      <Card className="studio-card p-4"><span className="text-xs font-bold text-primary">04 REVIEW</span><p className="mt-2 text-sm">Record attempts, request hints, and revisit upsolve items.</p></Card>
    </div>
    <ProblemLibrary initialTopic={topic} />
  </div>;
}
