import guides from "./dsa-pattern-guides.json";
import type { VizTopic } from "./types";

export const PATTERN_TOPICS: VizTopic[] = Object.entries(guides).map(([id, guide]) => {
  const labels = guide.visual;
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3]];
  const scenes: Array<[number[], number[], string, string]> = [
    [[0], [], `Start with ${labels[0]}.`, `শুরুতে ${labels[0]} দেখো।`],
    [[1, 2], [0], `Next follow ${labels[1]} and ${labels[2]}.`, `এরপর ${labels[1]} ও ${labels[2]} দেখো।`],
    [[3], [0, 1, 2], `Finish at ${labels[3]}. ${guide.example}`, `শেষে ${labels[3]}। ${guide.exampleBn}`],
  ];
  return {
    id,
    title: guide.title,
    category: "Algorithms",
    kind: "concept",
    summary: guide.concept,
    steps: scenes.map(([active, completed, explanation, explanationBn]) => ({
      explanation,
      explanationBn,
      scene: { labels, links, layout: "line" as const, active, completed },
    })),
  };
});
