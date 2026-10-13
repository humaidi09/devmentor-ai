import { writeFileSync } from "node:fs";
import guides from "../src/lib/visual/dsa-guides.json";
import { TOPICS } from "../src/lib/visual/topics";

const byId = new Map(TOPICS.map((topic) => [topic.id, topic]));
const manifest = Object.entries(guides).map(([id, guide]) => {
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
