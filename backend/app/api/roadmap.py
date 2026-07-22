from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DBSession, rate_limit
from app.models.roadmap import Roadmap
from app.schemas.roadmap import (
    AssessmentInput,
    RoadmapListItem,
    RoadmapOut,
)
from app.services.ai_engine import generate_roadmap

router = APIRouter(prefix="/roadmap", tags=["roadmap"], dependencies=[Depends(rate_limit)])


@router.post("/generate", response_model=RoadmapOut, status_code=status.HTTP_201_CREATED)
async def generate(payload: AssessmentInput, user: CurrentUser, db: DBSession) -> RoadmapOut:
    try:
        roadmap_payload = await generate_roadmap(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    roadmap = Roadmap(
        user_id=user.id,
        target_role=roadmap_payload.target_role,
        profile=payload.model_dump(),
        structured_json=roadmap_payload.model_dump(),
    )
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)
    return RoadmapOut.model_validate(roadmap)


@router.get("", response_model=list[RoadmapListItem])
async def list_roadmaps(user: CurrentUser, db: DBSession) -> list[RoadmapListItem]:
    result = await db.execute(
        select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc())
    )
    rows = result.scalars().all()
    return [RoadmapListItem.model_validate(r) for r in rows]


@router.get("/{roadmap_id}", response_model=RoadmapOut)
async def get_roadmap(roadmap_id: int, user: CurrentUser, db: DBSession) -> RoadmapOut:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == user.id)
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return RoadmapOut.model_validate(roadmap)


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap(roadmap_id: int, user: CurrentUser, db: DBSession) -> None:
    result = await db.execute(
        select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == user.id)
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    await db.delete(roadmap)
    await db.commit()
