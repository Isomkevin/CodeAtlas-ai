"""Shared MCP JSON-RPC message dispatch used by every HTTP transport.

Handles `initialize`, `notifications/initialized`, `ping`, `tools/list`,
`tools/call`. Tool logic itself lives in `tools.py` so different transports
(Streamable HTTP, legacy SSE) can share the exact same behavior.
"""

from typing import Any

from app.modules.mcp_http.tools import TOOLS, ToolContext, call_tool

PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {"name": "codeatlas", "version": "0.1.0"}


def _result(message_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": message_id, "result": result}


def _error(message_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": message_id, "error": {"code": code, "message": message}}


async def dispatch(message: dict[str, Any], context: ToolContext) -> dict[str, Any] | None:
    """Dispatch a single MCP message; return the JSON-RPC response, or None for notifications."""

    method = message.get("method")
    message_id = message.get("id")

    if method == "notifications/initialized":
        return None
    if method == "initialize":
        params = message.get("params") or {}
        return _result(
            message_id,
            {
                "protocolVersion": params.get("protocolVersion") or PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": SERVER_INFO,
            },
        )
    if method == "ping":
        return _result(message_id, {})
    if method == "tools/list":
        return _result(message_id, {"tools": TOOLS})
    if method == "tools/call":
        params = message.get("params") or {}
        name = params.get("name") or ""
        arguments = params.get("arguments") or {}
        try:
            output = await call_tool(name, arguments, context)
            import json

            return _result(
                message_id, {"content": [{"type": "text", "text": json.dumps(output)}]}
            )
        except (RuntimeError, ValueError) as error:
            return _result(
                message_id,
                {"content": [{"type": "text", "text": str(error)}], "isError": True},
            )

    return _error(message_id, -32601, f"Method not found: {method}")
