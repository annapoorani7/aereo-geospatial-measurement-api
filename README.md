# Aereo GeoMeasure

Aereo GeoMeasure is a local geospatial file inspection and measurement tool. Upload a KML document or a ZIP containing one Shapefile, inspect the extracted features, and review CRS-aware polygon area and line length results.

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
      FastAPI Backend (app/)
  ├── app/api/files.py               (HTTP routing)
  ├── app/services/upload_validation (File size & extension checks)
  ├── app/services/shapefile_archives(Safe ZIP extraction)
  ├── app/parsers/kml.py             (FastKML feature reader)
  ├── app/parsers/shapefile.py       (Fiona Shapefile reader)
  ├── app/services/measurements.py   (PyProj UTM projection & Shapely math)
  └── app/storage.py                 (In-memory upload storage)
                │
                ▼
      React Frontend (frontend/)
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
- Geospatial dependencies in `requirements.txt`.

## Run locally

### 1. Start the FastAPI backend

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend starts at `http://127.0.0.1:8000`.

### 2. Start the React frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL in your browser, normally `http://127.0.0.1:5173`.

To point the frontend to a custom API URL, create `frontend/.env.local`:

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
| `GET` | `/api/files/{file_id}/` | Metadata and extracted features for an uploaded file |
| `GET` | `/api/files/{file_id}/measurements/` | CRS-aware planar polygon area and line length measurements |

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

From the repository root with `.venv` active:

```powershell
python -m pytest
python -m pip check
```

Expected output: 24 passed tests, no broken requirements.

### Frontend audit

From `frontend/`:

```powershell
npm run build
npm audit
```

Expected output: Clean TypeScript compilation (`tsc -b`) and Vite production bundling.

## Known limitations

1. **In-memory backend persistence:** The backend stores uploads in process memory (`app.storage.UPLOAD_STORE`). Records do not persist across server restarts.
2. **Session-only frontend state:** Frontend uploads are held in React client state. Reloading the browser clears the session list.
3. **Format constraints:** Accepted formats are strictly `.kml` and `.zip` archives containing a single Shapefile (`.shp`, `.shx`, `.dbf`, and optional `.prj`).
4. **Planar UTM scope:** Designed for local and regional spatial features. Global or polar datasets require geodesic measurement engines.
5. **Tailwind CSS 3 toolchain:** Dependency audit reports dev-dependency advisories in the Tailwind CSS 3 build chain. Tailwind CSS 4 requires Node 20+, so Tailwind 3 is retained for Node 18 compatibility.