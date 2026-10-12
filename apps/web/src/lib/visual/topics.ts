import { bfs, binarySearch, bubbleSort, dfs, innerJoin } from "./generators";
import type { VizTopic } from "./types";

const GRAPH: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};

export const TOPICS: VizTopic[] = [
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    category: "DSA",
    kind: "array",
    summary: "Repeatedly swap adjacent out-of-order pairs until sorted.",
    steps: bubbleSort([5, 2, 8, 1, 9, 3]),
  },
  {
    id: "binary-search",
    title: "Binary Search",
    category: "DSA",
    kind: "array",
    summary: "Halve a sorted range each step to find a target fast.",
    steps: binarySearch([1, 3, 5, 7, 9, 11, 13], 7),
  },
  {
    id: "bfs",
    title: "Breadth-First Search",
    category: "Algorithms",
    kind: "graph",
    summary: "Explore a graph level by level using a queue.",
    steps: bfs(GRAPH, "A"),
  },
  {
    id: "dfs",
    title: "Depth-First Search",
    category: "Algorithms",
    kind: "graph",
    summary: "Explore as deep as possible first, using a stack.",
    steps: dfs(GRAPH, "A"),
  },
  {
    id: "sql-inner-join",
    title: "SQL INNER JOIN",
    category: "DBMS",
    kind: "join",
    summary: "Keep only the rows whose keys match in both tables.",
    steps: innerJoin(),
  },
];

export function getTopic(id: string): VizTopic | undefined {
  return TOPICS.find((t) => t.id === id);
}
