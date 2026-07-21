"""GitHub REST client for repository discovery; tokens never reach the browser."""

from dataclasses import dataclass

import httpx
from fastapi import HTTPException


@dataclass(frozen=True)
class GitHubRepository:
    full_name: str
    clone_url: str
    default_branch: str
    private: bool


class GitHubRepositoryClient:
    async def list_repositories(self, access_token: str) -> list[GitHubRepository]:
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {access_token}",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers
            )
        if response.is_error:
            raise HTTPException(status_code=502, detail="GitHub repository discovery failed")
        return [
            GitHubRepository(
                full_name=item["full_name"],
                clone_url=item["clone_url"],
                default_branch=item.get("default_branch") or "main",
                private=bool(item.get("private")),
            )
            for item in response.json()
            if item.get("full_name") and item.get("clone_url")
        ]
