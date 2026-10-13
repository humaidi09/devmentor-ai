import { writeFileSync } from "node:fs";
import guides from "../src/lib/visual/dsa-guides.json";
import patternGuides from "../src/lib/visual/dsa-pattern-guides.json";
import { TOPICS } from "../src/lib/visual/topics";

const byId = new Map(TOPICS.map((topic) => [topic.id, topic]));
type Guide = { concept: string; conceptBn: string; example: string; exampleBn: string; visual: string[]; patterns: string[] };
const entries: Array<[string, Guide]> = Object.entries(guides);
for (const [id, guide] of Object.entries(patternGuides)) {
  const parent = (guides as Record<string, Guide>)[guide.parent];
  if (!parent) throw new Error(`Missing parent guide: ${guide.parent}`);
  entries.push([id, { ...guide, patterns: parent.patterns }]);
}
const manifest = entries.map(([id, guide]) => {
  const topic = byId.get(id);
  if (!topic || topic.steps.length < 3) throw new Error(`Missing animated lesson: ${id}`);
  const last = topic.steps.length - 1;
  return {
    id,
    title: topic.title,
    ...guide,
    steps: [topic.steps[0], topic.steps[Math.floor(last / 2)], topic.steps[last]].map((step) => ({
      en: step.explanation,
      bn: step.explanationBn,
    })),
  };
});

writeFileSync(process.argv[2], JSON.stringify(manifest));
