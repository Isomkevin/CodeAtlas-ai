"""Redis-backed repository progress event publication."""

import json
from typing import Any
from uuid import UUID

from redis.asyncio import Redis


def repository_channel(repository_id: UUID) -> str:
    return f"codeatlas:repository:{repository_id}:events"


async def publish_repository_event(
    redis_url: str | None, repository_id: UUID, event: dict[str, Any]
) -> None:
    if not redis_url:
        return
    redis = Redis.from_url(redis_url)
    try:
        await redis.publish(repository_channel(repository_id), json.dumps(event))
    finally:
        await redis.aclose()
