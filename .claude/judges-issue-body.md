# 👋 Welcome, hackathon judges — CodeAtlas evaluation guide

Thanks for reviewing **CodeAtlas** for the OpenAI Build Week Challenge.
This issue is your single source of truth for evaluating the project:
what it does, how to test it end-to-end, the recent UX polish, and how the
MCP integration works. Everything below is designed so you can spot-check
the four judging criteria (Technological Implementation, Design, Potential
Impact, Quality of the Idea) in ~10 minutes.

_Directed to judges from `testing@devpost.com` and `build-week-event@openai.com`._

---

## 🔗 Live URLs

| | URL |
|---|---|
| **App (start here)** | https://code-atlas-ai-henna.vercel.app |
| **Backend API** | https://codeatlas-api-r0e9.onrender.com/api/v1 |
| **Health probe** | https://codeatlas-api-r0e9.onrender.com/api/v1/warm |
| **API docs (OpenAPI)** | https://codeatlas-api-r0e9.onrender.com/api/v1/docs |
| **Demo video (≤ 3 min)** | https://www.youtube.com/watch?v=zlBKdZrCyeY |
| **Devpost submission** | (linked from the Devpost project page) |

**Codex Session ID:** `019f80d5-58a2-70e0-ba16-54df678fecea`

**Elevator pitch:** CodeAtlas turns GitHub repositories into living
architecture graphs, diagrams, documentation, and AI-guided implementation
plans — so teams can understand and evolve software safely.

Full submission narrative: [`docs/00-overview/hackathon-submission.md`](docs/00-overview/hackathon-submission.md).

---

## ⚡ 10-minute evaluation recipe

**Prereq:** a GitHub account. Sign-in is via GitHub OAuth — no separate CodeAtlas account needed.

1. Open https://code-atlas-ai-henna.vercel.app
2. **Sign in with GitHub.** You'll be redirected back to CodeAtlas with a workspace provisioned.
3. Go to **Repositories** → **Connect repository** → paste any public GitHub repo URL (yours or a fork). Small-to-medium repos scan fastest.
4. Wait for the scan to complete (~30–60s for a small repo). Progress is streamed live via WebSocket.
5. Go to **Architecture** — you'll see the versioned architecture graph rendered live. Click any node to inspect connections and act on it (**Generate documentation** or **Plan refactor**).
6. Go to **Documentation** — see the graph-generated Markdown / Mermaid / Draw.io / C4 artifacts. Everything is bound to a specific graph version so nothing goes stale.
7. Back on Architecture, click **Plan refactor** on a node. You land on **Implementation** with a draft plan.
8. On Implementation → **Approve plan** (as owner/admin) → **Ship draft PR** dropdown:
   - **Open pull request…** → dialog fills a real PR body from the plan; submits to your GitHub via your OAuth token.
   - **Copy MCP bridge prompt** → copies a ready-to-paste prompt for a coding agent to draft the actual code changes.

If you'd rather see a scanned repo without connecting one yourself, connect any read-only public repo you have access to.

---

## 🧠 What we shipped since the initial submission narrative

The last two weeks were pure "close the golden path" work. Highlights:

**Live production posture**
- Full Render Blueprint deploying Postgres + Key Value + FastAPI Docker web service on the free tier ([`render.yaml`](render.yaml)).
- Vercel-hosted frontend at `code-atlas-ai-henna.vercel.app`.
- `/api/v1/warm` keep-alive endpoint + UptimeRobot cron so Aura Free stays out of hibernation.
- `/api/v1/ready` returns a specific dependency name on 503 instead of a generic "something's down."

**Implementation planner E2E**
- Approval-gated plan lifecycle: draft → approved → pull_request_opened.
- Real GitHub PR creation via the workspace's OAuth token.
- "Copy MCP bridge prompt" handoff for coding-agent-driven code drafting.

**MCP coding bridge**
- **Remote HTTP MCP** at `/api/v1/mcp` — no local install, just URL + PAT.
- **Personal Access Tokens** (long-lived, revocable) at Settings → Agents.
- Stdio bridge preserved for offline development.
- Per-client setup instructions on the Agents page + [`docs/07-mcp/client-setup.md`](docs/07-mcp/client-setup.md).

**UX polish**
- Retractable sidebars (app shell + architecture explorer + inspector, each collapses independently).
- Focus mode on the Architecture graph (`F` key or the maximize button) — hides everything but the graph; overlay-peek chevrons still reveal the side panels.
- Keyboard shortcuts: `Cmd+\` app shell, `[` explorer, `]` inspector, `F` focus mode, `Esc` exit.
- Not-Authenticated errors now link straight to Settings → Integrations.
- Removed hardcoded mock data (fake "Health: 82", "v42 chip", "Compare v41 → v42" dead button, etc.).

**Judging criteria mapping**
- **Technological Implementation** — [`backend/app/mcp_server.py`](backend/app/mcp_server.py), [`backend/app/modules/mcp_http/`](backend/app/modules/mcp_http/), [`backend/app/modules/graph/store.py`](backend/app/modules/graph/store.py).
- **Design** — try focus mode on `/architecture` and the retractable sidebars everywhere.
- **Potential Impact** — the plan → approve → PR pipeline is real; the MCP bridge exposes it to any coding agent without exposing raw source.
- **Quality of the Idea** — graph-grounded AI context (not raw-repo prompting) is the core novel bet; the whole platform is downstream of the versioned Architecture Graph.

---

## 🤖 Connect an MCP-capable coding agent (optional but recommended)

The CodeAtlas MCP endpoint gives Cursor / Claude Desktop / Claude Code / OpenClaw architecture-aware context without exposing raw source. Two tools:

- `get_architecture_graph` — reads the canonical graph for a connected repo.
- `create_implementation_plan` — creates an approval-gated plan bound to a graph version.

**Quick setup (Claude Code as an example):**

1. Sign in on the CodeAtlas site.
2. Navigate to **AI Agents** in the sidebar → **Generate MCP token** → copy the `cak_...` token.
3. Register with Claude Code:

   ```bash
   claude mcp add codeatlas \
     --scope user \
     --transport http \
     --header "Authorization: Bearer <PASTE-cak-TOKEN-HERE>" \
     https://codeatlas-api-r0e9.onrender.com/api/v1/mcp
   ```

4. In a Claude Code session, run `/mcp` — you should see `codeatlas` with both tools listed.

Full per-client walkthrough (Cursor, Claude Desktop, Claude Code, OpenClaw) with troubleshooting: [`docs/07-mcp/client-setup.md`](docs/07-mcp/client-setup.md).

---

## 🧪 API self-check (5 seconds)

If the site behaves oddly (free-tier cold start), curl-verify the backend directly:

```bash
curl https://codeatlas-api-r0e9.onrender.com/api/v1/warm
```

Expected: `{"status":"warm","dependencies":{"postgres":"ok","redis":"ok","neo4j":"ok"}}`.

If Postgres or Redis show "ok" but Neo4j shows an auth error, the graph endpoint will be temporarily unavailable while Neo4j Aura Free finishes resuming — retry in ~60 seconds.

---

## 🛠️ How this was built with Codex

The core of CodeAtlas was built in the Codex session referenced above
(`019f80d5-58a2-70e0-ba16-54df678fecea`). Codex + GPT-5.6 were used to
scaffold and iterate on the FastAPI monolith (identity, repository
ingestion, architecture graph projection, artifact generation, MCP
bridge, PAT flow), the React/TanStack frontend, alembic migrations,
integration tests, the `render.yaml` Blueprint, and the `docs/07-mcp`
client-setup guide. See the "How we built it" section of
[`docs/00-overview/hackathon-submission.md`](docs/00-overview/hackathon-submission.md)
for the architectural rationale.

---

## 📋 Known limitations (honest)

- **Free tier cold start.** First request after ~15 min of inactivity can take 30–60s. UptimeRobot pings every 5 min to keep the API warm.
- **Neo4j Aura Free hibernates on 3-day idle.** Our `/warm` cron pattern prevents this in practice; if you catch it mid-resume, the graph endpoint retries auth errors with 2s/5s/10s backoff before giving up.
- **PR-drafting coding agent is not backend-hosted.** Judges evaluating the "Ship draft PR" flow: the "Copy MCP bridge prompt" action is where the coding-agent handoff lives; you paste the prompt into your own Cursor/Claude Code session, which then drafts the code. Server-side coding-agent execution is a future item (documented as such — we don't fake it).

---

## 🙋 Questions?

Comment on this issue and I'll respond. For anything sensitive, my email is on the Devpost submission page.

Thanks for judging.

— Kevin
