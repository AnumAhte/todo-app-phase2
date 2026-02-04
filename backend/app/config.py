from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str
    JWT_SECRET: str
    BETTER_AUTH_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str
    CLOCK_SKEW_SECONDS: int = 30  # Clock skew tolerance for JWT validation

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
