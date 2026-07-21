"""Small stdio MCP bridge exposing only CodeAtlas graph and plan operations.

The server deliberately forwards to the tenant-scoped HTTP API. It never reads a
checkout or exposes source files, so coding agents are constrained to canonical
architecture graph context and approval-gated implementation plans.
"""

import json
import os
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_BASE_URL = os.environ.get("CODEATLAS_MCP_API_BASE_URL", "http://localhost:8000/api/v1")
API_TOKEN = os.environ.get("CODEATLAS_MCP_TOKEN", "")


TOOLS = [
    {
        "name": "get_architecture_graph",
        "description": "Read the canonical architecture graph for a connected repository.",
        "inputSchema": {
            "type": "object",
            "properties": {"repository_id": {"type": "string"}},
            "required": ["repository_id"],
        },
    },
    {
        "name": "create_implementation_plan",
        "description": (
            "Create a graph-bound implementation plan. Approval is required before PR creation."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "repository_id": {"type": "string"},
                "change_request": {"type": "string"},
                "graph_version_id": {"type": "string"},
            },
            "required": ["repository_id", "change_request"],
        },
    },
]


def _api_request(method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
    if not API_TOKEN:
        raise RuntimeError("CODEATLAS_MCP_TOKEN must contain a tenant-scoped CodeAtlas JWT")
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(
        f"{API_BASE_URL.rstrip('/')}{path}",
        data=body,
        method=method,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {API_TOKEN}",
            **({"Content-Type": "application/json"} if body else {}),
        },
    )
    try:
        with urlopen(request, timeout=30) as response:  # noqa: S310 - configurable local API endpoint
            return json.loads(response.read().decode())
    except HTTPError as error:
        details = error.read().decode(errors="replace")
        raise RuntimeError(f"CodeAtlas API returned {error.code}: {details}") from error
    except URLError as error:
        raise RuntimeError(f"Unable to reach CodeAtlas API: {error.reason}") from error


def _call_tool(name: str, arguments: dict[str, Any]) -> Any:
    repository_id = arguments.get("repository_id")
    if not isinstance(repository_id, str) or not repository_id:
        raise ValueError("repository_id is required")
    if name == "get_architecture_graph":
        return _api_request("GET", f"/repositories/{repository_id}/graph")
    if name == "create_implementation_plan":
        request = {"change_request": arguments.get("change_request")}
        if arguments.get("graph_version_id"):
            request["graph_version_id"] = arguments["graph_version_id"]
        return _api_request("POST", f"/repositories/{repository_id}/implementation-plans", request)
    raise ValueError(f"Unknown tool: {name}")


def _result(message_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": message_id, "result": result}


def _error(message_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": message_id, "error": {"code": code, "message": message}}


def handle_message(message: dict[str, Any]) -> dict[str, Any] | None:
    method = message.get("method")
    message_id = message.get("id")
    if method == "notifications/initialized":
        return None
    if method == "initialize":
        return _result(
            message_id,
            {
                "protocolVersion": message.get("params", {}).get("protocolVersion", "2024-11-05"),
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "codeatlas", "version": "0.1.0"},
            },
        )
    if method == "tools/list":
        return _result(message_id, {"tools": TOOLS})
    if method == "tools/call":
        params = message.get("params", {})
        try:
            output = _call_tool(params.get("name", ""), params.get("arguments", {}))
            return _result(message_id, {"content": [{"type": "text", "text": json.dumps(output)}]})
        except (RuntimeError, ValueError) as error:
            return _result(
                message_id,
                {"content": [{"type": "text", "text": str(error)}], "isError": True},
            )
    if method == "ping":
        return _result(message_id, {})
    return _error(message_id, -32601, f"Method not found: {method}")


def main() -> None:
    for line in sys.stdin:
        try:
            message = json.loads(line)
            response = handle_message(message)
            if response is not None:
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
        except json.JSONDecodeError:
            sys.stdout.write(json.dumps(_error(None, -32700, "Parse error")) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
