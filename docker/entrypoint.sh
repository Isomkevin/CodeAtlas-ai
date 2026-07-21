#!/bin/sh
set -eu

if [ "${CODEATLAS_RUN_MIGRATIONS:-0}" = "1" ]; then
  alembic upgrade head
fi

exec "$@"
