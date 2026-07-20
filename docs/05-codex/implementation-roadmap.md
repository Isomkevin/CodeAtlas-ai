# CodeAtlas implementation roadmap

Status: active. The Architecture Graph is the product source of truth; parsers write source facts first, graph projection produces architecture facts, and AI and generated artifacts consume only the architecture graph.

## Dependency map

`apps/web` (canonical UI) depends on the versioned HTTP/WebSocket API. API controllers depend on module public services. Services coordinate SQL operational records, graph repositories, event publication, and workers. Parser workers create source-graph facts; the architecture module projects and versions the canonical graph. Documentation, diagrams, AI, drift, implementation, GitHub, and MCP depend on that graph in that order.

## Milestones and work packages

1. **Platform foundation** — application factory, configuration, observability, error contract, container topology, probes, and test baseline. Complete.
2. **Identity and workspace** — PostgreSQL/Alembic, organizations, users, JWT, GitHub OAuth state flow, RBAC, audit events, and frontend session integration. In progress: persistence schema, JWT, OAuth authorization initiation, and role policy are implemented; callback exchange and UI session wiring follow with the GitHub integration work package.
3. **Repository connections and ingestion** — GitHub installation/repository linking, encrypted credentials, webhook verification, scan lifecycle, Redis/Celery jobs, AST parser adapters, source-graph persistence.
4. **Canonical architecture graph** — Neo4j constraints, graph versioning/diffs, architecture projection, traversal/query API, graph explorer integration.
5. **Generated artifacts** — graph-derived documentation, Mermaid, Draw.io, C4 and artifact versioning; connect existing UI actions.
6. **Architecture intelligence** — retrieval strictly over graph projections, AI chat, citations, drift detection, impact analysis, WebSocket progress.
7. **Architecture-to-code workflow** — implementation plans, guarded GitHub branch/PR operations, coding-agent/MCP contracts, policy checks and approvals.
8. **Production hardening** — integration/e2e tests, migration and backup rehearsal, security review, rate limits, deployment manifests, dashboards, runbooks, CI/CD.

## Execution policy

Each work package must add its API contract, validation, structured logging, metrics, tests, and module documentation. A package is only complete after formatting/linting and its relevant test suite pass; it is then committed before the next package begins. Frontend changes are limited to replacing mock data and wiring existing interactions to API/WebSocket contracts.
