import assert from "node:assert/strict";
import { test } from "node:test";

import { CATALOG_PROBLEMS, CURATED_PROBLEMS, CP_TOPICS, LIBRARY_PROBLEMS, dailyPractice, filterProblems, levelFromRating, normalizeCodeforces } from "../src/lib/cp/library";

test("catalog contains 1,000+ distinct, topic-tagged problems from all three platforms", () => {
  assert.ok(CATALOG_PROBLEMS.length >= 1000);
  assert.equal(new Set(CATALOG_PROBLEMS.map((item) => item.id)).size, CATALOG_PROBLEMS.length);
  assert.equal(new Set(LIBRARY_PROBLEMS.map((item) => item.id)).size, LIBRARY_PROBLEMS.length);
  for (const platform of ["codeforces", "leetcode", "codechef"] as const) {
    const items = CATALOG_PROBLEMS.filter((item) => item.platform === platform);
    assert.ok(items.length > 0, platform);
    assert.deepEqual(new Set(items.map((item) => item.normalizedDifficulty)), new Set(["easy", "medium", "hard"]));
    assert.ok(items.every((item) => item.topics.length > 0 && item.topics.every((topic) => CP_TOPICS.includes(topic))));
    assert.ok(items.every((item) => new URL(item.url).protocol === "https:"));
  }
});

test("CodeChef ratings are shown as CodeChef metadata and excluded from CF rating filters", () => {
  const chef = CATALOG_PROBLEMS.find((item) => item.platform === "codechef")!;
  assert.match(chef.originalDifficulty!, /^CodeChef \d+$/);
  assert.ok(chef.url.startsWith("https://www.codechef.com/problems/"));
  assert.deepEqual(filterProblems([chef], { minRating: 1 }), []);
  assert.deepEqual(filterProblems(LIBRARY_PROBLEMS, { platform: "codechef", difficulty: chef.normalizedDifficulty, topic: chef.topics[0] }).some((item) => item.id === chef.id), true);
});

test("curated LeetCode and Codeforces links contain metadata, never statements", () => {
  assert.ok(CURATED_PROBLEMS.some((item) => item.platform === "leetcode"));
  assert.ok(CURATED_PROBLEMS.some((item) => item.platform === "codeforces"));
  assert.ok(CURATED_PROBLEMS.every((item) => item.url.startsWith("https://") && item.rating === null));
  assert.ok(CP_TOPICS.includes("bfs") && CP_TOPICS.includes("dynamic-programming"));
});

test("Codeforces ratings remain original and normalized levels are explicit", () => {
  const problem = normalizeCodeforces({ id: "cf-520-B", contestId: 520, index: "B", name: "Two Buttons", rating: 1400, tags: ["graphs"], url: "https://codeforces.com/problemset/problem/520/B" });
  assert.equal(problem.rating, 1400);
  assert.equal(problem.normalizedDifficulty, "medium");
  assert.equal(problem.originalDifficulty, "Codeforces 1400");
  assert.deepEqual(problem.topics, ["graph"]);
  assert.equal(levelFromRating(null), "unrated");
});

test("topic, platform, difficulty, title, rating and personal status filters combine", () => {
  const twoSum = CURATED_PROBLEMS.find((item) => item.title === "Two Sum")!;
  const filtered = filterProblems(CURATED_PROBLEMS, {
    query: "two sum", topic: "hashing", platform: "leetcode", difficulty: "easy",
    status: "upsolve", progress: { [twoSum.id]: "upsolve" },
  });
  assert.deepEqual(filtered.map((item) => item.id), [twoSum.id]);
  assert.equal(filterProblems(CURATED_PROBLEMS, { minRating: 800 }).length, 0);
});

test("daily practice prioritizes accessible and revision problems without fake counts", () => {
  const twoSum = CURATED_PROBLEMS.find((item) => item.title === "Two Sum")!;
  const practice = dailyPractice(CURATED_PROBLEMS, { [twoSum.id]: "upsolve" });
  assert.ok(practice.length >= 2);
  assert.ok(practice.some((item) => item.id === twoSum.id));
  assert.equal(new Set(practice.map((item) => item.id)).size, practice.length);
});
