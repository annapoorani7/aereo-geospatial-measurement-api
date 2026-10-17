import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.files import FeatureResponse
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


@pytest.mark.parametrize(
    ("geometry_type", "coordinates", "expected_vertices"),
    [
        ("Point", [1, 2], 1),
        ("LineString", [[0, 0], [1, 1], [2, 2]], 3),
        ("Polygon", [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]], 5),
        (
            "Polygon",
            [
                [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
                [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
            ],
            10,
        ),
    ],
)
def test_geometry_vertex_count_includes_supported_geometry_coordinates(
    geometry_type: str,
    coordinates: list,
    expected_vertices: int,
) -> None:
    geometry = {"type": geometry_type, "coordinates": coordinates}

    assert processing._count_geometry_vertices(geometry) == expected_vertices


def test_polygon_interior_ring_vertices_enforce_limit(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    feature = FeatureResponse(
        feature_id="polygon-with-hole",
        geometry_type="Polygon",
        geometry={
            "type": "Polygon",
            "coordinates": [
                [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
                [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
            ],
        },
        source_crs="EPSG:4326",
        properties={},
    )
    monkeypatch.setattr(processing, "MAX_VERTICES", 9)

    with pytest.raises(processing.UploadError) as exc_info:
        processing._validate_feature_limits([feature])

    assert exc_info.value.status_code == 413
