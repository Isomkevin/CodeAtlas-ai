"""Shared error envelope and exception handlers for public HTTP contracts."""

from typing import Any

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = structlog.get_logger(__name__)


class ErrorResponse(BaseModel):
    """Stable JSON error response used by every API module."""

    code: str
    message: str
    details: dict[str, Any] | None = None


class DomainError(Exception):
    """Expected business error which can be safely returned to callers."""

    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None) -> None:
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    logger.info("domain_error", code=exc.code)
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(code=exc.code, message=exc.message, details=exc.details).model_dump(),
    )


async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_error", error_type=type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(code="internal_error", message="An unexpected error occurred.").model_dump(),
    )
