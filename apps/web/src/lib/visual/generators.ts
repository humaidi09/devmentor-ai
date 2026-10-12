import type { TableData, VizStep } from "./types";

/** Deterministic step generators. Each returns an auditable list of frames so
 *  visuals and the text-steps fallback are always in sync. */

export function bubbleSort(input: number[]): VizStep[] {
  const a = [...input];
  const n = a.length;
  const sorted: number[] = [];
  const steps: VizStep[] = [];
  steps.push({
    array: [...a],
    sorted: [],
    explanation: "Bubble sort: compare each adjacent pair and swap if they are out of order.",
  });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const x = a[j];
      const y = a[j + 1];
      steps.push({ array: [...a], highlight: [j, j + 1], sorted: [...sorted], explanation: `Compare ${x} and ${y}.` });
      if (x > y) {
        a[j] = y;
        a[j + 1] = x;
        steps.push({ array: [...a], highlight: [j, j + 1], sorted: [...sorted], explanation: `${x} > ${y} → swap them.` });
      }
    }
    sorted.unshift(n - 1 - i);
    steps.push({ array: [...a], sorted: [...sorted], explanation: `Position ${n - 1 - i} is now locked in its final place.` });
  }
  steps.push({ array: [...a], sorted: a.map((_, k) => k), explanation: "Sorted — every element is in its final place." });
  return steps;
}

export function binarySearch(input: number[], target: number): VizStep[] {
  const a = [...input].sort((x, y) => x - y);
  const steps: VizStep[] = [];
  let lo = 0;
  let hi = a.length - 1;
  steps.push({ array: [...a], pointer: { lo, hi }, explanation: `Search for ${target} in a sorted array. Start with lo=${lo}, hi=${hi}.` });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], pointer: { lo, hi, mid }, highlight: [mid], explanation: `mid = ${mid}, value = ${a[mid]}.` });
    if (a[mid] === target) {
      steps.push({ array: [...a], pointer: { mid }, sorted: [mid], explanation: `Found ${target} at index ${mid}.` });
      return steps;
    }
    if (a[mid] < target) {
      lo = mid + 1;
      steps.push({ array: [...a], pointer: { lo, hi }, explanation: `${a[mid]} < ${target} → discard the left half. lo = ${lo}.` });
    } else {
      hi = mid - 1;
      steps.push({ array: [...a], pointer: { lo, hi }, explanation: `${a[mid]} > ${target} → discard the right half. hi = ${hi}.` });
    }
  }
  steps.push({ array: [...a], explanation: `${target} is not in the array.` });
  return steps;
}

function edgesOf(adj: Record<string, string[]>): [string, string][] {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const u of Object.keys(adj)) {
    for (const v of adj[u]) {
      const key = [u, v].sort().join("~");
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([u, v]);
      }
    }
  }
  return edges;
}

export function bfs(adj: Record<string, string[]>, start: string): VizStep[] {
  const nodes = Object.keys(adj);
  const edges = edgesOf(adj);
  const steps: VizStep[] = [];
  const visited: string[] = [];
  const order: string[] = [];
  const queue: string[] = [start];
  const enqueued = new Set<string>([start]);
  const base = { nodes, edges, frontierLabel: "Queue" };
  steps.push({ ...base, frontier: [...queue], visited: [], order: [], explanation: `Start BFS at ${start}. Enqueue ${start}.` });
  while (queue.length) {
    const u = queue.shift() as string;
    visited.push(u);
    order.push(u);
    steps.push({ ...base, current: u, frontier: [...queue], visited: [...visited], order: [...order], explanation: `Dequeue ${u} and mark it visited. Order: ${order.join(" → ")}.` });
    for (const v of adj[u]) {
      if (!enqueued.has(v)) {
        enqueued.add(v);
        queue.push(v);
        steps.push({ ...base, current: u, frontier: [...queue], visited: [...visited], order: [...order], explanation: `Discover ${v} from ${u} → enqueue it.` });
      }
    }
  }
  steps.push({ ...base, frontier: [], visited: [...visited], order: [...order], explanation: `BFS complete. Visiting order: ${order.join(" → ")}.` });
  return steps;
}

export function dfs(adj: Record<string, string[]>, start: string): VizStep[] {
  const nodes = Object.keys(adj);
  const edges = edgesOf(adj);
  const steps: VizStep[] = [];
  const visited: string[] = [];
  const order: string[] = [];
  const stack: string[] = [start];
  const base = { nodes, edges, frontierLabel: "Stack" };
  steps.push({ ...base, frontier: [...stack], visited: [], order: [], explanation: `Start DFS at ${start}. Push ${start}.` });
  while (stack.length) {
    const u = stack.pop() as string;
    if (visited.includes(u)) continue;
    visited.push(u);
    order.push(u);
    steps.push({ ...base, current: u, frontier: [...stack], visited: [...visited], order: [...order], explanation: `Pop ${u} and mark it visited. Order: ${order.join(" → ")}.` });
    const neighbors = [...adj[u]].reverse();
    for (const v of neighbors) {
      if (!visited.includes(v)) {
        stack.push(v);
        steps.push({ ...base, current: u, frontier: [...stack], visited: [...visited], order: [...order], explanation: `Push neighbour ${v} onto the stack.` });
      }
    }
  }
  steps.push({ ...base, frontier: [], visited: [...visited], order: [...order], explanation: `DFS complete. Visiting order: ${order.join(" → ")}.` });
  return steps;
}

export function innerJoin(): VizStep[] {
  const A: TableData = { name: "students", columns: ["id", "name"], rows: [[1, "Ava"], [2, "Ben"], [3, "Cara"]] };
  const B: TableData = { name: "enrollments", columns: ["student_id", "course"], rows: [[1, "CSE220"], [2, "CSE370"], [1, "CSE321"], [4, "CSE101"]] };
  const resultCols = ["id", "name", "course"];
  const steps: VizStep[] = [];
  const resultRows: (string | number)[][] = [];
  const result = () => ({ name: "result", columns: resultCols, rows: resultRows.map((r) => [...r]) });
  steps.push({ tableA: A, tableB: B, result: result(), explanation: "INNER JOIN students and enrollments ON students.id = enrollments.student_id — keep only matching pairs." });
  for (let i = 0; i < A.rows.length; i++) {
    for (let j = 0; j < B.rows.length; j++) {
      const match = A.rows[i][0] === B.rows[j][0];
      steps.push({ tableA: A, tableB: B, result: result(), matchRows: [{ a: i, b: j }], explanation: `Compare students.id = ${A.rows[i][0]} with enrollments.student_id = ${B.rows[j][0]} → ${match ? "match ✓" : "no match"}.` });
      if (match) {
        resultRows.push([A.rows[i][0], A.rows[i][1], B.rows[j][1]]);
        steps.push({ tableA: A, tableB: B, result: result(), matchRows: [{ a: i, b: j }], explanation: `Match → add (${A.rows[i][1]}, ${B.rows[j][1]}) to the result.` });
      }
    }
  }
  steps.push({ tableA: A, tableB: B, result: result(), explanation: `Done — ${resultRows.length} rows match. Rows with no match on either side (id 3 and id 4) are excluded.` });
  return steps;
}
