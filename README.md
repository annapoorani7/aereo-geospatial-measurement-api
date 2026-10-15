# Aereo GeoMeasure

Aereo GeoMeasure is a local geospatial file inspection and measurement tool. Upload a KML document or a ZIP containing one Shapefile, inspect the extracted features, and review CRS-aware polygon area and line length results.

The repository is organized as a Python API in `server/` and a React client in `client/`. See the [setup guide](docs/setup.md), [testing guide](docs/testing.md), [architecture](docs/architecture.md), [user guide](docs/user-guide.md), [deployment notes](docs/deployment.md), and [map/zoom investigation](docs/map-zoom-investigation.md).

The frontend features a unified Butter-inspired editorial aesthetic: warm off-white background, Newsreader serif display typography, restrained forest green accents, generous whitespace, spatial diagrams, and a responsive top navigation without any permanent sidebar.

## Capabilities

- **Format intake:** Validates and extracts Point, LineString, and Polygon features from `.kml` documents and zipped `.zip` Shapefiles.
- **Coordinate preservation:** Preserves original source coordinates, feature identifiers, properties, and source CRS metadata.
- **Planar metric measurement:** Measures polygon area in square metres (`m²`) and line length in metres (`m`) using a local projected copy in a centered UTM zone via PyProj and Shapely.
- **Integrity & limitations:** Reports unknown CRS, unsupported or invalid features, and unavailable measurements transparently rather than guessing or flattening geometries.
- **Unified editorial UI:** Single responsive top navigation across all pages (Landing, Overview, Upload & Analyze, Feature Explorer, API Status), with full URL hash routing supporting browser refresh and Back/Forward history.

## Architecture and data flow

```
[ Geospatial File (.kml / .zip) ]
                │
                ▼
        FastAPI Backend (server/app/)
      ├── api/files.py                   (HTTP routing)
      ├── services/upload_validation.py  (File size & extension checks)
      ├── services/shapefile_archives.py (Safe ZIP extraction)
      ├── parsers/kml.py                 (FastKML feature reader)
      ├── parsers/shapefile.py           (Fiona Shapefile reader)
      ├── services/measurements.py       (PyProj UTM projection & Shapely math)
      └── storage.py                     (In-memory upload storage)
                │
                ▼
        React Frontend (client/)
  ├── src/components/TopNav.tsx      (Unified responsive top navigation)
  ├── src/pages/LandingPage.tsx      (Butter-inspired presentation)
  ├── src/pages/OverviewPage.tsx     (Editorial session overview & geometry mix)
  ├── src/pages/UploadPage.tsx       (Intake drop-zone & measurement receipt)
  ├── src/pages/FeatureExplorerPage. (Spatial inspector & coordinate SVG preview)
  ├── src/pages/ApiStatusPage.tsx    (Live health telemetry & endpoint specs)
  └── src/styles.css                 (Butter editorial styling & responsive rules)
```

1. **Intake:** The browser uploads a file to `POST /api/files/`. The backend validates size (max 20 MiB), ensures safe ZIP extraction, and extracts features.
2. **Session storage:** The backend stores upload metadata in process memory (`app.storage.UPLOAD_STORE`). The frontend retains session records in React state.
3. **Measurement:** The frontend requests `GET /api/files/{upload_id}/measurements/`. The backend projects geometries into centered local UTM zones and computes planar metric area/length.
4. **Inspection:** Feature coordinates, properties, and measurements are displayed in the Feature Explorer with coordinate-derived SVG previews.

## Technology stack

- **Backend:** Python 3.10, FastAPI, Uvicorn, FastKML, Fiona, Shapely, PyProj.
- **Frontend:** Node.js 18+, React 18, Vite 6, TypeScript, Tailwind CSS 3, Lucide React, Recharts 3.
- **Typography:** Newsreader Variable (editorial display serif) and DM Sans (interface sans).
- **Tests:** pytest, FastAPI TestClient.

## Prerequisites

- Python 3.10 (tested and verified with Python 3.10.11).
- Node.js 18 or newer and npm.
- Python dependencies in `server/requirements.txt`.

## Run locally

### 1. Start the FastAPI backend

From the repository root:

```powershell
python -m venv server/.venv
server/.venv/Scripts/Activate.ps1
python -m pip install -r server/requirements.txt
Set-Location server
python -m uvicorn app.main:app --reload
```

The backend starts at `http://127.0.0.1:8000`.

### 2. Start the React frontend

In a second terminal:

```powershell
cd client
npm ci
npm run dev
```

Open the Vite URL in your browser, normally `http://127.0.0.1:5173`.

To point the client to a custom API URL, create `client/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The backend CORS policy allows development requests from `http://localhost:5173` and `http://127.0.0.1:5173`.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API welcome message and documentation path |
| `GET` | `/health` | Health probe returning `{"status": "ok"}` |
| `POST` | `/api/files/` | Multipart form field `file` with `.kml` or `.zip` Shapefile archive |
| `GET` | `/api/files/{file_id}/` | Upload metadata; extracted features are returned by upload |
| `GET` | `/api/files/{file_id}/measurements/` | CRS-aware planar polygon area and line length measurements |
| `GET` | `/api/files/{file_id}/export/csv` | Download measurements as CSV |
| `GET` | `/api/files/{file_id}/export/geojson` | Download features and measurements as GeoJSON |
| `GET` | `/api/files/{file_id}/export/json` | Download detailed measurements as JSON |
| `GET` | `/api/files/{file_id}/export/summary` | Download measurement summary as JSON |
| `GET` | `/api/files/{file_id}/export/html` | Download an HTML measurement report |

Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs` while the server is running. The documentation is custom-branded with Aereo GeoMeasure's editorial design system (warm ivory palette, forest-green accents, Newsreader display serif typography, and an integrated top header). To configure the "Back to application" navigation link, set the optional `AEREO_APP_URL` environment variable (defaults to `http://127.0.0.1:5173` for local development; in production deployments, set this to your hosted frontend origin, e.g. `https://your-domain.com`).

## Measurement methodology and CRS

- **KML documents:** Follow the KML standard convention of WGS 84 (EPSG:4326) longitude/latitude degrees.
- **Shapefiles:** The source CRS is parsed directly from the `.prj` file. If `.prj` is missing or unparseable, the backend refuses to guess EPSG:4326 and marks measurements `unavailable`.
- **Projection method:** For each measurable geometry, PyProj identifies the centered local UTM zone (e.g., `EPSG:32643`), transforms a copy into planar UTM coordinates, and uses Shapely to compute:
  - Polygon area in square metres (`area_m2`).
  - LineString length in metres (`length_m`).
  - Points are marked `not_applicable`.
- **Coordinate preservation:** Original source coordinates and feature properties are never overwritten or altered.
- **Extent boundaries:** Geometries spanning more than 6 degrees of longitude or outside UTM valid latitude bounds are marked `unavailable` to prevent distortion.

## Tests and verification

### Backend audit

From `server/` with the project environment active:

```powershell
Set-Location server
python -m pytest
python -m pip check
```

### Client build

From `client/`:

```powershell
Set-Location client
npm ci
npm run build
```
The build runs the strict TypeScript project check followed by the Vite production bundle.

## Known limitations

1. **In-memory backend persistence:** The backend stores uploads in process memory (`server/app/storage.py`). Records do not persist across server restarts or multiple workers.
2. **Session-only frontend state:** Frontend uploads are held in React client state. Reloading the browser clears the session list.
3. **Format constraints:** Accepted formats are strictly `.kml` and `.zip` archives containing a single Shapefile (`.shp`, `.shx`, `.dbf`, and optional `.prj`).
4. **Planar UTM scope:** Designed for local and regional spatial features. Global or polar datasets require geodesic measurement engines.
5. **Shapefile dependency:** ZIP Shapefile processing requires Fiona. Install the full `server/requirements.txt`; the lighter `requirements-dev.txt` intentionally omits Fiona and GeoPandas.

## Documentation

- [Setup and local development](docs/setup.md)
- [Testing and manual verification](docs/testing.md)
- [Architecture and development workflow](docs/architecture.md)
- [User guide](docs/user-guide.md)
- [Deployment notes](docs/deployment.md)
- [Map and zoom investigation](docs/map-zoom-investigation.md)

## Limits

| Limit | Value |
|---|---|
| Upload size | 20 MiB |
| ZIP members | 256 |
| Extracted archive size | 100 MiB |
| Features per upload | 10,000 |
| Vertices per feature | 10,000 |
Feature and vertex limits are enforced after parsing all features.
