from app.errors import UploadError
from app.parsers.kml import parse_kml
from app.parsers.shapefile import parse_shapefile
from app.schemas.files import FeatureResponse
from app.services.shapefile_archives import extract_shapefile_archive


def process_upload(
    extension: str,
    content: bytes,
) -> tuple[list[FeatureResponse], str | None, str]:
    if extension == ".kml":
        return parse_kml(content)
    if extension == ".zip":
        with extract_shapefile_archive(content) as shapefile_path:
            return parse_shapefile(shapefile_path)
    raise UploadError("Unsupported upload type.", status_code=415)