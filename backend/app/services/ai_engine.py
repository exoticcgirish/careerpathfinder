"""
Gemini AI engine.

Uses Gemini's structured JSON output (response_mime_type='application/json' +
response_schema) so the model is forced to return a payload matching
RoadmapPayload. The result is parsed and validated with Pydantic before being
returned to callers.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import google.generativeai as genai
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.roadmap import AssessmentInput, RoadmapPayload

logger = logging.getLogger(__name__)

_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    _configured = True


# JSON Schema Gemini must obey.
RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "target_role": {"type": "string"},
        "skill_gap": {"type": "array", "items": {"type": "string"}},
        "milestones": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "phase_title": {"type": "string"},
                    "duration": {"type": "string"},
                    "core_topics": {"type": "array", "items": {"type": "string"}},
                    "free_resources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "url": {"type": "string"},
                                "type": {"type": "string"},
                            },
                            "required": ["title", "url"],
                        },
                    },
                },
                "required": ["phase_title", "duration", "core_topics", "free_resources"],
            },
        },
    },
    "required": ["target_role", "skill_gap", "milestones"],
}


def _build_prompt(profile: AssessmentInput) -> str:
    return f"""
You are an expert career coach and curriculum designer.

Build a personalized, realistic career roadmap for the following learner.
Return ONLY JSON matching the provided schema. Do not include prose, markdown,
or code fences. Every free resource URL MUST be real, publicly accessible, and
free (official docs, freeCodeCamp, MDN, YouTube channels, university OCW,
open-source projects, etc.). Provide 4-7 milestones ordered chronologically.

LEARNER PROFILE
- Career goal: {profile.career_goal}
- Experience level: {profile.experience_level}
- Current skills: {", ".join(profile.current_skills) or "none stated"}
- Interests: {", ".join(profile.interests) or "none stated"}
- Weekly study hours available: {profile.weekly_hours}
- Preferred learning style: {profile.preferred_learning}

REQUIREMENTS
- `target_role` = concrete job title the learner should aim for.
- `skill_gap` = specific skills they must acquire, ordered by priority.
- Each milestone has `phase_title`, `duration` (e.g. "3 weeks"),
  `core_topics` (concrete concepts), and `free_resources`
  (2-5 items, each with title, url, and type in
  [course, article, video, book, project, docs, other]).
""".strip()


async def generate_roadmap(profile: AssessmentInput) -> RoadmapPayload:
    """Call Gemini in a worker thread (SDK is sync) and validate the result."""
    _configure()

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": RESPONSE_SCHEMA,
            "temperature": 0.4,
        },
    )
    prompt = _build_prompt(profile)

    def _invoke() -> str:
        response = model.generate_content(prompt)
        return response.text or ""

    try:
        raw = await asyncio.to_thread(_invoke)
    except Exception as exc:  # network / provider errors
        logger.exception("Gemini call failed")
        raise RuntimeError(f"AI provider request failed: {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Gemini returned non-JSON: %s", raw[:500])
        raise RuntimeError("AI returned invalid JSON") from exc

    try:
        return RoadmapPayload.model_validate(data)
    except ValidationError as exc:
        logger.error("Gemini payload failed schema validation: %s", exc)
        raise RuntimeError(f"AI payload did not match schema: {exc}") from exc
