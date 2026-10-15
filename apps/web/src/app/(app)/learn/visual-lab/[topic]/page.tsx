import { TopicPageClient } from "@/components/visual/topic-page-client";
import type { Guide } from "@/components/visual/dsa-text-lesson";
import { getTopic } from "@/lib/visual/topics";
import guides from "@/lib/visual/dsa-guides.json";
import patternGuides from "@/lib/visual/dsa-pattern-guides.json";
import deepLessons from "@/lib/visual/dsa-deep-lessons.json";
import expandedLessons from "@/lib/visual/dsa-expanded-lessons.json";

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  const pattern = (patternGuides as Record<string, { parent: string; concept: string; conceptBn: string; example: string; exampleBn: string; patterns?: string[] }>)[id];
  const guide = (guides as Record<string, Guide>)[id] ?? (pattern ? {
    ...pattern,
    patterns: (guides as Record<string, Guide>)[pattern.parent].patterns,
  } : undefined);

  return <TopicPageClient
    topic={topic}
    patternConcept={pattern ? { concept: pattern.concept, conceptBn: pattern.conceptBn } : undefined}
    guide={guide}
    deep={(deepLessons as Record<string, typeof deepLessons.array>)[id]}
    expanded={(expandedLessons as Record<string, typeof expandedLessons.array>)[id]}
  />;
}
