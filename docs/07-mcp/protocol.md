# CodeAtlas MCP protocol

Status: implemented.

CodeAtlas exposes a standards-compliant JSON-RPC MCP server so coding agents can consume architecture context without ever seeing a repository checkout or raw source files.

## Transports

CodeAtlas ships **two transports** that share one dispatch layer and expose an identical tool surface:

| Transport | Location | Auth | Use case |
|---|---|---|---|
| **Streamable HTTP** (recommended) | `POST /api/v1/mcp` on the deployed API | `Authorization: Bearer <cak_...>` PAT | Any MCP-capable coding agent; no local install |
| **Local stdio** | `python -m app.mcp_server` in a checkout | `CODEATLAS_MCP_TOKEN=cak_...` env var | Offline development against a local backend |

Streamable HTTP follows the MCP 2025-03-26 transport spec — one endpoint that returns JSON responses (or SSE if we later stream long-running tools). It is stateless: no session id is required because both tools are short-lived and idempotent.

The stdio bridge is a tiny Python process that reads JSON-RPC on stdin and forwards each `tools/call` to the same CodeAtlas API. It exists for offline dev; the HTTP transport is the primary path.

## Compatibility

| Client | HTTP | Stdio |
|---|---|---|
| Cursor | ✅ | ✅ |
| Claude Desktop 0.7+ | ✅ | ✅ (older versions) |
| Claude Code (CLI) | ✅ `--transport http` | ✅ `--transport stdio` |
| OpenClaw | ✅ | ✅ |

Copyable per-client configuration examples: [client setup](client-setup.md).

## Security boundary

Both transports require:

- **API base** — for HTTP the URL directly (e.g. `https://codeatlas-api-r0e9.onrender.com/api/v1/mcp`); for stdio the env var `CODEATLAS_MCP_API_BASE_URL`.
- **Bearer credential** — a **Personal Access Token** (`cak_...`) minted at Settings → Agents. HTTP sends it in the `Authorization` header; stdio via `CODEATLAS_MCP_TOKEN`.

Personal access tokens are long-lived, workspace-scoped, and carry the issuer's role. They can be revoked at any time from the CodeAtlas UI. Both transports also accept short-lived session JWTs for browser-driven flows, but PATs are the recommended mode for coding agents because they survive browser sign-out.

Neither transport reads a local checkout, clones a repository, or exposes raw source files to an agent. The API enforces the caller's workspace and repository authorization on every tool call.

**Treat the MCP token as a password.** Store it in the agent's user-scope local configuration; never commit it to `.cursor/mcp.json`, `.mcp.json`, or another shared configuration file. See the security notes in [client setup](client-setup.md#6-security-notes) for the rotation and revocation model.

## Implemented tools

| Tool | Purpose | Guardrail |
|---|---|---|
| `get_architecture_graph` | Read the canonical architecture graph for one connected repository. | Requires repository access; returns only graph data (no source files). |
| `create_implementation_plan` | Create a graph-bound implementation plan from a change request. | Draft until an owner or admin approves; approval required before a PR can open. |

Argument shapes: see [tools](tools.md).

## Wire protocol

The server implements `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`. Both transports use the same dispatch layer (`backend/app/modules/mcp_http/protocol.py`).

**HTTP lifecycle:**

1. Coding agent sends `POST /api/v1/mcp` with a single JSON-RPC message or a batch array.
2. API validates the bearer credential (PAT or JWT) via the shared resolver (`backend/app/modules/authentication/bearer.py`).
3. Dispatcher routes each message; `tools/call` invokes the CodeAtlas internal services directly (no self-HTTP hop).
4. Response is `application/json` (single or batch). Pure notifications get HTTP 202 Accepted with an empty body.

**Stdio lifecycle:**

1. Coding agent spawns `python -m app.mcp_server` as a subprocess.
2. Client sends JSON-RPC lines on stdin; server responds on stdout.
3. Every tool call is proxied to the CodeAtlas HTTP API using the PAT.

## Error surface

Tool failures — including expected backend outages like Neo4j Aura hibernation — return as MCP `content` with `isError: true` and a readable message, **not** JSON-RPC `-32603 Internal error`. This means a coding agent sees "graph unavailable, retry later" and can continue the conversation, rather than a transport failure.

Retryable Neo4j errors (auth error during Aura resume, service unavailable) are automatically retried by the graph store with 2s / 5s / 10s backoff before the outer tool call gives up.

## Verification

**Server-side unit tests:**

```powershell
uv run pytest backend/tests/test_mcp_server.py
uv run pytest backend/tests/test_mcp_http.py
```

**Manual HTTP probe against the deployed endpoint:**

```powershell
curl -X POST https://codeatlas-api-r0e9.onrender.com/api/v1/mcp `
  -H "Authorization: Bearer <cak-token>" `
  -H "Content-Type: application/json" `
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Manual verification via a configured client:**

Ask the coding agent to list its MCP tools, then request the architecture graph for a repository the workspace can access. Full walkthrough: [client setup](client-setup.md#4-try-it-end-to-end).
