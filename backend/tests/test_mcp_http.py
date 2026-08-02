"""HTTP MCP protocol path — no auth, just the dispatch layer."""

from types import SimpleNamespace

import asyncio

from app.modules.mcp_http.protocol import dispatch


class _FakeGraphService:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def read_graph(self, repository_id, version_id):
        self.calls.append((repository_id, version_id))
        version = SimpleNamespace(id=repository_id)
        return version, [], []


class _FakeImplementationService:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def create_plan(self, repository_id, requested_by, change_request, version_id):
        self.calls.append((repository_id, requested_by, change_request, version_id))
        return SimpleNamespace(
            id="00000000-0000-0000-0000-000000000000",
            repository_id=repository_id,
            graph_version_id=repository_id,
            status=SimpleNamespace(value="draft"),
            change_request=change_request,
            plan_json={"tasks": []},
            pull_request_url=None,
            error=None,
            created_at=None,
        )


class _FakeRepositoryStore:
    def __init__(self, allowed: bool) -> None:
        self._allowed = allowed

    async def get(self, repository_id, org_id):
        if not self._allowed:
            return None
        return SimpleNamespace(id=repository_id)


def _context(allowed: bool = True):
    from app.modules.mcp_http.tools import ToolContext

    return ToolContext(
        claims={
            "sub": "00000000-0000-0000-0000-000000000001",
            "org": "00000000-0000-0000-0000-000000000002",
            "role": "owner",
        },
        graph_service=_FakeGraphService(),  # type: ignore[arg-type]
        implementation_service=_FakeImplementationService(),  # type: ignore[arg-type]
        repositories=_FakeRepositoryStore(allowed),  # type: ignore[arg-type]
    )


def test_initialize_returns_server_info() -> None:
    response = asyncio.run(
        dispatch(
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05"}},
            _context(),
        )
    )
    assert response is not None
    assert response["result"]["serverInfo"]["name"] == "codeatlas"
    assert response["result"]["capabilities"] == {"tools": {}}


def test_tools_list_includes_both_tools() -> None:
    response = asyncio.run(
        dispatch({"jsonrpc": "2.0", "id": 2, "method": "tools/list"}, _context())
    )
    assert response is not None
    names = {tool["name"] for tool in response["result"]["tools"]}
    assert names == {"get_architecture_graph", "create_implementation_plan"}


def test_initialized_notification_returns_none() -> None:
    assert asyncio.run(
        dispatch({"jsonrpc": "2.0", "method": "notifications/initialized"}, _context())
    ) is None


def test_unknown_method_returns_error() -> None:
    response = asyncio.run(
        dispatch({"jsonrpc": "2.0", "id": 3, "method": "does/not/exist"}, _context())
    )
    assert response is not None
    assert response["error"]["code"] == -32601


def test_tool_call_forbidden_repository() -> None:
    response = asyncio.run(
        dispatch(
            {
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {
                    "name": "get_architecture_graph",
                    "arguments": {"repository_id": "00000000-0000-0000-0000-000000000003"},
                },
            },
            _context(allowed=False),
        )
    )
    assert response is not None
    payload = response["result"]
    assert payload["isError"] is True
    text = payload["content"][0]["text"].lower()
    assert "not accessible" in text or "not found" in text


def test_tool_call_get_graph_success() -> None:
    response = asyncio.run(
        dispatch(
            {
                "jsonrpc": "2.0",
                "id": 5,
                "method": "tools/call",
                "params": {
                    "name": "get_architecture_graph",
                    "arguments": {"repository_id": "00000000-0000-0000-0000-000000000003"},
                },
            },
            _context(),
        )
    )
    assert response is not None
    import json

    payload = json.loads(response["result"]["content"][0]["text"])
    assert payload["repository_id"] == "00000000-0000-0000-0000-000000000003"
    assert payload["nodes"] == []
    assert payload["edges"] == []
