# CodeAtlas operations runbook

## Start and validate

1. Copy `.env.example` to `.env` and set production secrets outside source control.
2. Run `docker compose up --build`.
3. Check `GET /api/v1/health`, `GET /api/v1/ready`, and `/metrics`.
4. Confirm the API migration log reaches Alembic head before accepting traffic.

`/health` checks process liveness. `/ready` verifies every configured PostgreSQL, Neo4j, and Redis dependency; it returns HTTP 503 when one cannot be reached.

## Migration and rollback

The API container runs `alembic upgrade head` only when `CODEATLAS_RUN_MIGRATIONS=1`. Workers do not run migrations. For a controlled rollout, apply migrations once, wait for success, then scale API and worker processes.

Before a schema-changing release, create a PostgreSQL backup and capture the Neo4j backup/snapshot according to the deployment provider. Downgrade only after checking the relevant Alembic revision’s `downgrade()` and restoring a compatible backup where data loss is possible.

## Backup and recovery

- PostgreSQL: schedule logical `pg_dump` plus point-in-time recovery where supported.
- Neo4j: schedule provider snapshots or `neo4j-admin database dump` while following the provider’s backup guidance.
- Redis: it is queue/event state, not canonical product data. Restore PostgreSQL and Neo4j first, then restart workers to process requested scans.

## Security controls

- Production startup rejects development JWT secrets and missing encrypted-GitHub-token, PostgreSQL, Neo4j, or Redis configuration.
- API responses include `nosniff`, deny framing, no-referrer, and no-store protections.
- Redis fixed-window limits protect API clients; an unavailable production limiter fails closed with HTTP 503.
- GitHub OAuth access tokens are encrypted at rest; Celery messages carry only scan IDs, never clone credentials.
- Implementation plans require owner/admin approval before PR creation.

## Alerts and diagnosis

Alert on readiness failures, Celery retry growth, scan failures, Neo4j connection failures, 5xx rate, and rate-limit unavailability. Use structured logs with `scan_id`, repository ID, and graph-version ID when tracing a scan. The WebSocket event stream exposes live scan state to the UI; persisted `repository_scans.error` retains terminal error details.
