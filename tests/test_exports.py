from html import escape as escape_html
from urllib.parse import quote
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api import files as files_api
from app.main import app
from app.schemas.files import (
    FeatureMeasurement,
    FeatureResponse,
    MeasurementsResponse,
    UploadResponse,
)
from app.storage import store_upload

client = TestClient(app)

EXPORT_ROUTES = [
    ("csv", "text/csv"),
    ("geojson", "application/geo+json"),
    ("json", "application/json"),
    ("summary", "application/json"),
    ("html", "text/html"),
]


def _store_export_upload(
    filename: str = "export-test.kml",
    feature_id: str = "export-feature",
    upload_id: str | None = None,
    source_crs: str | None = None,
) -> str:
    upload_id = upload_id or str(uuid4())
    feature = FeatureResponse(
        feature_id=feature_id,
        geometry_type="Point",
        geometry={"type": "Point", "coordinates": [3, 0]},
        source_crs=source_crs,
        properties={"label": "export test"},
    )
    store_upload(
        UploadResponse(
            upload_id=upload_id,
            filename=filename,
            feature_count=1,
            source_crs=source_crs,
            crs_status="known" if source_crs else "missing",
            processing_status="processed",
            features=[feature],
        )
    )
    return upload_id


@pytest.mark.parametrize(("format_name", "content_type"), EXPORT_ROUTES)
def test_export_disabled_returns_forbidden(
    monkeypatch: pytest.MonkeyPatch,
    format_name: str,
    content_type: str,
) -> None:
    monkeypatch.setattr(files_api, "ENABLE_EXPORT", False)

    response = client.get(f"/api/files/unknown-id/export/{format_name}")

    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()


@pytest.mark.parametrize(("format_name", "content_type"), EXPORT_ROUTES)
def test_export_missing_upload_returns_not_found(
    monkeypatch: pytest.MonkeyPatch,
    format_name: str,
    content_type: str,
) -> None:
    monkeypatch.setattr(files_api, "ENABLE_EXPORT", True)

    response = client.get(f"/api/files/missing-upload/export/{format_name}")

    assert response.status_code == 404


@pytest.mark.parametrize(("format_name", "content_type"), EXPORT_ROUTES)
def test_export_returns_format_content_type_and_payload(
    monkeypatch: pytest.MonkeyPatch,
    format_name: str,
    content_type: str,
) -> None:
    monkeypatch.setattr(files_api, "ENABLE_EXPORT", True)
    upload_id = _store_export_upload()

    response = client.get(f"/api/files/{upload_id}/export/{format_name}")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(content_type)
    if format_name == "csv":
        assert "feature_id,geometry_type,status" in response.text
        assert "export-feature,Point,not_applicable" in response.text
    elif format_name == "geojson":
        payload = response.json()
        assert payload["type"] == "FeatureCollection"
        assert payload["features"][0]["properties"]["feature_id"] == "export-feature"
    elif format_name == "json":
        payload = response.json()
        assert payload["upload_id"] == upload_id
        assert payload["measurements"][0]["feature_id"] == "export-feature"
    elif format_name == "summary":
        payload = response.json()
        assert payload["total_features"] == 1
        assert payload["geometry_breakdown"] == {"Point": 1}
    else:
        assert "export-test.kml" in response.text
        assert "export-feature" in response.text


def test_unsupported_export_format_returns_not_found() -> None:
    upload_id = _store_export_upload()

    response = client.get(f"/api/files/{upload_id}/export/xml")

    assert response.status_code == 404


def test_html_export_escapes_untrusted_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    malicious_filename = '<img src=x onerror="alert(1)">'
    malicious_upload_id = "<svg onload=alert(2)>"
    malicious_feature_id = "</td><script>alert(3)</script>"
    malicious_error = "<script>alert(4)</script>"
    malicious_source_crs = "<img src=x onerror=alert(5)>"
    malicious_method = "<svg onload=alert(6)>"
    upload_id = _store_export_upload(
        filename=malicious_filename,
        feature_id=malicious_feature_id,
        upload_id=malicious_upload_id,
        source_crs=malicious_source_crs,
    )
    measurements = MeasurementsResponse(
        upload_id=malicious_upload_id,
        filename=malicious_filename,
        source_crs=malicious_source_crs,
        crs_status="known",
        measurement_method=malicious_method,
        status="partial",
        measurements=[
            FeatureMeasurement(
                feature_id=malicious_feature_id,
                geometry_type="<svg onload=alert(7)>",
                status="unavailable",
                measurement_crs=malicious_source_crs,
                error=malicious_error,
            )
        ],
    )
    monkeypatch.setattr(files_api, "ENABLE_EXPORT", True)
    monkeypatch.setattr(files_api, "measure_upload", lambda _upload: measurements)

    response = client.get(
        f"/api/files/{quote(upload_id, safe='')}/export/html"
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    for value in (
        malicious_filename,
        malicious_upload_id,
        malicious_feature_id,
        malicious_error,
        malicious_source_crs,
        malicious_method,
        "<svg onload=alert(7)>",
    ):
        assert escape_html(value, quote=True) in response.text
        assert value not in response.text