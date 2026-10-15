from typing import Any, Literal

from pydantic import BaseModel


class FeatureResponse(BaseModel):
    feature_id: str
    geometry_type: str
    geometry: dict[str, Any]
    source_crs: str | None
    properties: dict[str, Any]


class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    feature_count: int
    source_crs: str | None
    crs_status: Literal["known", "missing", "unknown"]
    processing_status: Literal["processed"]
    features: list[FeatureResponse]


class UploadMetadataResponse(BaseModel):
    upload_id: str
    filename: str
    processing_status: Literal["processed"]
    feature_count: int
    source_crs: str | None
    crs_status: Literal["known", "missing", "unknown"]


class FeatureMeasurement(BaseModel):
    feature_id: str
    geometry_type: str
    status: Literal["measured", "not_applicable", "unavailable"]
    area_m2: float | None = None
    length_m: float | None = None
    measurement_crs: str | None = None
    error: str | None = None


class MeasurementsResponse(BaseModel):
    upload_id: str
    filename: str
    source_crs: str | None
    crs_status: Literal["known", "missing", "unknown"]
    measurement_method: str
    status: Literal["complete", "partial"]
    measurements: list[FeatureMeasurement]