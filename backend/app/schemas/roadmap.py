from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssessmentInput(BaseModel):
    """Payload from the frontend Assessment page."""

    current_skills: list[str] = Field(default_factory=list, max_length=50)
    interests: list[str] = Field(default_factory=list, max_length=50)
    career_goal: str = Field(min_length=2, max_length=255)
    experience_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    weekly_hours: int = Field(default=10, ge=1, le=80)
    preferred_learning: Literal["videos", "reading", "projects", "mixed"] = "mixed"


# ---- Strict schema Gemini must return ----

class Resource(BaseModel):
    title: str
    url: str
    type: Literal["course", "article", "video", "book", "project", "docs", "other"] = "other"


class Milestone(BaseModel):
    phase_title: str = Field(min_length=1)
    duration: str = Field(min_length=1, description="Human readable duration, e.g. '4 weeks'")
    core_topics: list[str] = Field(min_length=1)
    free_resources: list[Resource] = Field(default_factory=list)


class RoadmapPayload(BaseModel):
    """Enforced structure returned by the Gemini AI engine."""

    target_role: str
    skill_gap: list[str]
    milestones: list[Milestone] = Field(min_length=1)


class RoadmapOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    target_role: str
    profile: dict
    structured_json: dict
    created_at: datetime


class RoadmapListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    target_role: str
    created_at: datetime
