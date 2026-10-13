export interface TableData {
  name: string;
  columns: string[];
  rows: (string | number)[][];
}

/** One frame of a visualization. Fields are per-kind and all optional so the
 *  same shape drives array, graph, and table renderers. */
export interface VizStep {
  explanation: string;
  explanationBn: string;
  tables?: TableData[];

  // array topics (sort / search)
  array?: number[];
  highlight?: number[]; // indices being compared
  sorted?: number[]; // indices locked / found
  pointer?: Record<string, number>; // named pointers e.g. { lo, hi, mid }

  // graph topics (BFS / DFS)
  nodes?: string[];
  edges?: [string, string][];
  current?: string;
  visited?: string[];
  frontier?: string[]; // queue (BFS) or stack (DFS)
  frontierLabel?: string;
  order?: string[]; // traversal order so far

  // table topics (SQL JOIN)
  tableA?: TableData;
  tableB?: TableData;
  result?: TableData;
  matchRows?: { a: number; b: number }[];
}

export type VizKind = "array" | "graph" | "join";

export interface VizTopic {
  id: string;
  title: string;
  category: "DSA" | "Algorithms" | "DBMS";
  summary: string;
  kind: VizKind;
  steps: VizStep[];
}
