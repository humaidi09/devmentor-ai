import guides from "../visual/dsa-guides.json";
import patternGuides from "../visual/dsa-pattern-guides.json";
import deepLessons from "../visual/dsa-deep-lessons.json";
import { classify } from "../safety/classifier";
import type { ChatMessage } from "../types";

type Lang = "en" | "bn";
type Lesson = {
  title: string;
  concept: string;
  conceptBn: string;
  example: string;
  exampleBn: string;
  visual: string[];
};
type DeepLesson = {
  explanationEn: string;
  explanationBn: string;
  videoStepsEn: string[];
  videoStepsBn: string[];
  extraExampleEn: string;
  extraExampleBn: string;
};

const aliases: Record<string, string[]> = {
  array: ["arrays", "অ্যারে"],
  string: ["strings", "স্ট্রিং"],
  "binary-search": ["বাইনারি সার্চ"],
  "bubble-sort": ["বাবল সর্ট"],
  "linked-list": ["লিংকড লিস্ট"],
  stack: ["স্ট্যাক"],
  queue: ["কিউ"],
  tree: ["ট্রি"],
  graph: ["গ্রাফ"],
  bfs: ["breadth first search", "বিএফএস"],
  dfs: ["depth first search", "ডিএফএস"],
  recursion: ["রিকার্শন"],
  "dynamic-programming": ["dp", "ডাইনামিক প্রোগ্রামিং"],
  "pattern-two-sum": ["টু সাম", "টু সম"],
  "pattern-kmp": ["কেএমপি"],
  "pattern-sliding-window": ["স্লাইডিং উইন্ডো"],
  "pattern-prefix-sum": ["প্রিফিক্স সাম"],
};

const lessons: Record<string, Lesson> = {
  ...Object.fromEntries(
    Object.entries(guides).map(([id, guide]) => [
      id,
      { ...guide, title: id.replaceAll("-", " ") },
    ]),
  ),
  ...patternGuides,
};

function words(value: string) {
  return ` ${value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
}

const phrases = Object.entries(lessons)
  .flatMap(([id, guide]) =>
    [guide.title, id.replace(/^pattern-/, "").replaceAll("-", " "), ...(aliases[id] ?? [])]
      .map((phrase) => ({ id, phrase: words(phrase).trim() }))
      .filter(({ phrase }) => phrase.length >= 3),
  )
  .sort((a, b) => b.phrase.length - a.phrase.length);

function topicIn(message: string) {
  const input = words(message);
  return phrases.find(({ phrase }) => input.includes(` ${phrase} `))?.id;
}

function reply(content: string, topicId?: string): ChatMessage {
  return {
    id: `lesson_${crypto.randomUUID()}`,
    role: "assistant",
    content,
    provider: "curated",
    state: "success",
    ...(topicId ? { modulePath: `/learn/visual-lab/${topicId}` } : {}),
  };
}

/** Public authored lessons answer learning questions without claiming model output. */
export function learningReply(
  message: string,
  lang: Lang,
  contextTopicId?: string,
): ChatMessage | null {
  const safety = classify(message);
  if (safety.urgent || safety.professional || safety.kind === "human") return null;
  const input = words(message);
  if (
    ["hi", "hello", "hey", "হাই", "হ্যালো", "কি করতে পারো", "what can you do"].includes(
      input.trim(),
    )
  ) {
    return reply(
      lang === "bn"
        ? "হ্যালো! Binary Search, Two Sum, BFS বা অন্য কোনো DSA topic জানতে চাইতে পারো। আমি সহজ ধারণা, একাধিক উদাহরণ ও সব ধাপ বুঝিয়ে দিতে পারি।"
        : "Hello! Ask me about Binary Search, Two Sum, BFS or another DSA topic. I can explain the idea, multiple examples and every step.",
    );
  }
  const directId = topicIn(message);
  const followUp = /\b(example|steps?|how|why|explain|more)\b|উদাহরণ|ধাপ|কিভাবে|কেন|বোঝাও|আরও/i.test(message);
  const id = directId ?? (followUp && contextTopicId && Object.hasOwn(lessons, contextTopicId) ? contextTopicId : undefined);
  if (!id) return null;
  const lesson = lessons[id];
  const deep = (deepLessons as Record<string, DeepLesson>)[id];
  const isSteps = /\bsteps?\b|ধাপ/i.test(message);
  const isExample = /\bexample\b|উদাহরণ/i.test(message);
  const title = lesson.title.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const concept = lang === "bn" ? lesson.conceptBn : lesson.concept;
  const example = lang === "bn" ? lesson.exampleBn : lesson.example;
  const explanation = lang === "bn" ? deep?.explanationBn : deep?.explanationEn;
  const extraExample = lang === "bn" ? deep?.extraExampleBn : deep?.extraExampleEn;
  const videoSteps = lang === "bn" ? deep?.videoStepsBn : deep?.videoStepsEn;
  if (isSteps) {
    return reply(
      `${title}\n${lang === "bn" ? "উদাহরণটি ধাপে ধাপে:" : "The example, step by step:"}\n${(videoSteps ?? lesson.visual).map((step, index) => `${index + 1}. ${step}`).join("\n")}\n${concept}`,
      id,
    );
  }
  if (isExample) {
    const another = !directId && contextTopicId === id;
    return reply(
      another
        ? `${title}\n${lang === "bn" ? "আরেকটি উদাহরণ:" : "Another example:"} ${extraExample ?? example}`
        : `${title}\n${lang === "bn" ? "উদাহরণ ১:" : "Example 1:"} ${example}\n${lang === "bn" ? "উদাহরণ ২:" : "Example 2:"} ${extraExample ?? example}\n${concept}`,
      id,
    );
  }
  return reply(
    `${title}\n${concept}\n${explanation ?? ""}\n${lang === "bn" ? "উদাহরণ ১:" : "Example 1:"} ${example}\n${lang === "bn" ? "উদাহরণ ২:" : "Example 2:"} ${extraExample ?? example}`,
    id,
  );
}
