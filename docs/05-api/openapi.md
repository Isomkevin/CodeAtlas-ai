# docs/05-api/openapi.md

# API Specification

Version: 1.0

Status: Canonical

Architecture Style

REST + WebSocket + MCP

---

# Authentication

GitHub OAuth

Google OAuth

JWT

API Keys

Organization Tokens

Implemented authentication endpoints

GET /auth/github/authorize

Returns the GitHub OAuth authorization URL with a signed, short-lived state value.

GET /auth/github/callback

Exchanges the GitHub authorization code, validates a verified primary email, provisions an initial organization for a new user, writes audit events, and sends the tenant-scoped JWT to the trusted web-app popup opener. The JWT is never placed in the callback URL.

GET /auth/session/claims

Validates a bearer token and returns its subject, organization, and role claims.

Roles

owner, admin, member, viewer

---

# Base URL

/api/v1

## Platform endpoints

GET /health

Liveness probe.

GET /ready

Readiness probe. Dependency probes are added as each corresponding production adapter is provisioned.

GET /metrics

Prometheus scrape endpoint.

GET /docs

Interactive OpenAPI documentation for implemented endpoints.

---

# Repository APIs

POST /repositories

Import repository.

GET /repositories

List repositories.

GET /repositories/{id}

Repository details.

DELETE /repositories/{id}

Archive repository.

POST /repositories/{id}/sync

Incremental sync.

POST /repositories/{id}/scan

Full scan.

GET /repositories/{id}/status

Indexing status.

---

# Architecture APIs

GET /architecture

Architecture summary.

GET /architecture/graph

Architecture graph.

POST /architecture/query

Graph query.

POST /architecture/explain

AI explanation.

POST /architecture/generate

Regenerate architecture.

POST /architecture/compare

Compare graph versions.

POST /architecture/validate

Architecture validation.

---

# Documentation APIs

GET /docs

List documentation.

POST /docs/generate

Generate documentation.

POST /docs/readme

Generate README.

POST /docs/adr

Generate ADR.

POST /docs/runbook

Generate Runbook.

---

# Diagram APIs

POST /diagrams/drawio

Generate Draw.io.

POST /diagrams/mermaid

Generate Mermaid.

POST /diagrams/c4

Generate C4.

POST /diagrams/erd

Generate ERD.

POST /diagrams/deployment

Generate deployment diagram.

---

# AI APIs

POST /ai/chat

Architecture Chat.

POST /ai/plan

Implementation planning.

POST /ai/review

Architecture review.

POST /ai/refactor

Refactoring suggestions.

POST /ai/implement

Architecture-to-Code.

POST /ai/tasks

Task generation.

---

# Knowledge Graph APIs

GET /graph

Graph metadata.

POST /graph/query

Cypher query.

POST /graph/search

Semantic search.

POST /graph/traverse

Relationship traversal.

GET /graph/history

Version history.

---

# Drift APIs

POST /drift/check

Detect drift.

GET /drift/history

Historical drift.

POST /drift/fix

Generate fix plan.

---

# GitHub APIs

POST /github/pr

Generate Pull Request.

POST /github/review

AI review.

POST /github/commit

Commit.

POST /github/branch

Create branch.

---

# MCP APIs

GET /mcp/tools

Tool discovery.

GET /mcp/resources

Resource discovery.

POST /mcp/invoke

Tool execution.

---

# WebSocket Events

repository.scan.started

repository.scan.completed

architecture.updated

graph.updated

documentation.generated

diagram.generated

implementation.started

implementation.completed

drift.detected

agent.completed
# CodeAtlas API surface

All API paths are prefixed with `/api/v1`. Repository, graph, artifact, intelligence, and implementation endpoints require a tenant-scoped JWT bearer token.

## Repository and graph

- `GET /repositories/discover`, `POST /repositories`, and `GET /repositories` manage GitHub-backed repositories.
- `POST /repositories/{repository_id}/scan` queues a durable scan.
- `WS /repositories/{repository_id}/events?access_token=...` emits `scan.running`, `scan.completed`, and `scan.failed` events.
- `GET /repositories/{repository_id}/graph`, `/graph/versions`, and `/graph/diff` read immutable graph versions and differences.

## Graph-derived artifacts and intelligence

- `POST /repositories/{repository_id}/artifacts` accepts `documentation`, `mermaid`, `drawio`, or `c4`; list and get endpoints return immutable content.
- `POST /repositories/{repository_id}/chat` uses only graph context and returns node citations.
- `GET /repositories/{repository_id}/impact/{node_id}` performs a bounded graph traversal.
- `POST` and `GET /repositories/{repository_id}/drift` create and read drift observations.

## Architecture-to-code

- `POST /repositories/{repository_id}/implementation-plans` creates a graph-version-bound draft.
- `POST /repositories/{repository_id}/implementation-plans/{plan_id}/approve` is owner/admin-only.
- `POST /repositories/{repository_id}/implementation-plans/{plan_id}/pull-request` is owner/admin-only and opens a GitHub PR from an existing agent branch.

The live OpenAPI contract is served at `/api/v1/openapi.json`.
