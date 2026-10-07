"""Developer tools: structured code review + project roadmap generation.

Both call Gemini with a tightly-structured prompt and fall back to a
clearly-labelled, section-shaped mock when no key is configured — so the
feature is demonstrable offline and never fabricates a "real" AI answer.
"""
from __future__ import annotations

from .gemini_service import get_gemini_service

REVIEW_SECTIONS = (
    "What's good",
    "Likely bugs",
    "Complexity",
    "Security",
    "Readability & maintainability",
    "Suggested tests",
)


def _build_review_prompt(code: str, language: str, want_rewrite: bool) -> str:
    rewrite = (
        "Then provide an improved version of the code."
        if want_rewrite
        else "Do NOT rewrite the code; only review it."
    )
    sections = "\n".join(f"## {s}" for s in REVIEW_SECTIONS)
    return (
        f"You are a senior engineer reviewing {language} code. Respond in Markdown "
        f"using EXACTLY these section headings, each with concise bullet points:\n"
        f"{sections}\n\n"
        f"Be specific and reference line/behaviour where possible. If a section has "
        f"nothing to report, say 'Looks fine.' {rewrite}\n\n"
        f"Code:\n```{language}\n{code}\n```"
    )


def review_code(code: str, language: str, want_rewrite: bool = False) -> tuple[str, bool]:
    svc = get_gemini_service()
    if not svc.settings.gemini_configured:
        return _mock_review(language), True
    return svc.generate(_build_review_prompt(code, language, want_rewrite))


def _mock_review(language: str) -> str:
    body = "\n".join(
        f"## {s}\n- _(Demo — connect a Gemini key for a real, specific review.)_"
        for s in REVIEW_SECTIONS
    )
    return (
        f"_(Demo response — set GEMINI_API_KEY for a full {language} review.)_\n\n{body}"
    )


ROADMAP_SECTIONS = (
    "Requirements",
    "Suggested tech stack",
    "Folder structure",
    "API design",
    "Database entities",
    "Milestones",
    "Deployment checklist",
)


def _build_roadmap_prompt(idea: str, stack_preference: str | None) -> str:
    sections = "\n".join(f"## {s}" for s in ROADMAP_SECTIONS)
    stack = f"\nPreferred stack hint: {stack_preference}." if stack_preference else ""
    return (
        "You are a pragmatic software architect. Produce a realistic project plan "
        "in Markdown using EXACTLY these section headings:\n"
        f"{sections}\n\n"
        "Keep it concrete and achievable for a student/junior team. Prefer free-tier "
        f"friendly, widely-used tools.{stack}\n\n"
        f"Project idea:\n{idea}"
    )


def generate_roadmap(idea: str, stack_preference: str | None = None) -> tuple[str, bool]:
    svc = get_gemini_service()
    if not svc.settings.gemini_configured:
        return _mock_roadmap(), True
    return svc.generate(_build_roadmap_prompt(idea, stack_preference))


def _mock_roadmap() -> str:
    body = "\n".join(
        f"## {s}\n- _(Demo — connect a Gemini key for a tailored plan.)_"
        for s in ROADMAP_SECTIONS
    )
    return f"_(Demo response — set GEMINI_API_KEY for a full roadmap.)_\n\n{body}"
