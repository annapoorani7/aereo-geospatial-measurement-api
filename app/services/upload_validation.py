from pathlib import PureWindowsPath

from fastapi import UploadFile

from app.errors import UploadError

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
UPLOAD_CHUNK_BYTES = 64 * 1024
SUPPORTED_EXTENSIONS = {".kml", ".zip"}


def validate_filename(filename: str | None) -> tuple[str, str]:
    if not filename or filename != filename.strip():
        raise UploadError("A valid filename is required.", status_code=400)
    if any(ord(character) < 32 for character in filename):
        raise UploadError("Filename contains invalid characters.", status_code=400)
    if "/" in filename or "\\" in filename or PureWindowsPath(filename).drive:
        raise UploadError("Filename must not contain a path.", status_code=400)

    extension = "." + filename.rsplit(".", maxsplit=1)[-1].casefold() if "." in filename else ""
    if extension not in SUPPORTED_EXTENSIONS:
        raise UploadError(
            "Only .kml and .zip uploads are supported.", status_code=415
        )
    return filename, extension


async def read_upload(upload: UploadFile) -> bytes:
    chunks: list[bytes] = []
    total_bytes = 0
    while chunk := await upload.read(UPLOAD_CHUNK_BYTES):
        total_bytes += len(chunk)
        if total_bytes > MAX_UPLOAD_BYTES:
            raise UploadError("Upload exceeds the 20 MiB size limit.", status_code=413)
        chunks.append(chunk)

    if total_bytes == 0:
        raise UploadError("Uploaded file is empty.", status_code=400)
    return b"".join(chunks)