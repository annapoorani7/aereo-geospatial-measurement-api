from typing import Any

from app.config import MAX_FEATURES, MAX_VERTICES
from app.errors import UploadError
from app.logging_config import get_logger
from app.parsers.kml import parse_kml
from app.parsers.shapefile import parse_shapefile
from app.schemas.files import FeatureResponse
from app.services.shapefile_archives import extract_shapefile_archive
logger = get_logger(__name__)


def _count_geometry_vertices(geometry: dict[str, Any]) -> int:
    """
    Count the number of vertices in a geometry.

    Supports Point, LineString, and Polygon geometries.
    For Polygons, counts vertices in every ring, including interior rings.

    Args:
        geometry: GeoJSON-like geometry dict with 'type' and 'coordinates'

    Returns:
        Number of vertices in the geometry
    """
    geom_type = geometry.get("type")

    if geom_type == "Point":
        return 1

    if geom_type == "LineString":
        coordinates = geometry.get("coordinates", [])
        return len(coordinates)

    if geom_type == "Polygon":
        coordinates = geometry.get("coordinates", [])
        return sum(len(ring) for ring in coordinates)

    return 0


def _validate_feature_limits(features: list[FeatureResponse]) -> None:
    """
    Validate that features comply with configured limits.

    Checks:
    - Total feature count does not exceed MAX_FEATURES
    - Each feature's vertex count does not exceed MAX_VERTICES

    Args:
        features: List of extracted features

    Raises:
        UploadError: If any limit is exceeded
    """
    if len(features) > MAX_FEATURES:
        logger.warning(
            f"Upload rejected: {len(features)} features exceeds limit of {MAX_FEATURES}"
        )
        raise UploadError(
            f"Upload contains {len(features)} features, exceeding the limit of {MAX_FEATURES}.",
            status_code=413,
        )

    for feature in features:
        vertex_count = _count_geometry_vertices(feature.geometry)
        if vertex_count > MAX_VERTICES:
            logger.warning(
                f"Feature {feature.feature_id} rejected: {vertex_count} vertices exceeds limit of {MAX_VERTICES}"
            )
            raise UploadError(
                f"Feature {feature.feature_id} exceeds vertex limit of {MAX_VERTICES}.",
                status_code=413,
            )


def process_upload(
    extension: str,
    content: bytes,
) -> tuple[list[FeatureResponse], str | None, str]:
    """
    Process an uploaded geospatial file and extract features.

    Supports KML documents and zipped Shapefiles. Validates file format,
    extracts features, and enforces configured limits.

    Args:
        extension: File extension ('.kml' or '.zip')
        content: Raw file content as bytes

    Returns:
        Tuple of (features, source_crs, crs_status) where:
        - features: List of extracted FeatureResponse objects
        - source_crs: Source CRS string (e.g., 'EPSG:4326') or None
        - crs_status: CRS status ('known', 'missing', or 'unknown')

    Raises:
        UploadError: If file format is unsupported or limits are exceeded
    """
    if extension == ".kml":
        logger.info("Processing KML upload")
        features, source_crs, crs_status = parse_kml(content)
        _validate_feature_limits(features)
        logger.info(f"KML processing complete: {len(features)} features extracted")
        return features, source_crs, crs_status

    if extension == ".zip":
        logger.info("Processing Shapefile ZIP upload")
        with extract_shapefile_archive(content) as shapefile_path:
            features, source_crs, crs_status = parse_shapefile(shapefile_path)
            _validate_feature_limits(features)
            logger.info(f"Shapefile processing complete: {len(features)} features extracted")
            return features, source_crs, crs_status

    logger.error(f"Unsupported file extension: {extension}")
    raise UploadError("Unsupported upload type.", status_code=415)
