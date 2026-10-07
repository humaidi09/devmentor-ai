"""Codeforces public API client + problem filtering.

Only public, documented endpoints are used:
  - user.info        : profile/rating
  - user.status      : submissions (to know what's solved)
  - problemset.problems : the problem bank
  - contest.list     : upcoming contests

Network calls are wrapped so the app degrades gracefully (and tests can
run offline). The recommendation filtering logic is pure and unit-tested.
"""
from __future__ import annotations

import httpx

from ..core.logging import get_logger

logger = get_logger(__name__)

CF_API = "https://codeforces.com/api"


class CodeforcesError(Exception):
    pass


class CodeforcesClient:
    def __init__(self, timeout: float = 10.0) -> None:
        self._timeout = timeout

    def _get(self, path: str, params: dict | None = None) -> dict:
        try:
            resp = httpx.get(f"{CF_API}/{path}", params=params, timeout=self._timeout)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:  # network / parse errors
            raise CodeforcesError(str(exc)) from exc
        if data.get("status") != "OK":
            raise CodeforcesError(data.get("comment", "Codeforces API error"))
        return data["result"]

    def user_info(self, handle: str) -> dict:
        result = self._get("user.info", {"handles": handle})
        return result[0] if result else {}

    def user_status(self, handle: str, count: int = 2000) -> list[dict]:
        return self._get("user.status", {"handle": handle, "from": 1, "count": count})

    def problemset(self) -> list[dict]:
        return self._get("problemset.problems").get("problems", [])

    def upcoming_contests(self) -> list[dict]:
        contests = self._get("contest.list", {"gym": "false"})
        return [c for c in contests if c.get("phase") == "BEFORE"]


def solved_problem_keys(submissions: list[dict]) -> set[str]:
    """Set of '{contestId}-{index}' the user has an accepted verdict on."""
    solved: set[str] = set()
    for sub in submissions:
        if sub.get("verdict") == "OK":
            prob = sub.get("problem", {})
            cid, idx = prob.get("contestId"), prob.get("index")
            if cid is not None and idx is not None:
                solved.add(f"{cid}-{idx}")
    return solved


def filter_problems(
    problems: list[dict],
    *,
    min_rating: int,
    max_rating: int,
    solved_keys: set[str],
    preferred_tags: list[str] | None = None,
    exclude_keys: set[str] | None = None,
    limit: int = 10,
) -> list[dict]:
    """Pure filtering: within rating band, unsolved, not already recommended,
    preferring problems that match preferred/weak tags. Pure => easy to test."""
    preferred = set(preferred_tags or [])
    exclude = exclude_keys or set()
    out: list[dict] = []
    for p in problems:
        rating = p.get("rating")
        if rating is None or rating < min_rating or rating > max_rating:
            continue
        cid, idx = p.get("contestId"), p.get("index")
        if cid is None or idx is None:
            continue
        key = f"{cid}-{idx}"
        if key in solved_keys or key in exclude:
            continue
        out.append(p)

    def score(p: dict) -> tuple:
        tag_match = len(preferred.intersection(p.get("tags", []))) if preferred else 0
        # Prefer tag matches, then lower rating (gentler), then recent (higher contestId).
        return (-tag_match, p.get("rating", 9999), -(p.get("contestId") or 0))

    out.sort(key=score)
    return out[:limit]


def contest_reminder_payloads(
    contests: list[dict],
    now_epoch: int,
    *,
    window_seconds: int = 3600,
) -> list[dict]:
    """Contests starting within `window_seconds` -> reminder payloads.

    Pure: takes the current epoch time so it is trivially testable. Contests
    without a usable start time, or that already began, are ignored.
    """
    out: list[dict] = []
    for c in contests:
        start = c.get("startTimeSeconds")
        if start is None:
            continue
        delta = start - now_epoch
        if 0 <= delta <= window_seconds:
            out.append({
                "contest_id": c.get("id"),
                "name": c.get("name"),
                "start_time_seconds": start,
                "minutes_until": delta // 60,
                "title": f"Contest soon: {c.get('name')}",
                "body": f"Starts in about {delta // 60} minutes. Good luck!",
            })
    out.sort(key=lambda r: r["start_time_seconds"])
    return out


def problems_from_submissions(submissions: list[dict], contest_id: int) -> list[dict]:
    """Distinct problems of one contest the user attempted, tagged solved."""
    solved = solved_problem_keys(submissions)
    seen: dict[str, dict] = {}
    for sub in submissions:
        prob = sub.get("problem", {})
        if prob.get("contestId") != contest_id:
            continue
        idx = prob.get("index")
        if idx is None:
            continue
        key = f"{contest_id}-{idx}"
        if key in seen:
            continue
        seen[key] = {
            "contestId": contest_id,
            "index": idx,
            "name": prob.get("name"),
            "rating": prob.get("rating"),
            "tags": prob.get("tags", []),
            "solved": key in solved,
        }
    return list(seen.values())


def post_contest_upsolve(submissions: list[dict], contest_id: int) -> list[dict]:
    """Attempted-but-unsolved problems from a contest, sorted easiest-first
    (unsolved with no rating go last). Pure and testable."""
    attempted = problems_from_submissions(submissions, contest_id)
    unsolved = [p for p in attempted if not p["solved"]]
    unsolved.sort(key=lambda p: (p["rating"] is None, p["rating"] or 0))
    return unsolved


_client: CodeforcesClient | None = None


def get_codeforces_client() -> CodeforcesClient:
    global _client
    if _client is None:
        _client = CodeforcesClient()
    return _client
