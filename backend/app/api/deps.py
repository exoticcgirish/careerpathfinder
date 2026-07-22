"""Shared FastAPI dependencies: current user, Redis, rate limiting."""
from __future__ import annotations

import time
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    return _redis


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_exc
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise creds_exc
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise creds_exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise creds_exc
    return user


async def rate_limit(
    request: Request,
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> None:
    """Simple fixed-window per-IP rate limit backed by Redis."""
    client_ip = request.client.host if request.client else "unknown"
    window = int(time.time()) // 60
    key = f"rl:{client_ip}:{request.url.path}:{window}"
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, 65)
    except Exception:
        # Fail open if Redis unavailable
        return
    if count > settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again in a minute.",
        )


CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
