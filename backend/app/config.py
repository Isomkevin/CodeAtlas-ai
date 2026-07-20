"""Validated application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Secrets are supplied by the deployment environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="CODEATLAS_",
        extra="ignore",
    )

    environment: str = Field(
        default="development", pattern="^(development|test|staging|production)$"
    )
    app_name: str = "CodeAtlas API"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[AnyHttpUrl] = []
    database_url: str | None = None
    neo4j_uri: str | None = None
    redis_url: str | None = None
    jwt_secret: SecretStr = SecretStr("development-secret-change-before-production")
    jwt_issuer: str = "codeatlas"
    jwt_audience: str = "codeatlas-web"
    access_token_ttl_minutes: int = Field(default=30, ge=5, le=1440)
    github_client_id: str | None = None
    github_client_secret: SecretStr | None = None
    github_oauth_redirect_uri: AnyHttpUrl | None = None
    otel_service_name: str = "codeatlas-api"
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment == "production" and self.jwt_secret.get_secret_value().startswith(
            "development-"
        ):
            raise ValueError("CODEATLAS_JWT_SECRET must be configured for production")
        return self


@lru_cache
def get_settings() -> Settings:
    """Return the single settings instance used by the process."""

    return Settings()
