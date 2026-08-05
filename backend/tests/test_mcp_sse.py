"""SSE transport unit tests — session registry + dispatch routing."""

import asyncio
import json
from types import SimpleNamespace

from app.modules.mcp_http import sse as sse_module
from app.modules.mcp_http.protocol import dispatch
from app.modules.mcp_http.tools import ToolContext


class _FakeGraphService:
    async def read_graph(self, repository_id, version_id):
        return SimpleNamespace(id=repository_id), [], []


class _FakeImplementationService:
    async def create_plan(self, *args, **kwargs):
        raise AssertionError("not called in these tests")


class _FakeRepositoryStore:
    async def get(self, repository_id, org_id):
        return SimpleNamespace(id=repository_id)


def _context() -> ToolContext:
    return ToolContext(
        claims={
            "sub": "00000000-0000-0000-0000-000000000001",
            "org": "00000000-0000-0000-0000-000000000002",
            "role": "owner",
        },
        graph_service=_FakeGraphService(),  # type: ignore[arg-type]
        implementation_service=_FakeImplementationService(),  # type: ignore[arg-type]
        repositories=_FakeRepositoryStore(),  # type: ignore[arg-type]
    )


def test_session_registry_round_trip() -> None:
    async def scenario() -> tuple[str, str | None]:
        session = sse_module.SseSession("abc123", _context().claims)
        sse_module._register(session)
        assert sse_module._resolve("abc123") is session
        await session.send({"jsonrpc": "2.0", "id": 1, "result": {"ok": True}})
        item = await session.queue.get()
        sse_module._drop("abc123")
        return session.session_id, item

    session_id, item = asyncio.run(scenario())
    assert session_id == "abc123"
    assert item is not None
    parsed = json.loads(item)
    assert parsed["result"]["ok"] is True
    assert sse_module._resolve("abc123") is None


def test_session_close_ends_stream() -> None:
    async def scenario() -> str | None:
        session = sse_module.SseSession("closer", _context().claims)
        await session.close()
        return await session.queue.get()

    assert asyncio.run(scenario()) is None


def test_resolve_returns_none_for_unknown() -> None:
    assert sse_module._resolve("does-not-exist") is None


def test_dispatch_returns_none_for_notifications_so_sse_stays_quiet() -> None:
    reply = asyncio.run(
        dispatch({"jsonrpc": "2.0", "method": "notifications/initialized"}, _context())
    )
    assert reply is None


def test_dispatch_tools_list_yields_message_payload() -> None:
    reply = asyncio.run(
        dispatch({"jsonrpc": "2.0", "id": 7, "method": "tools/list"}, _context())
    )
    assert reply is not None
    assert reply["id"] == 7
    assert {tool["name"] for tool in reply["result"]["tools"]} == {
        "get_architecture_graph",
        "create_implementation_plan",
    }
