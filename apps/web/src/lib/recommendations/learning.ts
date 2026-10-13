export type VisualProgress = {
  kind: "visual" | "project";
  topic_key: string;
  status: string;
  position: number;
  updated_at: string;
};
export function recentVisual(progress: VisualProgress[]) {
  return progress
    .filter((p) => p.kind === "visual")
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 3);
}
export function relatedVisual(topic: string) {
  return topic === "bfs"
    ? ["dfs"]
    : topic === "dfs"
      ? ["bfs"]
      : topic === "binary-search"
        ? ["bubble-sort"]
        : topic === "bubble-sort"
          ? ["binary-search"]
          : topic === "sql-inner-join"
            ? ["normalization"]
            : topic === "normalization"
              ? ["sql-inner-join"]
              : [];
}
export function nextMilestone(
  path: { id: string; milestones: string[] },
  done: Record<string, boolean>,
) {
  const index = path.milestones.findIndex((_, i) => !done[`${path.id}:${i}`]);
  return index < 0
    ? null
    : {
        index,
        title: path.milestones[index],
        prerequisite: index ? path.milestones[index - 1] : null,
      };
}
export function academicSuggestions(
  deadlines: { id: string; title: string; due_at: string; status: string }[],
  tasks: { title: string; completed: boolean }[],
  now = Date.now(),
) {
  const pending = deadlines
    .filter((d) => d.status === "pending" && Date.parse(d.due_at) > now)
    .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at));
  return [
    ...pending.slice(0, 2).map((d) => ({
      title: `Review ${d.title}`,
      reason: "Your upcoming deadline",
      deadlineId: d.id,
    })),
    ...tasks
      .filter((t) => !t.completed)
      .slice(0, 1)
      .map((t) => ({
        title: t.title,
        reason: "Your unfinished study task",
        deadlineId: null,
      })),
  ].slice(0, 3);
}

export function validStoredProgress(value: unknown): VisualProgress[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is VisualProgress =>
      !!v &&
      typeof v === "object" &&
      ["visual", "project"].includes(v.kind) &&
      typeof v.topic_key === "string" &&
      /^[a-zA-Z0-9_-]{1,100}$/.test(v.topic_key) &&
      [
        "viewed",
        "planned",
        "started",
        "in_progress",
        "completed",
        "paused",
      ].includes(v.status) &&
      Number.isInteger(v.position) &&
      v.position >= 0 &&
      v.position <= 1000 &&
      typeof v.updated_at === "string" &&
      Number.isFinite(Date.parse(v.updated_at)),
  );
}
