-- =====================================================================
-- DevMentor AI — built-in public snippet library seed (idempotent)
-- Run after migrations:  psql "$DATABASE_URL" -f supabase/seed.sql
-- or paste into the Supabase SQL editor.
-- owner_id is NULL => readable by every authenticated user (see RLS).
-- =====================================================================

delete from public.snippets where owner_id is null;

insert into public.snippets
  (owner_id, visibility, title, description, language, category, code, notes, tags) values

-- ---------------- Python ----------------
(null,'public','List comprehension with filter','Build a filtered, transformed list in one line.','python','Python',
$code$evens_squared = [n * n for n in range(10) if n % 2 == 0]
# [0, 4, 16, 36, 64]$code$,
$note$Readable for simple cases; a normal loop is clearer once logic grows.$note$,'["python","comprehension","list"]'),

(null,'public','Counter for frequencies','Count occurrences without manual bookkeeping.','python','Python',
$code$from collections import Counter

freq = Counter("banana")
print(freq.most_common(1))  # [('a', 3)]$code$,
$note$Counter returns 0 for missing keys instead of raising KeyError.$note$,'["python","collections","counter"]'),

(null,'public','defaultdict for grouping','Group items without checking if the key exists.','python','Python',
$code$from collections import defaultdict

groups = defaultdict(list)
for name in ["ann", "bob", "amy"]:
    groups[name[0]].append(name)
# {'a': ['ann', 'amy'], 'b': ['bob']}$code$,
$note$Accessing a missing key creates it; wrap in dict() if that surprises callers.$note$,'["python","collections","grouping"]'),

(null,'public','Read a file with pathlib','Modern, cross-platform file reading.','python','Python',
$code$from pathlib import Path

text = Path("data.txt").read_text(encoding="utf-8")
lines = text.splitlines()$code$,
$note$read_text loads the whole file into memory; stream large files line by line.$note$,'["python","pathlib","files"]'),

(null,'public','Dataclass','Concise classes for holding data.','python','Python',
$code$from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0

p = Point(1, 2)$code$,
$note$Use field(default_factory=list) for mutable defaults, never a bare [].$note$,'["python","dataclass","oop"]'),

-- ---------------- JavaScript / TypeScript ----------------
(null,'public','map / filter / reduce','Transform, select, and fold an array.','javascript','JavaScript / TypeScript',
$code$const nums = [1, 2, 3, 4];
const doubledEvens = nums.filter(n => n % 2 === 0).map(n => n * 2);
const sum = nums.reduce((acc, n) => acc + n, 0);$code$,
$note$Always give reduce an initial value to handle empty arrays safely.$note$,'["javascript","array","functional"]'),

(null,'public','Destructuring with defaults','Pull fields out of objects and arrays.','javascript','JavaScript / TypeScript',
$code$const { name = "guest", age } = user;
const [first, ...rest] = [1, 2, 3];$code$,
$note$Defaults only apply when the value is undefined, not null.$note$,'["javascript","destructuring","es6"]'),

(null,'public','async/await with try/catch','Await a promise and handle failure.','javascript','JavaScript / TypeScript',
$code$async function getUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed:", err);
    return null;
  }
}$code$,
$note$fetch only rejects on network errors — check res.ok for 4xx/5xx yourself.$note$,'["javascript","async","fetch"]'),

(null,'public','Promise.all for parallel work','Run async calls concurrently and wait for all.','javascript','JavaScript / TypeScript',
$code$const [users, posts] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json()),
]);$code$,
$note$Promise.all rejects as soon as one rejects; use Promise.allSettled to keep partial results.$note$,'["javascript","promise","parallel"]'),

(null,'public','TypeScript utility types','Reshape existing types without rewriting them.','typescript','JavaScript / TypeScript',
$code$interface User { id: string; name: string; email: string; }

type NewUser = Omit<User, "id">;
type UserPatch = Partial<User>;
type IdAndName = Pick<User, "id" | "name">;$code$,
$note$Partial makes every field optional — do not use it for required create payloads.$note$,'["typescript","types","utility"]'),

-- ---------------- React / Next.js ----------------
(null,'public','useState + useEffect','Local state plus a side effect that reacts to it.','tsx','React / Next.js',
$code$const [count, setCount] = useState(0);

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);$code$,
$note$Omitting the dependency array runs the effect after every render.$note$,'["react","hooks","useeffect"]'),

(null,'public','Custom hook (useLocalStorage)','Reusable stateful logic persisted to localStorage.','tsx','React / Next.js',
$code$function useLocalStorage(key: string, initial: string) {
  const [value, setValue] = useState(
    () => localStorage.getItem(key) ?? initial
  );
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue] as const;
}$code$,
$note$localStorage is unavailable during SSR — guard with typeof window !== "undefined".$note$,'["react","hooks","localstorage"]'),

(null,'public','useMemo for expensive values','Cache a computed value between renders.','tsx','React / Next.js',
$code$const sorted = useMemo(
  () => [...items].sort((a, b) => a.rank - b.rank),
  [items]
);$code$,
$note$Only memoize genuinely expensive work; needless useMemo adds complexity.$note$,'["react","hooks","usememo","performance"]'),

(null,'public','Next.js server component fetch','Fetch data on the server in the app router.','tsx','React / Next.js',
$code$// app/users/page.tsx (Server Component)
export default async function Page() {
  const res = await fetch("https://api.example.com/users", {
    next: { revalidate: 60 },
  });
  const users = await res.json();
  return <ul>{users.map((u: any) => <li key={u.id}>{u.name}</li>)}</ul>;
}$code$,
$note$Server components cannot use useState/useEffect; add "use client" for interactivity.$note$,'["react","nextjs","server-component"]'),

(null,'public','React Context','Share state without prop drilling.','tsx','React / Next.js',
$code$const ThemeCtx = createContext<"light" | "dark">("light");

export function useTheme() {
  return useContext(ThemeCtx);
}
// Wrap tree: <ThemeCtx.Provider value="dark">{children}</ThemeCtx.Provider>$code$,
$note$Every consumer re-renders when the context value changes — split large contexts.$note$,'["react","context","state"]'),

-- ---------------- Node.js / Express ----------------
(null,'public','Minimal Express server','A basic HTTP server with one route.','javascript','Node.js / Express',
$code$import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(3000, () => console.log("on :3000"));$code$,
$note$Call express.json() before your routes or req.body will be undefined.$note$,'["node","express","server"]'),

(null,'public','Express router + middleware','Group routes and run logic before handlers.','javascript','Node.js / Express',
$code$import { Router } from "express";
const router = Router();

function auth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end();
  next();
}

router.get("/me", auth, (req, res) => res.json({ user: "me" }));
export default router;$code$,
$note$Forgetting to call next() leaves the request hanging forever.$note$,'["node","express","middleware"]'),

(null,'public','Express error handler','Centralised error middleware with four args.','javascript','Node.js / Express',
$code$app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});$code$,
$note$Error middleware MUST declare all four params or Express treats it as normal middleware.$note$,'["node","express","error-handling"]'),

(null,'public','Async route wrapper','Forward async errors to the error handler.','javascript','Node.js / Express',
$code$const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get("/users", wrap(async (req, res) => {
  res.json(await db.users.findMany());
}));$code$,
$note$Without this, a rejected promise in an async handler is unhandled and never responds.$note$,'["node","express","async"]'),

(null,'public','Read environment variables','Load config from a .env file.','javascript','Node.js / Express',
$code$import "dotenv/config";

const port = process.env.PORT ?? "3000";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");$code$,
$note$Never commit .env; validate required vars at startup so failures are obvious.$note$,'["node","env","config"]'),

-- ---------------- FastAPI / Python backend ----------------
(null,'public','Minimal FastAPI app','Create an app and run it with uvicorn.','python','FastAPI / Python backend',
$code$from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
# run: uvicorn main:app --reload$code$,
$note$Interactive docs are auto-generated at /docs.$note$,'["fastapi","python","server"]'),

(null,'public','Pydantic request model','Validate and parse a JSON body.','python','FastAPI / Python backend',
$code$from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create(item: Item):
    return item$code$,
$note$Returning a model serialises it to JSON; invalid bodies get a 422 automatically.$note$,'["fastapi","pydantic","validation"]'),

(null,'public','Path and query parameters','Typed path and optional query params.','python','FastAPI / Python backend',
$code$@app.get("/items/{item_id}")
def read(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}$code$,
$note$Type hints drive parsing: item_id arrives as int, and bad values 422 before your code runs.$note$,'["fastapi","params","routing"]'),

(null,'public','FastAPI dependency injection','Reuse shared logic like auth via Depends.','python','FastAPI / Python backend',
$code$from fastapi import Depends, Header, HTTPException

def get_token(authorization: str = Header()):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    return authorization[7:]

@app.get("/me")
def me(token: str = Depends(get_token)):
    return {"token": token}$code$,
$note$Dependencies run per request and can themselves depend on other dependencies.$note$,'["fastapi","dependency-injection","auth"]'),

(null,'public','FastAPI background task','Run work after responding.','python','FastAPI / Python backend',
$code$from fastapi import BackgroundTasks

def write_log(msg: str):
    with open("log.txt", "a") as f:
        f.write(msg + "\n")

@app.post("/notify")
def notify(bg: BackgroundTasks):
    bg.add_task(write_log, "notified")
    return {"queued": True}$code$,
$note$Background tasks run in-process; use a real queue (not this) for heavy or long jobs.$note$,'["fastapi","background","async"]'),

-- ---------------- C++ STL & CP ----------------
(null,'public','Fast IO template','Speed up cin/cout for competitive programming.','cpp','C++ STL & CP',
$code$#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    return 0;
}$code$,
$note$After sync_with_stdio(false), do not mix printf/scanf with cin/cout.$note$,'["cpp","cp","fast-io"]'),

(null,'public','Sort with custom comparator','Sort structs by a chosen field.','cpp','C++ STL & CP',
$code$vector<pair<int,int>> v;
sort(v.begin(), v.end(), [](auto& a, auto& b) {
    return a.second < b.second;  // by second, ascending
});$code$,
$note$The comparator must be a strict weak ordering; using <= causes undefined behaviour.$note$,'["cpp","stl","sort"]'),

(null,'public','Binary search with lower_bound','Find the first element >= a target.','cpp','C++ STL & CP',
$code$vector<int> a = {1, 3, 5, 7};
int idx = lower_bound(a.begin(), a.end(), 5) - a.begin();  // 2
// upper_bound gives first element strictly greater$code$,
$note$The range must be sorted; lower_bound on unsorted data gives wrong results.$note$,'["cpp","stl","binary-search"]'),

(null,'public','Priority queue (min-heap)','Default is max-heap; invert for min-heap.','cpp','C++ STL & CP',
$code$priority_queue<int, vector<int>, greater<int>> pq;
pq.push(3); pq.push(1); pq.push(2);
int smallest = pq.top();  // 1$code$,
$note$Plain priority_queue<int> is a MAX-heap — easy to get backwards.$note$,'["cpp","stl","heap"]'),

(null,'public','Sieve of Eratosthenes','Precompute primes up to n.','cpp','C++ STL & CP',
$code$vector<bool> is_prime(n + 1, true);
is_prime[0] = is_prime[1] = false;
for (int i = 2; (long long)i * i <= n; i++)
    if (is_prime[i])
        for (int j = i * i; j <= n; j += i)
            is_prime[j] = false;$code$,
$note$Use i*i as a long long (or start j at i*i carefully) to avoid overflow for large n.$note$,'["cpp","cp","number-theory","sieve"]'),

-- ---------------- SQL ----------------
(null,'public','INNER JOIN','Combine rows that match in both tables.','sql','SQL',
$code$SELECT o.id, u.name, o.total
FROM orders o
INNER JOIN users u ON u.id = o.user_id;$code$,
$note$INNER JOIN drops rows with no match on either side.$note$,'["sql","join","query"]'),

(null,'public','LEFT JOIN','Keep all left rows, NULLs where no match.','sql','SQL',
$code$SELECT u.id, u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;$code$,
$note$Filtering the right table in WHERE silently turns a LEFT JOIN into an INNER JOIN — filter in ON.$note$,'["sql","join","left-join"]'),

(null,'public','GROUP BY with HAVING','Aggregate, then filter the groups.','sql','SQL',
$code$SELECT user_id, COUNT(*) AS orders
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;$code$,
$note$WHERE filters rows before grouping; HAVING filters after aggregation.$note$,'["sql","group-by","aggregate"]'),

(null,'public','CTE (WITH clause)','Name a subquery to keep queries readable.','sql','SQL',
$code$WITH recent AS (
  SELECT * FROM orders WHERE created_at > now() - interval '7 days'
)
SELECT user_id, COUNT(*) FROM recent GROUP BY user_id;$code$,
$note$CTEs aid readability; very large CTEs can be slower than a plain subquery in some engines.$note$,'["sql","cte","with"]'),

(null,'public','Window function ROW_NUMBER','Rank rows within partitions.','sql','SQL',
$code$SELECT name, dept,
  ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
FROM employees;$code$,
$note$ROW_NUMBER is always unique; use RANK/DENSE_RANK when ties should share a rank.$note$,'["sql","window","analytics"]'),

-- ---------------- Git ----------------
(null,'public','Undo last commit (keep changes)','Move HEAD back one commit, keep edits staged.','bash','Git',
$code$git reset --soft HEAD~1$code$,
$note$--soft keeps changes staged; --hard discards them permanently.$note$,'["git","undo","reset"]'),

(null,'public','Amend the last commit','Fix the message or add forgotten files.','bash','Git',
$code$git add forgotten_file.py
git commit --amend --no-edit$code$,
$note$Amending rewrites history — do not amend commits you have already pushed to a shared branch.$note$,'["git","amend","commit"]'),

(null,'public','Discard local changes to a file','Restore a file to the last commit.','bash','Git',
$code$git restore path/to/file   # modern
# or: git checkout -- path/to/file$code$,
$note$This is destructive — uncommitted edits to that file are gone for good.$note$,'["git","restore","discard"]'),

(null,'public','Stash work in progress','Shelve changes to switch branches cleanly.','bash','Git',
$code$git stash push -m "wip: parser"
git switch main
git stash pop$code$,
$note$stash pop can conflict; resolve like a merge, then the stash entry is dropped.$note$,'["git","stash","workflow"]'),

(null,'public','Recover a lost commit (reflog)','Find commits that are no longer on any branch.','bash','Git',
$code$git reflog
git checkout -b recovered <commit-sha>$code$,
$note$The reflog is local and expires (default 90 days); it is never pushed to a remote.$note$,'["git","reflog","recovery"]'),

-- ---------------- Docker & Deployment ----------------
(null,'public','Python Dockerfile','Slim image for a FastAPI/Python app.','dockerfile','Docker & Deployment',
$code$FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]$code$,
$note$Copy requirements.txt first so the pip layer is cached across code-only changes.$note$,'["docker","python","deployment"]'),

(null,'public','Node Dockerfile','Production image for a Node app.','dockerfile','Docker & Deployment',
$code$FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]$code$,
$note$Use npm ci (not npm install) in images for reproducible, lockfile-exact installs.$note$,'["docker","node","deployment"]'),

(null,'public','docker-compose (app + db)','Run an app alongside Postgres locally.','yaml','Docker & Deployment',
$code$services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]$code$,
$note$depends_on waits for the container to start, not for Postgres to be ready — add a healthcheck.$note$,'["docker","compose","postgres"]'),

(null,'public','Multi-stage build','Build in one stage, ship a small runtime image.','dockerfile','Docker & Deployment',
$code$FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]$code$,
$note$Only copy build artifacts into the final stage so dev dependencies never ship.$note$,'["docker","multi-stage","optimization"]'),

(null,'public','.dockerignore','Keep junk out of the build context.','bash','Docker & Deployment',
$code$node_modules
.git
.env
__pycache__
*.log$code$,
$note$Without this, a huge build context (e.g. node_modules) slows every docker build.$note$,'["docker","dockerignore","build"]'),

-- ---------------- Testing ----------------
(null,'public','pytest basic test','A plain assertion-based test.','python','Testing',
$code$def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5$code$,
$note$Files/functions must start with test_ for pytest to discover them.$note$,'["python","pytest","testing"]'),

(null,'public','pytest fixture + parametrize','Reusable setup and table-driven cases.','python','Testing',
$code$import pytest

@pytest.fixture
def numbers():
    return [1, 2, 3]

@pytest.mark.parametrize("a,b,expected", [(1, 2, 3), (0, 0, 0)])
def test_add(a, b, expected):
    assert a + b == expected$code$,
$note$Default fixture scope is 'function' (re-run per test); use scope='session' for expensive setup.$note$,'["python","pytest","fixtures"]'),

(null,'public','pytest.raises','Assert that code raises an exception.','python','Testing',
$code$import pytest

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        _ = 1 / 0$code$,
$note$Keep only the raising line inside the with-block so you test the right statement.$note$,'["python","pytest","exceptions"]'),

(null,'public','Vitest/Jest test','Unit test for a JS/TS function.','typescript','Testing',
$code$import { describe, it, expect } from "vitest";
import { add } from "./math";

describe("add", () => {
  it("sums two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});$code$,
$note$Use toEqual for deep object/array equality; toBe checks reference/primitive identity.$note$,'["javascript","vitest","jest","testing"]'),

(null,'public','React Testing Library','Render a component and assert on output.','tsx','Testing',
$code$import { render, screen } from "@testing-library/react";
import Greeting from "./Greeting";

test("shows name", () => {
  render(<Greeting name="Ada" />);
  expect(screen.getByText(/Ada/)).toBeInTheDocument();
});$code$,
$note$Query by accessible role/text, not test IDs, to test what users actually see.$note$,'["react","testing","rtl"]'),

-- ---------------- Design Patterns ----------------
(null,'public','Singleton (Python)','One shared instance across the app.','python','Design Patterns',
$code$class Config:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance$code$,
$note$Singletons are effectively global state and make testing harder — prefer dependency injection.$note$,'["design-patterns","singleton","python"]'),

(null,'public','Factory function','Create objects without hardcoding classes.','python','Design Patterns',
$code$def make_notifier(kind: str):
    return {"email": EmailNotifier, "sms": SmsNotifier}[kind]()

notifier = make_notifier("email")$code$,
$note$Factories centralise construction; keep the mapping small or it becomes a dumping ground.$note$,'["design-patterns","factory","creational"]'),

(null,'public','Strategy pattern','Swap an algorithm at runtime.','typescript','Design Patterns',
$code$type SortStrategy = (a: number, b: number) => number;

function sortWith(nums: number[], strategy: SortStrategy) {
  return [...nums].sort(strategy);
}
sortWith([3, 1, 2], (a, b) => a - b);$code$,
$note$In languages with first-class functions, a plain function is often all the "strategy" you need.$note$,'["design-patterns","strategy","behavioral"]'),

(null,'public','Observer pattern','Notify many listeners when state changes.','javascript','Design Patterns',
$code$class Emitter {
  listeners = [];
  on(fn) { this.listeners.push(fn); }
  emit(data) { this.listeners.forEach(fn => fn(data)); }
}$code$,
$note$Remove listeners you no longer need, or you will leak memory and double-handle events.$note$,'["design-patterns","observer","events"]'),

(null,'public','Dependency injection','Pass collaborators in instead of creating them.','python','Design Patterns',
$code$class Service:
    def __init__(self, repo):
        self.repo = repo  # injected, not constructed here

    def list_users(self):
        return self.repo.all()$code$,
$note$Injecting dependencies lets you pass a fake/mock repo in tests.$note$,'["design-patterns","dependency-injection","testing"]'),

-- ---------------- Error Handling & Debugging ----------------
(null,'public','try/except/finally','Handle errors and always clean up.','python','Error Handling & Debugging',
$code$try:
    f = open("data.txt")
    data = f.read()
except FileNotFoundError:
    data = ""
finally:
    f.close()$code$,
$note$Catch specific exceptions, not bare 'except:', which also swallows KeyboardInterrupt.$note$,'["python","error-handling","exceptions"]'),

(null,'public','Custom exception','Define a domain-specific error type.','python','Error Handling & Debugging',
$code$class PaymentError(Exception):
    """Raised when a payment cannot be processed."""

def charge(amount):
    if amount <= 0:
        raise PaymentError("amount must be positive")$code$,
$note$Subclass the most specific built-in that fits (e.g. ValueError) so callers can catch broadly.$note$,'["python","exceptions","custom"]'),

(null,'public','async try/catch (JS)','Handle errors from awaited calls.','javascript','Error Handling & Debugging',
$code$async function run() {
  try {
    const data = await risky();
    return data;
  } catch (err) {
    console.error("run failed:", err);
    throw err; // rethrow if callers must know
  }
}$code$,
$note$An unhandled promise rejection can crash Node — always catch or attach .catch().$note$,'["javascript","async","error-handling"]'),

(null,'public','Python logging setup','Structured logs instead of print().','python','Error Handling & Debugging',
$code$import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger(__name__)
log.info("started")$code$,
$note$Never log secrets or raw tokens; configure logging once at startup, not per module.$note$,'["python","logging","debugging"]'),

(null,'public','Retry with exponential backoff','Retry a flaky call with growing delays.','python','Error Handling & Debugging',
$code$import time

def retry(fn, attempts=3, base=0.5):
    for i in range(attempts):
        try:
            return fn()
        except Exception:
            if i == attempts - 1:
                raise
            time.sleep(base * 2 ** i)$code$,
$note$Only retry idempotent operations; retrying a non-idempotent write can duplicate effects.$note$,'["python","retry","resilience"]');
