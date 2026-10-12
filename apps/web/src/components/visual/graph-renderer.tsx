"use client";

import type { VizStep } from "@/lib/visual/types";

export function GraphRenderer({ step }: { step: VizStep }) {
  const nodes = step.nodes ?? [];
  const edges = step.edges ?? [];
  const visited = new Set(step.visited ?? []);
  const current = step.current;
  const n = Math.max(nodes.length, 1);
  const R = 90;
  const cx = 120;
  const cy = 120;
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach((id, k) => {
    const ang = (2 * Math.PI * k) / n - Math.PI / 2;
    pos[id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 240 240" className="h-56 w-56 max-w-full" role="img" aria-label="Graph visualization">
        {edges.map(([u, v], k) => (
          <line key={k} x1={pos[u]?.x} y1={pos[u]?.y} x2={pos[v]?.x} y2={pos[v]?.y} stroke="hsl(var(--border))" strokeWidth={2} />
        ))}
        {nodes.map((id) => {
          const isCur = id === current;
          const isVis = visited.has(id);
          const fill = isCur ? "hsl(var(--primary))" : isVis ? "hsl(var(--success))" : "hsl(var(--card))";
          const stroke = isCur ? "hsl(var(--primary))" : isVis ? "hsl(var(--success))" : "hsl(var(--border))";
          return (
            <g key={id}>
              <circle cx={pos[id].x} cy={pos[id].y} r={16} fill={fill} stroke={stroke} strokeWidth={2} />
              <text
                x={pos[id].x}
                y={pos[id].y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight="700"
                fill={isCur || isVis ? "#ffffff" : "hsl(var(--foreground))"}
              >
                {id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="w-full space-y-1 text-xs">
        <p>
          <span className="font-semibold">{step.frontierLabel ?? "Frontier"}:</span> [{(step.frontier ?? []).join(", ")}]
        </p>
        <p>
          <span className="font-semibold">Visited order:</span> {(step.order ?? []).join(" → ") || "—"}
        </p>
      </div>
    </div>
  );
}
