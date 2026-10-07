"""Orchestrator — the controlled agentic workflow.

Flow:
  user message
    -> classify intent
    -> gather relevant context (profile, today's tasks, CP settings, snippets)
    -> build a grounded prompt and call the AI (or mock)
    -> attach safe, human-in-the-loop *suggested* actions (never auto-run
       destructive/outward actions)
    -> persist the exchange + an audit record
    -> return a structured response

Nothing here deletes data, sends email, or messages external people. Those
require explicit user confirmation at the route/UI layer.
"""
from __future__ import annotations

from ..core.logging import get_logger
from ..core.security import AuthUser
from ..core.store import Store
from ..services.gemini_service import get_gemini_service
from . import intent_router

logger = get_logger(__name__)


def _context_block(store: Store, user: AuthUser) -> tuple[str, dict]:
    profile = store.select("profiles", filters=[("id", "eq", user.id)], single=True) or {}
    cp = store.select("cp_preferences", filters=[("user_id", "eq", user.id)], single=True) or {}
    lines = [
        f"Learner level: {profile.get('current_level', 'beginner')}",
        f"Preferred language: {profile.get('preferred_language', 'en')}",
    ]
    if profile.get("goals"):
        lines.append(f"Goals: {', '.join(map(str, profile['goals']))}")
    if profile.get("codeforces_handle"):
        lines.append(f"Codeforces handle: {profile['codeforces_handle']}")
    if cp.get("weak_tags"):
        lines.append(f"Weak CP topics: {', '.join(cp['weak_tags'])}")
    return "\n".join(lines), profile


def _suggested_actions(intent: str) -> list[dict]:
    mapping = {
        "study_plan": [{"label": "Generate my weekly plan", "kind": "generate_weekly_plan", "payload": {}}],
        "task_scheduling": [{"label": "Add this as a task", "kind": "create_task", "payload": {}}],
        "cp_recommendation": [{"label": "Get today's Codeforces problems", "kind": "cp_recommend", "payload": {}}],
        "career_plan": [{"label": "Build an interview-prep plan", "kind": "generate_weekly_plan",
                         "payload": {"focus": "interview"}}],
    }
    return mapping.get(intent, [])


def handle_chat(
    store: Store,
    user: AuthUser,
    *,
    message: str,
    conversation_id: str | None,
    language: str | None,
) -> dict:
    intent = intent_router.classify(message)
    context, profile = _context_block(store, user)
    lang = language or profile.get("preferred_language", "en")

    links: list[dict] = []
    actions_taken: list[str] = []

    # Snippet lookups are grounded in the real library (no hallucinated APIs).
    if intent == "snippet_lookup":
        hits = store.search_snippets(user_id=user.id, q=_keywords(message), limit=3)
        for h in hits:
            links.append({"label": f"Snippet: {h['title']}", "url": f"/snippets/{h['id']}"})
        if hits:
            actions_taken.append(f"Found {len(hits)} matching snippet(s) in your library.")

    prompt = _build_prompt(intent, context, message, lang, _load_history(store, user, conversation_id))
    answer, mocked = get_gemini_service().generate(prompt, language=lang)

    # Persist conversation + messages (best-effort).
    conv_id = _persist(store, user, conversation_id, message, answer, intent)

    # Audit (best-effort; RLS allows users to append their own rows).
    try:
        store.insert("agent_audit_log", {
            "user_id": user.id,
            "intent": intent,
            "module": _module_for(intent),
            "tool_calls": [{"tool": "gemini", "mocked": mocked}],
            "decision_reason": f"Keyword classifier -> {intent}",
        })
    except Exception as exc:  # pragma: no cover
        logger.debug("Audit log skipped: %s", exc)

    return {
        "answer": answer,
        "intent": intent,
        "conversation_id": conv_id,
        "actions_taken": actions_taken,
        "suggested_actions": _suggested_actions(intent),
        "links": links,
        "mocked": mocked,
    }


def _keywords(message: str) -> str:
    # crude keyword extraction for snippet search
    return " ".join(w for w in message.split() if len(w) > 3)[:120]


def _module_for(intent: str) -> str:
    return {
        "study_plan": "LearningPlanner",
        "task_scheduling": "LearningPlanner",
        "cp_recommendation": "CPCoach",
        "code_review": "DeveloperAssistant",
        "snippet_lookup": "DeveloperAssistant",
        "career_plan": "LearningPlanner",
    }.get(intent, "Mentor")


def _load_history(store: Store, user: AuthUser, conversation_id: str | None, limit: int = 6) -> str:
    """Recent turns of this conversation, oldest-first, for prompt context."""
    if not conversation_id:
        return ""
    try:
        msgs = store.select(
            "chat_messages",
            filters=[("conversation_id", "eq", conversation_id), ("user_id", "eq", user.id)],
            order="created_at",
        )
    except Exception:  # pragma: no cover
        return ""
    recent = msgs[-limit:]
    if not recent:
        return ""
    lines = [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in recent]
    return "Recent conversation:\n" + "\n".join(lines)


def _build_prompt(intent: str, context: str, message: str, lang: str, history: str = "") -> str:
    lang_line = {
        "en": "Answer in clear English.",
        "bn": "Answer in Bangla (বাংলা).",
        "bilingual": "Answer bilingually: a short English version then Bangla.",
    }.get(lang, "Answer in clear English.")

    guidance = {
        "cp_recommendation": "If the user asks for problems, remind them you can fetch live "
                             "Codeforces data via the CP page; do not invent problem names or ratings.",
        "code_review": "Use sections: What's good / Likely bugs / Complexity / Security / "
                       "Readability / Suggested tests. Only rewrite code if asked.",
        "snippet_lookup": "Give a concise, correct, copy-ready example with one caveat.",
        "study_plan": "Propose a realistic plan with breaks; invite the user to edit it. "
                     "Never overload them.",
    }.get(intent, "Teach the concept: definition, intuition, example, complexity if relevant, "
                  "common mistakes, a related idea, and a tiny practice question.")

    history_block = f"{history}\n\n" if history else ""
    return (
        f"User context:\n{context}\n\n"
        f"{history_block}"
        f"Task guidance ({intent}): {guidance}\n"
        f"{lang_line}\n\n"
        f"User message:\n{message}"
    )


def _persist(store: Store, user: AuthUser, conversation_id: str | None,
             message: str, answer: str, intent: str) -> str | None:
    try:
        if not conversation_id:
            conv = store.insert("conversations", {
                "user_id": user.id, "title": message[:60],
            })
            conversation_id = conv["id"]
        store.insert("chat_messages", {
            "conversation_id": conversation_id, "user_id": user.id,
            "role": "user", "content": message, "intent": intent,
        })
        store.insert("chat_messages", {
            "conversation_id": conversation_id, "user_id": user.id,
            "role": "assistant", "content": answer, "intent": intent,
        })
        return conversation_id
    except Exception as exc:  # pragma: no cover
        logger.debug("Chat persistence skipped: %s", exc)
        return conversation_id
