# Incident: Neo4j Aura DNS resolution failure

**Date:** 2026-08-16  
**Service:** `codeatlas-api` on Render  
**Severity:** Degraded functionality

## Summary

The Render deployment completed successfully, but the API could not connect to
the configured Neo4j Aura database. The configured hostname
`f1284ba7.databases.neo4j.io` could not be resolved, so graph-backed features
were unavailable. PostgreSQL, Redis, the API, and the inline Celery worker were
healthy.

## Deployment evidence

```text
2026-08-16T14:21:12Z application_started environment=production
2026-08-16T14:21:12Z Uvicorn running on http://0.0.0.0:8000
2026-08-16T14:21:17Z readiness_dependency_unavailable
  dependency=neo4j
  error="Cannot resolve address f1284ba7.databases.neo4j.io:7687"
2026-08-16T14:21:17Z readiness_soft_deps_unavailable unavailable=["neo4j"]
2026-08-16T14:21:17Z GET /api/v1/ready 200 OK
2026-08-16T14:21:19Z Render reported the service live
```

The error repeated in subsequent Render readiness checks until the log capture
ended. The application intentionally treats Neo4j as a soft readiness
dependency, so the service stayed live while graph operations remained
unavailable.

## Diagnosis

This is a DNS/configuration failure, not an application or password failure.
The Aura hostname is stale, malformed, or belongs to a database that no longer
exists. Aura hibernation alone does not remove the database DNS record.

## Remediation

1. In Neo4j Aura, resume the existing database or create a replacement.
2. Copy the connection URI provided by Aura exactly. It should use the form
   `neo4j+s://<instance-id>.databases.neo4j.io`.
3. In Render's `codeatlas-api` environment, replace `CODEATLAS_NEO4J_URI` and,
   if necessary, `CODEATLAS_NEO4J_PASSWORD`.
4. Redeploy and verify `GET /api/v1/warm` reports `"neo4j":"ok"`.

Do not add `:7687` manually; use the exact URI copied from Aura.

## Log handling

The original Render export contained OAuth callback codes and bearer tokens in
request URLs. Those values were deliberately omitted from this repository
record. Treat the exposed values in the original export as sensitive and rotate
the relevant credentials if they were shared beyond their intended audience.
