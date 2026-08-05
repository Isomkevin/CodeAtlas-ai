"""Legacy MCP transport — SSE (spec 2024-11-05).

Older MCP clients (pre-Streamable-HTTP) speak this two-endpoint pattern:

  1. Client opens `GET /mcp/sse` — server responds with an EventStream.
     The first event is `endpoint`; its `data` is the URL the client
     should POST subsequent JSON-RPC messages to.
  2. Client `POST /mcp/messages?session_id=…` — server acknowledges 202
     and delivers the JSON-RPC response through the SSE stream as a
     `message` event.

We share the same dispatch layer and tool implementations with the
Streamable HTTP transport in `controller.py`.

Session state lives in a module-level dict of `SseSession`. Fine for the
single-instance Render Free deploy; if we horizontally scale later,
this needs to move to Redis pub/sub (same channel pattern already used
by repository events).
"""

import asyncio
import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.bearer import resolve_bearer_from_token
from app.modules.graph.controller import get_graph_service
from app.modules.graph.service import GraphService
from app.modules.implementation.controller import get_implementation_service
from app.modules.implementation.service import ImplementationService
from app.modules.mcp_http.protocol import dispatch
from app.modules.mcp_http.tools import ToolContext
from app.modules.repository.repository import RepositoryStore

router = APIRouter(prefix="/mcp", tags=["mcp"])

_KEEPALIVE_SECONDS = 15
"""Send an SSE comment ping every 15s so Cloudflare / Render idle
timeouts (default ~100s) don't kill the stream during quiet periods."""


class SseSession:
    """Per-client state — an outgoing queue plus the caller's claims."""

    def __init__(self, session_id: str, claims: dict[str, str]) -> None:
        self.session_id = session_id
        self.claims = claims
        self.queue: asyncio.Queue[str | None] = asyncio.Queue()

    async def send(self, payload: dict[str, Any]) -> None:
        await self.queue.put(json.dumps(payload))

    async def close(self) -> None:
        await self.queue.put(None)


_sessions: dict[str, SseSession] = {}


def _register(session: SseSession) -> None:
    _sessions[session.session_id] = session


def _resolve(session_id: str) -> SseSession | None:
    return _sessions.get(session_id)


def _drop(session_id: str) -> None:
    _sessions.pop(session_id, None)


async def _extract_bearer(
    request: Request,
    access_token: str | None,
    settings: Settings,
    db_session: AsyncSession,
) -> dict[str, str]:
    """Accept `Authorization: Bearer …` OR `?access_token=…` for browser-driven
    EventSource clients that can't attach headers."""

    token: str | None = None
    header = request.headers.get("Authorization")
    if header and header.lower().startswith("bearer "):
        token = header[7:].strip()
    elif access_token:
        token = access_token
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return await resolve_bearer_from_token(token, db_session, settings)


@router.get("/sse", tags=["mcp"])
async def sse_stream(
    request: Request,
    access_token: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    db_session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Open an MCP SSE stream. First event names the POST endpoint."""

    claims = await _extract_bearer(request, access_token, settings, db_session)
    session_id = uuid.uuid4().hex
    session = SseSession(session_id, claims)
    _register(session)

    prefix = settings.api_v1_prefix.rstrip("/")
    endpoint_url = f"{prefix}/mcp/messages?session_id={session_id}"

    async def event_stream():
        try:
            yield f"event: endpoint\ndata: {endpoint_url}\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(session.queue.get(), timeout=_KEEPALIVE_SECONDS)
                except asyncio.TimeoutError:
                    if await request.is_disconnected():
                        break
                    yield ": ping\n\n"
                    continue
                if payload is None:
                    break
                yield f"event: message\ndata: {payload}\n\n"
                if await request.is_disconnected():
                    break
        finally:
            _drop(session_id)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/messages", status_code=202)
async def post_message(
    request: Request,
    session_id: str = Query(..., description="SSE session id issued by /mcp/sse"),
    db_session: AsyncSession = Depends(get_session),
    graph_service: GraphService = Depends(get_graph_service),
    implementation_service: ImplementationService = Depends(get_implementation_service),
) -> dict[str, str]:
    """Route a client JSON-RPC message to the correct SSE stream.

    Auth is inherited from the SSE session — the session_id serves as
    the shared secret between server and client for the duration of
    the connection. This mirrors the reference MCP SSE pattern and
    avoids the coding agent having to re-attach headers on every POST.
    """

    session = _resolve(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="SSE session not found")

    try:
        message = await request.json()
    except Exception as error:
        raise HTTPException(status_code=400, detail="Body must be JSON") from error

    if not isinstance(message, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON-RPC object")

    context = ToolContext(
        claims=session.claims,
        graph_service=graph_service,
        implementation_service=implementation_service,
        repositories=RepositoryStore(db_session),
    )

    try:
        reply = await dispatch(message, context)
    except asyncio.CancelledError:
        raise
    except Exception as error:  # noqa: BLE001 - JSON-RPC error boundary
        reply = {
            "jsonrpc": "2.0",
            "id": message.get("id"),
            "error": {"code": -32603, "message": f"Internal error: {error}"},
        }

    if reply is not None:
        await session.send(reply)

    return {"status": "accepted"}
