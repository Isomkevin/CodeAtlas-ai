"""Cross-cutting logging, tracing, and metrics configuration."""

import logging
import sys
import time
from collections.abc import Callable

import structlog
from fastapi import FastAPI, Request, Response
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from prometheus_client import Counter, Histogram, make_asgi_app
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import Settings

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "codeatlas_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "route", "status_code"],
)
HTTP_REQUESTS_TOTAL = Counter(
    "codeatlas_http_requests_total",
    "Total HTTP requests",
    ["method", "route", "status_code"],
)


def configure_logging(settings: Settings) -> None:
    """Emit JSON structured logs suitable for local and centralized collection."""

    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=settings.log_level)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def configure_tracing(app: FastAPI, settings: Settings) -> None:
    """Install OpenTelemetry request instrumentation without exporting outside the process."""

    provider = TracerProvider(resource=Resource.create({SERVICE_NAME: settings.otel_service_name}))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)


class HttpMetricsMiddleware(BaseHTTPMiddleware):
    """Record stable route-level latency and request-count metrics."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        started_at = time.perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        route_path = getattr(route, "path", request.url.path)
        labels = {"method": request.method, "route": route_path, "status_code": response.status_code}
        HTTP_REQUESTS_TOTAL.labels(**labels).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(**labels).observe(time.perf_counter() - started_at)
        return response


def configure_observability(app: FastAPI, settings: Settings) -> None:
    """Attach tracing, request metrics, and the Prometheus scrape endpoint."""

    configure_logging(settings)
    configure_tracing(app, settings)
    app.add_middleware(HttpMetricsMiddleware)
    app.mount("/metrics", make_asgi_app())
