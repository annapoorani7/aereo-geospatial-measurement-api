from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import fiona
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import upload_validation

client = TestClient(app)

KML_DOCUMENT = b"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
        <Schema id="survey-fields" name="survey-fields">
            <SimpleField name="survey_code" type="string" />
        </Schema>
    <Placemark id="point-1">
      <name>Control point</name>
            <ExtendedData>
                <Data name="category"><value>survey</value></Data>
                <SchemaData schemaUrl="#survey-fields">
                    <SimpleData name="survey_code">A-17</SimpleData>
                </SchemaData>
            </ExtendedData>
      <Point><coordinates>-122.0,37.0,0</coordinates></Point>
    </Placemark>
    <Placemark id="line-1">
      <name>Baseline</name>
      <LineString><coordinates>-122.0,37.0 -121.9,37.1</coordinates></LineString>
    </Placemark>
    <Placemark id="polygon-1">
      <name>Parcel</name>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>
        -122,37 -121.9,37 -121.9,37.1 -122,37.1 -122,37
      </coordinates></LinearRing></outerBoundaryIs></Polygon>
    </Placemark>
  </Document>
</kml>
"""


def _post_file(filename: str, content: bytes):
    return client.post(
        "/api/files/",
        files={"file": (filename, content, "application/octet-stream")},
    )


def _shapefile_archive(tmp_path: Path, include_crs: bool = True) -> bytes:
    shapefile_path = tmp_path / "source" / "areas.shp"
    shapefile_path.parent.mkdir()
    schema = {
        "geometry": "Polygon",
        "properties": {"name": "str:40", "parcel_id": "int"},
    }
    options = {"crs": "EPSG:4326"} if include_crs else {}
    with fiona.open(
        shapefile_path,
        mode="w",
        driver="ESRI Shapefile",
        schema=schema,
        **options,
    ) as destination:
        for parcel_id, name, offset in (
            (1, "North field", 0.0),
            (2, "South field", 1.0),
        ):
            destination.write(
                {
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                (offset, 0.0),
                                (offset + 0.5, 0.0),
                                (offset + 0.5, 0.5),
                                (offset, 0.5),
                                (offset, 0.0),
                            ]
                        ],
                    },
                    "properties": {"name": name, "parcel_id": parcel_id},
                }
            )

    buffer = BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        for component in shapefile_path.parent.iterdir():
            if include_crs or component.suffix.casefold() != ".prj":
                archive.write(component, f"dataset/{component.name}")
    return buffer.getvalue()


def test_valid_kml_upload_preserves_features_and_properties() -> None:
    response = _post_file("survey.kml", KML_DOCUMENT)

    assert response.status_code == 201
    upload = response.json()
    assert upload["filename"] == "survey.kml"
    assert upload["feature_count"] == 3
    assert upload["source_crs"] == "EPSG:4326"
    assert upload["crs_status"] == "known"
    assert upload["processing_status"] == "processed"
    assert [feature["geometry_type"] for feature in upload["features"]] == [
        "Point",
        "LineString",
        "Polygon",
    ]
    assert upload["features"][0]["feature_id"] == "point-1"
    assert upload["features"][0]["properties"] == {
        "name": "Control point",
        "category": "survey",
        "survey_code": "A-17",
    }
    assert upload["features"][0]["geometry"]["coordinates"] == [-122.0, 37.0, 0.0]


def test_valid_zipped_shapefile_upload_parses_features_and_crs(tmp_path: Path) -> None:
    response = _post_file("areas.zip", _shapefile_archive(tmp_path))

    assert response.status_code == 201
    upload = response.json()
    assert upload["feature_count"] == 2
    assert upload["source_crs"] == "EPSG:4326"
    assert upload["crs_status"] == "known"
    assert upload["features"][0]["geometry_type"] == "Polygon"
    assert upload["features"][0]["properties"] == {
        "name": "North field",
        "parcel_id": 1,
    }


def test_shapefile_without_projection_keeps_crs_unknown(tmp_path: Path) -> None:
    response = _post_file(
        "areas.zip", _shapefile_archive(tmp_path, include_crs=False)
    )

    assert response.status_code == 201
    upload = response.json()
    assert upload["source_crs"] is None
    assert upload["crs_status"] == "missing"
    assert all(feature["source_crs"] is None for feature in upload["features"])


def test_empty_upload_is_rejected() -> None:
    response = _post_file("empty.kml", b"")

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded file is empty."


def test_unsupported_file_type_is_rejected() -> None:
    response = _post_file("survey.gpx", b"<gpx/>")

    assert response.status_code == 415
    assert "Only .kml and .zip" in response.json()["detail"]


def test_path_like_filename_is_rejected() -> None:
    response = _post_file("../survey.kml", KML_DOCUMENT)

    assert response.status_code == 400
    assert "must not contain a path" in response.json()["detail"]


def test_upload_size_limit_is_enforced(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(upload_validation, "MAX_UPLOAD_BYTES", 8)

    response = _post_file("large.kml", b"123456789")

    assert response.status_code == 413
    assert "size limit" in response.json()["detail"]


def test_malformed_kml_is_rejected() -> None:
    response = _post_file("broken.kml", b"<kml><Placemark>")

    assert response.status_code == 422
    assert "Malformed or unreadable KML" in response.json()["detail"]


def test_kml_without_features_is_rejected() -> None:
    response = _post_file(
        "empty-document.kml",
        b'<kml xmlns="http://www.opengis.net/kml/2.2"><Document/></kml>',
    )

    assert response.status_code == 422
    assert "contains no features" in response.json()["detail"]


def test_empty_or_unsupported_geometry_is_rejected() -> None:
    document = b"""<kml xmlns="http://www.opengis.net/kml/2.2">
      <Placemark id="unsupported"><MultiGeometry>
        <Point><coordinates>0,0</coordinates></Point>
        <LineString><coordinates>0,0 1,1</coordinates></LineString>
      </MultiGeometry></Placemark>
    </kml>"""

    response = _post_file("unsupported.kml", document)

    assert response.status_code == 422


def test_placemark_without_geometry_is_rejected() -> None:
        document = b"""<kml xmlns="http://www.opengis.net/kml/2.2">
            <Placemark id="empty"><name>No geometry</name></Placemark>
        </kml>"""

        response = _post_file("empty-geometry.kml", document)

        assert response.status_code == 422
        assert "has no geometry" in response.json()["detail"]


def test_invalid_zip_is_rejected() -> None:
    response = _post_file("broken.zip", b"not a zip archive")

    assert response.status_code == 422
    assert "ZIP archive is invalid" in response.json()["detail"]


def test_zip_with_missing_shapefile_components_is_rejected() -> None:
    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("dataset/areas.shp", b"not extracted")

    response = _post_file("incomplete.zip", buffer.getvalue())

    assert response.status_code == 422
    assert "missing essential components" in response.json()["detail"]


def test_zip_path_traversal_is_rejected() -> None:
    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("../escape.txt", b"must not be extracted")

    response = _post_file("unsafe.zip", buffer.getvalue())

    assert response.status_code == 422
    assert "path traversal" in response.json()["detail"]