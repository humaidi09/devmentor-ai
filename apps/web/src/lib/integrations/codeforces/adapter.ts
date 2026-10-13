export interface PublicProfile {
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  url: string;
}
export interface PublicProblem {
  id: string;
  contestId: number;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
}
export interface PublicSubmission {
  id: number;
  problem: PublicProblem;
  verdict: string;
  createdAt: number;
}
export class IntegrationError extends Error {
  constructor(
    public kind:
      | "invalid_handle"
      | "rate_limit"
      | "unavailable"
      | "malformed"
      | "oversized",
  ) {
    super(kind);
  }
}
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new IntegrationError("malformed");
  return v as Record<string, unknown>;
}
function string(v: unknown, max: number) {
  if (typeof v !== "string" || !v.length || v.length > max)
    throw new IntegrationError("malformed");
  return v;
}
function number(v: unknown, min = 0, max = 1e10) {
  if (!Number.isSafeInteger(v) || Number(v) < min || Number(v) > max)
    throw new IntegrationError("malformed");
  return Number(v);
}
export function validHandle(v: unknown) {
  if (typeof v !== "string" || !/^[a-zA-Z0-9_.-]{3,24}$/.test(v))
    throw new IntegrationError("invalid_handle");
  return v;
}
function result(v: unknown): unknown {
  const b = record(v);
  if (b.status !== "OK")
    throw new IntegrationError(
      b.status === "FAILED" &&
      typeof b.comment === "string" &&
      /handle.*not found|not found.*handle/i.test(b.comment)
        ? "invalid_handle"
        : "unavailable",
    );
  return b.result;
}
function array(v: unknown, max: number) {
  if (!Array.isArray(v) || v.length > max)
    throw new IntegrationError("malformed");
  return v;
}
export function profileResponse(v: unknown, requested: string): PublicProfile {
  const rows = array(result(v), 1);
  if (rows.length !== 1) throw new IntegrationError("malformed");
  const p = record(rows[0]),
    handle = validHandle(p.handle);
  if (handle.toLowerCase() !== requested.toLowerCase())
    throw new IntegrationError("malformed");
  return {
    handle,
    rating: p.rating === undefined ? null : number(p.rating, 0, 6000),
    maxRating: p.maxRating === undefined ? null : number(p.maxRating, 0, 6000),
    rank: p.rank === undefined ? null : string(p.rank, 40),
    url: `https://codeforces.com/profile/${encodeURIComponent(handle)}`,
  };
}
function problem(v: unknown): PublicProblem {
  const p = record(v),
    contestId = number(p.contestId, 1, 1e9),
    index = string(p.index, 8);
  if (!/^[A-Za-z0-9]+$/.test(index)) throw new IntegrationError("malformed");
  return {
    id: `cf-${contestId}-${index}`,
    contestId,
    index,
    name: string(p.name, 200),
    rating: p.rating === undefined ? null : number(p.rating, 0, 6000),
    tags: array(p.tags, 30).map((t) => string(t, 40)),
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
  };
}
export function submissionsResponse(v: unknown): PublicSubmission[] {
  return array(result(v), 100).map((value) => {
    const s = record(value);
    return {
      id: number(s.id, 1),
      problem: problem(s.problem),
      verdict: s.verdict === undefined ? "PENDING" : string(s.verdict, 40),
      createdAt: number(s.creationTimeSeconds),
    };
  });
}
export function problemsResponse(v: unknown): PublicProblem[] {
  const b = record(result(v));
  return array(b.problems, 30000).map(problem);
}
export const CF_TOPICS = [
  "math",
  "strings",
  "implementation",
  "graphs",
  "dfs and similar",
  "binary search",
  "dp",
  "greedy",
  "trees",
] as const;
