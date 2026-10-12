"use client";

import type { TableData, VizStep } from "@/lib/visual/types";
import { cn } from "@/lib/utils";

function Table({ data, highlight }: { data?: TableData; highlight?: Set<number> }) {
  if (!data) return null;
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="bg-muted px-3 py-1.5 font-mono text-xs font-semibold">{data.name}</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {data.columns.map((c) => (
              <th key={c} className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i} className={cn("border-b border-border last:border-0", highlight?.has(i) && "bg-primary/10")}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {data.rows.length === 0 && (
            <tr>
              <td colSpan={data.columns.length} className="px-3 py-3 text-center text-muted-foreground">
                (empty)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function JoinRenderer({ step }: { step: VizStep }) {
  const aHi = new Set((step.matchRows ?? []).map((m) => m.a));
  const bHi = new Set((step.matchRows ?? []).map((m) => m.b));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Table data={step.tableA} highlight={aHi} />
        <Table data={step.tableB} highlight={bHi} />
      </div>
      <Table data={step.result} />
    </div>
  );
}
