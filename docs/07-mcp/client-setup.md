# Connect CodeAtlas to AI coding agents

CodeAtlas ships a local **stdio MCP bridge** that any MCP-capable coding agent — Cursor, Claude Desktop, Claude Code, OpenClaw, and others — can launch as a subprocess. Once configured, the agent gains two CodeAtlas tools:

- `get_architecture_graph` — read the canonical architecture graph for a connected repository.
- `create_implementation_plan` — create a graph-bound implementation plan from a change request.

The bridge does **not** expose your source files, shell, filesystem, or a generic GitHub client. It only forwards allowed tool calls to the CodeAtlas API using a token you control.

---

## 1. Prerequisites (one-time, per machine)

You need three things on the machine where your coding agent runs:

**a) A CodeAtlas checkout.** The bridge process lives in this repo.

```powershell
git clone https://github.com/Isomkevin/CodeAtlas-ai.git
cd CodeAtlas-ai
```

**b) Python 3.13+ and [uv](https://docs.astral.sh/uv/).**

```powershell
# Verify Python
python --version

# Install uv if you don't have it
irm https://astral.sh/uv/install.ps1 | iex
```

**c) Backend dependencies installed.**

```powershell
uv sync --all-groups
```

Verify the bridge module resolves:

```powershell
uv run python -c "import app.mcp_server; print('ok')"
```

Expected output: `ok`.

---

## 2. Get a CodeAtlas MCP token

The bridge authenticates against the CodeAtlas API with a **personal access token (PAT)**. Unlike a browser session, a PAT does not expire when you sign out — it stays valid until you revoke it.

1. Open the live app: **https://code-atlas-ai-henna.vercel.app**.
2. Sign in via GitHub OAuth.
3. Navigate to **Settings → Agents** (or click **AI Agents** in the sidebar → the token card at the top).
4. Click **Generate MCP token**.
5. Give the token a descriptive name — e.g. `Claude Code — MacBook Pro`, `Cursor — Work Desktop`. This is how you'll identify it when revoking later.
6. Click **Generate**.
7. The token is displayed **once**, starting with `cak_...`. Copy it now.

You can also click **Copy MCP config JSON** on the reveal dialog to get a fully-formed configuration block with your token pre-filled — this is the fastest path for most clients.

**If you lose the token** you cannot recover it. Revoke it from the Agents page and generate a new one.

**API base URL** for your deploy: `https://codeatlas-api-r0e9.onrender.com/api/v1`. The UI will embed the correct value automatically when you use "Copy MCP config JSON".

---

## 3. Configure your coding agent

Pick your client below. Every configuration snippet needs your PAT substituted into `<PASTE-cak-TOKEN-HERE>`.

### Cursor

Create or edit either the user-scope file (`~/.cursor/mcp.json`) or a project-local file (`.cursor/mcp.json` — but **do not commit** a file with a token).

```json
{
  "mcpServers": {
    "codeatlas": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.mcp_server"],
      "env": {
        "CODEATLAS_MCP_API_BASE_URL": "https://codeatlas-api-r0e9.onrender.com/api/v1",
        "CODEATLAS_MCP_TOKEN": "<PASTE-cak-TOKEN-HERE>"
      }
    }
  }
}
```

Set Cursor's working directory to your CodeAtlas checkout, or set the `cwd` key inside the config:

```json
"cwd": "/absolute/path/to/CodeAtlas-ai"
```

**Verify:** Restart Cursor. In the AI chat, ask "list the MCP tools you have access to." You should see `get_architecture_graph` and `create_implementation_plan`.

### Claude Desktop

Edit the Claude Desktop MCP config. Location:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add under `mcpServers`:

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

Note the `--directory` argument — Claude Desktop doesn't inherit a working directory the way Cursor does, so we tell `uv` where the CodeAtlas checkout lives.

**Verify:** Restart Claude Desktop. Under the tools menu (hammer icon) you should see the two CodeAtlas tools listed.

### Claude Code (CLI)

From any directory, register the bridge with `claude mcp add`:

```powershell
claude mcp add codeatlas `
  --scope user `
  --transport stdio `
  --env CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 `
  --env CODEATLAS_MCP_TOKEN=<PASTE-cak-TOKEN-HERE> `
  -- uv --directory /absolute/path/to/CodeAtlas-ai run python -m app.mcp_server
```

On macOS/Linux replace the backticks with backslashes:

```bash
claude mcp add codeatlas \
  --scope user \
  --transport stdio \
  --env CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 \
  --env CODEATLAS_MCP_TOKEN=<PASTE-cak-TOKEN-HERE> \
  -- uv --directory /absolute/path/to/CodeAtlas-ai run python -m app.mcp_server
```

**Verify:** Run `claude mcp list` — you should see `codeatlas` listed as connected. In a `claude` session, run `/mcp` to see the tools inventory.

Prefer `--scope user` (recorded in `~/.claude.json`) or `--scope local` (per-directory) over `--scope project` for anything containing a token. Project-scoped configs land in a repo `.mcp.json` and can accidentally leak via git.

### OpenClaw

```powershell
openclaw mcp add codeatlas `
  --command uv `
  --arg --directory --arg /absolute/path/to/CodeAtlas-ai `
  --arg run --arg python --arg -m --arg app.mcp_server `
  --env CODEATLAS_MCP_API_BASE_URL=https://codeatlas-api-r0e9.onrender.com/api/v1 `
  --env CODEATLAS_MCP_TOKEN=<PASTE-cak-TOKEN-HERE>

openclaw mcp doctor codeatlas --probe
```

The `doctor --probe` command validates that OpenClaw can spawn the bridge and enumerate the two tools.

---

## 4. Try it end-to-end

Once configured, ask your agent:

> "Use CodeAtlas to fetch the architecture graph for repository `<repository-id>` and summarize the top 5 dependencies."

Find your repository id in the CodeAtlas UI under **Repositories** — it's the id column in the URL when you open a repo (a UUID).

For a plan:

> "Use CodeAtlas to create an implementation plan for adding pagination to the /repositories endpoint."

The agent should call `create_implementation_plan`. Head back to CodeAtlas → **Implementation** to review the draft, approve it as an owner/admin, and then either use the agent to draft the actual code changes or open a PR via CodeAtlas' Open PR dialog.

---

## 5. Troubleshooting

### "CODEATLAS_MCP_TOKEN must contain a tenant-scoped CodeAtlas JWT"

The token env var is empty or unset. Confirm you copied a value starting with `cak_...` into the `env` block of your config. Some editors quietly truncate long strings when pasted — re-copy from the reveal dialog.

### "Personal access token is invalid or revoked"

Either the token was revoked (check the token list on Settings → Agents) or the token was truncated on paste. Generate a fresh one and update your client config.

### "Unable to reach CodeAtlas API"

- Confirm `CODEATLAS_MCP_API_BASE_URL` is exactly `https://codeatlas-api-r0e9.onrender.com/api/v1` — no trailing slash, includes `/api/v1`.
- On free-tier Render, the API may be spun down after inactivity; the first request wakes it and can take 30–60 seconds. Retry.

### Bridge process fails to start

Run the bridge directly to see the error:

```powershell
cd /absolute/path/to/CodeAtlas-ai
$env:CODEATLAS_MCP_API_BASE_URL="https://codeatlas-api-r0e9.onrender.com/api/v1"
$env:CODEATLAS_MCP_TOKEN="<your-token>"
uv run python -m app.mcp_server
```

Then paste a probe message to stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}
```

Expected response: a JSON line with `"serverInfo":{"name":"codeatlas"...}`.

### Tools don't show up in the client

- Cursor / Claude Desktop: restart the client after editing the config.
- Claude Code: run `claude mcp list` — if it says "Failed to connect", check the command path.
- Confirm the `--directory` / `cwd` value points to a real CodeAtlas checkout with `pyproject.toml` at its root.

### Repository access denied

The PAT carries your CodeAtlas workspace role. If the API returns 403 on `get_architecture_graph`, your workspace doesn't have access to that repository. Connect the repository from **Settings → Integrations → Connect GitHub** first.

---

## 6. Security notes

- **Treat a PAT like a password.** It carries your workspace role and doesn't require any second factor.
- **Never commit a PAT.** Don't put it in `.mcp.json`, `.cursor/mcp.json`, or any other file that might land in git. Use user-scope config files.
- **Rotate tokens per client** — one PAT per machine + client combination makes revocation surgical.
- **Revoke via the UI** at Settings → Agents. Revocation is instant; any in-flight bridge process will get 401 on its next tool call.
- The bridge never exposes shell, filesystem, or raw source files. Coding agents should still be given their own file-editing tools (Cursor's editor, Claude Code's file tools, etc.) — CodeAtlas is context, not a code editor.

---

## Reference

- [MCP protocol details](protocol.md)
- [Available tools](tools.md)
- Cursor: <https://docs.cursor.com/context/model-context-protocol>
- Claude Code: <https://code.claude.com/docs/en/mcp>
- Claude Desktop: <https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop>
- OpenClaw: <https://docs.openclaw.ai/cli/mcp>
