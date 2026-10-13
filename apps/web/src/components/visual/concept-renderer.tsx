"use client";

import type { VizStep } from "@/lib/visual/types";
import { useLanguage } from "@/lib/i18n";

function positions(layout: NonNullable<VizStep["scene"]>["layout"], count: number) {
  if (layout === "trie") return [[50, 12], [50, 34], [50, 56], [28, 82], [72, 82]];
  if (layout === "graph") return [[18, 50], [42, 18], [73, 27], [73, 73], [42, 82]];
  if (layout === "tree") return [[50, 13], [26, 43], [74, 43], [12, 77], [39, 77], [88, 77]];
  if (layout === "stack") return Array.from({ length: count }, (_, index) => [50, 80 - index * (60 / Math.max(count - 1, 1))]);
  return Array.from({ length: count }, (_, index) => [12 + index * (76 / Math.max(count - 1, 1)), 50]);
}

export function ConceptRenderer({ step }: { step: VizStep }) {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const scene = step.scene;
  if (!scene) return null;
  const xy = positions(scene.layout, scene.labels.length);
  const active = new Set(scene.active);
  const completed = new Set(scene.completed);
  return (
    <div className="concept-stage overflow-hidden rounded-2xl border border-border p-3 sm:p-6">
      <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <span>{bn ? "ধারণার অ্যানিমেশন" : "Concept animation"}</span>
        <span className="inline-flex items-center gap-1.5 text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bn ? "ধাপ" : "Frame"}</span>
      </div>
      <div className="relative mx-auto mt-4 h-56 max-w-2xl sm:h-64" role="img" aria-label={`${bn ? "চিত্র" : "Diagram"}: ${scene.labels.join(", ")}. ${bn ? "সক্রিয়" : "Active"}: ${scene.active.map((index) => scene.labels[index]).join(", ")}`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {scene.links.map(([from, to], index) => {
            const highlighted = active.has(from) && active.has(to);
            return <line key={index} x1={xy[from][0]} y1={xy[from][1]} x2={xy[to][0]} y2={xy[to][1]} stroke={highlighted ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth={highlighted ? 0.7 : 0.45} strokeDasharray={highlighted ? undefined : "1.2 0.9"} className="concept-link" />;
          })}
        </svg>
        {scene.labels.map((label, index) => (
          <div
            key={index}
            className="concept-node absolute grid min-h-12 w-[4.1rem] place-items-center rounded-xl border px-1 py-2 text-center text-[11px] font-bold leading-tight sm:min-h-14 sm:w-[5.5rem] sm:text-xs"
            data-active={active.has(index)}
            data-complete={completed.has(index)}
            style={{ left: `${xy[index][0]}%`, top: `${xy[index][1]}%`, transform: "translate(-50%, -50%)" }}
          >
            {label}
          </div>
        ))}
      </div>
      {scene.result && <p className="concept-result mx-auto mt-2 w-fit rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">{scene.result}</p>}
    </div>
  );
}
