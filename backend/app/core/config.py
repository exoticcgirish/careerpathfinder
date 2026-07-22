from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Career PathFinder"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://exoticcmacbookair:exoticc%40123@localhost:5432/career_pathfinder"
    )

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # Security
    JWT_SECRET_KEY: str = Field(default="change-me-in-production-please-use-a-long-random-string")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Gemini
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash-exp")

    # CORS
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:5173", "http://localhost:3000"])

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
