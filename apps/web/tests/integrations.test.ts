import test from "node:test";
import assert from "node:assert/strict";
import { CodeforcesClient } from "../src/lib/integrations/codeforces/client";
import {
  profileResponse,
  problemsResponse,
  submissionsResponse,
  IntegrationError,
} from "../src/lib/integrations/codeforces/adapter";
import { quietHours } from "../src/lib/integrations/notifications/types";
import {
  practiceProblems,
  weakTopics,
  conceptTopic,
} from "../src/lib/recommendations/cp";
import {
  academicSuggestions,
  nextMilestone,
  recentVisual,
  relatedVisual,
} from "../src/lib/recommendations/learning";
const profile = {
    status: "OK",
    result: [
      {
        handle: "tourist",
        rating: 3900,
        maxRating: 3979,
        rank: "legendary grandmaster",
        email: "ignore-private",
      },
    ],
  },
  problem = {
    contestId: 4,
    index: "A",
    name: "Watermelon",
    rating: 800,
    tags: ["math"],
  };
test("Codeforces normalized profile includes only required public fields and canonical URL", () => {
  assert.deepEqual(profileResponse(profile, "Tourist"), {
    handle: "tourist",
    rating: 3900,
    maxRating: 3979,
    rank: "legendary grandmaster",
    url: "https://codeforces.com/profile/tourist",
  });
});
test("Codeforces rejects invalid, empty, malformed, mismatched and numeric/URL injection responses", () => {
  for (const p of [
    { status: "FAILED", comment: "handle: not found" },
    { status: "OK", result: [] },
    { status: "OK", result: [{ handle: "wrong" }] },
    { status: "OK", result: [{ handle: "tourist", rating: "3900" }] },
    { status: "OK", result: [{ handle: "https://evil.test" }] },
  ])
    assert.throws(() => profileResponse(p, "tourist"), IntegrationError);
  assert.throws(() =>
    problemsResponse({
      status: "OK",
      result: { problems: [{ ...problem, index: "../evil" }] },
    }),
  );
  assert.throws(() =>
    submissionsResponse({ status: "OK", result: [{ id: NaN, problem }] }),
  );
});
test("Codeforces validates problem and submission samples without inventing total history", () => {
  const rows = problemsResponse({
    status: "OK",
    result: { problems: [problem] },
  });
  assert.equal(rows[0].url, "https://codeforces.com/problemset/problem/4/A");
  const history = submissionsResponse({
    status: "OK",
    result: [
      { id: 1, creationTimeSeconds: 1700000000, verdict: "OK", problem },
    ],
  });
  assert.equal(history[0].problem.id, "cf-4-A");
  assert.deepEqual(submissionsResponse({ status: "OK", result: [] }), []);
});
test("Codeforces cache, per-process throttle, expiry, single-flight and invalidation avoid repeated API calls", async () => {
  let now = 1e6,
    calls = 0;
  const client = new CodeforcesClient(
    async () => {
      calls++;
      return new Response(JSON.stringify(profile));
    },
    () => now,
  );
  const [a, b] = await Promise.all([
    client.profile("tourist"),
    client.profile("tourist"),
  ]);
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
  await client.profile("TOURIST");
  assert.equal(calls, 1);
  client.invalidate("tourist");
  await assert.rejects(
    () => client.profile("tourist"),
    (e) => (e as IntegrationError).kind === "rate_limit",
  );
  now += 2200;
  await client.profile("tourist");
  assert.equal(calls, 2);
  now += 300001;
  await client.profile("tourist");
  assert.equal(calls, 3);
});
test("Codeforces offline, HTTP rate limit, partial JSON and oversized input fail safely without retries", async () => {
  for (const request of [
    async () => {
      throw Error("offline");
    },
    async () => new Response("", { status: 429 }),
    async () => new Response("{bad"),
    async () =>
      new Response("{}", { headers: { "content-length": "5000000" } }),
  ]) {
    const client = new CodeforcesClient(request);
    await assert.rejects(() => client.profile("tourist"), IntegrationError);
  }
});
test("Quiet hours cover daytime, overnight, disabled, equal times, timezone and DST offsets", () => {
  assert.equal(
    quietHours(
      new Date("2026-10-13T20:00:00Z"),
      "Asia/Dhaka",
      "22:00",
      "07:00",
      true,
    ),
    true,
  );
  assert.equal(
    quietHours(
      new Date("2026-10-13T03:00:00Z"),
      "Asia/Dhaka",
      "22:00",
      "07:00",
      true,
    ),
    false,
  );
  assert.equal(
    quietHours(new Date("2026-10-13T12:00:00Z"), "UTC", "09:00", "17:00", true),
    true,
  );
  assert.equal(
    quietHours(new Date("2026-10-13T12:00:00Z"), "UTC", "00:00", "00:00", true),
    true,
  );
  assert.equal(quietHours(new Date(), "UTC", "00:00", "00:00", false), false);
  assert.equal(
    quietHours(
      new Date("2026-03-29T01:30:00Z"),
      "Europe/London",
      "02:00",
      "03:00",
      true,
    ),
    true,
  );
});
test("CP modes use explicit topic/rating choices, genuine practice status and accepted IDs", () => {
  const rows = [
    { id: "a", rating: 800, tags: ["graphs"] },
    { id: "b", rating: 1000, tags: ["math"] },
    { id: "c", rating: 1400, tags: ["graphs"] },
  ];
  assert.deepEqual(weakTopics(rows, {}), []);
  assert.deepEqual(weakTopics(rows, { a: "need_hint", b: "solved" }), [
    "graphs",
  ]);
  assert.deepEqual(
    practiceProblems(
      rows,
      { topic: "", min: 800, max: 1200, mode: "weak" },
      { a: "attempted" },
    ).map((p) => p.id),
    ["a"],
  );
  assert.deepEqual(
    practiceProblems(
      rows,
      { topic: "", min: 800, max: 1200, mode: "topic" },
      { a: "solved" },
      ["b"],
    ),
    [],
  );
  assert.equal(
    practiceProblems(
      rows,
      { topic: "math", min: 800, max: 1200, mode: "random" },
      {},
      [],
      0,
    )[0].id,
    "b",
  );
  assert.equal(conceptTopic(["binary search"]), "binary-search");
});
test("Academic and developer personalization read only explicit learning inputs and skip completed/cancelled data", () => {
  const suggestions = academicSuggestions(
    [
      { id: "d", title: "SQL exam", due_at: "2099-01-01", status: "pending" },
      {
        id: "done",
        title: "Finished",
        due_at: "2099-01-01",
        status: "completed",
      },
    ],
    [{ title: "My unfinished task", completed: false }],
  );
  assert.deepEqual(
    suggestions.map((s) => s.title),
    ["Review SQL exam", "My unfinished task"],
  );
  assert.deepEqual(
    nextMilestone({ id: "web", milestones: ["HTML", "JS"] }, { "web:0": true }),
    { index: 1, title: "JS", prerequisite: "HTML" },
  );
  assert.equal(
    nextMilestone({ id: "web", milestones: ["HTML"] }, { "web:0": true }),
    null,
  );
});
test("Visual continuation uses explicitly remembered progress; related topics remain deterministic without AI", () => {
  const recent = recentVisual([
    {
      kind: "project",
      topic_key: "frontend",
      status: "completed",
      position: 0,
      updated_at: "2099-01-01",
    },
    {
      kind: "visual",
      topic_key: "bfs",
      status: "viewed",
      position: 2,
      updated_at: "2026-10-01",
    },
  ]);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].position, 2);
  assert.deepEqual(relatedVisual("bfs"), ["dfs"]);
});
