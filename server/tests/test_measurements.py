from copy import deepcopy
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pyproj import Transformer
from shapely.geometry import GeometryCollection, LineString, Point, Polygon, mapping

from app.main import app
from app.schemas.files import FeatureResponse, UploadResponse
from app.storage import get_upload, store_upload

client = TestClient(app)


def _geographic_kml() -> bytes:
    to_geographic = Transformer.from_crs(32631, 4326, always_xy=True)

    def coordinate(easting: float, northing: float) -> str:
        longitude, latitude = to_geographic.transform(easting, northing)
        return f"{longitude:.12f},{latitude:.12f},0"

    polygon = " ".join(
        coordinate(easting, northing)
        for easting, northing in (
            (500000, 0),
            (501000, 0),
            (501000, 1000),
            (500000, 1000),
            (500000, 0),
        )
    )
    line = " ".join((coordinate(500000, 2000), coordinate(501000, 2000)))
    point = coordinate(500500, 5000)
    return f"""<kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        <Placemark id="parcel-1"><Polygon><outerBoundaryIs><LinearRing>
          <coordinates>{polygon}</coordinates>
        </LinearRing></outerBoundaryIs></Polygon></Placemark>
        <Placemark id="baseline-1"><LineString>
          <coordinates>{line}</coordinates>
        </LineString></Placemark>
        <Placemark id="marker-1"><Point><coordinates>{point}</coordinates></Point></Placemark>
      </Document>
    </kml>""".encode("utf-8")


def _store_feature(
    geometry_type: str,
    geometry: dict,
    source_crs: str | None = "EPSG:32631",
    crs_status: str = "known",
) -> str:
    upload_id = str(uuid4())
    feature = FeatureResponse(
        feature_id="synthetic-feature",
        geometry_type=geometry_type,
        geometry=geometry,
        source_crs=source_crs,
        properties={},
    )
    store_upload(
        UploadResponse(
            upload_id=upload_id,
            filename="synthetic.kml",
            feature_count=1,
            source_crs=source_crs,
            crs_status=crs_status,
            processing_status="processed",
            features=[feature],
        )
    )
    return upload_id


def test_metadata_and_measurements_use_local_projected_units() -> None:
    uploaded = client.post(
        "/api/files/",
        files={"file": ("survey.kml", _geographic_kml(), "application/vnd.google-earth.kml+xml")},
    )
    assert uploaded.status_code == 201
    upload = uploaded.json()
    upload_id = upload["upload_id"]
    stored_geometry = deepcopy(get_upload(upload_id).features[0].geometry)

    metadata_response = client.get(f"/api/files/{upload_id}/")
    assert metadata_response.status_code == 200
    assert metadata_response.json() == {
        "upload_id": upload_id,
        "filename": "survey.kml",
        "processing_status": "processed",
        "feature_count": 3,
        "source_crs": "EPSG:4326",
        "crs_status": "known",
    }

    response = client.get(f"/api/files/{upload_id}/measurements/")
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "complete"
    assert result["source_crs"] == "EPSG:4326"
    assert "UTM" in result["measurement_method"]
    measurements = {item["feature_id"]: item for item in result["measurements"]}

    polygon = measurements["parcel-1"]
    assert polygon["geometry_type"] == "Polygon"
    assert polygon["status"] == "measured"
    assert polygon["area_m2"] == pytest.approx(1_000_000, abs=0.02)
    assert polygon["area_m2"] > 100_000
    assert polygon["length_m"] is None
    assert polygon["measurement_crs"] == "EPSG:32631"

    line = measurements["baseline-1"]
    assert line["geometry_type"] == "LineString"
    assert line["status"] == "measured"
    assert line["length_m"] == pytest.approx(1_000, abs=0.001)
    assert line["area_m2"] is None
    assert line["measurement_crs"] == "EPSG:32631"

    point = measurements["marker-1"]
    assert point["geometry_type"] == "Point"
    assert point["status"] == "not_applicable"
    assert point["area_m2"] is None
    assert point["length_m"] is None
    assert get_upload(upload_id).features[0].geometry == stored_geometry


def test_unknown_file_id_returns_404_for_both_get_routes() -> None:
    assert client.get("/api/files/unknown-id/").status_code == 404
    assert client.get("/api/files/unknown-id/measurements/").status_code == 404


@pytest.mark.parametrize(
    ("geometry_type", "geometry", "source_crs", "crs_status", "error_text"),
    [
        (
            "Polygon",
            mapping(Polygon([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)])),
            None,
            "missing",
            "Source CRS is missing",
        ),
        (
            "Polygon",
            mapping(Polygon([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)])),
            "not-a-real-crs",
            "unknown",
            "Source CRS is unusable",
        ),
        (
            "Polygon",
            mapping(Polygon([(0, 0), (1, 1), (1, 0), (0, 1), (0, 0)])),
            "EPSG:4326",
            "known",
            "geometry is invalid",
        ),
        (
            "Polygon",
            mapping(Polygon()),
            "EPSG:4326",
            "known",
            "geometry is empty",
        ),
        (
            "GeometryCollection",
            mapping(GeometryCollection([Point(0, 0), LineString([(0, 0), (1, 1)])])),
            "EPSG:4326",
            "known",
            "not measurable",
        ),
        (
            "Polygon",
            mapping(Polygon([(0, 0), (20, 0), (20, 1), (0, 1), (0, 0)])),
            "EPSG:4326",
            "known",
            "spans more than 6 degrees",
        ),
    ],
)
def test_measurement_failures_are_explicit_and_do_not_fabricate_values(
    geometry_type: str,
    geometry: dict,
    source_crs: str | None,
    crs_status: str,
    error_text: str,
) -> None:
    upload_id = _store_feature(geometry_type, geometry, source_crs, crs_status)

    response = client.get(f"/api/files/{upload_id}/measurements/")

    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "partial"
    measurement = result["measurements"][0]
    assert measurement["status"] == "unavailable"
    assert measurement["area_m2"] is None
    assert measurement["length_m"] is None
    assert error_text in measurement["error"]