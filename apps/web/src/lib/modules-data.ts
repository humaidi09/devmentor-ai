// Demo data + types for the optional learning modules (Academic Study,
// Developer Path, CP Coach). All fictional/sample content for demo mode.

// ---- Academic Study ----
export interface Course {
  id: string;
  code: string;
  name: string;
}
export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  due: string;
}
export interface StudyTask {
  id: string;
  title: string;
  done: boolean;
  aiSuggested?: boolean;
}

export const DEMO_COURSES: Course[] = [
  { id: "c1", code: "CSE220", name: "Data Structures" },
  { id: "c2", code: "CSE370", name: "Database Systems" },
  { id: "c3", code: "CSE321", name: "Operating Systems" },
];

export const DEMO_DEADLINES: Deadline[] = [
  { id: "d1", courseId: "c1", title: "Assignment 3: Trees", due: "2026-10-20" },
  { id: "d2", courseId: "c2", title: "ER diagram project", due: "2026-10-25" },
  { id: "d3", courseId: "c3", title: "Midterm exam", due: "2026-11-02" },
];

export const DEMO_STUDY_TASKS: StudyTask[] = [
  { id: "t1", title: "Revise binary search trees", done: false },
  { id: "t2", title: "Practice 5 SQL JOIN queries", done: false, aiSuggested: true },
  { id: "t3", title: "Read OS scheduling chapter", done: true },
];

// ---- Developer Path ----
export interface Pathway {
  id: string;
  name: string;
  nameBn: string;
  summary: string;
  milestones: string[];
}
export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
}

export const DEMO_PATHWAYS: Pathway[] = [
  {
    id: "frontend",
    name: "Frontend",
    nameBn: "ফ্রন্টএন্ড",
    summary: "Build accessible, responsive user interfaces for the web.",
    milestones: [
      "HTML & CSS fundamentals",
      "JavaScript & the DOM",
      "A framework (React / Next.js)",
      "State & data fetching",
      "Accessibility & testing",
      "Ship a portfolio project",
    ],
  },
  {
    id: "backend",
    name: "Backend",
    nameBn: "ব্যাকএন্ড",
    summary: "Build APIs, data models, and server-side logic.",
    milestones: [
      "A language (Python / Node.js)",
      "HTTP & REST APIs",
      "Databases & SQL",
      "Auth & security basics",
      "Testing & deployment",
      "Ship an API project",
    ],
  },
  {
    id: "fullstack",
    name: "Full-stack",
    nameBn: "ফুল-স্ট্যাক",
    summary: "Connect frontend and backend into one working product.",
    milestones: [
      "Frontend basics",
      "Backend basics",
      "Connecting the two",
      "Database design",
      "Deployment & CI",
      "Ship a full-stack app",
    ],
  },
];

export const DEMO_SNIPPETS: Snippet[] = [
  {
    id: "s1",
    title: "Debounce",
    language: "javascript",
    code: "function debounce(fn, ms) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}",
  },
  {
    id: "s2",
    title: "Binary search",
    language: "python",
    code: "def binary_search(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
  },
  {
    id: "s3",
    title: "Typed fetch JSON",
    language: "typescript",
    code: "async function getJSON<T>(url: string): Promise<T> {\n  const r = await fetch(url);\n  if (!r.ok) throw new Error(String(r.status));\n  return (await r.json()) as T;\n}",
  },
];

// ---- CP Coach ----
export type CPStatus = "none" | "attempted" | "solved" | "skipped";
export interface CPProblem {
  id: string;
  name: string;
  rating: number;
  tags: string[];
  url: string;
  hint: string;
}

export const DEMO_CP_PROBLEMS: CPProblem[] = [
  {
    id: "p1",
    name: "Watermelon",
    rating: 800,
    tags: ["math", "brute force"],
    url: "https://codeforces.com/problemset/problem/4/A",
    hint: "Any even number greater than 2 can be split into two positive even parts. What does that tell you?",
  },
  {
    id: "p2",
    name: "Theatre Square",
    rating: 1000,
    tags: ["math"],
    url: "https://codeforces.com/problemset/problem/1/A",
    hint: "Use ceiling division along each dimension, then multiply the two counts.",
  },
  {
    id: "p3",
    name: "Way Too Long Words",
    rating: 800,
    tags: ["strings"],
    url: "https://codeforces.com/problemset/problem/71/A",
    hint: "If a word's length is greater than 10, abbreviate as first letter + (length - 2) + last letter.",
  },
  {
    id: "p4",
    name: "Next Round",
    rating: 800,
    tags: ["implementation"],
    url: "https://codeforces.com/problemset/problem/158/A",
    hint: "Count how many scores are greater than zero AND at least the k-th place score.",
  },
];
