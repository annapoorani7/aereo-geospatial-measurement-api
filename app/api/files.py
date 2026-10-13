from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.config import ENABLE_EXPORT
from app.errors import UploadError
from app.logging_config import get_logger
from app.schemas.files import (
    MeasurementsResponse,
    UploadMetadataResponse,
    UploadResponse,
)
from app.services.export import (
    export_features_geojson,
    export_html_report,
    export_measurements_csv,
    export_measurements_json,
    export_summary_json,
)
from app.services.measurements import measure_upload
from app.services.processing import process_upload
from app.services.upload_validation import read_upload, validate_filename
from app.storage import get_upload, store_upload

logger = get_logger(__name__)
router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload and process a geospatial file.
    
    Accepts KML documents or ZIP archives containing Shapefiles.
    Extracts features and validates against configured limits.
    
    Returns:
        UploadResponse with extracted features and metadata
    """
    try:
        filename, extension = validate_filename(file.filename)
        content = await read_upload(file)
        features, source_crs, crs_status = process_upload(extension, content)
    except UploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    record = UploadResponse(
        upload_id=str(uuid4()),
        filename=filename,
        feature_count=len(features),
        source_crs=source_crs,
        crs_status=crs_status,
        processing_status="processed",
        features=features,
    )
    store_upload(record)
    logger.info(f"Upload processed: {record.upload_id} with {len(features)} features")
    return record


@router.get("/{file_id}/", response_model=UploadMetadataResponse)
def get_file(file_id: str) -> UploadMetadataResponse:
    """
    Retrieve metadata for an uploaded file.
    
    Returns:
        UploadMetadataResponse with file information
    """
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")

    return UploadMetadataResponse(
        upload_id=record.upload_id,
        filename=record.filename,
        processing_status=record.processing_status,
        feature_count=record.feature_count,
        source_crs=record.source_crs,
        crs_status=record.crs_status,
    )


@router.get("/{file_id}/measurements/", response_model=MeasurementsResponse)
def get_file_measurements(file_id: str) -> MeasurementsResponse:
    """
    Compute and retrieve measurements for an uploaded file.
    
    Performs CRS-aware planar measurements using local UTM projections.
    
    Returns:
        MeasurementsResponse with measurement results
    """
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    return measure_upload(record)


@router.get("/{file_id}/export/csv")
def export_measurements_csv_endpoint(file_id: str) -> StreamingResponse:
    """
    Export measurements as CSV.
    
    Returns a CSV file with feature measurements and metadata.
    """
    if not ENABLE_EXPORT:
        raise HTTPException(status_code=403, detail="Export functionality is disabled.")
    
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    
    measurements = measure_upload(record)
    csv_content = export_measurements_csv(measurements)
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={record.filename}.measurements.csv"},
    )


@router.get("/{file_id}/export/geojson")
def export_features_geojson_endpoint(file_id: str) -> StreamingResponse:
    """
    Export features as GeoJSON with measurements.
    
    Returns a GeoJSON FeatureCollection with all features and measurements.
    """
    if not ENABLE_EXPORT:
        raise HTTPException(status_code=403, detail="Export functionality is disabled.")
    
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    
    measurements = measure_upload(record)
    geojson_content = export_features_geojson(record, measurements)
    
    return StreamingResponse(
        iter([geojson_content]),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={record.filename}.geojson"},
    )


@router.get("/{file_id}/export/json")
def export_measurements_json_endpoint(file_id: str) -> StreamingResponse:
    """
    Export measurements as JSON.
    
    Returns a JSON file with detailed measurement data.
    """
    if not ENABLE_EXPORT:
        raise HTTPException(status_code=403, detail="Export functionality is disabled.")
    
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    
    measurements = measure_upload(record)
    json_content = export_measurements_json(measurements)
    
    return StreamingResponse(
        iter([json_content]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={record.filename}.measurements.json"},
    )


@router.get("/{file_id}/export/summary")
def export_summary_json_endpoint(file_id: str) -> StreamingResponse:
    """
    Export a summary of measurements with statistics.
    
    Returns a JSON file with aggregated statistics.
    """
    if not ENABLE_EXPORT:
        raise HTTPException(status_code=403, detail="Export functionality is disabled.")
    
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    
    measurements = measure_upload(record)
    summary_content = export_summary_json(measurements)
    
    return StreamingResponse(
        iter([summary_content]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={record.filename}.summary.json"},
    )


@router.get("/{file_id}/export/html")
def export_html_report_endpoint(file_id: str) -> StreamingResponse:
    """
    Export a formatted HTML report.
    
    Returns an HTML file with formatted measurements and statistics.
    """
    if not ENABLE_EXPORT:
        raise HTTPException(status_code=403, detail="Export functionality is disabled.")
    
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    
    measurements = measure_upload(record)
    html_content = export_html_report(record, measurements)
    
    return StreamingResponse(
        iter([html_content]),
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={record.filename}.report.html"},
    )
