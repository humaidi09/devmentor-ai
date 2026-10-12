"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import type { VizStep, VizTopic } from "@/lib/visual/types";

import { ArrayRenderer } from "./array-renderer";
import { GraphRenderer } from "./graph-renderer";
import { JoinRenderer } from "./join-renderer";

export function StepPlayer({ topic }: { topic: VizTopic }) {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const steps = topic.steps;
  const last = steps.length - 1;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showText, setShowText] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((prev) => (prev >= last ? prev : prev + 1));
    }, 1100 / speed);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speed, last]);

  useEffect(() => {
    if (i >= last) setPlaying(false);
  }, [i, last]);

  const step: VizStep = steps[i];

  function renderStep(s: VizStep) {
    if (topic.kind === "array") return <ArrayRenderer step={s} />;
    if (topic.kind === "graph") return <GraphRenderer step={s} />;
    return <JoinRenderer step={s} />;
  }

  function togglePlay() {
    if (i >= last) {
      setI(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">{renderStep(step)}</Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label={bn ? "আগের ধাপ" : "Previous step"}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="sm" onClick={togglePlay} aria-label={playing ? (bn ? "থামান" : "Pause") : bn ? "চালান" : "Play"}>
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {playing ? (bn ? "থামান" : "Pause") : bn ? "চালান" : "Play"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setI((x) => Math.min(last, x + 1))} disabled={i >= last} aria-label={bn ? "পরের ধাপ" : "Next step"}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setI(0); setPlaying(false); }} aria-label={bn ? "রিসেট" : "Reset"}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {bn ? "রিসেট" : "Reset"}
          </Button>
          <Select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))} aria-label={bn ? "গতি" : "Speed"} className="h-9 w-auto text-xs">
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </Select>
          <button type="button" onClick={() => setShowText((s) => !s)} className="ml-auto text-xs font-medium text-primary hover:underline">
            {showText ? (bn ? "ভিজ্যুয়াল" : "Hide text steps") : bn ? "টেক্সট ধাপ দেখুন" : "Show steps as text"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">
            {bn ? "ধাপ" : "Step"} {i + 1}/{steps.length}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
        <p className="mt-3 text-sm" aria-live="polite">
          {step.explanation}
        </p>
      </Card>

      {showText && (
        <Card className="p-4">
          <ol className="space-y-1 text-xs">
            {steps.map((s, idx) => (
              <li key={idx} className={idx === i ? "font-semibold text-primary" : "text-muted-foreground"}>
                {idx + 1}. {s.explanation}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
