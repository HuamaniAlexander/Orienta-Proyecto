from fastapi.testclient import TestClient

from app.main import Settings, create_app


def test_health_contract() -> None:
    with TestClient(create_app(Settings(_env_file=None))) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "orienta-api"}


def test_cors_only_allows_configured_origin() -> None:
    with TestClient(create_app(Settings(_env_file=None))) as client:
        allowed = client.get("/health", headers={"Origin": "http://localhost:5173"})
        denied = client.get("/health", headers={"Origin": "https://untrusted.example"})
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in denied.headers
