import type { ProviderAdapter } from "./adapters";
import type { KnowledgeCategory, KnowledgeProvider, KnowledgeResponse, KnowledgeResult } from "./types";

type CacheEntry = { results: KnowledgeResult[]; expires: number; staleUntil: number };

function rank(query: string, results: KnowledgeResult[]): KnowledgeResult[] {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  return [...results].sort((a, b) => {
    const score = (result: KnowledgeResult) => words.reduce((total, word) =>
      total + (result.title.toLowerCase().includes(word) ? 2 : 0) +
      (result.summary.toLowerCase().includes(word) ? 1 : 0), 0);
    return score(b) - score(a);
  });
}

export class KnowledgeEngine {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<KnowledgeResult[]>>();
  constructor(
    private providers: Record<KnowledgeProvider, ProviderAdapter>,
    private select: (query: string, category: KnowledgeCategory) => KnowledgeProvider[],
    private clock = () => Date.now(),
  ) {}

  private async fromProvider(id: KnowledgeProvider, query: string, now: string): Promise<KnowledgeResult[]> {
    const key = `${id}:${query.toLowerCase()}`;
    const current = this.cache.get(key);
    if (current && current.expires > this.clock()) return current.results;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const task = this.providers[id].search(query, now).then((results) => {
      if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, { results, expires: this.clock() + 10 * 60_000, staleUntil: this.clock() + 24 * 60 * 60_000 });
      return results;
    }).catch((error) => {
      if (current && current.staleUntil > this.clock())
        return current.results.map((result) => ({ ...result, stale: true }));
      throw error;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }

  async search(query: string, category: KnowledgeCategory): Promise<KnowledgeResponse> {
    const searchedAt = new Date(this.clock()).toISOString();
    const ids = this.select(query, category);
    const outcomes = await Promise.allSettled(ids.map((id) => this.fromProvider(id, query, searchedAt)));
    const unavailable: KnowledgeProvider[] = [];
    const results: KnowledgeResult[] = [];
    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") results.push(...outcome.value);
      else unavailable.push(ids[index]);
    });
    return { query, category, results: rank(query, results).slice(0, 15), unavailable, searchedAt };
  }
}
