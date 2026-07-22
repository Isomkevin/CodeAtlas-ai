# Connect CodeAtlas to AI coding agents

CodeAtlas provides a local stdio MCP bridge. The bridge can be used by Cursor, Claude Desktop, Claude Code, and OpenClaw because each supports launching a local command and passing environment variables.

## Prerequisites

1. Clone CodeAtlas on the machine where the coding agent runs.
2. Install the repository dependencies with `uv sync --all-groups`.
3. Sign in to CodeAtlas and obtain a tenant-scoped access token from the active CodeAtlas session.
4. Set the remote API URL and token locally:

   ```powershell
   $env:CODEATLAS_MCP_API_BASE_URL="https://<api-host>/api/v1"
   $env:CODEATLAS_MCP_TOKEN="<tenant-scoped-codeatlas-jwt>"
   ```

The token is short-lived and inherits its CodeAtlas workspace and repository access. Never add it to source control.

## Shared stdio definition

Run this command from the CodeAtlas repository root:

```powershell
uv run python -m app.mcp_server
```

The client configuration always needs these values:

```json
{
  "command": "uv",
  "args": ["run", "python", "-m", "app.mcp_server"],
  "env": {
    "CODEATLAS_MCP_API_BASE_URL": "https://<api-host>/api/v1",
    "CODEATLAS_MCP_TOKEN": "<tenant-scoped-codeatlas-jwt>"
  }
}
```

## Cursor

Create a personal `~/.cursor/mcp.json` or project-local `.cursor/mcp.json`. Do not commit a file containing a token.

```json
{
  "mcpServers": {
    "codeatlas": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.mcp_server"],
      "env": {
        "CODEATLAS_MCP_API_BASE_URL": "https://<api-host>/api/v1",
        "CODEATLAS_MCP_TOKEN": "<tenant-scoped-codeatlas-jwt>"
      }
    }
  }
}
```

Open Cursor in the CodeAtlas checkout or configure the command's working directory to that checkout. Cursor discovers `get_architecture_graph` and `create_implementation_plan` through `tools/list`.

## Claude Desktop

In Claude Desktop, add a local stdio extension/server through its MCP settings. If using the JSON configuration form, add this entry under `mcpServers`:

```json
{
  "codeatlas": {
    "command": "uv",
    "args": ["run", "python", "-m", "app.mcp_server"],
    "env": {
      "CODEATLAS_MCP_API_BASE_URL": "https://<api-host>/api/v1",
      "CODEATLAS_MCP_TOKEN": "<tenant-scoped-codeatlas-jwt>"
    }
  }
}
```

Restart Claude Desktop, then verify that the CodeAtlas tools appear in its tool list.

## Claude Code

From the CodeAtlas checkout, add a local MCP server:

```powershell
claude mcp add --env CODEATLAS_MCP_API_BASE_URL=https://<api-host>/api/v1 --env CODEATLAS_MCP_TOKEN=<tenant-scoped-codeatlas-jwt> --transport stdio codeatlas -- uv run python -m app.mcp_server
```

Use `claude mcp list` to confirm registration and `/mcp` inside Claude Code to verify the server is connected. Use a local or user scope for secret-bearing configuration rather than committing the token to a project `.mcp.json` file.

## OpenClaw

Register the local bridge in OpenClaw's MCP registry:

```powershell
openclaw mcp add codeatlas --command uv --arg run --arg python --arg -m --arg app.mcp_server --env CODEATLAS_MCP_API_BASE_URL=https://<api-host>/api/v1 --env CODEATLAS_MCP_TOKEN=<tenant-scoped-codeatlas-jwt>
openclaw mcp doctor codeatlas --probe
```

The `doctor --probe` command validates that OpenClaw can start the bridge and list the two CodeAtlas tools.

## Recommended prompts

- "Use CodeAtlas to retrieve the architecture graph for repository `<id>` and explain the main dependency boundaries."
- "Use CodeAtlas to create an implementation plan for `<change request>` using the latest graph version."

The bridge intentionally does not expose a generic filesystem, shell, raw source, or unrestricted GitHub tool. Keep normal coding-agent permissions separate from CodeAtlas architecture context.

## Client references

- [Cursor MCP documentation](https://docs.cursor.com/context/model-context-protocol)
- [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)
- [Claude Desktop local MCP guidance](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [OpenClaw MCP CLI documentation](https://docs.openclaw.ai/cli/mcp)
