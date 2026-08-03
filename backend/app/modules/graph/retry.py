"""Retry Neo4j operations across Aura Free's hibernation wake cycle.

Aura Free pauses an instance after a stretch of no activity. When Aura
resumes, connections briefly get `Neo.ClientError.Security.Unauthorized`
(the driver raises `AuthError`) or `ServiceUnavailable` before valid
sessions are accepted. Retrying with a short backoff turns a user-visible
failure into a slightly slow first call.
"""

import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

import structlog
from neo4j.exceptions import AuthError, ServiceUnavailable, SessionExpired

T = TypeVar("T")

_BACKOFF_SECONDS = (2, 5, 10)
"""Attempt 1 runs immediately; attempts 2-4 wait these many seconds first."""

logger = structlog.get_logger(__name__)

RETRYABLE = (AuthError, ServiceUnavailable, SessionExpired)


async def with_wake_retry(operation: Callable[[], Awaitable[T]], *, label: str) -> T:
    """Retry `operation` while Aura is resuming; raise on non-wake failures."""

    last_error: Exception | None = None
    for attempt, delay in enumerate((0, *_BACKOFF_SECONDS)):
        if delay:
            await asyncio.sleep(delay)
        try:
            return await operation()
        except RETRYABLE as error:
            last_error = error
            logger.warning(
                "neo4j_wake_retry",
                label=label,
                attempt=attempt + 1,
                total_attempts=len(_BACKOFF_SECONDS) + 1,
                error_type=type(error).__name__,
                error=str(error),
            )
    assert last_error is not None
    raise last_error
