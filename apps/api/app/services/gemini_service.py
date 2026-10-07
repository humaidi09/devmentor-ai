"""Gemini wrapper with a safe, clearly-labelled mock fallback.

If GEMINI_API_KEY is not set (or a call fails), we return a deterministic
mock response so the app is fully usable offline. Mock output is always
flagged (`mocked=True`) and never presented as a real model answer.
"""
from __future__ import annotations

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
                logger.warning("Could not initialise Gemini: %s", exc)
                self._model = None
        return self._model

    def generate(self, prompt: str, *, language: str = "en") -> tuple[str, bool]:
        """Returns (text, mocked)."""
        model = self._ensure_model()
        if model is None:
            return self._mock(prompt, language), True
        try:
            resp = model.generate_content(prompt)
            text = (getattr(resp, "text", None) or "").strip()
            return (text or self._mock(prompt, language)), (not text)
        except Exception as exc:
            logger.warning("Gemini generation failed, using mock: %s", exc)
            return self._mock(prompt, language), True

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
