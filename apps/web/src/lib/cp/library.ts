export const CP_TOPICS = [
  "array", "string", "two-pointers", "linked-list", "stack", "queue", "hashing",
  "sorting", "binary-search", "recursion", "backtracking", "tree", "bst", "heap",
  "graph", "bfs", "dfs", "greedy", "dynamic-programming", "shortest-path",
  "minimum-spanning-tree", "trie", "bit-manipulation",
] as const;
export type CPTopic = (typeof CP_TOPICS)[number];
export type CPPlatform = "codeforces" | "leetcode";
export type CPLevel = "beginner" | "easy" | "medium" | "hard" | "unrated";
export type CPProgressStatus = "none" | "attempted" | "solved" | "need_hint" | "upsolve" | "upsolved" | "skipped";

export interface LibraryProblem {
  id: string;
  platform: CPPlatform;
  externalId: string;
  title: string;
  url: string;
  topics: CPTopic[];
  originalDifficulty: string | null;
  normalizedDifficulty: CPLevel;
  rating: number | null;
  source: "curated" | "codeforces-api";
  lastUpdated: string | null;
  hint: string;
}

export const TOPIC_LABELS: Record<CPTopic, string> = Object.fromEntries(
  CP_TOPICS.map((topic) => [topic, topic.split("-").map((word) => word === "bst" || word === "bfs" || word === "dfs" ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)).join(" ")]),
) as Record<CPTopic, string>;

export const VISUAL_TOPICS: Partial<Record<CPTopic, string>> = {
  bfs: "bfs", dfs: "dfs", graph: "bfs", "binary-search": "binary-search",
  sorting: "bubble-sort", array: "bubble-sort",
};

// Approved references: metadata and links only, never copied problem statements.
const references: Array<[CPPlatform, string, string, CPTopic[], CPLevel, string]> = [
  ["codeforces", "71/A", "Way Too Long Words", ["string"], "unrated", "Compare the length against the abbreviation threshold."],
  ["codeforces", "266/B", "Queue at the School", ["queue", "string"], "unrated", "Simulate one second at a time and avoid moving the same child twice."],
  ["codeforces", "520/B", "Two Buttons", ["bfs", "graph"], "unrated", "Think of each number as a state with two possible next states."],
  ["codeforces", "580/C", "Kefa and Park", ["dfs", "tree"], "unrated", "Carry the consecutive count along each path."],
  ["codeforces", "706/B", "Interesting drink", ["binary-search", "sorting"], "unrated", "Sort the prices first; each query asks for a boundary."],
  ["leetcode", "two-sum", "Two Sum", ["array", "hashing"], "easy", "Ask what complement you need for each number."],
  ["leetcode", "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", ["array", "greedy"], "easy", "Track the cheapest price seen before the current day."],
  ["leetcode", "valid-parentheses", "Valid Parentheses", ["stack", "string"], "easy", "A stack can remember unmatched opening symbols."],
  ["leetcode", "merge-two-sorted-lists", "Merge Two Sorted Lists", ["linked-list"], "easy", "Compare the heads and attach the smaller one."],
  ["leetcode", "binary-search", "Binary Search", ["binary-search"], "easy", "Maintain an inclusive sorted search interval."],
  ["leetcode", "number-of-islands", "Number of Islands", ["bfs", "dfs", "graph"], "medium", "Treat each land cell as a graph node and mark visited cells."],
  ["leetcode", "flood-fill", "Flood Fill", ["bfs", "dfs", "graph"], "easy", "Only visit neighbors that match the starting color."],
  ["leetcode", "maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", ["tree", "recursion"], "easy", "Relate a node's depth to the depths of its children."],
  ["leetcode", "climbing-stairs", "Climbing Stairs", ["dynamic-programming"], "easy", "The ways to reach a step depend on the previous two steps."],
  ["leetcode", "coin-change", "Coin Change", ["dynamic-programming"], "medium", "Define the best answer for each amount smaller than the target."],
  ["leetcode", "kth-largest-element-in-an-array", "Kth Largest Element in an Array", ["heap", "sorting"], "medium", "Consider keeping only the largest k values."],
  ["leetcode", "implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", ["trie"], "medium", "Each node represents a prefix; track where words end."],
  ["leetcode", "longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", ["string", "two-pointers", "hashing"], "medium", "Move the left boundary when a repeated character enters the window."],
  ["leetcode", "subsets", "Subsets", ["backtracking", "recursion"], "medium", "For each element, choose to include it or exclude it."],
  ["leetcode", "single-number", "Single Number", ["bit-manipulation"], "easy", "Think about an operation that cancels equal values."],
  ["leetcode", "minimum-cost-to-connect-all-points", "Min Cost to Connect All Points", ["minimum-spanning-tree", "graph"], "medium", "Connect all points without cycles while minimizing total edge cost."],
  ["leetcode", "network-delay-time", "Network Delay Time", ["shortest-path", "graph"], "medium", "Relax edges from the closest unreached node first."],
  ["leetcode", "validate-binary-search-tree", "Validate Binary Search Tree", ["bst", "tree"], "medium", "Each subtree inherits value bounds from its ancestors."],
];

export const CURATED_PROBLEMS: LibraryProblem[] = references.map(([platform, externalId, title, topics, level, hint]) => ({
  id: platform === "codeforces" ? `cf-${externalId.replace("/", "-")}` : `lc-${externalId}`,
  platform, externalId, title, topics,
  url: platform === "codeforces" ? `https://codeforces.com/problemset/problem/${externalId}` : `https://leetcode.com/problems/${externalId}/`,
  originalDifficulty: platform === "leetcode" ? level[0].toUpperCase() + level.slice(1) : null,
  normalizedDifficulty: level,
  rating: null,
  source: "curated",
  lastUpdated: null,
  hint,
}));

export function levelFromRating(rating: number | null): CPLevel {
  if (rating === null) return "unrated";
  if (rating < 1000) return "beginner";
  if (rating < 1400) return "easy";
  if (rating < 1900) return "medium";
  return "hard";
}

export const CODEFORCES_TAG: Partial<Record<CPTopic, string>> = {
  array: "implementation", string: "strings", "two-pointers": "two pointers", "binary-search": "binary search",
  sorting: "sortings", tree: "trees", graph: "graphs", bfs: "graphs", dfs: "dfs and similar",
  greedy: "greedy", "dynamic-programming": "dp", "shortest-path": "shortest paths",
  "bit-manipulation": "bitmasks", recursion: "brute force", backtracking: "brute force",
};

const TAG_TOPIC: Record<string, CPTopic> = {
  implementation: "array", strings: "string", "two pointers": "two-pointers", "binary search": "binary-search",
  sortings: "sorting", trees: "tree", graphs: "graph", "dfs and similar": "dfs",
  greedy: "greedy", dp: "dynamic-programming", "shortest paths": "shortest-path", bitmasks: "bit-manipulation",
  "brute force": "backtracking",
};

export function normalizeCodeforces(value: { id: string; contestId: number; index: string; name: string; rating: number | null; tags: string[]; url: string }): LibraryProblem {
  const topics = [...new Set(value.tags.map((tag) => TAG_TOPIC[tag]).filter(Boolean))] as CPTopic[];
  return {
    id: value.id, platform: "codeforces", externalId: `${value.contestId}/${value.index}`,
    title: value.name, url: value.url, topics: [...new Set(topics)],
    originalDifficulty: value.rating === null ? null : `Codeforces ${value.rating}`,
    normalizedDifficulty: levelFromRating(value.rating), rating: value.rating,
    source: "codeforces-api", lastUpdated: null,
    hint: "Start with a small example, identify the state and constraints, then choose an algorithm.",
  };
}

export function filterProblems(problems: LibraryProblem[], filters: {
  query?: string; topic?: string; platform?: string; difficulty?: string; status?: string;
  minRating?: number; maxRating?: number; progress?: Record<string, string>;
}) {
  const query = filters.query?.trim().toLowerCase();
  return problems.filter((problem) =>
    (!query || problem.title.toLowerCase().includes(query)) &&
    (!filters.topic || problem.topics.includes(filters.topic as CPTopic)) &&
    (!filters.platform || problem.platform === filters.platform) &&
    (!filters.difficulty || problem.normalizedDifficulty === filters.difficulty) &&
    (!filters.status || (filters.progress?.[problem.id] ?? "none") === filters.status) &&
    (filters.minRating === undefined || (problem.rating !== null && problem.rating >= filters.minRating)) &&
    (filters.maxRating === undefined || (problem.rating !== null && problem.rating <= filters.maxRating))
  );
}

export function dailyPractice(problems: LibraryProblem[], progress: Record<string, string>, topic?: string) {
  const pool = topic ? problems.filter((problem) => problem.topics.includes(topic as CPTopic)) : problems;
  const pending = pool.filter((problem) => !["solved", "upsolved"].includes(progress[problem.id]));
  const chosen: LibraryProblem[] = [];
  const add = (problem?: LibraryProblem) => { if (problem && !chosen.some((item) => item.id === problem.id)) chosen.push(problem); };
  add(pending.find((problem) => problem.normalizedDifficulty === "beginner" || problem.normalizedDifficulty === "easy"));
  add(pending.find((problem) => progress[problem.id] === "upsolve" || progress[problem.id] === "attempted" || progress[problem.id] === "need_hint"));
  add(pending.find((problem) => !chosen.some((item) => item.id === problem.id)));
  return chosen;
}
