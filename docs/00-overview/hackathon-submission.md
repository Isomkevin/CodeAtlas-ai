# CodeAtlas: OpenAI Build Week Challenge submission

## Project name

CodeAtlas

## Elevator pitch

CodeAtlas turns GitHub repositories into living architecture graphs, diagrams, documentation, and AI-guided implementation plans—so teams can understand and evolve software safely.

## Inspiration

Software architecture is usually documented once and then slowly becomes unreliable as the code evolves. Engineers spend too much time reconstructing system boundaries, dependencies, data flows, and design decisions from scattered repositories, tickets, and outdated diagrams.

We built CodeAtlas to make architecture a living asset rather than a static document. Its core idea is simple: derive a versioned Architecture Graph from the codebase, then use that graph as the trusted context for documentation, diagrams, impact analysis, AI assistance, and implementation planning.

## What it does

CodeAtlas is an AI-native Architecture Intelligence Platform for software teams.

It connects GitHub repositories, scans and analyzes source code in background workers, extracts source facts, and projects them into a versioned Architecture Graph. From that canonical graph, teams can explore components and dependencies, generate documentation, create Mermaid, Draw.io, and C4 diagrams, identify architecture drift, ask architecture-focused questions, and create implementation plans for proposed changes.

Rather than asking AI to infer architecture from raw repositories, CodeAtlas provides structured, graph-grounded context. This makes responses more explainable, traceable, and useful for developers making real implementation decisions.

Key capabilities include:

- GitHub repository connection, OAuth, JWT authentication, RBAC, and workspaces.
- Background repository scanning and source-symbol/dependency extraction.
- Versioned Source Graph and Architecture Graph generation.
- Architecture diffs and drift detection between graph versions.
- Markdown, Mermaid, Draw.io, and C4 architecture artifacts.
- Graph-grounded AI architecture intelligence and impact analysis.
- Approval-gated implementation plans and GitHub pull-request workflows.
- WebSocket scan progress events and MCP integration for AI coding agents.

## How we built it

We preserved the existing React and TypeScript frontend as the canonical CodeAtlas experience and built the platform around it as a modular FastAPI monolith.

The backend uses PostgreSQL and pgvector for tenant, repository, scan, artifact, and planning data; Neo4j for the immutable, versioned Architecture Graph; Redis and Celery for asynchronous repository scans; and Docker for local orchestration. GitHub OAuth, encrypted credentials, signed webhooks, JWT sessions, and role-based access control secure multi-workspace use.

The AI layer uses the OpenAI Responses API with graph-derived context. CodeAtlas deliberately keeps AI downstream of parsing and graph construction: source code is processed into structured facts first, then the Architecture Graph becomes the source of truth for reasoning, documentation, plans, and coding-agent workflows.

## Challenges we ran into

The hardest challenge was making architecture intelligence trustworthy. Raw code alone is noisy, and AI-generated summaries can become unreliable if they are not grounded in a stable representation of the system.

We also had to solve:

- Turning repository symbols and imports into useful architectural relationships.
- Keeping documentation and diagrams tied to a specific graph version.
- Supporting background scans without blocking the user experience.
- Securing GitHub access while supporting local development workflows.
- Representing architecture changes as auditable graph diffs rather than vague summaries.
- Making AI outputs actionable without letting them replace engineering review.

## Accomplishments that we’re proud of

We are proud that CodeAtlas turns architecture into an executable, versioned system of record instead of a collection of disconnected diagrams and documents.

In particular, we are proud of:

- A canonical Architecture Graph that drives every downstream artifact.
- End-to-end repository scan-to-graph verification.
- Live graph-backed documentation and diagram generation.
- Graph-grounded AI reasoning instead of raw-repository prompting.
- A secure multi-tenant foundation with GitHub OAuth, JWT, RBAC, webhooks, and background workers.
- MCP support that lets coding agents work from architecture-aware context.
- A production-ready local Docker workflow with a usable frontend preview.

## What we learned

We learned that the value of AI in software architecture comes from context quality, not just model capability. A graph that captures repository structure, dependencies, and version history gives AI a more reliable foundation for explaining a system and planning changes.

We also learned that architecture intelligence must remain traceable. Developers need to know which repository state, scan, and graph version produced a diagram, recommendation, or implementation plan.

Finally, we learned that architecture tooling becomes much more useful when it fits into existing developer workflows: GitHub, pull requests, background jobs, real-time updates, and coding agents.

## What’s next for CodeAtlas

Next, we plan to expand CodeAtlas with broader language support, richer semantic relationship extraction, automated architecture-policy enforcement, team review workflows, and deeper integrations with CI/CD systems.

We also plan to add more real-time drift alerts, richer dependency and blast-radius analysis, collaborative graph annotations, and stronger agent execution workflows so teams can safely move from an approved architectural change to an implementation-ready pull request.

## Built with

OpenAI API, OpenAI Responses API, Python, FastAPI, React, TypeScript, JavaScript, PostgreSQL, pgvector, Neo4j, Redis, Celery, Docker, GitHub, GitHub OAuth, JWT, WebSockets, Model Context Protocol, OpenTelemetry, Prometheus, SQLAlchemy, Alembic, Pydantic, Vite, Kubernetes, GitHub Actions.
