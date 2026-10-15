import stat
import tempfile
import zipfile
from contextlib import contextmanager
from io import BytesIO
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Iterator

from app.errors import UploadError

MAX_ARCHIVE_MEMBERS = 256
MAX_EXTRACTED_BYTES = 100 * 1024 * 1024


def _safe_members(
    archive: zipfile.ZipFile,
) -> list[tuple[zipfile.ZipInfo, tuple[str, ...]]]:
    infos = archive.infolist()
    if not infos or len(infos) > MAX_ARCHIVE_MEMBERS:
        raise UploadError("ZIP archive has an invalid number of entries.")

    members: list[tuple[zipfile.ZipInfo, tuple[str, ...]]] = []
    seen_paths: set[str] = set()
    total_size = 0
    for info in infos:
        name = info.filename
        if not name or "\x00" in name or "\\" in name:
            raise UploadError("ZIP archive contains an unsafe path.")
        if info.flag_bits & 0x1:
            raise UploadError("Encrypted ZIP entries are not supported.")

        windows_path = PureWindowsPath(name)
        if name.startswith("/") or windows_path.is_absolute() or windows_path.drive:
            raise UploadError("ZIP archive contains an absolute path.")

        raw_parts = name.split("/")
        if info.is_dir() and raw_parts[-1] == "":
            raw_parts.pop()
        if not raw_parts or any(part in {"", ".", ".."} for part in raw_parts):
            raise UploadError("ZIP archive contains a path traversal entry.")

        normalized_name = "/".join(raw_parts)
        normalized_key = normalized_name.casefold()
        if normalized_key in seen_paths:
            raise UploadError("ZIP archive contains duplicate paths.")
        seen_paths.add(normalized_key)

        mode = info.external_attr >> 16
        file_type = stat.S_IFMT(mode)
        if stat.S_ISLNK(mode) or file_type not in {0, stat.S_IFREG, stat.S_IFDIR}:
            raise UploadError("ZIP archive contains an unsupported file type.")
        if info.is_dir() and file_type == stat.S_IFREG:
            raise UploadError("ZIP archive has inconsistent directory metadata.")

        total_size += info.file_size
        if total_size > MAX_EXTRACTED_BYTES:
            raise UploadError("ZIP archive expands beyond the 100 MiB limit.", 413)

        members.append((info, tuple(raw_parts)))

    return members


def _shapefile_member(
    members: list[tuple[zipfile.ZipInfo, tuple[str, ...]]],
) -> tuple[zipfile.ZipInfo, tuple[str, ...]]:
    shapefiles = [
        (info, parts)
        for info, parts in members
        if not info.is_dir() and PurePosixPath(*parts).suffix.casefold() == ".shp"
    ]
    if len(shapefiles) != 1:
        raise UploadError("ZIP archive must contain exactly one Shapefile (.shp).")

    shp_info, shp_parts = shapefiles[0]
    shp_path = PurePosixPath(*shp_parts)
    parent_key = shp_path.parent.as_posix().casefold()
    stem_key = shp_path.stem.casefold()
    components = {
        (
            PurePosixPath(*parts).parent.as_posix().casefold(),
            PurePosixPath(*parts).stem.casefold(),
            PurePosixPath(*parts).suffix.casefold(),
        )
        for info, parts in members
        if not info.is_dir()
    }
    missing = [
        extension
        for extension in (".shx", ".dbf")
        if (parent_key, stem_key, extension) not in components
    ]
    if missing:
        raise UploadError(
            "Shapefile archive is missing essential components: "
            + ", ".join(missing)
            + "."
        )
    return shp_info, shp_parts


def _extract_members(
    archive: zipfile.ZipFile,
    members: list[tuple[zipfile.ZipInfo, tuple[str, ...]]],
    root: Path,
) -> None:
    total_extracted = 0
    for info, parts in members:
        destination = root.joinpath(*parts)
        resolved = destination.resolve()
        try:
            resolved.relative_to(root)
        except ValueError as exc:
            raise UploadError("ZIP archive contains a path outside its extraction directory.") from exc

        if info.is_dir():
            resolved.mkdir(parents=True, exist_ok=True)
            continue

        resolved.parent.mkdir(parents=True, exist_ok=True)
        with archive.open(info) as source, resolved.open("xb") as target:
            while chunk := source.read(64 * 1024):
                total_extracted += len(chunk)
                if total_extracted > MAX_EXTRACTED_BYTES:
                    raise UploadError(
                        "ZIP archive expands beyond the 100 MiB limit.", 413
                    )
                target.write(chunk)


@contextmanager
def extract_shapefile_archive(content: bytes) -> Iterator[Path]:
    try:
        archive_context = zipfile.ZipFile(BytesIO(content))
    except Exception as exc:
        raise UploadError("Uploaded ZIP archive is invalid.") from exc

    with archive_context as archive:
        members = _safe_members(archive)
        _, shapefile_parts = _shapefile_member(members)

        with tempfile.TemporaryDirectory(prefix="aereo-upload-") as directory:
            root = Path(directory).resolve()
            try:
                _extract_members(archive, members, root)
            except UploadError:
                raise
            except Exception as exc:
                raise UploadError("Could not safely extract ZIP archive.") from exc

            yield root.joinpath(*shapefile_parts)