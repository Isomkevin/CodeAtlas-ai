# CodeAtlas AI

> The AI-Native Living Architecture Platform

CodeAtlas transforms software architecture from static documentation into a living, continuously synchronized system powered by AI.

Instead of architecture becoming outdated moments after implementation, CodeAtlas continuously understands repositories, generates architecture models, validates implementation, updates documentation, produces diagrams, and enables AI coding agents to implement architectural changes safely.

## Vision

Software architecture should be executable.

Developers should never manually maintain diagrams, documentation, or architecture descriptions again.

CodeAtlas becomes the source of truth for software architecture.

## Hackathon elevator pitch

> CodeAtlas turns GitHub repositories into living architecture graphs, diagrams, documentation, and AI-guided implementation plans—so teams can understand and evolve software safely.

Read the complete [OpenAI Build Week Challenge project narrative](docs/00-overview/hackathon-submission.md), including the problem, implementation, challenges, learnings, and roadmap.

## Core Capabilities

- Repository Analysis
- Living Architecture Graph
- Architecture AI Chat
- Draw.io Generation
- Mermaid Generation
- C4 Diagrams
- Architecture Drift Detection
- AI Documentation
- Architecture Review
- Architecture-to-Code
- Code-to-Architecture
- GitHub Integration
- MCP Server
- Multi-Agent AI System

## Philosophy

Documentation should not describe the system.

Documentation should BE the system.

## Long-Term Goal

Become the architecture layer that every AI coding agent uses before writing code.

## Technology

Frontend

- Vite with TanStack Start
- React 19 and TypeScript
- Tailwind CSS

Backend

- FastAPI
- Python 3.12+
- SQLAlchemy and Alembic
- JWT, GitHub OAuth, and RBAC

Database

- PostgreSQL
- pgvector

Graph

- Neo4j

Runtime

- Redis
- OpenTelemetry and Prometheus metrics

AI

- OpenAI Responses API

Infrastructure

- Docker
- Kubernetes
- GitHub Actions

Protocols

- MCP

## Repository

This repository contains both the platform implementation and the AI-Executable Specification that defines the product.

## Current implementation

CodeAtlas is implemented as a modular FastAPI monolith. The canonical graph is an immutable, versioned Neo4j projection created by the scan worker from PostgreSQL source facts. Python uses the standard AST; JavaScript and TypeScript use deterministic, language-aware symbol and import extraction designed for safe worker execution. Every graph-backed artifact, drift observation, chat response, impact analysis, and implementation plan references a specific graph version.

Implemented modules include tenant JWT/GitHub OAuth/RBAC, encrypted GitHub credentials, signed GitHub push webhooks, private repository scanning, Celery/Redis scan jobs, architecture graph versions and diffs, Markdown/Mermaid/Draw.io/C4 artifacts, graph-only intelligence, WebSocket scan events, approval-gated plans and GitHub PR creation, and an MCP stdio bridge. The existing Repository and Architecture screens use the live API; Architecture consumes scan WebSocket events and refreshes its graph when a projection completes.

## Run locally

Start platform dependencies and the API:

```powershell
docker compose up --build
```

The API is available at `http://localhost:8000`; the API container applies Alembic migrations before startup. Copy `.env.example` to `.env` and configure a unique JWT secret, Fernet GitHub-token encryption key, GitHub OAuth client credentials, and GitHub webhook secret before authentication. The compose file supplies local PostgreSQL, Neo4j, and Redis endpoints.

Start the canonical frontend separately:

```powershell
Set-Location apps/web
bun install --frozen-lockfile
bun run dev
```

Vite will print the available local URL. If the checked-in lockfile’s Lovable package cache is unavailable to your environment, perform a local-only public-registry installation without changing `bun.lock`, then run `bun run dev`.

For a local demo without configured GitHub OAuth, Compose explicitly enables a development-only session. Open Settings and select **Use local demo session**. It may scan public GitHub repositories anonymously; private repositories still require GitHub OAuth. This endpoint is unavailable unless both the environment is `development` and `CODEATLAS_ALLOW_DEVELOPMENT_LOGIN=true`; production startup rejects that setting.

Run backend verification from the repository root:

```powershell
uv run pytest backend/tests
uv run ruff check backend alembic
```

See [implementation roadmap](docs/05-codex/implementation-roadmap.md) for milestone status and [API specification](docs/05-api/openapi.md) for the API surface.

## Deploy to production

The checked-in Compose stack is for local development only. The supported hosted deployment path uses Vercel for the existing frontend, Render for the API and Celery worker, Render Postgres and Key Value for operational data and Redis, and Neo4j Aura for the Architecture Graph. Follow the [production deployment guide](docs/06-operations/production-deployment.md) before exposing the application publicly.

## Runtime workflows

Run a worker outside Compose with `uv run celery -A app.worker.celery_app worker --pool=solo --loglevel=INFO` for native parser safety in a local environment. The Architecture page reads `/repositories/{id}/graph` and queues scans through the live API. Set `VITE_CODEATLAS_API_URL=http://localhost:8000` if the frontend uses a non-default API host.

The MCP stdio bridge exposes only `get_architecture_graph` and `create_implementation_plan`; it does not expose raw repository files. Start it with a tenant-scoped API token:

```powershell
$env:CODEATLAS_MCP_API_BASE_URL="http://localhost:8000/api/v1"
$env:CODEATLAS_MCP_TOKEN="<tenant-scoped JWT>"
uv run python -m app.mcp_server
```

Every implementation plan is a draft until an owner or administrator approves it. Only then can CodeAtlas open a GitHub pull request from a branch prepared by a coding agent.

## GitHub push refreshes

Configure a GitHub repository webhook for `https://<api-host>/api/v1/github/webhooks`, select `application/json`, subscribe to push events, and use the value in `CODEATLAS_GITHUB_WEBHOOK_SECRET`. CodeAtlas checks GitHub's raw-body `X-Hub-Signature-256` HMAC before processing the payload. Only non-deletion pushes to a connected repository's configured default branch queue a scan; the worker then rebuilds the canonical graph and pushes the outcome to authenticated Architecture clients.
