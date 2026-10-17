from pathlib import PureWindowsPath

from fastapi import UploadFile

from app.config import MAX_UPLOAD_BYTES, UPLOAD_CHUNK_BYTES, SUPPORTED_EXTENSIONS
from app.errors import UploadError
from app.logging_config import get_logger

logger = get_logger(__name__)


def validate_filename(filename: str | None) -> tuple[str, str]:
    """
    Validate and parse an uploaded filename.

    Checks for:
    - Non-empty, trimmed filename
    - No control characters
    - No path separators or absolute paths
    - Supported file extension (.kml or .zip)

    Args:
        filename: The filename to validate

    Returns:
        Tuple of (filename, extension) where extension is lowercase with leading dot

    Raises:
        UploadError: If filename is invalid or extension is not supported
    """
    if not filename or filename != filename.strip():
        logger.warning("Filename validation failed: empty or untrimmed")
        raise UploadError("A valid filename is required.", status_code=400)

    if any(ord(character) < 32 for character in filename):
        logger.warning(f"Filename validation failed: contains control characters")
        raise UploadError("Filename contains invalid characters.", status_code=400)

    if "/" in filename or "\\" in filename or PureWindowsPath(filename).drive:
        logger.warning(f"Filename validation failed: contains path separators")
        raise UploadError("Filename must not contain a path.", status_code=400)

    extension = "." + filename.rsplit(".", maxsplit=1)[-1].casefold() if "." in filename else ""
    if extension not in SUPPORTED_EXTENSIONS:
        logger.warning(f"Filename validation failed: unsupported extension {extension}")
        raise UploadError(
            "Only .kml and .zip uploads are supported.", status_code=415
        )

    logger.debug(f"Filename validated: {filename} ({extension})")
    return filename, extension


async def read_upload(upload: UploadFile) -> bytes:
    """
    Read an uploaded file in chunks, enforcing size limits.

    Streams the file in UPLOAD_CHUNK_BYTES chunks to avoid loading
    entire file into memory. Enforces MAX_UPLOAD_BYTES limit.

    Args:
        upload: FastAPI UploadFile object

    Returns:
        Complete file content as bytes

    Raises:
        UploadError: If file is empty or exceeds size limit
    """
    chunks: list[bytes] = []
    total_bytes = 0

    while chunk := await upload.read(UPLOAD_CHUNK_BYTES):
        total_bytes += len(chunk)
        if total_bytes > MAX_UPLOAD_BYTES:
            logger.warning(f"Upload rejected: {total_bytes} bytes exceeds limit of {MAX_UPLOAD_BYTES}")
            raise UploadError(
                f"Upload exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MiB size limit.",
                status_code=413
            )
        chunks.append(chunk)

    if total_bytes == 0:
        logger.warning("Upload rejected: empty file")
        raise UploadError("Uploaded file is empty.", status_code=400)

    logger.debug(f"Upload read complete: {total_bytes} bytes")
    return b"".join(chunks)