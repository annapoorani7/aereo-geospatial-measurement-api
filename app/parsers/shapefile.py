from pathlib import Path
from typing import Any

import fiona
from pyproj import CRS
from pyproj.exceptions import CRSError

from app.errors import UploadError
from app.parsers.features import make_feature
from app.schemas.files import FeatureResponse


def _projection_file_exists(shapefile_path: Path) -> bool:
    expected_name = f"{shapefile_path.stem}.prj".casefold()
    return any(path.name.casefold() == expected_name for path in shapefile_path.parent.iterdir())


def _source_crs(collection: Any, has_projection_file: bool) -> tuple[str | None, str]:
    crs_value = collection.crs_wkt or collection.crs
    if crs_value:
        try:
            return CRS.from_user_input(crs_value).to_string(), "known"
        except CRSError:
            return None, "unknown"

    return None, "unknown" if has_projection_file else "missing"


def parse_shapefile(
    shapefile_path: Path,
) -> tuple[list[FeatureResponse], str | None, str]:
    features: list[FeatureResponse] = []
    try:
        with fiona.open(shapefile_path) as collection:
            source_crs, crs_status = _source_crs(
                collection, _projection_file_exists(shapefile_path)
            )
            for index, source_feature in enumerate(collection, start=1):
                feature_id = str(source_feature.get("id") or f"feature-{index}")
                features.append(
                    make_feature(
                        feature_id=feature_id,
                        source_geometry=source_feature.get("geometry"),
                        source_crs=source_crs,
                        properties=dict(source_feature.get("properties") or {}),
                    )
                )
    except UploadError:
        raise
    except Exception as exc:
        raise UploadError("Invalid or unreadable Shapefile.") from exc

    if not features:
        raise UploadError("Shapefile contains no features.")

    return features, source_crs, crs_status