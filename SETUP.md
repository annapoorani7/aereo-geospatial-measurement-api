# Local Development Setup Guide

## Quick Start

The Aereo GeoMeasure application is now running with both backend and frontend servers active.

### Running Servers

**Backend API Server:**
- URL: `http://localhost:8000`
- Status: ✅ Running (Uvicorn with auto-reload)
- Port: 8000

**Frontend Development Server:**
- URL: `http://localhost:5173`
- Status: ✅ Running (Vite with HMR)
- Port: 5173

**API Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Prerequisites

- Python 3.14+
- Node.js 18+
- Homebrew (macOS)

## Installation Steps

### 1. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (without GDAL-dependent packages for development)
pip install -r requirements-dev.txt
```

**Note:** The `requirements-dev.txt` excludes `fiona` and `geopandas` which require GDAL compilation. For production deployment with full shapefile support, use `requirements.txt` after GDAL is properly installed.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### 3. Start Backend Server

```bash
# From project root, with venv activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
aereo-geospatial-measurement-api/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Centralized configuration
│   ├── logging_config.py        # Structured logging setup
│   ├── storage.py              # In-memory file storage
│   ├── errors.py               # Custom error classes
│   ├── api/
│   │   └── files.py            # File upload/download endpoints
│   ├── parsers/
│   │   ├── features.py         # Feature parsing logic
│   │   ├── kml.py              # KML parser
│   │   └── shapefile.py        # Shapefile parser (optional fiona)
│   ├── services/
│   │   ├── processing.py       # Core measurement processing
│   │   ├── measurements.py     # Measurement calculations
│   │   ├── upload_validation.py # File validation
│   │   ├── export.py           # Multi-format export (CSV, GeoJSON, JSON, HTML)
│   │   ├── geometry_validation.py # Geometry quality checks
│   │   ├── spatial_operations.py  # Buffer, intersect, union, etc.
│   │   └── crs_conversion.py   # CRS transformation utilities
│   └── schemas/
│       └── files.py            # Pydantic models
├── frontend/
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Main app component
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript types
│   │   ├── components/
│   │   │   ├── MapViewer.tsx   # Interactive Leaflet map
│   │   │   ├── TopNav.tsx      # Navigation bar
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ...
│   │   └── pages/
│   │       ├── UploadPage.tsx
│   │       ├── FeatureExplorerPage.tsx (with MapViewer)
│   │       ├── OverviewPage.tsx
│   │       └── ...
│   └── package.json
├── docs/
│   ├── USER_GUIDE.md           # User documentation
│   ├── DEVELOPER_GUIDE.md      # Developer documentation
│   └── DEPLOYMENT.md           # Deployment instructions
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies (no GDAL)
└── README.md
```

## Key Features Implemented

### Phase 1: Code Quality ✅
- Centralized configuration management
- Structured logging infrastructure
- Type hints and docstrings
- Code duplication elimination

### Phase 2: Visualization & Interactivity ✅
- Interactive Leaflet.js map component
- Feature highlighting and selection
- Color-coded measurement status display
- Responsive map integration

### Phase 3: Data Export & Reporting ✅
- CSV export with measurements
- GeoJSON export with properties
- JSON export (detailed and summary)
- HTML report generation

### Phase 4: Geometry Validation ✅
- Topology validation
- Self-intersection detection
- Validation result aggregation
- Quality metrics

### Phase 6: Advanced Analysis ✅
- Buffer zone creation
- Intersection detection
- Union/dissolve operations
- Centroid calculation
- Convex hull generation
- Bounding box calculation
- Geometry simplification

### Phase 8: CRS Improvements ✅
- EPSG code support
- WKT string parsing
- PROJ string support
- CRS transformation utilities
- UTM zone identification

### Phase 13: Documentation ✅
- Comprehensive user guide
- Developer guide with architecture
- Deployment instructions

## API Endpoints

### File Management
- `POST /api/files/upload` - Upload geospatial files
- `GET /api/files` - List uploaded files
- `GET /api/files/{file_id}` - Get file details
- `DELETE /api/files/{file_id}` - Delete file

### Measurements
- `GET /api/files/{file_id}/measurements` - Get measurements for file

### Export
- `GET /api/files/{file_id}/export/csv` - Export as CSV
- `GET /api/files/{file_id}/export/geojson` - Export as GeoJSON
- `GET /api/files/{file_id}/export/json` - Export as JSON
- `GET /api/files/{file_id}/export/summary` - Export summary
- `GET /api/files/{file_id}/export/html` - Export as HTML report

### Documentation
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc documentation

## Development Workflow

### Making Backend Changes

1. Edit files in `app/` directory
2. Uvicorn auto-reload will detect changes
3. Check console for any errors
4. Test via API at `http://localhost:8000/docs`

### Making Frontend Changes

1. Edit files in `frontend/src/` directory
2. Vite HMR will hot-reload the browser
3. Check browser console for errors
4. Test the UI at `http://localhost:5173`

### Testing

```bash
# Run backend tests
source venv/bin/activate
pytest

# Run frontend tests (if configured)
cd frontend
npm test
```

## Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'fiona'`**
- Solution: Use `requirements-dev.txt` instead of `requirements.txt`
- The dev requirements exclude GDAL-dependent packages

**Error: Port 8000 already in use**
- Solution: `lsof -i :8000` to find process, then `kill -9 <PID>`
- Or use different port: `--port 8001`

### Frontend Won't Start

**Error: `npm ERR! peer dep missing`**
- Solution: Already handled with `npm install --legacy-peer-deps`

**Error: Port 5173 already in use**
- Solution: Vite will automatically use next available port

### GDAL Installation Issues

For production with shapefile support, GDAL must be installed:

```bash
# macOS
brew install gdal

# Then set environment variable
export GDAL_CONFIG=$(brew --prefix gdal)/bin/gdal-config

# Install full requirements
pip install -r requirements.txt
```

## Environment Variables

Key configuration via environment variables (see `app/config.py`):

- `ENVIRONMENT` - dev/staging/production
- `LOG_LEVEL` - DEBUG/INFO/WARNING/ERROR
- `MAX_UPLOAD_SIZE_MB` - Maximum file upload size
- `MAX_FEATURES_PER_FILE` - Maximum features allowed
- `MAX_VERTICES_PER_FEATURE` - Maximum vertices per geometry
- `ENABLE_PERSISTENCE` - Enable database persistence
- `ENABLE_BATCH_PROCESSING` - Enable batch operations
- `ENABLE_EXPORT` - Enable export functionality
- `ENABLE_VALIDATION` - Enable geometry validation

## Next Steps

### Immediate (Phase 3-4)
- [ ] Add PDF report generation
- [ ] Create validation dashboard component
- [ ] Add validation endpoint to API

### Short-term (Phase 5-7)
- [ ] Support MultiPolygon/MultiLineString/MultiPoint
- [ ] Handle 3D geometries (Z coordinates)
- [ ] Implement batch processing
- [ ] Add progress tracking

### Medium-term (Phase 9-11)
- [ ] PostgreSQL database integration
- [ ] Docker containerization
- [ ] GitHub Actions CI/CD
- [ ] Production deployment

### Long-term (Phase 10, 12)
- [ ] Dark mode support
- [ ] Enhanced accessibility
- [ ] Comprehensive test suite
- [ ] Performance optimization

## Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **Leaflet.js Docs:** https://leafletjs.com/
- **Shapely Docs:** https://shapely.readthedocs.io/
- **PyProj Docs:** https://pyproj4.github.io/pyproj/

## Support

For issues or questions:
1. Check the relevant documentation in `docs/`
2. Review API documentation at `http://localhost:8000/docs`
3. Check console logs for error messages
4. Refer to troubleshooting section above
