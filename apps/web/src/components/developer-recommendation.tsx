"use client";
import Link from "next/link";
import { useLearningProgress } from "@/lib/learning-store";
import { useLanguage } from "@/lib/i18n";
import { localize } from "@/lib/content-bn";
import { nextMilestone } from "@/lib/recommendations/learning";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Select } from "./ui/input";
export function DeveloperRecommendation({
  path,
  done,
}: {
  path: { id: string; milestones: string[] };
  done: Record<string, boolean>;
}) {
  const { progress, save, remove, busy, error } = useLearningProgress(),
    { lang } = useLanguage(),
    bn = lang === "bn",
    next = nextMilestone(path, done),
    project = progress.find(
      (p) => p.kind === "project" && p.topic_key === path.id,
    );
  const practice =
    path.id === "frontend"
      ? bn
        ? "Accessible task tracker বানান"
        : "Build an accessible task tracker"
      : path.id === "backend"
        ? bn
          ? "পরীক্ষাসহ একটি ছোট API বানান"
          : "Build a small API with tests"
        : bn
          ? "একটি ছোট course planner বানান"
          : "Build a small course planner";
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-bold">
        {bn ? "আপনার পরবর্তী milestone" : "Your next milestone"}
      </h2>
      <p className="text-sm">
        {next
          ? localize(next.title, lang)
          : bn
            ? "সব milestone আপনি সম্পন্ন চিহ্নিত করেছেন।"
            : "You marked all milestones complete."}
      </p>
      <p className="text-xs text-muted-foreground">
        {bn
          ? "কারণ: এই নির্বাচিত pathway-এর প্রথম অসম্পূর্ণ milestone। চাকরি বা দক্ষতার নিশ্চয়তা নয়।"
          : "Reason: the first unfinished milestone in your selected pathway. This is not a job or skill guarantee."}
      </p>
      {next?.prerequisite && (
        <p className="text-xs">
          {bn ? "আগের ধাপ" : "Previous prerequisite"}:{" "}
          {localize(next.prerequisite, lang)}
        </p>
      )}
      <p className="text-sm">
        {bn ? "Project practice" : "Project practice"}: {practice}
      </p>
      <label className="block text-sm">
        {bn ? "আপনার project-এর অবস্থা" : "Project status"}
        <Select
          aria-label={bn ? "আপনার project-এর অবস্থা" : "Project status"}
          value={project?.status || "planned"}
          disabled={busy}
          onChange={(e) => void save("project", path.id, e.target.value)}
        >
          {["planned", "started", "in_progress", "completed", "paused"].map(
            (s) => (
              <option value={s} key={s}>
                {s.replace("_", " ")}
              </option>
            ),
          )}
        </Select>
      </label>
      {!project && (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void save("project", path.id, "planned")}
        >
          {bn ? "নিজে project planned চিহ্নিত করুন" : "Mark project planned"}
        </Button>
      )}
      {project && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => void remove("project", path.id)}
        >
          {bn ? "Project record মুছুন" : "Remove project record"}
        </Button>
      )}
      <Link
        href={`/learn/visual-lab/${path.id === "frontend" ? "binary-search" : "sql-inner-join"}`}
        className="text-xs text-primary underline"
      >
        {bn
          ? "সংশ্লিষ্ট মৌলিক ধারণা practice"
          : "Practice a related foundation visually"}
      </Link>
      {error && <p role="alert">{error}</p>}
    </Card>
  );
}
