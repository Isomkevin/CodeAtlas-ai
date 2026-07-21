import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.modules.repository.service import RepositoryService


def test_connect_normalizes_github_url() -> None:
    created: dict[str, str] = {}

    class Store:
        async def find(self, *_):
            return None

        async def create(self, _, full_name, clone_url, branch):
            created.update(full_name=full_name, clone_url=clone_url, branch=branch)
            return SimpleNamespace()

        async def commit(self):
            return None

    asyncio.run(
        RepositoryService(Store()).connect(uuid4(), "git@github.com:codeatlas/api.git", "main")
    )

    assert created == {
        "full_name": "codeatlas/api",
        "clone_url": "https://github.com/codeatlas/api.git",
        "branch": "main",
    }


def test_scan_requires_owned_repository() -> None:
    class Store:
        async def get(self, *_):
            return None

    with pytest.raises(HTTPException) as error:
        asyncio.run(RepositoryService(Store()).request_scan(uuid4(), uuid4()))

    assert error.value.status_code == 404
