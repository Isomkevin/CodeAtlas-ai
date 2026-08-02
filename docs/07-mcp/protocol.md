# CodeAtlas MCP protocol

Status: implemented

CodeAtlas exposes a standards-compliant JSON-RPC MCP server. It gives coding agents architecture context without exposing a repository checkout or source files.

## Transports

- **Streamable HTTP (recommended)** — the hosted CodeAtlas API exposes MCP at `POST https://<api-host>/api/v1/mcp`. Coding agents authenticate with an `Authorization: Bearer <PAT>` header. No local install required. Follows the MCP 2025-03-26 Streamable HTTP transport spec.
- **Local stdio** — the `app.mcp_server` module runs as a local Python process and forwards to the CodeAtlas HTTP API. Use for offline development against a local backend, or when your MCP client only supports stdio.

Both transports share the same JSON-RPC dispatch logic and expose the same two tools.

## Compatibility

Cursor, Claude Desktop (0.7+), Claude Code (`--transport http` or `--transport stdio`), and OpenClaw all support the recommended HTTP transport. See [client setup](client-setup.md) for copyable configuration examples.

## Security boundary

The MCP bridge is a small local process that forwards requests to the tenant-scoped CodeAtlas HTTP API. It requires:

- `CODEATLAS_MCP_API_BASE_URL`, for example `https://codeatlas-api-r0e9.onrender.com/api/v1`
- `CODEATLAS_MCP_TOKEN`, a CodeAtlas **personal access token** (starts with `cak_`) minted from Settings → Agents

Personal access tokens are long-lived and workspace-scoped. They carry the issuer's workspace role and can be revoked at any time from the CodeAtlas UI. The bridge accepts both PATs and short-lived session JWTs, but PATs are the recommended mode for local coding agents because they survive browser sign-out.

The bridge sends the token only as an API bearer credential. It never reads a local checkout, clones a repository, or exposes raw source files to an agent. The API still enforces the caller's workspace and repository authorization.

Treat the MCP token as a secret. Store it in the agent's user-scope local configuration; never commit it to `.cursor/mcp.json`, `.mcp.json`, or another shared configuration file.

## Implemented tools

| Tool | Purpose | Guardrail |
| --- | --- | --- |
| `get_architecture_graph` | Reads the canonical architecture graph for one connected repository. | Requires repository access and returns only graph data. |
| `create_implementation_plan` | Creates a graph-bound implementation plan from a change request. | The plan remains a draft until an owner or admin approves it before PR creation. |

Each tool requires `repository_id`. `create_implementation_plan` also requires `change_request` and accepts an optional `graph_version_id`.

## Transport lifecycle

1. The agent launches `python -m app.mcp_server` as a local stdio process.
2. The client sends `initialize`, `tools/list`, and `tools/call` JSON-RPC messages.
3. The bridge forwards allowed tool calls to the CodeAtlas API using the tenant-scoped JWT.
4. The API checks workspace and repository access before returning graph data or creating a plan.

The server implements `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`.

## Verification

Run the MCP protocol test from the repository root:

```powershell
uv run pytest backend/tests/test_mcp_server.py
```

To manually verify a configured client, ask it to list CodeAtlas tools, then request the architecture graph for a repository you are authorized to access.
