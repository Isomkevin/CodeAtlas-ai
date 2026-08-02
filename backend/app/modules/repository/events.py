"""Authenticated WebSocket stream for repository scan progress."""

from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.config import get_settings
from app.database import create_session_factory
from app.events import repository_channel
from app.modules.authentication.bearer import resolve_bearer_from_token
from app.modules.repository.repository import RepositoryStore

router = APIRouter(tags=["repository-events"])


@router.websocket("/repositories/{repository_id}/events")
async def repository_events(websocket: WebSocket, repository_id: UUID) -> None:
    settings = get_settings()
    token = websocket.query_params.get("access_token")
    if not token or not settings.database_url or not settings.redis_url:
        await websocket.close(code=1008)
        return
    try:
        session_factory = create_session_factory(settings.database_url)
        async with session_factory() as session:
            claims = await resolve_bearer_from_token(token, session, settings)
            repository = await RepositoryStore(session).get(repository_id, UUID(claims["org"]))
        if repository is None:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    redis = Redis.from_url(settings.redis_url)
    pubsub = redis.pubsub()
    try:
        await pubsub.subscribe(repository_channel(repository_id))
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and isinstance(message.get("data"), bytes | str):
                data = message["data"]
                await websocket.send_text(data.decode() if isinstance(data, bytes) else data)
    except WebSocketDisconnect:
        return
    finally:
        await pubsub.unsubscribe(repository_channel(repository_id))
        await pubsub.aclose()
        await redis.aclose()
