"""Streamable HTTP MCP transport (spec 2025-03-26).

One endpoint (`POST /mcp`) that:
  * accepts a single JSON-RPC message or a batch,
  * authenticates via `Authorization: Bearer <JWT|PAT>` — same as REST,
  * calls the same tool logic used by stdio + legacy SSE,
  * returns `application/json` (batched) or `202 Accepted` for pure
    notifications.

Session management is deliberately skipped: our tools are short-lived
and idempotent, so a stateless request/response works for every client
we target (Cursor, Claude Desktop, Claude Code, OpenClaw).
"""

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from app.modules.authentication.bearer import resolve_bearer_claims
from app.modules.graph.controller import get_graph_service
from app.modules.graph.service import GraphService
from app.modules.implementation.controller import get_implementation_service
from app.modules.implementation.service import ImplementationService
from app.modules.mcp_http.protocol import dispatch
from app.modules.mcp_http.tools import ToolContext
from app.modules.repository.repository import RepositoryStore
from app.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/mcp", tags=["mcp"])


async def _build_context(
    claims: dict[str, str],
    session: AsyncSession,
    graph_service: GraphService,
    implementation_service: ImplementationService,
) -> ToolContext:
    return ToolContext(
        claims=claims,
        graph_service=graph_service,
        implementation_service=implementation_service,
        repositories=RepositoryStore(session),
    )


@router.post("")
async def streamable_http(
    request: Request,
    claims: dict[str, str] = Depends(resolve_bearer_claims),
    session: AsyncSession = Depends(get_session),
    graph_service: GraphService = Depends(get_graph_service),
    implementation_service: ImplementationService = Depends(get_implementation_service),
) -> Response:
    """Handle a single MCP message (or JSON-RPC batch) and return the responses."""

    try:
        body: Any = await request.json()
    except Exception as error:
        raise HTTPException(status_code=400, detail="Body must be JSON") from error

    if not isinstance(body, (dict, list)):
        raise HTTPException(status_code=400, detail="Body must be an object or a batch array")

    context = await _build_context(claims, session, graph_service, implementation_service)
    messages = body if isinstance(body, list) else [body]

    responses: list[dict[str, Any]] = []
    for message in messages:
        if not isinstance(message, dict):
            responses.append(
                {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32600, "message": "Invalid Request"},
                }
            )
            continue
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
            responses.append(reply)

    if not responses:
        return Response(status_code=202)
    payload: Any = responses[0] if not isinstance(body, list) else responses
    return JSONResponse(payload)
