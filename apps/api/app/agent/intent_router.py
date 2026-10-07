"""Intent classification.

A lightweight, deterministic keyword classifier routes a chat message to a
specialised module. It is intentionally transparent (and testable) rather
than a hidden LLM decision; the orchestrator records the chosen intent in
the audit log.
"""
from __future__ import annotations

import re

Intent = str

INTENTS: list[Intent] = [
    "study_plan",
    "task_scheduling",
    "cp_recommendation",
    "code_review",
    "snippet_lookup",
    "career_plan",
    "chat_explain",  # default
]

_PATTERNS: list[tuple[Intent, list[str]]] = [
    ("study_plan", [r"\bstudy plan\b", r"\bschedule my\b", r"\bweekly plan\b",
                    r"\bplan my (week|study|day)\b", r"\brevision plan\b"]),
    ("task_scheduling", [r"\badd (a )?task\b", r"\bremind me\b", r"\bschedule a\b",
                         r"\bcreate (a )?task\b", r"\bto-?do\b"]),
    ("cp_recommendation", [r"\bcodeforces\b", r"\bcf\b", r"\bcompetitive\b",
                           r"\bproblem(s)? to solve\b", r"\brating\b", r"\bupsolve\b",
                           r"\bcontest\b"]),
    ("code_review", [r"\breview (my )?code\b", r"\bdebug\b", r"\bwhy (is|does).*error\b",
                     r"\bfix (my|this)\b", r"\bstack ?trace\b", r"\bexception\b"]),
    ("snippet_lookup", [r"\bsnippet\b", r"\bsyntax\b", r"\bhow (do|to) i\b.*\b(in|with)\b",
                        r"\bcheat ?sheet\b", r"\btemplate for\b", r"\bexample of\b"]),
    ("career_plan", [r"\binterview\b", r"\bresume\b", r"\bcv\b", r"\binternship\b",
                     r"\bcareer\b", r"\bmock interview\b"]),
]


def classify(message: str) -> Intent:
    text = message.lower()
    for intent, patterns in _PATTERNS:
        if any(re.search(p, text) for p in patterns):
            return intent
    return "chat_explain"
