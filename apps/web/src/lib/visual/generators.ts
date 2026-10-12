import type { TableData, VizStep } from "./types";

/** Deterministic step generators. Each returns an auditable list of frames so
 *  visuals and the text-steps fallback are always in sync. */

export function bubbleSort(input: number[]): VizStep[] {
  validateArray(input);
  const a = [...input];
  const n = a.length;
  const sorted: number[] = [];
  const steps: VizStep[] = [];
  steps.push({
    array: [...a],
    sorted: [],
    explanationBn: "বাবল সর্ট: পাশাপাশি দুটি উপাদান তুলনা করুন। ভুল ক্রমে থাকলে স্থান বদলান।", explanation: "Bubble sort: compare each adjacent pair and swap if they are out of order.",
  });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const x = a[j];
      const y = a[j + 1];
      steps.push({ array: [...a], highlight: [j, j + 1], sorted: [...sorted], explanationBn: `${x} ও ${y} তুলনা করুন।`, explanation: `Compare ${x} and ${y}.` });
      if (x > y) {
        a[j] = y;
        a[j + 1] = x;
        steps.push({ array: [...a], highlight: [j, j + 1], sorted: [...sorted], explanationBn: `${x} > ${y} → তাদের স্থান বদলান।`, explanation: `${x} > ${y} → swap them.` });
      }
    }
    sorted.unshift(n - 1 - i);
    steps.push({ array: [...a], sorted: [...sorted], explanationBn: `${n - 1 - i} নম্বর অবস্থানের উপাদান এখন তার চূড়ান্ত স্থানে আছে।`, explanation: `Position ${n - 1 - i} is now locked in its final place.` });
  }
  steps.push({ array: [...a], sorted: a.map((_, k) => k), explanationBn: "সাজানো শেষ — প্রতিটি উপাদান তার চূড়ান্ত স্থানে আছে।", explanation: "Sorted — every element is in its final place." });
  return steps;
}

export function binarySearch(input: number[], target: number): VizStep[] {
  validateArray(input);
  if (!Number.isFinite(target)) throw new Error("Target must be finite");
  const a = [...input].sort((x, y) => x - y);
  const steps: VizStep[] = [];
  let lo = 0;
  let hi = a.length - 1;
  steps.push({ array: [...a], pointer: { lo, hi }, explanationBn: `সাজানো অ্যারেতে ${target} খুঁজুন। শুরুতে lo=${lo}, hi=${hi}।`, explanation: `Search for ${target} in a sorted array. Start with lo=${lo}, hi=${hi}.` });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], pointer: { lo, hi, mid }, highlight: [mid], explanationBn: `মাঝের অবস্থান mid=${mid}, মান=${a[mid]}।`, explanation: `mid = ${mid}, value = ${a[mid]}.` });
    if (a[mid] === target) {
      steps.push({ array: [...a], pointer: { mid }, sorted: [mid], explanationBn: `${mid} নম্বর ইনডেক্সে ${target} পাওয়া গেছে।`, explanation: `Found ${target} at index ${mid}.` });
      return steps;
    }
    if (a[mid] < target) {
      lo = mid + 1;
      steps.push({ array: [...a], pointer: { lo, hi }, explanationBn: `${a[mid]} < ${target} → বাঁয়ের অর্ধেক বাদ দিন। lo=${lo}।`, explanation: `${a[mid]} < ${target} → discard the left half. lo = ${lo}.` });
    } else {
      hi = mid - 1;
      steps.push({ array: [...a], pointer: { lo, hi }, explanationBn: `${a[mid]} > ${target} → ডানের অর্ধেক বাদ দিন। hi=${hi}।`, explanation: `${a[mid]} > ${target} → discard the right half. hi = ${hi}.` });
    }
  }
  steps.push({ array: [...a], explanationBn: `অ্যারেতে ${target} নেই।`, explanation: `${target} is not in the array.` });
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
  validateGraph(adj, start);
  const nodes = Object.keys(adj);
  const edges = edgesOf(adj);
  const steps: VizStep[] = [];
  const visited: string[] = [];
  const order: string[] = [];
  const queue: string[] = [start];
  const enqueued = new Set<string>([start]);
  const base = { nodes, edges, frontierLabel: "Queue" };
  steps.push({ ...base, frontier: [...queue], visited: [], order: [], explanationBn: `${start} থেকে BFS শুরু করুন। ${start}-কে কিউতে রাখুন।`, explanation: `Start BFS at ${start}. Enqueue ${start}.` });
  while (queue.length) {
    const u = queue.shift() as string;
    visited.push(u);
    order.push(u);
    steps.push({ ...base, current: u, frontier: [...queue], visited: [...visited], order: [...order], explanationBn: `কিউ থেকে ${u} বের করে পরিদর্শিত চিহ্ন দিন। ক্রম: ${order.join(" → ")}।`, explanation: `Dequeue ${u} and mark it visited. Order: ${order.join(" → ")}.` });
    for (const v of adj[u]) {
      if (!enqueued.has(v)) {
        enqueued.add(v);
        queue.push(v);
        steps.push({ ...base, current: u, frontier: [...queue], visited: [...visited], order: [...order], explanationBn: `${u} থেকে ${v} পাওয়া গেল → কিউতে যোগ করুন।`, explanation: `Discover ${v} from ${u} → enqueue it.` });
      }
    }
  }
  steps.push({ ...base, frontier: [], visited: [...visited], order: [...order], explanationBn: `BFS শেষ। পরিদর্শনের ক্রম: ${order.join(" → ")}।`, explanation: `BFS complete. Visiting order: ${order.join(" → ")}.` });
  return steps;
}

export function dfs(adj: Record<string, string[]>, start: string): VizStep[] {
  validateGraph(adj, start);
  const nodes = Object.keys(adj);
  const edges = edgesOf(adj);
  const steps: VizStep[] = [];
  const visited: string[] = [];
  const order: string[] = [];
  const stack: string[] = [start];
  const base = { nodes, edges, frontierLabel: "Stack" };
  steps.push({ ...base, frontier: [...stack], visited: [], order: [], explanationBn: `${start} থেকে DFS শুরু করুন। ${start}-কে স্ট্যাকে রাখুন।`, explanation: `Start DFS at ${start}. Push ${start}.` });
  while (stack.length) {
    const u = stack.pop() as string;
    if (visited.includes(u)) continue;
    visited.push(u);
    order.push(u);
    steps.push({ ...base, current: u, frontier: [...stack], visited: [...visited], order: [...order], explanationBn: `স্ট্যাক থেকে ${u} বের করে পরিদর্শিত চিহ্ন দিন। ক্রম: ${order.join(" → ")}।`, explanation: `Pop ${u} and mark it visited. Order: ${order.join(" → ")}.` });
    const neighbors = [...adj[u]].reverse();
    for (const v of neighbors) {
      if (!visited.includes(v)) {
        stack.push(v);
        steps.push({ ...base, current: u, frontier: [...stack], visited: [...visited], order: [...order], explanationBn: `পাশের নোড ${v}-কে স্ট্যাকে রাখুন।`, explanation: `Push neighbour ${v} onto the stack.` });
      }
    }
  }
  steps.push({ ...base, frontier: [], visited: [...visited], order: [...order], explanationBn: `DFS শেষ। পরিদর্শনের ক্রম: ${order.join(" → ")}।`, explanation: `DFS complete. Visiting order: ${order.join(" → ")}.` });
  return steps;
}

export function innerJoin(): VizStep[] {
  const A: TableData = { name: "students", columns: ["id", "name"], rows: [[1, "Ava"], [2, "Ben"], [3, "Cara"]] };
  const B: TableData = { name: "enrollments", columns: ["student_id", "course"], rows: [[1, "CSE220"], [2, "CSE370"], [1, "CSE321"], [4, "CSE101"]] };
  const resultCols = ["id", "name", "course"];
  const steps: VizStep[] = [];
  const resultRows: (string | number)[][] = [];
  const result = () => ({ name: "result", columns: resultCols, rows: resultRows.map((r) => [...r]) });
  steps.push({ tableA: A, tableB: B, result: result(), explanationBn: "students.id = enrollments.student_id শর্তে INNER JOIN করুন — শুধু মিলে যাওয়া জোড়া রাখুন।", explanation: "INNER JOIN students and enrollments ON students.id = enrollments.student_id — keep only matching pairs." });
  for (let i = 0; i < A.rows.length; i++) {
    for (let j = 0; j < B.rows.length; j++) {
      const match = A.rows[i][0] === B.rows[j][0];
      steps.push({ tableA: A, tableB: B, result: result(), matchRows: [{ a: i, b: j }], explanationBn: `students.id=${A.rows[i][0]} ও enrollments.student_id=${B.rows[j][0]} তুলনা করুন → ${match ? "মিলেছে ✓" : "মেলেনি"}।`, explanation: `Compare students.id = ${A.rows[i][0]} with enrollments.student_id = ${B.rows[j][0]} → ${match ? "match ✓" : "no match"}.` });
      if (match) {
        resultRows.push([A.rows[i][0], A.rows[i][1], B.rows[j][1]]);
        steps.push({ tableA: A, tableB: B, result: result(), matchRows: [{ a: i, b: j }], explanationBn: `মিলেছে → ফলাফলে (${A.rows[i][1]}, ${B.rows[j][1]}) যোগ করুন।`, explanation: `Match → add (${A.rows[i][1]}, ${B.rows[j][1]}) to the result.` });
      }
    }
  }
  steps.push({ tableA: A, tableB: B, result: result(), explanationBn: `শেষ — ${resultRows.length}টি সারি মিলেছে। কোনো জোড়া না পাওয়া সারিগুলো (id 3 ও id 4) বাদ গেছে।`, explanation: `Done — ${resultRows.length} rows match. Rows with no match on either side (id 3 and id 4) are excluded.` });
  return steps;
}


function validateArray(input: number[]) {
  if (input.length > 40 || input.some(n => !Number.isFinite(n))) throw new Error("Use at most 40 finite numbers");
}
function validateGraph(adj: Record<string, string[]>, start: string) {
  const keys = Object.keys(adj);
  if (keys.length > 40 || !keys.includes(start) || keys.some(k => !Array.isArray(adj[k]) || adj[k].some(v => !keys.includes(v)))) throw new Error("Every node and the start must be in the graph");
}

/** A fixed educational example: (student_id, course_id) determines enrollment;
 * student_id determines name/department, and department_id determines its name. */
export function normalization(): VizStep[] {
  const enrollments: TableData = { name: "enrollments", columns: ["student_id", "course_id"], rows: [[1, "CSE220"], [1, "CSE370"], [2, "CSE220"]] };
  return [
    { tables: [{ name: "UNF", columns: ["student_id", "student", "department_id", "department", "courses"], rows: [[1,"Ava","D1","Computing","CSE220, CSE370"],[2,"Ben","D1","Computing","CSE220"]] }], explanation: "UNF: the courses cell contains a repeating group. A single cell holds multiple course values.", explanationBn: "UNF: courses ঘরে একাধিক কোর্স আছে। একটি ঘরে একাধিক মান রাখা হয়েছে।" },
    { tables: [{ name: "1NF", columns: ["student_id", "course_id", "student", "department_id", "department"], rows: [[1,"CSE220","Ava","D1","Computing"],[1,"CSE370","Ava","D1","Computing"],[2,"CSE220","Ben","D1","Computing"]] }], explanation: "1NF: one value per cell. The composite key is (student_id, course_id), but student details depend only on student_id.", explanationBn: "1NF: প্রতি ঘরে একটি মান। যৌগিক কী (student_id, course_id), কিন্তু শিক্ষার্থীর তথ্য শুধু student_id-এর ওপর নির্ভরশীল।" },
    { tables: [{ name: "students_2NF", columns: ["student_id", "student", "department_id", "department"], rows: [[1,"Ava","D1","Computing"],[2,"Ben","D1","Computing"]] }, enrollments], explanation: "2NF: separate student details from enrollments to remove partial dependency. Department name still depends on department_id through student_id.", explanationBn: "2NF: আংশিক নির্ভরতা সরাতে শিক্ষার্থীর তথ্য ও ভর্তি আলাদা করুন। বিভাগের নাম এখনও student_id থেকে department_id-এর মাধ্যমে নির্ভর করে।" },
    { tables: [{ name: "students", columns: ["student_id", "student", "department_id"], rows: [[1,"Ava","D1"],[2,"Ben","D1"]] }, enrollments, { name: "departments", columns: ["department_id", "department"], rows: [["D1","Computing"]] }], explanation: "3NF: keep department names in departments. No partial or transitive dependency remains in this example. Join the keys to reconstruct the original enrollments without losing information.", explanationBn: "3NF: বিভাগের নাম departments টেবিলে রাখুন। এই উদাহরণে আংশিক বা পরোক্ষ নির্ভরতা আর নেই। কী দিয়ে JOIN করে কোনো তথ্য না হারিয়ে মূল ভর্তির তথ্য পাওয়া যাবে।" },
  ];
}
