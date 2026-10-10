from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.errors import UploadError
from app.schemas.files import (
    MeasurementsResponse,
    UploadMetadataResponse,
    UploadResponse,
)
from app.services.measurements import measure_upload
from app.services.processing import process_upload
from app.services.upload_validation import read_upload, validate_filename
from app.storage import get_upload, store_upload

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
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
    return record


@router.get("/{file_id}/", response_model=UploadMetadataResponse)
def get_file(file_id: str) -> UploadMetadataResponse:
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
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Uploaded file was not found.")
    return measure_upload(record)