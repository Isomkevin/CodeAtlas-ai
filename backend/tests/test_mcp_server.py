from app.mcp_server import TOOLS, handle_message


def test_mcp_initialization_and_tool_listing_are_protocol_valid() -> None:
    initialized = handle_message(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {"protocolVersion": "2024-11-05"},
        }
    )
    tools = handle_message({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})

    assert initialized is not None
    assert initialized["result"]["capabilities"] == {"tools": {}}
    assert tools is not None
    assert tools["result"]["tools"] == TOOLS
