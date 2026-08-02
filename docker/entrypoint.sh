#!/bin/sh
set -eu

if [ "${CODEATLAS_RUN_MIGRATIONS:-0}" = "1" ]; then
  alembic upgrade head
fi

if [ "${CODEATLAS_RUN_INLINE_WORKER:-0}" = "1" ]; then
  celery -A app.worker.celery_app worker --pool=solo --loglevel="${CODEATLAS_WORKER_LOG_LEVEL:-INFO}" &
fi

exec "$@"
