"""Quiz module: a small, deterministic question bank + grading.

Pure and testable. Feeds `quiz_attempts`, which in turn drives weak-topic
detection in analytics. If a Gemini key is configured the bank could be
augmented later; the MVP uses a curated bank so the feature always works
offline.
"""
from __future__ import annotations

import random
import re

# Each entry: question, 4 options, index of the correct option, explanation.
_BANK: dict[str, list[dict]] = {
    "dsa": [
        {"q": "Time complexity of binary search on a sorted array of n elements?",
         "o": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "a": 1,
         "e": "It halves the search space each step: O(log n)."},
        {"q": "Which data structure gives O(1) average-time lookup by key?",
         "o": ["Array", "Hash table", "Linked list", "Stack"], "a": 1,
         "e": "Hash tables map keys to buckets in average O(1)."},
        {"q": "Which traversal visits a node before its children?",
         "o": ["In-order", "Post-order", "Pre-order", "Level-order"], "a": 2,
         "e": "Pre-order: node, then left subtree, then right subtree."},
        {"q": "A stack follows which order?",
         "o": ["FIFO", "LIFO", "Random", "Priority"], "a": 1,
         "e": "Stack is Last-In-First-Out."},
    ],
    "dbms": [
        {"q": "Which normal form removes partial dependencies on a composite key?",
         "o": ["1NF", "2NF", "3NF", "BCNF"], "a": 1,
         "e": "2NF removes partial dependencies on part of a composite key."},
        {"q": "A JOIN that returns all left rows plus matches is a…",
         "o": ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], "a": 1,
         "e": "LEFT JOIN keeps all left rows, filling NULLs where there is no match."},
        {"q": "Which key uniquely identifies a row?",
         "o": ["Foreign key", "Primary key", "Candidate key", "Super key"], "a": 1,
         "e": "The primary key uniquely identifies each row."},
        {"q": "ACID's 'I' stands for…",
         "o": ["Integrity", "Isolation", "Indexing", "Iteration"], "a": 1,
         "e": "Isolation: concurrent transactions do not interfere."},
    ],
    "os": [
        {"q": "A process waiting for I/O is in which state?",
         "o": ["Running", "Ready", "Waiting/Blocked", "Terminated"], "a": 2,
         "e": "Blocked: waiting for an event such as I/O to complete."},
        {"q": "Which scheduling policy is non-preemptive?",
         "o": ["Round Robin", "First-Come First-Served", "Preemptive SJF", "Priority (preemptive)"], "a": 1,
         "e": "FCFS runs a process to completion; it is non-preemptive."},
        {"q": "Thrashing is primarily caused by…",
         "o": ["Too much RAM", "Excessive paging", "CPU overheating", "Cache hits"], "a": 1,
         "e": "Too little memory causes constant page faults — thrashing."},
        {"q": "A deadlock requires all of: mutual exclusion, hold-and-wait, no preemption, and…",
         "o": ["Circular wait", "Starvation", "Context switch", "Paging"], "a": 0,
         "e": "The four Coffman conditions include circular wait."},
    ],
    "networks": [
        {"q": "Which layer of the OSI model routes packets between networks?",
         "o": ["Data link", "Network", "Transport", "Application"], "a": 1,
         "e": "Layer 3 (Network), e.g. IP, handles routing."},
        {"q": "TCP is…",
         "o": ["Connectionless", "Connection-oriented", "Unreliable", "Broadcast-only"], "a": 1,
         "e": "TCP is connection-oriented and reliable."},
        {"q": "Default port for HTTPS?",
         "o": ["80", "443", "22", "8080"], "a": 1,
         "e": "HTTPS uses TCP port 443."},
        {"q": "DNS primarily translates…",
         "o": ["IP to MAC", "Domain names to IP addresses", "Ports to sockets", "Files to packets"], "a": 1,
         "e": "DNS resolves human-readable names to IP addresses."},
    ],
    "python": [
        {"q": "Which keyword defines an anonymous function?",
         "o": ["def", "lambda", "func", "fn"], "a": 1,
         "e": "lambda x: x + 1 creates a small anonymous function."},
        {"q": "What does a list comprehension return?",
         "o": ["A generator", "A list", "A tuple", "None"], "a": 1,
         "e": "[... for ...] builds a list."},
        {"q": "Which is immutable?",
         "o": ["list", "dict", "tuple", "set"], "a": 2,
         "e": "Tuples cannot be changed after creation."},
        {"q": "What does `dict.get(key, default)` do when the key is missing?",
         "o": ["Raises KeyError", "Returns default", "Returns None always", "Inserts the key"], "a": 1,
         "e": "It returns the default instead of raising."},
    ],
    "sql": [
        {"q": "Which clause filters AFTER grouping?",
         "o": ["WHERE", "HAVING", "ORDER BY", "LIMIT"], "a": 1,
         "e": "HAVING filters aggregated groups; WHERE filters rows before grouping."},
        {"q": "Which function counts rows in a group?",
         "o": ["SUM()", "COUNT()", "AVG()", "MAX()"], "a": 1,
         "e": "COUNT() counts rows."},
        {"q": "A CTE is introduced by which keyword?",
         "o": ["WITH", "IMP", "OVER", "JOIN"], "a": 0,
         "e": "WITH name AS (...) defines a common table expression."},
        {"q": "Which JOIN returns only matching rows from both tables?",
         "o": ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN"], "a": 2,
         "e": "INNER JOIN keeps only rows matching on both sides."},
    ],
}

_ALIASES = {
    "algorithm": "dsa", "algorithms": "dsa", "data structures": "dsa", "ds": "dsa",
    "database": "dbms", "databases": "dbms", "db": "dbms",
    "operating systems": "os", "operating system": "os",
    "network": "networks", "networking": "networks", "computer networks": "networks",
    "python3": "python",
    "sql queries": "sql", "databases sql": "sql",
}


def _slug(topic: str) -> str:
    key = topic.strip().lower()
    if key in _ALIASES:
        return _ALIASES[key]
    for k in _BANK:
        if k in key:
            return k
    return "dsa"  # default bank


def _questions(topic: str) -> list[dict]:
    return _BANK[_slug(topic)]


def generate_quiz(topic: str, count: int = 3, seed: int | None = None) -> list[dict]:
    """Return up to `count` questions for a topic, without answers."""
    slug = _slug(topic)
    bank = _BANK[slug]
    rng = random.Random(seed)
    idxs = list(range(len(bank)))
    rng.shuffle(idxs)
    chosen = idxs[: min(count, len(bank))]
    out = []
    for i in chosen:
        item = bank[i]
        out.append({
            "id": f"{slug}:{i}",
            "topic": topic,
            "question": item["q"],
            "options": list(item["o"]),
        })
    return out


def parse_question_id(qid: str) -> tuple[str, int]:
    m = re.match(r"^([a-z]+):(\d+)$", qid)
    if not m:
        raise ValueError("Malformed question id")
    return m.group(1), int(m.group(2))


def grade(qid: str, answer_index: int) -> dict:
    slug, idx = parse_question_id(qid)
    bank = _BANK.get(slug)
    if not bank or idx < 0 or idx >= len(bank):
        raise ValueError("Unknown question")
    item = bank[idx]
    correct = answer_index == item["a"]
    return {
        "correct": correct,
        "correct_index": item["a"],
        "explanation": item["e"],
        "score": 1.0 if correct else 0.0,
        "question": item["q"],
    }


def topics_below(perf_rows: list[dict], *, threshold: float = 0.6, min_attempts: int = 2) -> list[str]:
    """Topic names needing extra practice (low accuracy, enough attempts)."""
    weak = [
        r["topic"] for r in perf_rows
        if r.get("attempts", 0) >= min_attempts and r.get("accuracy", 0.0) < threshold
    ]
    return weak
