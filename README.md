# CodeAtlas AI

> The AI-Native Living Architecture Platform

CodeAtlas transforms software architecture from static documentation into a living, continuously synchronized system powered by AI.

Instead of architecture becoming outdated moments after implementation, CodeAtlas continuously understands repositories, generates architecture models, validates implementation, updates documentation, produces diagrams, and enables AI coding agents to implement architectural changes safely.

## Vision

Software architecture should be executable.

Developers should never manually maintain diagrams, documentation, or architecture descriptions again.

CodeAtlas becomes the source of truth for software architecture.

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

The backend is a modular FastAPI monolith. The platform foundation is available at `/api/v1/health`, `/api/v1/ready`, `/metrics`, and `/api/v1/docs`. Identity and tenant foundations are implemented: PostgreSQL migrations create organizations, users, memberships, and audit records; GitHub OAuth provisions a first workspace and returns a tenant-scoped JWT to the existing Settings UI.

The Architecture Graph remains the planned canonical source of truth. Repository ingestion, source-graph construction, and Neo4j projection are the next implementation milestone.

## Run locally

Start platform dependencies and the API:

```powershell
docker compose up --build
```

The API is available at `http://localhost:8000`; copy `.env.example` to `.env` and configure a unique JWT secret before using authentication. GitHub sign-in also requires a GitHub OAuth client ID, secret, and callback URL.

Start the canonical frontend separately:

```powershell
Set-Location apps/web
bun install --frozen-lockfile
bun run dev
```

Vite will print the available local URL. If the checked-in lockfile’s Lovable package cache is unavailable to your environment, perform a local-only public-registry installation without changing `bun.lock`, then run `bun run dev`.

Run backend verification from the repository root:

```powershell
uv run pytest backend/tests
uv run ruff check backend alembic
```

See [implementation roadmap](docs/05-codex/implementation-roadmap.md) for milestone status and [API specification](docs/05-api/openapi.md) for the API surface.
