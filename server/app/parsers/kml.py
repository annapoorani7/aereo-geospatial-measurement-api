from typing import Any

from fastkml import KML, Placemark
from fastkml.utils import find_all

from app.errors import UploadError
from app.parsers.features import make_feature
from app.schemas.files import FeatureResponse

# KML coordinates are longitude/latitude in WGS 84 by the KML specification.
KML_SOURCE_CRS = "EPSG:4326"


def _placemark_properties(placemark: Placemark) -> dict[str, Any]:
    properties: dict[str, Any] = {}
    if placemark.name is not None:
        properties["name"] = placemark.name
    if placemark.description is not None:
        properties["description"] = placemark.description

    extended_data = placemark.extended_data
    if extended_data is not None:
        for element in extended_data.elements:
            name = getattr(element, "name", None)
            if name:
                properties[name] = getattr(element, "value", None)
            for simple_data in getattr(element, "data", ()):
                simple_name = getattr(simple_data, "name", None)
                if simple_name:
                    properties[simple_name] = getattr(simple_data, "value", None)
            for array_data in getattr(element, "array_data", ()):
                array_name = getattr(array_data, "name", None)
                if array_name:
                    properties[array_name] = list(
                        getattr(array_data, "values", ()) or ()
                    )

    return properties


def parse_kml(content: bytes) -> tuple[list[FeatureResponse], str, str]:
    try:
        document = KML.from_string(content)
        placemarks = list(find_all(document, of_type=Placemark))
    except Exception as exc:
        raise UploadError("Malformed or unreadable KML document.") from exc

    if not placemarks:
        raise UploadError("KML document contains no features.")

    features = [
        make_feature(
            feature_id=placemark.id or f"feature-{index}",
            source_geometry=placemark.geometry,
            source_crs=KML_SOURCE_CRS,
            properties=_placemark_properties(placemark),
        )
        for index, placemark in enumerate(placemarks, start=1)
    ]
    return features, KML_SOURCE_CRS, "known"