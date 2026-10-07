from fastapi import APIRouter, Depends, HTTPException

from ...core.security import AuthUser
from ...core.store import Store
from ...schemas.common import Page
from ...schemas.quiz import (
    QuizAttemptIn,
    QuizAttemptOut,
    QuizAttemptRow,
    QuizGenerateRequest,
    QuizQuestionOut,
)
from ...services import quiz_service
from ..deps import Pagination, get_current_user, get_store, pagination

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=list[QuizQuestionOut])
def generate(
    body: QuizGenerateRequest,
    user: AuthUser = Depends(get_current_user),
):
    return quiz_service.generate_quiz(body.topic, count=body.count, seed=body.seed)


@router.post("/attempt", response_model=QuizAttemptOut)
def attempt(
    body: QuizAttemptIn,
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    try:
        result = quiz_service.grade(body.question_id, body.answer_index)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    store.insert("quiz_attempts", {
        "user_id": user.id,
        "topic": body.topic,
        "question": result["question"],
        "answer": str(body.answer_index),
        "correct": result["correct"],
        "score": result["score"],
    })
    return {
        "correct": result["correct"],
        "correct_index": result["correct_index"],
        "explanation": result["explanation"],
        "score": result["score"],
    }


@router.get("/history", response_model=Page[QuizAttemptRow])
def history(
    pg: Pagination = Depends(pagination),
    user: AuthUser = Depends(get_current_user),
    store: Store = Depends(get_store),
):
    rows = store.select("quiz_attempts", filters=[("user_id", "eq", user.id)],
                        order="created_at", desc=True)
    return {"items": rows[pg.offset: pg.offset + pg.limit], "limit": pg.limit,
            "offset": pg.offset, "count": len(rows)}
