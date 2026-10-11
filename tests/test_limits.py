import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import processing

client = TestClient(app)

def _post_file(filename: str, content: bytes):
    return client.post(
        "/api/files/",
        files={"file": (filename, content, "application/octet-stream")},
    )

# Minimal KML with two simple point features
KML_TWO_FEATURES = b"""<?xml version='1.0' encoding='UTF-8'?>
<kml xmlns='http://www.opengis.net/kml/2.2'>
  <Document>
    <Placemark><Point><coordinates>-122,37,0</coordinates></Point></Placemark>
    <Placemark><Point><coordinates>-123,38,0</coordinates></Point></Placemark>
  </Document>
</kml>"""

def test_feature_count_limit_kml(monkeypatch: pytest.MonkeyPatch):
    # set a low limit to trigger the guard quickly
    monkeypatch.setattr(processing, "MAX_FEATURES", 1)
    response = _post_file("test.kml", KML_TWO_FEATURES)
    assert response.status_code == 413
    assert "exceeding the limit" in response.json()["detail"].lower()

def test_vertex_limit_kml(monkeypatch: pytest.MonkeyPatch):
    # LineString with two vertices, limit set to 1
    kml = b"""<?xml version='1.0' encoding='UTF-8'?>
<kml xmlns='http://www.opengis.net/kml/2.2'>
  <Document>
    <Placemark><LineString><coordinates>-122,37 -121.9,37.1</coordinates></LineString></Placemark>
  </Document>
</kml>"""
    monkeypatch.setattr(processing, "MAX_VERTICES", 1)
    response = _post_file("test.kml", kml)
    assert response.status_code == 413
    assert "vertex limit" in response.json()["detail"].lower()

def test_feature_count_limit_zip(monkeypatch: pytest.MonkeyPatch, tmp_path):
    from tests.test_uploads import _shapefile_archive
    monkeypatch.setattr(processing, "MAX_FEATURES", 1)
    archive_path = _shapefile_archive(tmp_path)
    response = _post_file("areas.zip", archive_path)
    assert response.status_code == 413
    assert "exceeding the limit" in response.json()["detail"].lower()

def test_vertex_limit_zip(monkeypatch: pytest.MonkeyPatch, tmp_path):
    from tests.test_uploads import _shapefile_archive
    # existing shapefile archive contains a polygon with 5 vertices; set limit lower
    monkeypatch.setattr(processing, "MAX_VERTICES", 2)
    archive_path = _shapefile_archive(tmp_path)
    response = _post_file("areas.zip", archive_path)
    assert response.status_code == 413
    assert "vertex limit" in response.json()["detail"].lower()
