"use client";

import type { VizStep } from "@/lib/visual/types";
import { cn } from "@/lib/utils";

export function ArrayRenderer({ step }: { step: VizStep }) {
  const a = step.array ?? [];
  const hi = new Set(step.highlight ?? []);
  const sorted = new Set(step.sorted ?? []);
  const pointers = step.pointer ?? {};
  const pointersAt = (idx: number) =>
    Object.entries(pointers)
      .filter(([, v]) => v === idx)
      .map(([k]) => k);

  return (
    <div className="flex flex-wrap items-end justify-center gap-2">
      {a.map((v, idx) => {
        const ptr = pointersAt(idx);
        return (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="h-4 text-[10px] font-semibold uppercase text-primary">{ptr.join(" ")}</div>
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-md border text-sm font-bold transition-colors",
                sorted.has(idx)
                  ? "border-success bg-success/15 text-success"
                  : hi.has(idx)
                    ? "border-primary bg-primary/15 text-primary ring-2 ring-primary"
                    : "border-border bg-card",
              )}
            >
              {v}
            </div>
            <div className="text-[10px] text-muted-foreground">{idx}</div>
          </div>
        );
      })}
    </div>
  );
}
