"""FastAPI application factory for CodeAtlas."""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.health import router as health_router
from app.config import Settings, get_settings
from app.modules.authentication.controller import router as authentication_router
from app.modules.documentation.controller import router as documentation_router
from app.modules.graph.controller import router as graph_router
from app.modules.implementation.controller import router as implementation_router
from app.modules.intelligence.controller import router as intelligence_router
from app.modules.repository.controller import router as repository_router
from app.modules.repository.events import router as repository_events_router
from app.observability import configure_observability
from app.shared.errors import (
    DomainError,
    ErrorResponse,
    domain_error_handler,
    unhandled_error_handler,
)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create the API application with only cross-cutting infrastructure wired in."""

    resolved_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        logger = structlog.get_logger(__name__)
        logger.info("application_started", environment=resolved_settings.environment)
        yield
        logger.info("application_stopped")

    app = FastAPI(
        title=resolved_settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        openapi_url=f"{resolved_settings.api_v1_prefix}/openapi.json",
        docs_url=f"{resolved_settings.api_v1_prefix}/docs",
        redoc_url=None,
    )
    app.dependency_overrides[get_settings] = lambda: resolved_settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in resolved_settings.allowed_origins]
        or [str(resolved_settings.web_app_origin)],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                code="validation_error",
                message="Request validation failed.",
                details={"errors": exc.errors()},
            ).model_dump(),
        )

    app.include_router(health_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(authentication_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(repository_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(repository_events_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(graph_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(documentation_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(intelligence_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(implementation_router, prefix=resolved_settings.api_v1_prefix)
    configure_observability(app, resolved_settings)
    return app


app = create_app()
