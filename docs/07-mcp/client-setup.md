# Connect CodeAtlas to AI coding agents

CodeAtlas exposes two MCP transports:

1. **Remote HTTP** (recommended) — the hosted CodeAtlas backend serves MCP directly at `https://<api-host>/api/v1/mcp`. Coding agents authenticate with an `Authorization: Bearer <PAT>` header. **No Python, no repo clone, no `uv`.**
2. **Local stdio** — a small local Python process (`app.mcp_server`) forwards to the CodeAtlas API. Use this for offline development against a local backend, or if your MCP client doesn't support HTTP transport yet.

Both transports expose the same two tools:

- `get_architecture_graph` — read the canonical architecture graph for a connected repository.
- `create_implementation_plan` — create a graph-bound implementation plan from a change request.

The bridge does **not** expose your source files, shell, filesystem, or a generic GitHub client. It only forwards allowed tool calls to the CodeAtlas API using a token you control.

---

## 1. Get a CodeAtlas MCP token (both transports)

Both transports authenticate with a **personal access token (PAT)**. Unlike a browser session, a PAT does not expire when you sign out — it stays valid until you revoke it.

1. Open the live app: **https://code-atlas-ai-henna.vercel.app**
2. Sign in via GitHub OAuth.
3. Navigate to **AI Agents** in the sidebar.
4. Click **Generate MCP token**.
5. Give it a descriptive name — e.g. `Claude Code — MacBook Pro`, `Cursor — Work Desktop`. This is how you'll identify it when revoking later.
6. Click **Generate**.
7. The token is displayed **once**, starting with `cak_...`. Copy it now.

If you lose the token you cannot recover it — revoke it from the Agents page and generate a new one.

---

## 2. Remote HTTP setup (recommended)

Endpoint: `https://codeatlas-api-r0e9.onrender.com/api/v1/mcp`

Pick your client below.

### Cursor

Create or edit `~/.cursor/mcp.json` (user scope) or `.cursor/mcp.json` (project scope — **do not commit** if it contains a token).

```json
{
  "mcpServers": {
    "codeatlas": {
      "url": "https://codeatlas-api-r0e9.onrender.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <PASTE-cak-TOKEN-HERE>"
      }
    }
  }
}
```

**Verify:** Restart Cursor. Ask the AI chat "list your MCP tools" — you should see `get_architecture_graph` and `create_implementation_plan`.

### Claude Desktop

Config location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "codeatlas": {
      "url": "https://codeatlas-api-r0e9.onrender.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <PASTE-cak-TOKEN-HERE>"
      }
    }
  }
}
```

Requires Claude Desktop 0.7+ (Streamable HTTP transport support).

**Verify:** Restart Claude Desktop. Click the hammer/tools icon — the two tools should appear.

### Claude Code (CLI)

One command:

```bash
claude mcp add codeatlas \
  --scope user \
  --transport http \
  --header "Authorization: Bearer <PASTE-cak-TOKEN-HERE>" \
  https://codeatlas-api-r0e9.onrender.com/api/v1/mcp
```

Prefer `--scope user` so the token lands in `~/.claude.json` rather than a project `.mcp.json` that might leak via git.

**Verify:** `claude mcp list` should show `codeatlas` as ✓ Connected. Inside a `claude` session, `/mcp` lists the tools.

### OpenClaw

```bash
openclaw mcp add codeatlas \
  --url https://codeatlas-api-r0e9.onrender.com/api/v1/mcp \
  --header "Authorization: Bearer <PASTE-cak-TOKEN-HERE>"

openclaw mcp doctor codeatlas --probe
```

**Verify:** `doctor --probe` prints both tool names.

---

## 3. Legacy SSE setup (only if your client requires the 2024-11-05 transport)

Modern MCP clients — Cursor, Claude Desktop 0.7+, Claude Code with `--transport http`, OpenClaw — all support the Streamable HTTP transport above and should use it. Use this SSE compat path only if your client explicitly requires the older two-endpoint pattern.

Two endpoints are involved:

- `GET https://codeatlas-api-r0e9.onrender.com/api/v1/mcp/sse` — open with `Authorization: Bearer <cak-token>` **or** append `?access_token=<cak-token>` for EventSource clients that can't attach headers.
- `POST https://codeatlas-api-r0e9.onrender.com/api/v1/mcp/messages?session_id=<id>` — the endpoint URL is delivered to the client in the first SSE `endpoint` event; the client does not compose it by hand.

Manually verify the transport with `curl`:

```bash
curl -N -H "Authorization: Bearer <cak-token>" \
  https://codeatlas-api-r0e9.onrender.com/api/v1/mcp/sse
```

Expected: an EventStream that starts with:

```
event: endpoint
data: /api/v1/mcp/messages?session_id=<hex>
```

Then, in another terminal, POST a JSON-RPC message to the URL from the `data:` line. The response arrives back on the SSE stream as `event: message`.

Client-specific SSE configuration varies. Consult your client's docs.

---

## 4. Local stdio setup (advanced)

Use this if you're developing CodeAtlas locally, or your MCP client doesn't support HTTP transport.

### Prereqs

1. **CodeAtlas checkout:**

   ```bash
   git clone https://github.com/Isomkevin/CodeAtlas-ai.git
   cd CodeAtlas-ai
   ```

2. **Python 3.13+ and [uv](https://docs.astral.sh/uv/).**

   ```bash
   python --version
   # Install uv if needed:
   #   macOS/Linux:  curl -LsSf https://astral.sh/uv/install.sh | sh
   #   Windows:      irm https://astral.sh/uv/install.ps1 | iex
   ```

3. **Backend dependencies:**

   ```bash
   uv sync --all-groups
   ```

   Sanity check — the bridge module resolves:

   ```bash
   uv run python -c "import app.mcp_server; print('ok')"
   ```

### Cursor / Claude Desktop (JSON config)

```json
{
  "mcpServers": {
    "codeatlas": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/CodeAtlas-ai", "run", "python", "-m", "app.mcp_server"],
      "env": {
        "CODEATLAS_MCP_API_BASE_URL": "https://codeatlas-api-r0e9.onrender.com/api/v1",
        "CODEATLAS_MCP_TOKEN": "<PASTE-cak-TOKEN-HERE>"
      }
    }
  }
}
```

The `--directory` argument tells `uv` where the CodeAtlas checkout lives, because Claude Desktop doesn't inherit a working directory and Cursor's cwd handling varies.

### Claude Code (CLI)

```bash
claude mcp add codeatlas \
  --scope user \
  --transport stdio \
  --env CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 \
  --env CODEATLAS_MCP_TOKEN=<PASTE-cak-TOKEN-HERE> \
  -- uv --directory /absolute/path/to/CodeAtlas-ai run python -m app.mcp_server
```

### OpenClaw

```bash
openclaw mcp add codeatlas \
  --command uv \
  --arg --directory --arg /absolute/path/to/CodeAtlas-ai \
  --arg run --arg python --arg -m --arg app.mcp_server \
  --env CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 \
  --env CODEATLAS_MCP_TOKEN=<PASTE-cak-TOKEN-HERE>

openclaw mcp doctor codeatlas --probe
```

---

## 5. Try it end-to-end

Once configured (either transport), ask your agent:

> "Use CodeAtlas to fetch the architecture graph for repository `<repository-id>` and summarize the top 5 dependencies."

Find your repository id in the CodeAtlas UI under **Repositories** — it's the UUID column.

For a plan:

> "Use CodeAtlas to create an implementation plan for adding pagination to the /repositories endpoint."

The agent should call `create_implementation_plan`. Head back to CodeAtlas → **Implementation** to review the draft, approve it as owner/admin, and then either use the agent to draft the actual code changes or open a PR via CodeAtlas' Open PR dialog.

---

## 6. Troubleshooting

### "Personal access token is invalid or revoked"

Either the token was revoked (check the token list on Settings → Agents) or the token was truncated on paste. Generate a fresh one and update your client config.

### "Unable to reach CodeAtlas API" / timeouts

- Confirm the URL. Remote HTTP endpoint is `https://codeatlas-api-r0e9.onrender.com/api/v1/mcp`. Local stdio's `CODEATLAS_MCP_API_BASE_URL` is `https://codeatlas-api-r0e9.onrender.com/api/v1` (no `/mcp` suffix — the bridge appends its own paths).
- On free-tier Render, the API may hibernate after inactivity; the first request wakes it and can take 30–60 seconds. Retry.

### Bridge process fails to start (stdio only)

Run the bridge directly to see the error:

```bash
cd /absolute/path/to/CodeAtlas-ai
CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 \
CODEATLAS_MCP_TOKEN=<your-token> \
uv run python -m app.mcp_server
```

Paste a probe message to stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}
```

Expected response: a JSON line with `"serverInfo":{"name":"codeatlas"...}`.

### Manually probe the remote HTTP endpoint

```bash
curl -X POST https://codeatlas-api-r0e9.onrender.com/api/v1/mcp \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected: JSON response with two tools listed.

### Tools don't show up in the client

- Cursor / Claude Desktop: restart the client after editing the config.
- Claude Code: run `claude mcp list` — if it says "Failed to connect", check the URL and token.
- If you're on stdio, confirm the `--directory` value points to a real CodeAtlas checkout with `pyproject.toml` at its root.

### Repository access denied (403)

The PAT carries your CodeAtlas workspace role. If the API returns 403 on `get_architecture_graph`, your workspace doesn't have access to that repository. Connect the repository from **Settings → Integrations → Connect GitHub** first.

---

## 7. Security notes

- **Treat a PAT like a password.** It carries your workspace role and doesn't require any second factor.
- **Never commit a PAT.** Don't put it in `.mcp.json`, `.cursor/mcp.json`, or any other file that might land in git. Use user-scope config files.
- **Rotate tokens per client** — one PAT per machine + client combination makes revocation surgical.
- **Revoke via the UI** at Settings → Agents. Revocation is instant; any in-flight bridge process will get 401 on its next tool call.
- The bridge/endpoint never exposes shell, filesystem, or raw source files. Coding agents should still be given their own file-editing tools — CodeAtlas is context, not a code editor.

---

## Reference

- [MCP protocol details](protocol.md)
- [Available tools](tools.md)
- Cursor: <https://docs.cursor.com/context/model-context-protocol>
- Claude Code: <https://code.claude.com/docs/en/mcp>
- Claude Desktop: <https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop>
- OpenClaw: <https://docs.openclaw.ai/cli/mcp>
