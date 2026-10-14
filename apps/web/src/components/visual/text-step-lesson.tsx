"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { binarySearch, bubbleSort } from "@/lib/visual/generators";
import type { VizTopic } from "@/lib/visual/types";

import { ProgressControls } from "./progress-controls";

export function TextStepLesson({ topic }: { topic: VizTopic }) {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [steps, setSteps] = useState(topic.steps);
  const [position, setPosition] = useState(0);
  const [values, setValues] = useState((topic.steps[0].array ?? []).join(", "));
  const [target, setTarget] = useState("7");
  const [error, setError] = useState("");

  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("step"));
    if (Number.isInteger(requested) && requested >= 0 && requested < topic.steps.length) {
      setPosition(requested);
    }
  }, [topic.id, topic.steps.length]);

  return (
    <section className="space-y-4" aria-labelledby="all-steps-heading">
      {(topic.id === "bubble-sort" || topic.id === "binary-search") && (
        <Card className="p-4 sm:p-5">
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const parts = values.split(",").map((value) => value.trim());
            const numbers = parts.map(Number);
            if (!parts.length || parts.length > 12 || parts.some((part) => !part) ||
              numbers.some((number) => !Number.isFinite(number)) ||
              (topic.id === "binary-search" && (!target.trim() || !Number.isFinite(Number(target))))) {
              setError(bn ? "কমা দিয়ে আলাদা করা ১–১২টি সংখ্যা ও বৈধ লক্ষ্য দিন।" : "Enter 1–12 finite numbers and a valid target.");
              return;
            }
            setSteps(topic.id === "binary-search" ? binarySearch(numbers, Number(target)) : bubbleSort(numbers));
            setPosition(0);
            setError("");
          }}>
            <label htmlFor="viz-input" className="block text-sm font-medium">{bn ? "সংখ্যা (কমা দিয়ে আলাদা করুন)" : "Numbers (comma-separated)"}</label>
            <Input id="viz-input" value={values} onChange={(event) => setValues(event.target.value)} aria-invalid={!!error} aria-describedby={error ? "viz-error" : undefined} />
            {topic.id === "binary-search" && <div className="space-y-2"><label htmlFor="viz-target" className="block text-sm font-medium">{bn ? "লক্ষ্য" : "Target"}</label><Input id="viz-target" value={target} onChange={(event) => setTarget(event.target.value)} /></div>}
            <Button type="submit" variant="secondary">{bn ? "উদাহরণ বদলান" : "Apply example"}</Button>
            {error && <p id="viz-error" role="alert" className="text-sm text-destructive">{error}</p>}
          </form>
        </Card>
      )}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="all-steps-heading" className="flex items-center gap-2 text-lg font-bold"><ListOrdered className="h-5 w-5 text-primary" aria-hidden />{bn ? "শুরু থেকে শেষ: সব ধাপ" : "Every step, from start to finish"}</h2>
          <span className="text-xs text-muted-foreground">{bn ? `মোট ${steps.length}টি ধাপ` : `${steps.length} steps in total`}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{bn ? "পুরো সমাধান একসঙ্গে পড়ুন। অগ্রগতি রাখতে যে ধাপে আছেন সেটি বেছে নিন।" : "Read the complete walkthrough at once. Select a step only if you want to remember your place."}</p>
        <ol id="text-steps" className="mt-5 space-y-2">
          {steps.map((step, index) => (
            <li key={index}>
              <button type="button" onClick={() => setPosition(index)} aria-current={index === position ? "step" : undefined} className={`flex w-full gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === position ? "border-primary/50 bg-primary/5" : "border-border bg-background/60 hover:border-primary/30"}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
                <span className="min-w-0 pt-1 text-sm leading-relaxed">{bn ? step.explanationBn : step.explanation}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <Button size="sm" variant="secondary" onClick={() => setPosition((current) => Math.max(0, current - 1))} disabled={position === 0} aria-label={bn ? "আগের ধাপ" : "Previous step"}><ChevronLeft className="h-4 w-4" aria-hidden /></Button>
          <span className="text-sm font-medium" aria-live="polite">{bn ? "ধাপ" : "Step"} {position + 1}/{steps.length}</span>
          <Button size="sm" variant="secondary" onClick={() => setPosition((current) => Math.min(steps.length - 1, current + 1))} disabled={position === steps.length - 1} aria-label={bn ? "পরের ধাপ" : "Next step"}><ChevronRight className="h-4 w-4" aria-hidden /></Button>
        </div>
      </Card>
      <ProgressControls topic={topic.id} position={position} />
    </section>
  );
}
