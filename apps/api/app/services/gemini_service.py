"""Gemini wrapper with a safe, clearly-labelled mock fallback.

Only explicit demo mode without a key returns mock output. Live missing
configuration and provider failures return actionable errors.
"""
from __future__ import annotations

from fastapi import HTTPException

from ..core.config import get_settings
from ..core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are DevMentor AI, a patient, precise mentor for CS students,
competitive programmers, and junior developers.

Rules:
- Teach first; do not only paste final code. Explain intuition and steps.
- For algorithms, state time and space complexity.
- Label pseudocode vs runnable code and note language/version assumptions.
- For competitive programming, follow: restate problem, constraints,
  observation, brute force, optimization, correctness, implementation,
  complexity, edge cases, similar problems. Write ORIGINAL explanations;
  never copy editorial text.
- Be concise by default; expand when asked.
- Reply in the user's chosen language (English, Bangla, or bilingual).
- Never guarantee grades, ratings, jobs, or salaries. Use cautious wording
  like "practice trend" or "estimated readiness".
- Do not complete a student's active graded assignment; offer hints,
  explanations, practice, and review instead.
- Recommend secure coding practices; avoid unsafe code."""


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    def _ensure_model(self):
        if self._model is None and self.settings.gemini_configured:
            try:
                import google.generativeai as genai

                genai.configure(api_key=self.settings.gemini_api_key)
                self._model = genai.GenerativeModel(
                    self.settings.gemini_model, system_instruction=SYSTEM_PROMPT
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("Could not initialise Gemini (%s)", type(exc).__name__)
                raise HTTPException(503, "AI provider could not initialize. Please contact the administrator.") from None
        return self._model

    def generate(self, prompt: str, *, language: str = "en") -> tuple[str, bool]:
        """Returns (text, mocked)."""
        model = self._ensure_model()
        if model is None:
            if not self.settings.effective_demo_mode:
                raise HTTPException(503, "AI is not configured on the server.")
            return self._mock(prompt, language), True
        try:
            resp = model.generate_content(prompt, request_options={"timeout": 45, "retry": None})
            text = (getattr(resp, "text", None) or "").strip()
            if not text:
                raise HTTPException(502, "AI returned an empty response. Try rephrasing your question.")
            return text, False
        except HTTPException:
            raise
        except Exception as exc:
            name = type(exc).__name__
            logger.warning("Gemini generation failed (%s)", name)
            if name in {"ResourceExhausted", "TooManyRequests"}:
                raise HTTPException(503, "AI quota is exhausted. Please try later or ask the administrator to check billing.") from None
            if name in {"DeadlineExceeded", "TimeoutError"}:
                raise HTTPException(504, "AI response timed out. Please try again.") from None
            if name in {"PermissionDenied", "Unauthenticated", "InvalidArgument", "NotFound"}:
                raise HTTPException(503, "AI key or model is unavailable. The administrator must check the provider configuration.") from None
            raise HTTPException(502, "AI provider is temporarily unavailable. Please try again.") from None

    @staticmethod
    def _mock(prompt: str, language: str) -> str:
        note = {
            "en": "_(Demo response — set GEMINI_API_KEY for real AI answers.)_",
            "bn": "_(ডেমো উত্তর — আসল AI উত্তরের জন্য GEMINI_API_KEY সেট করুন।)_",
            "bilingual": "_(Demo / ডেমো response — set GEMINI_API_KEY for real answers.)_",
        }.get(language, "_(Demo response — set GEMINI_API_KEY for real AI answers.)_")
        snippet = prompt.strip().splitlines()[0][:160] if prompt.strip() else "your question"
        return (
            f"{note}\n\n"
            f"Here's how I'd approach **{snippet}**:\n\n"
            "1. **Clarify the goal** and constraints.\n"
            "2. **Recall the core concept** and a simple analogy.\n"
            "3. **Work a small example** step by step.\n"
            "4. **Note complexity** (time/space) where relevant.\n"
            "5. **Watch for common mistakes** and edge cases.\n\n"
            "Connect a Gemini API key to get full, tailored explanations."
        )


_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    global _service
    if _service is None:
        _service = GeminiService()
    return _service
