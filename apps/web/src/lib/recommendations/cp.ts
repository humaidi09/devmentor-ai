import type { CPProblem } from "../modules-data";
export function weakTopics(
  problems: Pick<CPProblem, "id" | "tags">[],
  status: Record<string, string>,
) {
  const result = new Set<string>();
  for (const p of problems)
    if (["attempted", "need_hint"].includes(status[p.id]))
      p.tags.forEach((t) => result.add(t));
  return [...result].sort();
}
export function practiceProblems<
  T extends { id: string; rating: number | null; tags: string[] },
>(
  problems: T[],
  options: {
    topic: string;
    min: number;
    max: number;
    mode: string;
    includeSolved?: boolean;
    includeUnrated?: boolean;
  },
  status: Record<string, string>,
  accepted: string[] = [],
  random = 0.5,
): T[] {
  const weak = weakTopics(problems, status);
  const rows = problems.filter(
    (p) =>
      (p.rating === null
        ? !!options.includeUnrated
        : p.rating >= options.min && p.rating <= options.max) &&
      (!options.topic || p.tags.includes(options.topic)) &&
      (options.includeSolved ||
        (!["solved", "upsolved"].includes(status[p.id]) &&
          !accepted.includes(p.id))) &&
      (options.mode !== "weak" || p.tags.some((t) => weak.includes(t))),
  );
  if (options.mode === "random")
    return rows.length
      ? [
          rows[
            Math.min(
              rows.length - 1,
              Math.floor(Math.max(0, Math.min(0.999, random)) * rows.length),
            )
          ],
        ]
      : [];
  return rows;
}
export function conceptTopic(tags: string[]) {
  return tags.includes("binary search")
    ? "binary-search"
    : tags.some((t) => ["graphs", "trees", "dfs and similar"].includes(t))
      ? "bfs"
      : tags.includes("sortings")
        ? "bubble-sort"
        : null;
}
