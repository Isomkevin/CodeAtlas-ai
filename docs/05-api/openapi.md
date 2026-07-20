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

---

# Base URL

/api/v1

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
