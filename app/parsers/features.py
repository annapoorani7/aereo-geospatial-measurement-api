from typing import Any, Mapping

from shapely.geometry import mapping, shape

from app.errors import UploadError
from app.schemas.files import FeatureResponse

SUPPORTED_GEOMETRIES = {"Point", "LineString", "Polygon"}


def make_feature(
    feature_id: str,
    source_geometry: Any,
    source_crs: str | None,
    properties: Mapping[str, Any],
) -> FeatureResponse:
    if source_geometry is None:
        raise UploadError(f"Feature {feature_id} has no geometry.")

    try:
        geometry = shape(source_geometry)
    except (TypeError, ValueError) as exc:
        raise UploadError(f"Feature {feature_id} has an invalid geometry.") from exc

    if geometry.is_empty:
        raise UploadError(f"Feature {feature_id} has an empty geometry.")
    if geometry.geom_type not in SUPPORTED_GEOMETRIES:
        raise UploadError(
            f"Feature {feature_id} uses unsupported geometry type "
            f"{geometry.geom_type}."
        )

    return FeatureResponse(
        feature_id=feature_id,
        geometry_type=geometry.geom_type,
        geometry=dict(mapping(geometry)),
        source_crs=source_crs,
        properties=dict(properties),
    )