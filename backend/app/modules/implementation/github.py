"""Minimal GitHub pull-request adapter used after human approval."""

from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class CreatedPullRequest:
    url: str
    number: int


class GitHubPullRequestClient:
    async def create_pull_request(
        self, token: str, full_name: str, title: str, body: str, head: str, base: str
    ) -> CreatedPullRequest:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"https://api.github.com/repos/{full_name}/pulls",
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {token}",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                json={"title": title, "body": body, "head": head, "base": base},
            )
        response.raise_for_status()
        payload = response.json()
        return CreatedPullRequest(url=payload["html_url"], number=payload["number"])
