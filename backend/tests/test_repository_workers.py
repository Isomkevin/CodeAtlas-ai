"""Repository worker token-selection regression tests."""

import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.config import Settings
from app.modules.repository import workers


def test_development_demo_allows_anonymous_public_clone(monkeypatch) -> None:
    class Credentials:
        def __init__(self, *_):
            pass

        async def access_token_for(self, _):
            raise HTTPException(status_code=403, detail="GitHub has not been connected")

    monkeypatch.setattr(workers, "GitHubCredentialService", Credentials)
    repository = SimpleNamespace(credential_owner_id=uuid4())

    token = asyncio.run(
        workers._access_token_for_scan(
            repository,
            SimpleNamespace(),
            Settings(environment="development", allow_development_login=True),
        )
    )

    assert token is None


def test_non_demo_scans_still_require_github_credentials(monkeypatch) -> None:
    class Credentials:
        def __init__(self, *_):
            pass

        async def access_token_for(self, _):
            raise HTTPException(status_code=403, detail="GitHub has not been connected")

    monkeypatch.setattr(workers, "GitHubCredentialService", Credentials)
    repository = SimpleNamespace(credential_owner_id=uuid4())

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            workers._access_token_for_scan(
                repository,
                SimpleNamespace(),
                Settings(environment="test", allow_development_login=False),
            )
        )

    assert error.value.status_code == 403
