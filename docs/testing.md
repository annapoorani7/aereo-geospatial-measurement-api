# Testing and Verification

## Automated Checks

Run backend checks from `server/` with the project virtual environment active:

```powershell
python -m pytest
python -m pip check
```

The suite covers health/OpenAPI docs, KML and zipped Shapefile uploads, CRS metadata, measurements, invalid input, upload limits, feature/vertex limits, and ZIP path traversal. Shapefile tests require Fiona. Do not weaken a test to hide a failure.

Run the client production check from `client/`:

```powershell
npm ci
npm run build
```

This runs the strict TypeScript check and Vite production bundle. The project does not currently include an automated browser/e2e suite.

## API Smoke Test

Start the backend from `server/` and use a second terminal at the repository root:

```powershell
curl.exe -sS http://127.0.0.1:8000/health
curl.exe -sS http://127.0.0.1:8000/openapi.json
curl.exe -sS -F "file=@server/demo_data/sample_features.kml" http://127.0.0.1:8000/api/files/
```

The upload response contains `upload_id` and extracted features. Use that ID to check metadata, measurements, and exports through `/docs` or these routes:

- `GET /api/files/{file_id}/`
- `GET /api/files/{file_id}/measurements/`
- `GET /api/files/{file_id}/export/csv`
- `GET /api/files/{file_id}/export/geojson`
- `GET /api/files/{file_id}/export/json`
- `GET /api/files/{file_id}/export/summary`
- `GET /api/files/{file_id}/export/html`

Uploads are stored in process memory, so an ID is lost when the backend restarts. A `404` for an unknown ID is expected.

## Browser Workflow

With both services running:

1. Open the Vite client and verify Landing, Overview, Upload, Feature Explorer, and API Status navigation.
2. Upload `server/demo_data/sample_features.kml` from the Upload page. Confirm the upload succeeds and features/measurements are shown.
3. Open Feature Explorer. Search/filter features, expand feature details, select a map feature, and verify its popup and corresponding details.
4. Use the export controls and confirm each requested file has the expected format.
5. Stop the backend and verify the API Status/offline and upload error messages explain the connection failure. Restart it and verify recovery.
6. Check browser console and network requests for unhandled errors or requests to an incorrect API base URL.

## Upload Validation Scenarios

The automated suite checks empty and unsupported files, malformed KML/ZIP, missing Shapefile components, path-like filenames, ZIP traversal, missing CRS, upload size limits, and feature/vertex limits. Default server limits are 20 MiB per upload, 256 ZIP entries, 100 MiB expanded archive data, 10,000 features, and 10,000 vertices per feature.

For an additional manual ZIP test, create an archive containing exactly one Shapefile with matching `.shp`, `.shx`, and `.dbf` files. The `.prj` is optional, but without a usable projection area/length measurements are reported unavailable rather than assumed to be WGS 84.

## Map Interaction Checks

The React-Leaflet map scenarios and the limits of the existing manual harness are documented in [map-zoom-investigation.md](map-zoom-investigation.md). Automated pytest and the client production build do not simulate mouse, keyboard, or touch input; test those interactions in a browser.
