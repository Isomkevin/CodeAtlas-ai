"""Browser CORS configuration regression tests."""

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_allowed_origin_is_not_normalized_with_a_trailing_slash() -> None:
    app = create_app(
        Settings(
            environment="test",
            allowed_origins=["http://127.0.0.1:8081"],
        )
    )

    response = TestClient(app).options(
        "/api/v1/auth/development/session",
        headers={
            "Origin": "http://127.0.0.1:8081",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:8081"
