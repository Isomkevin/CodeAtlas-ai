"""Internal public service for securely reading GitHub credentials."""

from uuid import UUID

from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.config import Settings
from app.modules.authentication.repository import AuthenticationRepository


class GitHubCredentialService:
    def __init__(self, repository: AuthenticationRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    async def access_token_for(self, user_id: UUID) -> str:
        credential = await self._repository.get_github_credential(user_id)
        if credential is None:
            raise HTTPException(status_code=403, detail="GitHub has not been connected")
        key = self._settings.github_token_encryption_key
        if key is None:
            if self._settings.environment == "production":
                raise RuntimeError("GitHub token encryption key is not configured")
            return credential.encrypted_access_token
        return (
            Fernet(key.get_secret_value().encode())
            .decrypt(credential.encrypted_access_token.encode())
            .decode()
        )
