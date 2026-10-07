"""Data access layer.

Routes and services talk to a small `Store` interface instead of
Supabase directly. Two implementations exist:

* SupabaseStore  — wraps a user-scoped Supabase client; RLS is enforced
                   by Postgres. Used when Supabase is configured.
* MemoryStore    — an in-process store seeded with demo fixtures so the
                   entire API runs with zero secrets (DEMO_MODE).

Filters are expressed as a list of (column, op, value) tuples where op is
one of: eq, neq, in, gte, lte, is.
"""
from __future__ import annotations

import copy
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Protocol

from .database import get_user_client
from .security import DEMO_USER_ID, AuthUser

Filter = tuple[str, str, Any]
Row = dict[str, Any]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# =====================================================================
# Store interface
# =====================================================================
class Store(Protocol):
    def select(
        self,
        table: str,
        *,
        filters: list[Filter] | None = None,
        order: str | None = None,
        desc: bool = False,
        limit: int | None = None,
        offset: int = 0,
        single: bool = False,
    ) -> Any: ...

    def insert(self, table: str, row: Row) -> Row: ...

    def update(self, table: str, filters: list[Filter], patch: Row) -> list[Row]: ...

    def delete(self, table: str, filters: list[Filter]) -> None: ...

    def search_snippets(
        self,
        *,
        user_id: str,
        q: str | None = None,
        language: str | None = None,
        category: str | None = None,
        tags: list[str] | None = None,
        visibility: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Row]: ...


# =====================================================================
# Supabase-backed store (RLS enforced by Postgres)
# =====================================================================
class SupabaseStore:
    def __init__(self, client: Any):
        self.client = client

    @staticmethod
    def _apply(query: Any, filters: list[Filter] | None) -> Any:
        for col, op, val in filters or []:
            if op == "eq":
                query = query.eq(col, val)
            elif op == "neq":
                query = query.neq(col, val)
            elif op == "in":
                query = query.in_(col, val)
            elif op == "gte":
                query = query.gte(col, val)
            elif op == "lte":
                query = query.lte(col, val)
            elif op == "is":
                query = query.is_(col, val)
            else:  # pragma: no cover
                raise ValueError(f"Unsupported filter op: {op}")
        return query

    def select(self, table, *, filters=None, order=None, desc=False, limit=None, offset=0, single=False):
        query = self._apply(self.client.table(table).select("*"), filters)
        if order:
            query = query.order(order, desc=desc)
        if limit is not None:
            query = query.range(offset, offset + limit - 1)
        data = query.execute().data or []
        if single:
            return data[0] if data else None
        return data

    def insert(self, table, row):
        data = self.client.table(table).insert(row).execute().data or []
        return data[0] if data else row

    def update(self, table, filters, patch):
        query = self._apply(self.client.table(table).update(patch), filters)
        return query.execute().data or []

    def delete(self, table, filters):
        self._apply(self.client.table(table).delete(), filters).execute()

    def search_snippets(self, *, user_id, q=None, language=None, category=None,
                        tags=None, visibility=None, limit=20, offset=0):
        query = self.client.table("snippets").select("*")
        if language:
            query = query.eq("language", language)
        if category:
            query = query.eq("category", category)
        if visibility == "public":
            query = query.eq("visibility", "public")
        elif visibility == "private":
            query = query.eq("owner_id", user_id)
        if tags:
            query = query.contains("tags", tags)
        if q:
            query = query.text_search(
                "search_tsv", q, options={"type": "websearch", "config": "english"}
            )
        query = query.order("usage_count", desc=True).range(offset, offset + limit - 1)
        return query.execute().data or []


# =====================================================================
# In-memory store (demo mode)
# =====================================================================
class MemoryStore:
    def __init__(self, data: dict[str, list[Row]]):
        self._data = data
        self._lock = threading.RLock()

    @staticmethod
    def _match(row: Row, filters: list[Filter] | None) -> bool:
        for col, op, val in filters or []:
            cell = row.get(col)
            if op == "eq" and cell != val:
                return False
            if op == "neq" and cell == val:
                return False
            if op == "in" and cell not in val:
                return False
            if op == "gte" and (cell is None or cell < val):
                return False
            if op == "lte" and (cell is None or cell > val):
                return False
            if op == "is" and cell is not val and cell != val:
                return False
        return True

    def select(self, table, *, filters=None, order=None, desc=False, limit=None, offset=0, single=False):
        with self._lock:
            rows = [copy.deepcopy(r) for r in self._data.get(table, []) if self._match(r, filters)]
        if order:
            # Keep rows whose sort key is None at the end, and never compare
            # None against a real value (that raises TypeError in Python 3).
            present = [r for r in rows if r.get(order) is not None]
            missing = [r for r in rows if r.get(order) is None]
            present.sort(key=lambda r: r.get(order), reverse=desc)
            rows = present + missing
        if offset:
            rows = rows[offset:]
        if limit is not None:
            rows = rows[:limit]
        if single:
            return rows[0] if rows else None
        return rows

    def insert(self, table, row):
        row = dict(row)
        row.setdefault("id", str(uuid.uuid4()))
        now = _now_iso()
        row.setdefault("created_at", now)
        if table not in {"study_sessions", "quiz_attempts", "notifications",
                         "weekly_summaries", "agent_audit_log", "chat_messages"}:
            row.setdefault("updated_at", now)
        with self._lock:
            self._data.setdefault(table, []).append(row)
        return copy.deepcopy(row)

    def update(self, table, filters, patch):
        updated: list[Row] = []
        with self._lock:
            for row in self._data.get(table, []):
                if self._match(row, filters):
                    row.update(patch)
                    if "updated_at" in row:
                        row["updated_at"] = _now_iso()
                    updated.append(copy.deepcopy(row))
        return updated

    def delete(self, table, filters):
        with self._lock:
            self._data[table] = [
                r for r in self._data.get(table, []) if not self._match(r, filters)
            ]

    def search_snippets(self, *, user_id, q=None, language=None, category=None,
                        tags=None, visibility=None, limit=20, offset=0):
        with self._lock:
            rows = [copy.deepcopy(r) for r in self._data.get("snippets", [])]
        # Visibility: public snippets + the caller's own private ones.
        rows = [r for r in rows if r.get("visibility") == "public" or r.get("owner_id") == user_id]
        if visibility == "public":
            rows = [r for r in rows if r.get("visibility") == "public"]
        elif visibility == "private":
            rows = [r for r in rows if r.get("owner_id") == user_id]
        if language:
            rows = [r for r in rows if r.get("language") == language]
        if category:
            rows = [r for r in rows if r.get("category") == category]
        if tags:
            rows = [r for r in rows if set(tags).issubset(set(r.get("tags", [])))]
        if q:
            ql = q.lower()
            rows = [
                r for r in rows
                if ql in (r.get("title", "") + " " + r.get("description", "") + " "
                          + r.get("code", "") + " " + " ".join(r.get("tags", []))).lower()
            ]
        rows.sort(key=lambda r: r.get("usage_count", 0), reverse=True)
        return rows[offset: offset + limit]


# =====================================================================
# Demo fixtures (only ever used by MemoryStore / demo mode)
# =====================================================================
def _build_demo_data() -> dict[str, list[Row]]:
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    def at(hour: int, minute: int = 0) -> str:
        return (today + timedelta(hours=hour, minutes=minute)).isoformat()

    monday = today - timedelta(days=today.weekday())

    def dow(day: int, hour: int, minute: int = 0) -> str:
        """ISO timestamp at a weekday (0=Mon) of the current week."""
        return (monday + timedelta(days=day, hours=hour, minutes=minute)).isoformat()

    uid = DEMO_USER_ID
    course_dbms = str(uuid.uuid4())
    course_algo = str(uuid.uuid4())

    return {
        "profiles": [
            {
                "id": uid,
                "display_name": "Demo Student",
                "preferred_language": "en",
                "timezone": "Asia/Dhaka",
                "current_level": "beginner",
                "weekly_study_goal_minutes": 720,
                "available_schedule": {
                    "mon": [{"start": "09:00", "end": "11:00"}, {"start": "16:00", "end": "18:00"}],
                    "tue": [{"start": "09:00", "end": "11:00"}],
                    "wed": [{"start": "09:00", "end": "11:00"}, {"start": "16:00", "end": "18:00"}],
                    "thu": [{"start": "09:00", "end": "11:00"}],
                    "fri": [{"start": "10:00", "end": "12:00"}],
                    "sat": [{"start": "10:00", "end": "13:00"}],
                    "sun": [{"start": "10:00", "end": "13:00"}],
                },
                "interests": ["cp", "web", "backend"],
                "goals": ["Land a software internship", "Reach 1400 on Codeforces"],
                "codeforces_handle": "tourist",
                "quiet_hours_start": "23:00",
                "quiet_hours_end": "07:00",
                "onboarding_completed": True,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        ],
        "courses": [
            {"id": course_dbms, "user_id": uid, "title": "Database Systems", "code": "CSE311",
             "difficulty": "medium", "color": "#6366f1", "active": True,
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": course_algo, "user_id": uid, "title": "Algorithms", "code": "CSE221",
             "difficulty": "hard", "color": "#ec4899", "active": True,
             "created_at": _now_iso(), "updated_at": _now_iso()},
        ],
        "deadlines": [
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_dbms,
             "title": "DBMS Mid-term", "type": "exam",
             "due_at": (now + timedelta(days=6)).isoformat(), "priority": 5,
             "notes": "Covers normalization + SQL", "status": "pending",
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_algo,
             "title": "Graph assignment", "type": "assignment",
             "due_at": (now + timedelta(days=2)).isoformat(), "priority": 4,
             "notes": "BFS/DFS problems", "status": "pending",
             "created_at": _now_iso(), "updated_at": _now_iso()},
        ],
        "tasks": [
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_dbms, "deadline_id": None,
             "title": "DBMS: Normalization (1NF→BCNF)", "description": "Read + 3 practice problems",
             "task_type": "study", "topic": "normalization",
             "scheduled_start": at(9), "scheduled_end": at(11), "estimated_minutes": 120,
             "actual_minutes": None, "priority": 5, "status": "pending",
             "completion_note": None, "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": None, "deadline_id": None,
             "title": "Codeforces: 2 problems (morning)", "description": "Rating 800–1100, greedy/implementation",
             "task_type": "cp", "topic": "greedy",
             "scheduled_start": at(16), "scheduled_end": at(17), "estimated_minutes": 60,
             "actual_minutes": None, "priority": 3, "status": "pending",
             "completion_note": None, "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_algo, "deadline_id": None,
             "title": "Review: SQL JOIN mistakes", "description": "Revisit yesterday's errors",
             "task_type": "revision", "topic": "sql joins",
             "scheduled_start": at(17, 30), "scheduled_end": at(18), "estimated_minutes": 30,
             "actual_minutes": None, "priority": 2, "status": "completed",
             "completion_note": "Understood LEFT vs INNER", "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_algo, "deadline_id": None,
             "title": "DSA: Binary search", "description": "Theory + 3 problems",
             "task_type": "study", "topic": "dsa",
             "scheduled_start": dow(0, 9), "scheduled_end": dow(0, 10, 30), "estimated_minutes": 90,
             "actual_minutes": 90, "priority": 3, "status": "completed",
             "completion_note": "Solid", "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": dow(0, 10, 30)},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": course_dbms, "deadline_id": None,
             "title": "DBMS: JOIN practice", "description": "INNER vs LEFT",
             "task_type": "study", "topic": "dbms",
             "scheduled_start": dow(1, 10), "scheduled_end": dow(1, 11), "estimated_minutes": 60,
             "actual_minutes": 60, "priority": 3, "status": "completed",
             "completion_note": None, "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": dow(1, 11)},
            {"id": str(uuid.uuid4()), "user_id": uid, "course_id": None, "deadline_id": None,
             "title": "Codeforces: 2 problems", "description": "greedy warm-up",
             "task_type": "cp", "topic": "greedy",
             "scheduled_start": dow(2, 16), "scheduled_end": dow(2, 16, 40), "estimated_minutes": 40,
             "actual_minutes": 40, "priority": 3, "status": "completed",
             "completion_note": None, "skip_reason": None, "metadata": {},
             "created_at": _now_iso(), "updated_at": dow(2, 16, 40)},
        ],
        "study_sessions": [],
        "cp_preferences": [
            {"id": str(uuid.uuid4()), "user_id": uid, "morning_time": "10:00", "evening_time": "20:00",
             "problems_per_session": 2, "min_rating": 800, "max_rating": 1200,
             "preferred_tags": ["greedy", "implementation", "math"],
             "weak_tags": ["dp", "graphs"], "notifications_enabled": True,
             "contest_reminders_enabled": True,
             "created_at": _now_iso(), "updated_at": _now_iso()},
        ],
        "cp_recommendations": [
            {"id": str(uuid.uuid4()), "user_id": uid, "recommendation_date": today.date().isoformat(),
             "session": "morning", "contest_id": None, "problem_contest_id": 4, "problem_index": "A",
             "problem_name": "Watermelon", "problem_rating": 800, "tags": ["brute force", "math"],
             "problem_url": "https://codeforces.com/contest/4/problem/A", "status": "suggested",
             "source_reason": "Demo problem within your rating band.",
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "recommendation_date": today.date().isoformat(),
             "session": "morning", "contest_id": None, "problem_contest_id": 231, "problem_index": "A",
             "problem_name": "Team", "problem_rating": 800, "tags": ["brute force", "greedy"],
             "problem_url": "https://codeforces.com/contest/231/problem/A", "status": "solved",
             "source_reason": "Demo problem within your rating band.",
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "recommendation_date": today.date().isoformat(),
             "session": "evening", "contest_id": None, "problem_contest_id": 158, "problem_index": "A",
             "problem_name": "Next Round", "problem_rating": 800, "tags": ["implementation"],
             "problem_url": "https://codeforces.com/contest/158/problem/A", "status": "suggested",
             "source_reason": "Demo problem within your rating band.",
             "created_at": _now_iso(), "updated_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "recommendation_date": today.date().isoformat(),
             "session": "evening", "contest_id": None, "problem_contest_id": 282, "problem_index": "A",
             "problem_name": "Bit++", "problem_rating": 800, "tags": ["implementation"],
             "problem_url": "https://codeforces.com/contest/282/problem/A", "status": "suggested",
             "source_reason": "Demo problem within your rating band.",
             "created_at": _now_iso(), "updated_at": _now_iso()},
        ],
        "snippets": list(_demo_snippets()),
        "quiz_attempts": [
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dsa", "question": "q",
             "answer": "1", "correct": True, "score": 1.0, "created_at": dow(0, 11)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dsa", "question": "q",
             "answer": "1", "correct": True, "score": 1.0, "created_at": dow(0, 11, 5)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dsa", "question": "q",
             "answer": "0", "correct": False, "score": 0.0, "created_at": dow(0, 11, 10)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dp", "question": "q",
             "answer": "0", "correct": False, "score": 0.0, "created_at": dow(1, 12)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dp", "question": "q",
             "answer": "1", "correct": True, "score": 1.0, "created_at": dow(1, 12, 5)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dp", "question": "q",
             "answer": "0", "correct": False, "score": 0.0, "created_at": dow(1, 12, 10)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "dbms", "question": "q",
             "answer": "1", "correct": True, "score": 1.0, "created_at": dow(2, 13)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "graphs", "question": "q",
             "answer": "0", "correct": False, "score": 0.0, "created_at": dow(2, 14)},
            {"id": str(uuid.uuid4()), "user_id": uid, "topic": "graphs", "question": "q",
             "answer": "0", "correct": False, "score": 0.0, "created_at": dow(2, 14, 5)},
        ],
        "notifications": [
            {"id": str(uuid.uuid4()), "user_id": uid, "type": "daily_summary",
             "title": "Your plan for today is ready", "body": "3 tasks · 2 CP problems · 1 deadline soon",
             "channel": "in_app", "scheduled_at": None, "sent_at": _now_iso(),
             "read_at": None, "status": "sent", "metadata": {}, "created_at": _now_iso()},
            {"id": str(uuid.uuid4()), "user_id": uid, "type": "deadline_warning",
             "title": "Graph assignment due in 2 days", "body": "Priority 4 — schedule time for it.",
             "channel": "in_app", "scheduled_at": None, "sent_at": _now_iso(),
             "read_at": None, "status": "sent", "metadata": {}, "created_at": _now_iso()},
        ],
        "weekly_summaries": [],
        "conversations": [],
        "chat_messages": [],
        "agent_audit_log": [],
    }


def _demo_snippets() -> Iterable[Row]:
    """A small inline set so the demo snippet library isn't empty.
    The full 55+ library lives in supabase/seed.sql for real databases."""
    base = [
        ("Dict comprehension", "Build a dict from an iterable in one line.", "python", "Python",
         "squares = {n: n * n for n in range(1, 6)}\n# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}",
         "Keys must be hashable; later duplicate keys overwrite earlier ones.",
         ["python", "comprehension", "dict"]),
        ("Counter for frequencies", "Count occurrences without manual loops.", "python", "Python",
         "from collections import Counter\nfreq = Counter('banana')\nprint(freq.most_common(1))  # [('a', 3)]",
         "Counter(...) returns 0 for missing keys instead of raising KeyError.",
         ["python", "collections", "counter"]),
        ("Array map/filter/reduce", "Transform, select and fold an array.", "javascript", "JavaScript / TypeScript",
         "const nums = [1, 2, 3, 4];\nconst evensDoubled = nums.filter(n => n % 2 === 0).map(n => n * 2);\nconst sum = nums.reduce((a, b) => a + b, 0);",
         "Always pass reduce an initial value to avoid errors on empty arrays.",
         ["javascript", "array", "functional"]),
        ("useState + useEffect", "Local state plus a side effect on mount.", "tsx", "React / Next.js",
         "const [count, setCount] = useState(0);\nuseEffect(() => {\n  document.title = `Count: ${count}`;\n}, [count]);",
         "Omitting the dependency array runs the effect after every render.",
         ["react", "hooks", "useeffect"]),
        ("Express error handler", "Centralised error middleware (4 args).", "javascript", "Node.js / Express",
         "app.use((err, req, res, next) => {\n  console.error(err);\n  res.status(err.status || 500).json({ error: err.message });\n});",
         "Error middleware MUST declare all four params or Express treats it as normal middleware.",
         ["node", "express", "error-handling"]),
        ("FastAPI route + Pydantic", "Typed request body with validation.", "python", "FastAPI / Python backend",
         "from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str\n    price: float\n\n@app.post('/items')\ndef create(item: Item):\n    return item",
         "Return models or dicts; FastAPI serialises them to JSON automatically.",
         ["fastapi", "pydantic", "python"]),
        ("C++ fast IO template", "Speed up cin/cout for competitive programming.", "cpp", "C++ STL & CP",
         "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}",
         "After sync_with_stdio(false), do not mix C stdio (printf/scanf) with cin/cout.",
         ["cpp", "cp", "fast-io"]),
        ("Union-Find (DSU)", "Disjoint set with path compression.", "cpp", "C++ STL & CP",
         "struct DSU {\n  vector<int> p;\n  DSU(int n): p(n) { iota(p.begin(), p.end(), 0); }\n  int find(int x){ return p[x]==x ? x : p[x]=find(p[x]); }\n  void join(int a,int b){ p[find(a)] = find(b); }\n};",
         "Add union-by-rank/size if you need the near-constant time guarantee.",
         ["cpp", "cp", "dsu", "graph"]),
        ("SQL LEFT JOIN", "Keep all left rows, NULLs where no match.", "sql", "SQL",
         "SELECT u.id, u.name, o.total\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nORDER BY u.name;",
         "Filtering the right table in WHERE turns a LEFT JOIN back into an INNER JOIN — filter in ON instead.",
         ["sql", "join", "query"]),
        ("Window function ROW_NUMBER", "Rank rows within a partition.", "sql", "SQL",
         "SELECT name, dept,\n  ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk\nFROM employees;",
         "ROW_NUMBER is always unique; use RANK/DENSE_RANK when ties should share a rank.",
         ["sql", "window", "analytics"]),
        ("Git: undo last commit (keep changes)", "Move HEAD back but keep your edits staged.", "bash", "Git",
         "git reset --soft HEAD~1",
         "Use --soft to keep changes staged; --hard discards them permanently.",
         ["git", "undo", "reset"]),
        ("Git: recover a lost commit", "Find and restore commits via the reflog.", "bash", "Git",
         "git reflog\ngit checkout -b recovered <commit-sha>",
         "The reflog is local and expires (default 90 days); it is not pushed to remotes.",
         ["git", "reflog", "recovery"]),
        ("Python Dockerfile", "Minimal slim image for a Python app.", "dockerfile", "Docker & Deployment",
         "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]",
         "Copy requirements first so Docker caches the pip layer across code changes.",
         ["docker", "python", "deployment"]),
        ("pytest fixture + parametrize", "Reusable setup and table-driven tests.", "python", "Testing",
         "import pytest\n\n@pytest.mark.parametrize('a,b,expected', [(1,2,3),(0,0,0)])\ndef test_add(a, b, expected):\n    assert a + b == expected",
         "Fixtures with scope='session' run once; the default 'function' scope re-runs per test.",
         ["python", "pytest", "testing"]),
        ("Retry with backoff", "Retry a flaky call with exponential delay.", "python", "Error Handling & Debugging",
         "import time\n\ndef retry(fn, attempts=3, base=0.5):\n    for i in range(attempts):\n        try:\n            return fn()\n        except Exception:\n            if i == attempts - 1:\n                raise\n            time.sleep(base * 2 ** i)",
         "Only retry idempotent operations; retrying a non-idempotent write can duplicate effects.",
         ["python", "retry", "resilience"]),
    ]
    for title, desc, lang, cat, code, notes, tags in base:
        yield {
            "id": str(uuid.uuid4()),
            "owner_id": None,
            "visibility": "public",
            "title": title,
            "description": desc,
            "language": lang,
            "category": cat,
            "code": code,
            "notes": notes,
            "tags": tags,
            "usage_count": 0,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }


# Single process-wide demo store so writes persist across requests.
_memory_store: MemoryStore | None = None


def get_memory_store() -> MemoryStore:
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore(_build_demo_data())
    return _memory_store


def reset_memory_store() -> None:
    """Used by tests to get a clean demo dataset."""
    global _memory_store
    _memory_store = MemoryStore(_build_demo_data())


def get_store_for_user(user: AuthUser) -> Store:
    from .config import get_settings

    settings = get_settings()
    if settings.effective_demo_mode:
        return get_memory_store()
    client = get_user_client(user.access_token)
    if client is None:  # pragma: no cover - safety net
        return get_memory_store()
    return SupabaseStore(client)
