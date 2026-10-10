from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_returns_welcome_and_docs_path() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to the Aereo Geospatial Measurement API.",
        "docs": "/docs",
    }


def test_docs_serves_branded_swagger_ui() -> None:
    response = client.get("/docs")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Aereo GeoMeasure" in response.text
    assert "Geospatial measurements, made precise." in response.text
    assert "/static/docs.css" in response.text
    assert "/static/favicon.svg" in response.text
    assert "Back to application" in response.text


def test_static_docs_css_is_available() -> None:
    response = client.get("/static/docs.css")

    assert response.status_code == 200
    assert "--aereo-forest" in response.text
    assert "--aereo-paper-light" in response.text


def test_openapi_schema_contains_all_endpoints() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "Aereo GeoMeasure API"
    expected_paths = {
        "/",
        "/health",
        "/api/files/",
        "/api/files/{file_id}/",
        "/api/files/{file_id}/measurements/",
    }
    assert expected_paths.issubset(set(data["paths"].keys()))
