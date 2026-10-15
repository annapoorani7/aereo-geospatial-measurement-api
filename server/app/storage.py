"""Process-local upload records; all records are lost when the app restarts."""

from app.schemas.files import UploadResponse

UPLOADS: dict[str, UploadResponse] = {}


def store_upload(record: UploadResponse) -> None:
    UPLOADS[record.upload_id] = record


def get_upload(upload_id: str) -> UploadResponse | None:
    return UPLOADS.get(upload_id)