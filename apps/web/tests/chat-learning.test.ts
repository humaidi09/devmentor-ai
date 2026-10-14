import assert from "node:assert/strict";
import test from "node:test";
import { learningReply } from "../src/lib/chat/learning";
import guides from "../src/lib/visual/dsa-guides.json";
import patterns from "../src/lib/visual/dsa-pattern-guides.json";

test("demo learning questions use the requested topic instead of a repeated fallback", () => {
  const search = learningReply("Explain binary search", "en");
  const sum = learningReply("How does Two Sum work?", "en");
  assert.equal(search?.modulePath, "/learn/visual-lab/binary-search");
  assert.match(search?.content ?? "", /sorted list/i);
  assert.equal(sum?.modulePath, "/learn/visual-lab/pattern-two-sum");
  assert.match(sum?.content ?? "", /pair|number|target/i);
  assert.notEqual(search?.content, sum?.content);
  assert.equal(search?.provider, "curated");
});

test("Bangla questions and follow-ups keep the lesson context", () => {
  const answer = learningReply("বাইনারি সার্চ বুঝিয়ে দাও", "bn");
  assert.equal(answer?.modulePath, "/learn/visual-lab/binary-search");
  assert.match(answer?.content ?? "", /[\u0980-\u09ff]/);
  const followUp = learningReply("আরেকটা উদাহরণ দাও", "bn", "binary-search");
  assert.equal(followUp?.modulePath, answer?.modulePath);
  assert.match(followUp?.content ?? "", /উদাহরণ/);
  assert.notEqual(followUp?.content, answer?.content);
  assert.match(followUp?.content ?? "", /ইনডেক্স|index/);
  assert.equal(learningReply("hello", "en")?.provider, "curated");
});

test("all DSA lessons are addressable while unsafe and unknown prompts stay outside lesson routing", () => {
  for (const id of Object.keys({ ...guides, ...patterns })) {
    assert.equal(
      learningReply(id.replace(/^pattern-/, "").replaceAll("-", " "), "en")?.modulePath,
      `/learn/visual-lab/${id}`,
      id,
    );
  }
  assert.equal(learningReply("What is the weather today?", "en"), null);
  assert.equal(learningReply("I want to hurt myself while learning binary search", "en"), null);
  assert.equal(learningReply("Show an example", "en", "__proto__"), null);
});
