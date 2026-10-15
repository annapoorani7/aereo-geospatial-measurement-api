from math import floor, isfinite

from pyproj import CRS, Transformer
from pyproj.exceptions import CRSError
from shapely.geometry import shape
from shapely.ops import transform
from shapely.validation import explain_validity

from app.schemas.files import (
    FeatureMeasurement,
    MeasurementsResponse,
    UploadResponse,
)

MEASUREMENT_METHOD = (
    "Each measurable feature is copied to its centered WGS 84 UTM zone; "
    "area is planar square metres and length is planar metres. Features "
    "spanning more than 6 degrees or outside UTM latitude coverage are unavailable."
)
MAX_UTM_SPAN_DEGREES = 6.0
MIN_UTM_LATITUDE = -80.0
MAX_UTM_LATITUDE = 84.0


class MeasurementFailure(Exception):
    pass


def _unavailable(
    feature_id: str,
    geometry_type: str,
    error: str,
) -> FeatureMeasurement:
    return FeatureMeasurement(
        feature_id=feature_id,
        geometry_type=geometry_type,
        status="unavailable",
        error=error,
    )


def _local_utm_crs(geometry, source_crs: CRS) -> CRS:
    try:
        to_geographic = Transformer.from_crs(
            source_crs, CRS.from_epsg(4326), always_xy=True
        )
        geographic_geometry = transform(to_geographic.transform, geometry)
    except Exception as exc:
        raise MeasurementFailure("Could not transform feature to WGS 84.") from exc

    min_lon, min_lat, max_lon, max_lat = geographic_geometry.bounds
    if not all(isfinite(value) for value in (min_lon, min_lat, max_lon, max_lat)):
        raise MeasurementFailure("Feature has non-finite geographic coordinates.")
    if min_lon < -180 or max_lon > 180:
        raise MeasurementFailure("Feature longitude is outside WGS 84 bounds.")
    if min_lat < MIN_UTM_LATITUDE or max_lat > MAX_UTM_LATITUDE:
        raise MeasurementFailure(
            "Feature is outside UTM latitude coverage (-80 to 84 degrees)."
        )
    if (
        max_lon - min_lon > MAX_UTM_SPAN_DEGREES
        or max_lat - min_lat > MAX_UTM_SPAN_DEGREES
    ):
        raise MeasurementFailure(
            "Feature spans more than 6 degrees; a local UTM projection is unsuitable."
        )

    center_lon = (min_lon + max_lon) / 2
    center_lat = (min_lat + max_lat) / 2
    zone = max(1, min(60, floor((center_lon + 180) / 6) + 1))
    epsg_code = (32600 if center_lat >= 0 else 32700) + zone
    return CRS.from_epsg(epsg_code)


def _measure_feature(feature) -> FeatureMeasurement:
    try:
        geometry = shape(feature.geometry)
    except Exception:
        return _unavailable(
            feature.feature_id,
            feature.geometry_type,
            "Stored feature geometry is malformed.",
        )

    geometry_type = geometry.geom_type
    if geometry.is_empty:
        return _unavailable(
            feature.feature_id, geometry_type, "Feature geometry is empty."
        )
    if geometry_type != feature.geometry_type:
        return _unavailable(
            feature.feature_id,
            geometry_type,
            "Stored geometry type does not match feature metadata.",
        )
    if geometry_type not in {"Point", "LineString", "Polygon"}:
        return _unavailable(
            feature.feature_id,
            geometry_type,
            f"Geometry type {geometry_type} is not measurable by this API.",
        )
    if not geometry.is_valid:
        return _unavailable(
            feature.feature_id,
            geometry_type,
            f"Feature geometry is invalid: {explain_validity(geometry)}",
        )
    if geometry_type == "Point":
        return FeatureMeasurement(
            feature_id=feature.feature_id,
            geometry_type=geometry_type,
            status="not_applicable",
        )
    if not feature.source_crs:
        return _unavailable(
            feature.feature_id,
            geometry_type,
            "Source CRS is missing; area or length cannot be calculated.",
        )

    try:
        source_crs = CRS.from_user_input(feature.source_crs)
    except (CRSError, ValueError):
        return _unavailable(
            feature.feature_id,
            geometry_type,
            "Source CRS is unusable; area or length cannot be calculated.",
        )

    try:
        measurement_crs = _local_utm_crs(geometry, source_crs)
        to_measurement_crs = Transformer.from_crs(
            source_crs, measurement_crs, always_xy=True
        )
        projected_geometry = transform(to_measurement_crs.transform, geometry)
        if projected_geometry.is_empty or not projected_geometry.is_valid:
            raise MeasurementFailure("Reprojected feature geometry is invalid.")

        value = (
            projected_geometry.area
            if geometry_type == "Polygon"
            else projected_geometry.length
        )
        if not isfinite(value):
            raise MeasurementFailure("Measurement result is not finite.")
    except MeasurementFailure as exc:
        return _unavailable(feature.feature_id, geometry_type, str(exc))
    except Exception:
        return _unavailable(
            feature.feature_id,
            geometry_type,
            "Could not reproject or measure feature with its source CRS.",
        )

    return FeatureMeasurement(
        feature_id=feature.feature_id,
        geometry_type=geometry_type,
        status="measured",
        area_m2=value if geometry_type == "Polygon" else None,
        length_m=value if geometry_type == "LineString" else None,
        measurement_crs=measurement_crs.to_string(),
    )


def measure_upload(upload: UploadResponse) -> MeasurementsResponse:
    measurements = [_measure_feature(feature) for feature in upload.features]
    status = (
        "partial"
        if any(item.status == "unavailable" for item in measurements)
        else "complete"
    )
    return MeasurementsResponse(
        upload_id=upload.upload_id,
        filename=upload.filename,
        source_crs=upload.source_crs,
        crs_status=upload.crs_status,
        measurement_method=MEASUREMENT_METHOD,
        status=status,
        measurements=measurements,
    )