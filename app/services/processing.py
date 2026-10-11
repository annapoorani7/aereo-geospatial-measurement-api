from app.errors import UploadError
from app.parsers.kml import parse_kml
from app.parsers.shapefile import parse_shapefile
from app.schemas.files import FeatureResponse
from app.services.shapefile_archives import extract_shapefile_archive
MAX_FEATURES = 10_000  # Maximum number of features per upload
MAX_VERTICES = 10_000  # Maximum number of vertices per feature (approx.)



def process_upload(
    extension: str,
    content: bytes,
) -> tuple[list[FeatureResponse], str | None, str]:
    if extension == ".kml":
        features, source_crs, crs_status = parse_kml(content)
        # Feature count limit
        if len(features) > MAX_FEATURES:
            raise UploadError(
                f"Upload contains {len(features)} features, exceeding the limit of {MAX_FEATURES}.",
                status_code=413,
            )
        # Geometry complexity limit
        for feature in features:
            # Count vertices in the geometry dict
            geom = feature.geometry
            def count_vertices(g):
                if g["type"] == "Point":
                    return 1
                if g["type"] == "LineString":
                    return len(g["coordinates"])
                if g["type"] == "Polygon":
                    # Sum vertices of exterior ring (ignore holes)
                    return len(g["coordinates"][0])
                return 0
            if count_vertices(geom) > MAX_VERTICES:
                raise UploadError(
                    f"Feature {feature.feature_id} exceeds vertex limit of {MAX_VERTICES}.",
                    status_code=413,
                )
        return features, source_crs, crs_status
    if extension == ".zip":
        with extract_shapefile_archive(content) as shapefile_path:
            features, source_crs, crs_status = parse_shapefile(shapefile_path)
            if len(features) > MAX_FEATURES:
                raise UploadError(
                    f"Upload contains {len(features)} features, exceeding the limit of {MAX_FEATURES}.",
                    status_code=413,
                )
            for feature in features:
                geom = feature.geometry
                def count_vertices(g):
                    if g["type"] == "Point":
                        return 1
                    if g["type"] == "LineString":
                        return len(g["coordinates"])
                    if g["type"] == "Polygon":
                        return len(g["coordinates"][0])
                    return 0
                if count_vertices(geom) > MAX_VERTICES:
                    raise UploadError(
                        f"Feature {feature.feature_id} exceeds vertex limit of {MAX_VERTICES}.",
                        status_code=413,
                    )
            return features, source_crs, crs_status
    raise UploadError("Unsupported upload type.", status_code=415)