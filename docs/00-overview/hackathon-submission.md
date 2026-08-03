# CodeAtlas — OpenAI Build Week Challenge submission

## Project

**CodeAtlas** — the AI-native living architecture platform. Live at [`code-atlas-ai-henna.vercel.app`](https://code-atlas-ai-henna.vercel.app).

- **Demo video (≤ 3 min):** https://www.youtube.com/watch?v=zlBKdZrCyeY
- **Repository:** [Isomkevin/CodeAtlas-ai](https://github.com/Isomkevin/CodeAtlas-ai) (private, shared with `testing@devpost.com` and `build-week-event@openai.com`)
- **Codex Session ID:** `019f80d5-58a2-70e0-ba16-54df678fecea`
- **Judges' evaluation guide (pinned):** [Issue #1](https://github.com/Isomkevin/CodeAtlas-ai/issues/1)

## Elevator pitch

CodeAtlas turns GitHub repositories into living architecture graphs, diagrams, documentation, and AI-guided implementation plans — so teams can understand and evolve software safely, and coding agents can work from a graph-grounded model instead of raw source.

## Inspiration

Software architecture is usually documented once and then slowly becomes unreliable as the code evolves. Engineers spend real time reconstructing system boundaries, dependencies, data flows, and design decisions from scattered repositories, tickets, and outdated diagrams.

We built CodeAtlas to make architecture a **living asset** rather than a static document. The core idea is simple: derive a **versioned Architecture Graph** from the codebase, then use that graph as trusted context for documentation, diagrams, impact analysis, AI assistance, and implementation planning.

## What it does

CodeAtlas is an AI-native Architecture Intelligence Platform.

It connects GitHub repositories, scans them in background workers, extracts source facts, and projects those facts into a versioned Architecture Graph. From that canonical graph, teams can:

- **Explore** components and dependencies in an interactive graph explorer with focus mode.
- **Generate** Markdown documentation, Mermaid, Draw.io, and C4 diagrams bound to a specific graph version.
- **Detect drift** between graph versions.
- **Ask** architecture-focused questions with AI grounded in graph context.
- **Plan changes** through an approval-gated workflow that ends in a real GitHub pull request.
- **Integrate coding agents** (Cursor, Claude Desktop, Claude Code, OpenClaw) via MCP over HTTP — no local install, no repo clone, PAT-authenticated.

Rather than prompting AI with raw repositories, CodeAtlas provides structured, graph-grounded context. Every response is explainable, traceable to a graph version, and useful for developers making real implementation decisions.

**Key capabilities:**

- GitHub repository connection, OAuth, JWT authentication, RBAC, and workspaces.
- Background repository scanning, source-symbol and dependency extraction.
- Versioned Source Graph → Architecture Graph projection.
- Architecture diffs and drift detection between graph versions.
- Markdown, Mermaid, Draw.io, and C4 architecture artifacts.
- Graph-grounded AI architecture intelligence and impact analysis.
- Approval-gated implementation plans and real GitHub pull-request workflows.
- WebSocket scan progress events with authenticated tenant channels.
- Encrypted workspace BYOK model configuration.
- **Remote HTTP + local stdio MCP transports** for Cursor, Claude Desktop, Claude Code, and OpenClaw.
- **Personal Access Tokens** (`cak_...`, revocable, long-lived) — session sign-out never breaks the coding-agent bridge.

## How we built it

We preserved the existing React and TypeScript frontend as the canonical CodeAtlas experience and built the platform around it as a **modular FastAPI monolith**.

**Backend.** PostgreSQL and pgvector for tenant, repository, scan, artifact, and planning data; Neo4j for the immutable, versioned Architecture Graph; Redis and Celery for asynchronous repository scans; Docker for local orchestration. GitHub OAuth, encrypted credentials, signed webhooks, JWT sessions, and RBAC secure multi-workspace use.

**AI layer.** The OpenAI Responses API is called with graph-derived context. Source code is processed into structured facts first, then the Architecture Graph becomes the source of truth for reasoning, documentation, plans, and coding-agent workflows. AI is deliberately downstream of parsing and graph construction — never upstream.

**MCP surface.** Two transports:

- **Streamable HTTP** at `POST /api/v1/mcp` — remote, PAT-authenticated, no client-side install.
- **Local stdio** (`app.mcp_server`) — for offline development against a local backend.

Both expose the same two tools: `get_architecture_graph` and `create_implementation_plan`.

**Hosting.** Everything except the frontend runs on **Render's free tier** — a single Web Service Docker container plus Render Postgres and Render Key Value, driven by a `render.yaml` Blueprint. The Celery worker runs **inline** in the API container (free tier has no Background Worker service). Vercel hosts the frontend; Neo4j Aura Free hosts the architecture graph. An external UptimeRobot cron hits `/api/v1/warm` every 5 minutes to keep Render awake and Aura out of hibernation.

**Codex usage.** Codex + GPT-5.6 scaffolded and iterated on: the FastAPI monolith (identity, repository ingestion, graph projection, artifacts, plans, MCP), the React/TanStack frontend (app shell, retractable sidebars, focus mode, planner UX), operational glue (Blueprint, migrations, retry helper, warm endpoint), and the docs (this file, README, MCP client setup guide, judges' issue). See the Codex Session ID above.

## Challenges we ran into

- **Making architecture intelligence trustworthy.** Raw code alone is noisy, and AI-generated summaries can become unreliable if they are not grounded in a stable representation of the system. Every AI output is scoped to a specific graph version so it can be reproduced.
- **Turning repository symbols and imports into useful architectural relationships.** We chose deterministic, language-aware parsers (Python AST + JS/TS symbol extraction) over probabilistic ones because reproducibility matters more than coverage for a hackathon submission.
- **Keeping documentation and diagrams tied to a specific graph version** so nothing goes stale.
- **Supporting background scans without blocking the user experience.** Celery + Redis + WebSocket progress events.
- **Securing GitHub access while supporting local development workflows.** Encrypted per-user credentials, signed webhooks, gated local-only development session endpoint.
- **Representing architecture changes as auditable graph diffs rather than vague summaries.**
- **Making AI outputs actionable without letting them replace engineering review.** Owner/admin approval is required to open a real PR.
- **Free-tier hosting realities.** Neo4j Aura Free hibernates on idle. We added: (a) a `/warm` endpoint, (b) an external UptimeRobot cron, (c) Neo4j-driver retry with 2s/5s/10s backoff for the wake window, and (d) soft-Neo4j readiness so hibernation cannot block a redeploy.

## Accomplishments that we're proud of

We're proud that CodeAtlas turns architecture into an **executable, versioned system of record** instead of a collection of disconnected diagrams and documents.

In particular:

- A canonical Architecture Graph that drives every downstream artifact.
- End-to-end repository scan-to-graph verification, with WebSocket progress events.
- Live graph-backed documentation and diagram generation.
- Graph-grounded AI reasoning instead of raw-repository prompting.
- A secure multi-tenant foundation — GitHub OAuth, JWT, RBAC, encrypted credentials, signed webhooks, background workers, audit events.
- **Remote MCP over HTTP** with revocable Personal Access Tokens, so any MCP-capable coding agent can consume graph context without cloning the repo or installing Python locally.
- A production-ready Render Blueprint that provisions the entire backend on the free tier in one apply.
- Honest failure surfaces — every deploy failure the judges could see in git history has been diagnosed and fixed in a subsequent commit; no fake buttons, no mocked metrics.

## What we learned

- **The value of AI in software architecture comes from context quality, not model capability.** A graph that captures repository structure, dependencies, and version history gives AI a more reliable foundation than raw prompts.
- **Architecture intelligence must remain traceable.** Developers need to know which repository state, scan, and graph version produced a diagram, recommendation, or implementation plan.
- **Architecture tooling becomes much more useful when it fits into existing developer workflows** — GitHub, pull requests, background jobs, real-time updates, and coding agents.
- **Hosted MCP transports beat local stdio for evaluation and adoption.** The remote HTTP endpoint let judges (and anyone else) connect Cursor / Claude Code without cloning or `uv sync`-ing anything.
- **Free-tier realities are a first-class UX problem.** Aura hibernation cost us multiple failed deploys before we made Neo4j a soft dep in readiness and added driver retry + keep-warm.

## What's next for CodeAtlas

- Broader language support and richer semantic relationship extraction.
- Automated architecture-policy enforcement (guardrails as code).
- Team review workflows on implementation plans.
- Deeper CI/CD integration — architecture drift as a pull request status check.
- Real-time drift alerts and blast-radius analysis.
- Collaborative graph annotations.
- **Server-side coding-agent execution** — the current "Ship draft PR" flow copies a bridge prompt for the user's local coding agent to draft the actual code. A future release will host the coding agent server-side and open PRs autonomously after human approval.
- Optional legacy SSE MCP transport for older MCP clients.

## Built with

OpenAI Responses API, Codex, GPT-5.6, Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, structlog, React 19, TypeScript, TanStack Start + Router, Vite, Tailwind, Radix UI, ReactFlow, framer-motion, PostgreSQL 16, pgvector, Neo4j 5 (Aura), Redis, Celery, Docker, docker-compose, GitHub, GitHub OAuth + PR API, JWT, WebSockets, Model Context Protocol (Streamable HTTP + stdio), OpenTelemetry, Prometheus, Vercel, Render (Web Service + Postgres + Key Value + Blueprint), UptimeRobot, uv, bun, GitHub Actions.
