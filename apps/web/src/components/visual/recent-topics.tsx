"use client";
import Link from "next/link";
import { useLearningProgress } from "@/lib/learning-store";
import { recentVisual } from "@/lib/recommendations/learning";
import { getTopic } from "@/lib/visual/topics";
import { useLanguage } from "@/lib/i18n";
import { localize } from "@/lib/content-bn";
export function RecentTopics() {
  const { progress } = useLearningProgress(),
    { lang } = useLanguage(),
    rows = recentVisual(progress).filter((p) => getTopic(p.topic_key));
  if (!rows.length) return null;
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-2 font-bold">
        {lang === "bn"
          ? "নিজের সংরক্ষিত শেখা চালিয়ে যান"
          : "Continue your remembered learning"}
      </h2>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.topic_key}>
            <Link
              className="text-sm text-primary underline"
              href={`/learn/visual-lab/${p.topic_key}?step=${p.position}`}
            >
              {localize(getTopic(p.topic_key)!.title, lang)} ·{" "}
              {lang === "bn" ? "ধাপ" : "Step"} {p.position + 1}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
