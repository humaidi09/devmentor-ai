import {
  IntegrationError,
  validHandle,
  profileResponse,
  submissionsResponse,
  problemsResponse,
  CF_TOPICS,
  type PublicProfile,
  type PublicProblem,
  type PublicSubmission,
} from "./adapter";
async function boundedJson(response: Response) {
  if (Number(response.headers.get("content-length")) > 4_000_000) {
    await response.body?.cancel();
    throw new IntegrationError("oversized");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new IntegrationError("malformed");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      length += r.value.byteLength;
      if (length > 4_000_000) throw new IntegrationError("oversized");
      chunks.push(r.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const buffer = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, at);
    at += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new IntegrationError("malformed");
  }
}
export class CodeforcesClient {
  private cache = new Map<string, { expires: number; value: unknown }>();
  private inFlight = new Map<string, Promise<unknown>>();
  private nextRequest = 0;
  constructor(
    private request: typeof fetch = fetch,
    private clock = () => Date.now(),
  ) {}
  private async get<T>(
    key: string,
    path: string,
    parse: (v: unknown) => T,
    ttl = 300_000,
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > this.clock()) return cached.value as T;
    const pending = this.inFlight.get(key);
    if (pending) return pending as Promise<T>;
    if (this.clock() < this.nextRequest)
      throw new IntegrationError("rate_limit");
    this.nextRequest = this.clock() + 2100;
    const task = (async () => {
      try {
        const response = await this.request(
          `https://codeforces.com/api/${path}`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );
        if (!response.ok)
          throw new IntegrationError(
            response.status === 429 ? "rate_limit" : "unavailable",
          );
        const value = parse(await boundedJson(response));
        if (this.cache.size >= 64)
          this.cache.delete(this.cache.keys().next().value!);
        this.cache.set(key, { expires: this.clock() + ttl, value });
        return value;
      } catch (e) {
        if (e instanceof IntegrationError) throw e;
        throw new IntegrationError("unavailable");
      } finally {
        this.inFlight.delete(key);
      }
    })();
    this.inFlight.set(key, task);
    return task;
  }
  profile(handle: string): Promise<PublicProfile> {
    const h = validHandle(handle);
    return this.get(
      `profile:${h.toLowerCase()}`,
      `user.info?handles=${encodeURIComponent(h)}`,
      (v) => profileResponse(v, h),
    );
  }
  submissions(handle: string): Promise<PublicSubmission[]> {
    const h = validHandle(handle);
    return this.get(
      `history:${h.toLowerCase()}`,
      `user.status?handle=${encodeURIComponent(h)}&from=1&count=50`,
      submissionsResponse,
      120_000,
    );
  }
  problems(topic: string): Promise<PublicProblem[]> {
    if (!CF_TOPICS.includes(topic as (typeof CF_TOPICS)[number]))
      throw new IntegrationError("malformed");
    return this.get(
      `problems:${topic}`,
      `problemset.problems?tags=${encodeURIComponent(topic)}`,
      (v) =>
        problemsResponse(v)
          .filter((p) => p.rating !== null)
          .slice(0, 300),
      1_800_000,
    );
  }
  invalidate(handle: string) {
    this.cache.delete(`profile:${handle.toLowerCase()}`);
    this.cache.delete(`history:${handle.toLowerCase()}`);
  }
}
