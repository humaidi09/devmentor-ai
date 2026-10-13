#!/usr/bin/env python3
"""Refresh the CP catalog from public problem metadata (no statements or solutions)."""

import concurrent.futures
import datetime
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/lib/cp/catalog.json"
TOPICS = {
    "array", "string", "two-pointers", "linked-list", "stack", "queue", "hashing",
    "sorting", "binary-search", "recursion", "backtracking", "tree", "bst", "heap",
    "graph", "bfs", "dfs", "greedy", "dynamic-programming", "shortest-path",
    "minimum-spanning-tree", "trie", "bit-manipulation",
}
LC_TAGS = {
    "hash-table": "hashing", "sliding-window": "two-pointers",
    "binary-tree": "tree", "binary-search-tree": "bst",
    "heap-priority-queue": "heap", "breadth-first-search": "bfs",
    "depth-first-search": "dfs", "bitmask": "bit-manipulation",
    "matrix": "array", "prefix-sum": "array", "union-find": "graph",
    "topological-sort": "graph",
}
CF_TAGS = {
    "implementation": "array", "strings": "string", "two pointers": "two-pointers",
    "binary search": "binary-search", "sortings": "sorting", "trees": "tree",
    "graphs": "graph", "dfs and similar": "dfs", "dp": "dynamic-programming",
    "shortest paths": "shortest-path", "bitmasks": "bit-manipulation",
}
CC_TAGS = {
    "arrays": "array", "array": "array", "strings": "string", "string": "string",
    "two pointers": "two-pointers", "linked lists": "linked-list",
    "stack": "stack", "queue": "queue", "hashing": "hashing",
    "sorting": "sorting", "binary search": "binary-search",
    "recursion": "recursion", "backtracking": "backtracking",
    "trees": "tree", "tree": "tree", "binary search tree": "bst",
    "heap": "heap", "graphs": "graph", "graph": "graph", "bfs": "bfs",
    "dfs": "dfs", "greedy": "greedy", "dynamic programming": "dynamic-programming",
    "dp": "dynamic-programming", "shortest path": "shortest-path",
    "trie": "trie", "bit manipulation": "bit-manipulation",
    "bitmasking": "bit-manipulation",
}


def get_json(url, data=None):
    command = ["curl", "-fsS", "--retry", "2", "--max-time", "45", "-H", "Accept: application/json"]
    if data is not None:
        command += ["-H", "Content-Type: application/json", "--data", json.dumps(data)]
    command.append(url)
    return json.loads(subprocess.check_output(command, timeout=55))


def mapped_tags(tags, mapping):
    result = []
    for tag in tags:
        value = mapping.get(tag.lower(), tag.lower())
        if value in TOPICS and value not in result:
            result.append(value)
    return result


def balanced(rows, count):
    """Keep a useful Easy/Medium/Hard mix while retaining source order."""
    buckets = {"easy": [], "medium": [], "hard": []}
    for row in rows:
        buckets[row[-1]].append(row)
    result = []
    while len(result) < count and any(buckets.values()):
        for level in buckets:
            if buckets[level] and len(result) < count:
                result.append(buckets[level].pop(0))
    return result


def codeforces():
    data = get_json("https://codeforces.com/api/problemset.problems")
    if data.get("status") != "OK":
        raise RuntimeError("Codeforces response was not OK")
    rows = []
    seen = set()
    for problem in data["result"]["problems"]:
        contest, index, rating = problem.get("contestId"), problem.get("index"), problem.get("rating")
        if not isinstance(contest, int) or contest <= 0 or not isinstance(index, str) or not re.fullmatch(r"[A-Za-z0-9]+", index) or not isinstance(rating, int):
            continue
        if rating < 800 or rating > 3500:
            continue
        key = f"{contest}/{index}"
        if key in seen:
            continue
        topics = mapped_tags(problem.get("tags", []), CF_TAGS)
        if not topics:
            continue
        seen.add(key)
        level = "easy" if rating < 1400 else "medium" if rating < 1900 else "hard"
        rows.append(["codeforces", key, problem["name"], topics, rating, level])
    # Public API lists newest first. Include recent problems across levels.
    return balanced(rows, 600)


def leetcode():
    rows = []
    seen = set()
    query = """query($skip: Int!, $limit: Int!) {
      questionList(categorySlug: "", skip: $skip, limit: $limit, filters: {}) {
        totalNum data { title titleSlug difficulty isPaidOnly topicTags { slug } }
      }
    }"""
    # LeetCode caps each response at 100 items even if a larger limit is requested.
    for skip in range(0, 2000, 100):
        payload = get_json("https://leetcode.com/graphql/", {
            "query": query, "variables": {"skip": skip, "limit": 100},
        })
        if payload.get("errors"):
            raise RuntimeError(f"LeetCode GraphQL failed at offset {skip}: {payload['errors'][0]['message']}")
        items = payload["data"]["questionList"]["data"]
        for problem in items:
            slug, difficulty = problem.get("titleSlug"), problem.get("difficulty", "").lower()
            if not slug or not re.fullmatch(r"[a-z0-9-]+", slug) or slug in seen or problem.get("isPaidOnly") or difficulty not in ("easy", "medium", "hard"):
                continue
            topics = mapped_tags([t["slug"] for t in problem.get("topicTags", [])], LC_TAGS)
            if not topics:
                continue
            seen.add(slug)
            rows.append(["leetcode", slug, problem["title"], topics, None, difficulty])
        if len(rows) >= 600 or len(items) < 100:
            break
    return balanced(rows, 600)


def codechef_detail(item):
    code = item.get("code", "")
    if not code.isalnum():
        return None
    try:
        detail = get_json(f"https://www.codechef.com/api/contests/PRACTICE/problems/{code}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError):
        return None
    if detail.get("status") != "success" or detail.get("problem_code") != code:
        return None
    rating = int(detail.get("difficulty_rating") or -1)
    if not 300 <= rating <= 3500:
        return None
    topics = mapped_tags(detail.get("user_tags", []) + detail.get("computed_tags", []), CC_TAGS)
    if not topics:
        return None
    level = "easy" if rating < 1200 else "medium" if rating < 2000 else "hard"
    return ["codechef", code, detail["problem_name"], topics, rating, level]


def codechef():
    candidates = []
    for page in (22, 26, 30, 34, 38, 42, 46, 50):
        payload = get_json(
            f"https://www.codechef.com/api/list/problems/all?limit=100&page={page}"
            "&sort_by=difficulty_rating&sort_order=desc&category=rated"
        )
        # Sample across each rating band rather than only one contest block.
        candidates.extend(payload.get("data", [])[::3][:25])
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = [row for row in pool.map(codechef_detail, candidates) if row]
    return balanced(rows, 60)


def main():
    sources = [codeforces(), leetcode(), codechef()]
    for name, rows in zip(("Codeforces", "LeetCode", "CodeChef"), sources):
        print(f"{name}: {len(rows)} verified metadata entries")
    rows = [row for source in sources for row in source]
    if len(rows) < 1000 or any(not row[3] for row in rows):
        raise RuntimeError(f"Catalog is incomplete: {len(rows)} entries")
    if len({(row[0], row[1]) for row in rows}) != len(rows):
        raise RuntimeError("Duplicate platform IDs")
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    lines = ['{', f'  "retrievedAt": "{today}",', '  "problems": [']
    lines.extend(
        f"    {json.dumps(row, ensure_ascii=False, separators=(',', ':'))}{',' if index < len(rows) - 1 else ''}"
        for index, row in enumerate(rows)
    )
    OUTPUT.write_text("\n".join([*lines, "  ]", "}"]) + "\n")
    print(f"Wrote {len(rows)} problems to {OUTPUT}")


if __name__ == "__main__":
    main()
