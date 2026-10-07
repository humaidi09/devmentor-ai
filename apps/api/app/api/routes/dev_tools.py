from fastapi import APIRouter, Depends, Request

from ...core.ratelimit import limiter
from ...core.security import AuthUser
from ...schemas.devtools import (
    ReviewRequest,
    ReviewResponse,
    RoadmapRequest,
    RoadmapResponse,
)
from ...services import dev_tools_service
from ..deps import get_current_user

router = APIRouter(prefix="/api", tags=["dev-tools"])


@router.post("/review", response_model=ReviewResponse)
@limiter.limit("15/minute")
def review(
    request: Request,
    body: ReviewRequest,
    user: AuthUser = Depends(get_current_user),
):
    text, mocked = dev_tools_service.review_code(body.code, body.language, body.want_rewrite)
    return {"review": text, "language": body.language, "mocked": mocked}


@router.post("/roadmap", response_model=RoadmapResponse)
@limiter.limit("15/minute")
def roadmap(
    request: Request,
    body: RoadmapRequest,
    user: AuthUser = Depends(get_current_user),
):
    text, mocked = dev_tools_service.generate_roadmap(body.idea, body.stack_preference)
    return {"roadmap": text, "mocked": mocked}
