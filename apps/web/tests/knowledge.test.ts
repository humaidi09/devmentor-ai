import assert from "node:assert/strict";
import { test } from "node:test";

import { crossref, github, selectProviderIds, worldBank, type ProviderAdapter } from "../src/lib/knowledge/adapters";
import { KnowledgeEngine } from "../src/lib/knowledge/core";
import { validateExplanation } from "../src/lib/knowledge/explanation-schema";
import type { KnowledgeProvider, KnowledgeResult } from "../src/lib/knowledge/types";

const now = "2026-10-13T00:00:00.000Z";
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const fake = (value: unknown, status = 200): typeof fetch => async () => response(value, status);
const sample = (provider: KnowledgeProvider, summary = "A source claim"): KnowledgeResult => ({
  id: `${provider}:1`, provider, category: "research", title: "Cloud computing",
  url: "https://doi.org/10.1234/example", source: provider, authors: [],
  publishedAt: "2025", updatedAt: null, retrievedAt: now, summary, stale: false,
});

test("Crossref validates DOI metadata, preserves provenance and supports empty results", async () => {
  const rows = await crossref.search("recent cloud computing", now, async (url) => {
    assert.match(String(url), /from-pub-date:2023-01-01/);
    return response({ message: { items: [{ DOI: "10.1234/example", title: ["Cloud study"], publisher: "Example Press", published: { "date-parts": [[2025]] }, author: [{ given: "Ada", family: "Lovelace" }] }, { title: ["No DOI"] }] } });
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].url, "https://doi.org/10.1234/example");
  assert.equal(rows[0].publishedAt, "2025");
  assert.deepEqual(rows[0].authors, ["Ada Lovelace"]);
  assert.deepEqual(await crossref.search("cloud", now, fake({ message: { items: [] } })), []);
  await assert.rejects(crossref.search("cloud", now, fake({ wrong: true })), /malformed/);
});

test("World Bank validates values; GitHub rejects invalid links and rate limits", async () => {
  const data = await worldBank.search("Bangladesh inflation", now, fake([{}, [{ date: "2025", value: 8.77 }, { date: "2024", value: null }]]));
  assert.equal(data.length, 1);
  assert.match(data[0].summary, /8.77/);
  assert.equal(data[0].source, "World Bank Open Data");
  await assert.rejects(worldBank.search("GDP", now, fake({ bad: true })), /malformed/);
  const repos = await github.search("React", now, fake({ items: [{ id: 1, full_name: "safe/repo", html_url: "https://github.com/safe/repo", owner: { login: "safe" } }, { id: 2, full_name: "bad", html_url: "https://evil.test/x" }] }));
  assert.equal(repos.length, 1);
  await assert.rejects(github.search("React", now, fake({}, 429)), /rate_limit/);
});

test("provider selection sends only explicit search queries to relevant sources", () => {
  assert.deepEqual(selectProviderIds("Bangladesh population", "all"), ["world-bank", "crossref", "github"]);
  assert.deepEqual(selectProviderIds("BFS", "competitive-programming"), ["github"]);
});

test("multi-source results preserve conflicting claims and isolate provider failure", async () => {
  const providers = {
    crossref: { id: "crossref", search: async () => [sample("crossref", "Source A says 10")] },
    "world-bank": { id: "world-bank", search: async () => [sample("world-bank", "Source B says 12")] },
    github: { id: "github", search: async () => { throw new Error("unavailable"); } },
  } as Record<KnowledgeProvider, ProviderAdapter>;
  const engine = new KnowledgeEngine(providers, () => ["crossref", "world-bank", "github"], () => Date.parse(now));
  const result = await engine.search("cloud", "all");
  assert.equal(result.results.length, 2);
  assert.deepEqual(result.results.map((item) => item.summary).sort(), ["Source A says 10", "Source B says 12"]);
  assert.deepEqual(result.unavailable, ["github"]);
});

test("stale cache is labeled and expires after 24 hours", async () => {
  let time = Date.parse(now);
  let available = true;
  const providers = {
    crossref: { id: "crossref", search: async () => { if (!available) throw new Error("offline"); return [sample("crossref")]; } },
    "world-bank": { id: "world-bank", search: async () => [] },
    github: { id: "github", search: async () => [] },
  } as Record<KnowledgeProvider, ProviderAdapter>;
  const engine = new KnowledgeEngine(providers, () => ["crossref"], () => time);
  await engine.search("cloud", "research");
  available = false;
  time += 11 * 60_000;
  const stale = await engine.search("cloud", "research");
  assert.equal(stale.results[0].stale, true);
  assert.equal(stale.results[0].retrievedAt, now);
  time += 25 * 60 * 60_000;
  const expired = await engine.search("cloud", "research");
  assert.deepEqual(expired.results, []);
  assert.deepEqual(expired.unavailable, ["crossref"]);
});

test("AI explanation rejects fabricated citations and malformed claims", () => {
  const valid = { summary: "The metadata describes cloud computing.", findings: [{ text: "One paper discusses cloud computing.", sourceIds: ["crossref:1"] }], differences: [] };
  assert.deepEqual(validateExplanation(valid, ["crossref:1"]), valid);
  assert.throws(() => validateExplanation({ ...valid, findings: [{ text: "False", sourceIds: ["invented"] }] }, ["crossref:1"]), /invalid_explanation/);
  assert.throws(() => validateExplanation({ ...valid, findings: [{ text: "No source", sourceIds: [] }] }, ["crossref:1"]), /invalid_explanation/);
});
