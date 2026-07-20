# Backend Technical Specification

Version: 1.0

Status

Canonical

---

# Overview

The backend is implemented as a Modular Monolith.

Each module owns:

- Business logic
- Database access
- Domain models
- Services
- Events
- Background jobs
- APIs

Modules communicate through explicit interfaces and domain events.

No module accesses another module's persistence layer directly.

---

# Modules

Repository Module

Purpose

Repository lifecycle.

Responsibilities

- Repository registration
- Git cloning
- Incremental sync
- Branch management
- Commit history
- Repository metadata
- Webhooks

Public API

RepositoryService

Events

RepositoryImported

RepositorySynced

RepositoryDeleted

---

Architecture Module

Purpose

Understand software systems.

Responsibilities

- Architecture inference
- Dependency analysis
- Layer analysis
- Domain analysis
- Health scoring
- Drift detection

Public API

ArchitectureService

Events

ArchitectureGenerated

ArchitectureUpdated

ArchitectureValidated

---

Graph Module

Purpose

Manage Neo4j.

Responsibilities

- Graph persistence
- Graph queries
- Traversals
- Version history
- Graph snapshots
- Graph diffing

Public API

GraphService

Events

GraphCreated

GraphUpdated

GraphMerged

---

Documentation Module

Purpose

Generate documentation.

Responsibilities

README

Architecture Docs

Runbooks

ADRs

API Docs

Markdown Export

Public API

DocumentationService

Events

DocumentationGenerated

DocumentationUpdated

---

Diagram Module

Purpose

Generate diagrams.

Responsibilities

Mermaid

Draw.io

PlantUML

C4

Deployment

Sequence

ERD

Public API

DiagramService

Events

DiagramGenerated

DiagramUpdated

---

AI Module

Purpose

Coordinate AI.

Responsibilities

Agent orchestration

Planning

Reasoning

Memory

Prompt construction

Tool execution

Streaming

Public API

AIService

Events

TaskStarted

TaskCompleted

TaskFailed

---

Implementation Module

Purpose

Architecture → Code.

Responsibilities

Planning

Code generation

Testing

Validation

Review

PR generation

Public API

ImplementationService

Events

ImplementationStarted

ImplementationFinished

PullRequestGenerated

---

GitHub Module

Purpose

Git integration.

Responsibilities

Authentication

Repositories

Branches

Commits

Pull Requests

Reviews

Checks

Public API

GitHubService

---

MCP Module

Purpose

External AI interface.

Responsibilities

Tool registry

Tool execution

Context construction

Streaming

Authorization

---

Authentication Module

Purpose

Identity.

Responsibilities

OAuth

JWT

RBAC

Organizations

Sessions

API Keys

Audit Logs
