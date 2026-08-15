# CodeAtlas API surface

All HTTP paths are prefixed with `/api/v1`. Except for health probes, the GitHub OAuth callback, and the signed GitHub webhook, endpoints require a tenant-scoped JWT bearer token. The live OpenAPI contract is at `/api/v1/openapi.json`.

## Platform and identity

- `GET /health`, `GET /ready`, and `GET /metrics` provide liveness, dependency readiness, and Prometheus metrics.
- `GET /auth/github/authorize` begins GitHub OAuth with a signed, short-lived state value.
- `GET /auth/github/callback` validates the callback, provisions tenant identity as needed, stores encrypted credentials, and posts a JWT to the trusted web-app opener.
- `GET /auth/session/claims` validates the current bearer token.
- `GET /auth/workspace` reads the current tenant's name, slug, plan, status, and caller role.
- `PUT /auth/workspace` lets owners and admins update the workspace name and unique slug; each change is audited.

## Repository ingestion

- `GET /repositories/discover`, `POST /repositories`, and `GET /repositories` manage GitHub-backed repository connections.
- `POST /repositories/{repository_id}/scan` queues a durable scan using a Celery message that contains only the scan ID.
- `POST /github/webhooks` verifies GitHub's `X-Hub-Signature-256` raw-body HMAC. A valid default-branch push queues scans for active tenant connections; no source content is accepted or persisted from the webhook payload.
- `WS /repositories/{repository_id}/events?access_token=...` emits `scan.running`, `scan.completed`, and `scan.failed` events to an authorized tenant client.

## Canonical architecture graph

- `GET /repositories/{repository_id}/graph` reads an immutable graph version; an optional `version_id` selects an older version.
- `GET /repositories/{repository_id}/graph/versions` lists versions.
- `GET /repositories/{repository_id}/graph/diff?from_version_id=...&to_version_id=...` returns graph deltas.

## Graph-derived artifacts and intelligence

- `POST`, `GET`, and `GET /{artifact_id}` at `/repositories/{repository_id}/artifacts` generate and read immutable `documentation`, `mermaid`, `drawio`, and `c4` artifacts.
- `POST /repositories/{repository_id}/chat` answers over graph context only and returns citations.
- `GET /repositories/{repository_id}/impact/{node_id}` performs a bounded graph traversal.
- `POST` and `GET /repositories/{repository_id}/drift` detect and list architecture drift observations.
- `GET /ai/provider` returns the current workspace's AI-provider status without returning a secret.
- `PUT /ai/provider` is owner/admin-only and stores an encrypted OpenAI-compatible BYOK key, base URL, and model for the workspace. Its model key overrides the deployment-level key for graph-context chat.
- `DELETE /ai/provider` is owner/admin-only and removes the workspace key so chat falls back to the deployment key or deterministic graph-only mode.

## Architecture-to-code and MCP

- `POST` and `GET /repositories/{repository_id}/implementation-plans`, plus `GET /{plan_id}`, create and read graph-version-bound plans.
- `POST /repositories/{repository_id}/implementation-plans/{plan_id}/approve` is owner/admin-only.
- `POST /repositories/{repository_id}/implementation-plans/{plan_id}/pull-request` is owner/admin-only and opens a PR from a branch prepared by a coding agent.
- The stdio MCP bridge provides `get_architecture_graph` and `create_implementation_plan` using a tenant-scoped API token. It never exposes raw repository files.
