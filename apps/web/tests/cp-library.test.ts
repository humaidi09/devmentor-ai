import assert from "node:assert/strict";
import { test } from "node:test";

import { CURATED_PROBLEMS, CP_TOPICS, dailyPractice, filterProblems, levelFromRating, normalizeCodeforces } from "../src/lib/cp/library";

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
