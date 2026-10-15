# Local Setup

## Prerequisites

- Python 3.10 or newer. The backend tests were run with Python 3.10.11.
- Node.js 18 or newer and npm.
- Fiona's platform-compatible wheel for zipped Shapefile support. The full server requirements install Fiona and GeoPandas.

## Server

From the repository root, in PowerShell:

```powershell
Set-Location server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`. Interactive Swagger documentation is at `/docs`, ReDoc at `/redoc`, and the health endpoint at `/health`.

For a lighter environment without Fiona/GeoPandas, install `requirements-dev.txt`; KML features can be developed, but Shapefile parsing requires Fiona. The full test suite includes Shapefile fixtures and therefore requires Fiona.

## Client

Open a second terminal at the repository root:

```powershell
Set-Location client
npm ci
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://127.0.0.1:5173`.

The client defaults to `http://127.0.0.1:8000`. To use a different API origin, create `client/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The checked-in `client/.env.example` is a placeholder template. Do not put credentials or private endpoints in tracked files.

## Run Tests and Build

With the server environment active:

```powershell
Set-Location server
python -m pytest
python -m pip check
```

Build the client from a second terminal:

```powershell
Set-Location client
npm ci
npm run build
```

See [testing.md](testing.md) for API and browser verification scenarios.

## Troubleshooting

- **Fiona import or Shapefile error:** activate the server environment and install `requirements.txt`; the lighter development manifest intentionally omits Fiona.
- **Client cannot reach the API:** verify `/health`, then check `VITE_API_BASE_URL` and that the server allows the client origin (`localhost:5173` or `127.0.0.1:5173`).
- **Port 8000 is occupied:** start Uvicorn with `--port 8001` and set `VITE_API_BASE_URL` to that origin.
- **Port 5173 is occupied:** Vite is configured with a strict port; stop the process using it or change the port and add that origin to the backend CORS configuration in `server/app/main.py`.
- **Measurements are unavailable:** inspect the upload CRS status and the per-feature measurement error. A missing or invalid Shapefile `.prj` is not treated as WGS 84.
