# Aereo GeoMeasure — Developer Guide

This guide is for developers who want to understand, extend, or contribute to Aereo GeoMeasure.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Code Standards](#code-standards)
8. [Debugging](#debugging)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Landing, Upload, Overview, Features, Status   │   │
│  │ Components: TopNav, MapViewer, ReportGenerator       │   │
│  │ API Client: fetch wrapper with error handling        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes: /api/files/, /api/files/{id}/            │   │
│  │ Services: Processing, Measurements, Export           │   │
│  │ Parsers: KML, Shapefile                              │   │
│  │ Storage: In-memory dict (or PostgreSQL)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Upload** → File validation → Parsing → Feature extraction → Storage
2. **Measurement** → Retrieve features → Project to UTM → Calculate area/length
3. **Export** → Retrieve features + measurements → Format (CSV/GeoJSON/HTML) → Download

---

## Project Structure

```
aereo-geospatial-measurement-api/
├── app/                          # Backend application
│   ├── main.py                   # FastAPI app initialization
│   ├── config.py                 # Configuration management
│   ├── logging_config.py         # Logging setup
│   ├── storage.py                # In-memory upload storage
│   ├── errors.py                 # Custom exceptions
│   ├── api/
│   │   └── files.py              # API routes
│   ├── parsers/
│   │   ├── kml.py                # KML parsing
│   │   ├── shapefile.py          # Shapefile parsing
│   │   └── features.py           # Feature normalization
│   ├── services/
│   │   ├── processing.py         # Upload processing pipeline
│   │   ├── upload_validation.py  # File validation
│   │   ├── measurements.py       # Measurement calculations
│   │   ├── export.py             # Data export
│   │   ├── geometry_validation.py # Geometry quality checks
│   │   ├── spatial_operations.py # Buffer, intersect, etc.
│   │   ├── crs_conversion.py     # CRS transformations
│   │   └── shapefile_archives.py # ZIP extraction
│   ├── schemas/
│   │   └── files.py              # Pydantic models
│   └── static/
│       ├── docs.css              # API docs styling
│       └── favicon.svg           # Branding
├── client/                     # React frontend
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Root component
│   │   ├── api.ts                # API client
│   │   ├── types.ts              # TypeScript types
│   │   ├── styles.css            # Global styles
│   │   ├── components/           # Reusable components
│   │   └── pages/                # Page components
│   ├── index.html                # HTML template
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # Dependencies
├── tests/                        # Test suite
│   ├── test_main.py              # API tests
│   ├── test_uploads.py           # Upload tests
│   ├── test_measurements.py      # Measurement tests
│   └── test_limits.py            # Limit enforcement tests
├── docs/                         # Documentation
│   ├── USER_GUIDE.md             # User documentation
│   ├── DEVELOPER_GUIDE.md        # This file
│   └── DEPLOYMENT.md             # Deployment guide
├── requirements.txt              # Python dependencies
├── README.md                     # Project overview
└── .gitignore                    # Git ignore rules
```

---

## Backend Development

### Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload
```

### Key Modules

#### [`app/config.py`](app/config.py)
Centralized configuration with environment variables:
```python
from app.config import MAX_FEATURES, MAX_UPLOAD_BYTES, ENABLE_EXPORT
```

#### [`app/logging_config.py`](app/logging_config.py)
Structured logging setup:
```python
from app.logging_config import get_logger
logger = get_logger(__name__)
logger.info("Processing upload")
```

#### [`app/services/processing.py`](app/services/processing.py)
Main upload processing pipeline:
```python
features, source_crs, crs_status = process_upload(extension, content)
```

#### [`app/services/measurements.py`](app/services/measurements.py)
CRS-aware measurement calculations:
```python
measurements = measure_upload(upload_record)
```

#### [`app/services/export.py`](app/services/export.py)
Multi-format data export:
```python
csv_content = export_measurements_csv(measurements)
geojson_content = export_features_geojson(upload, measurements)
html_report = export_html_report(upload, measurements)
```

### Adding a New Service

1. Create file in `app/services/`
2. Add comprehensive docstrings
3. Use logging for debugging
4. Add type hints to all functions
5. Write tests in `tests/`

Example:
```python
# app/services/my_service.py
from app.logging_config import get_logger

logger = get_logger(__name__)

def my_function(param: str) -> dict[str, Any]:
    """
    Brief description.
    
    Detailed explanation of what this does.
    
    Args:
        param: Parameter description
        
    Returns:
        Dictionary with results
    """
    logger.info(f"Processing {param}")
    # Implementation
    return {"result": "value"}
```

### Adding an API Endpoint

1. Add route to `app/api/files.py`
2. Use appropriate HTTP method (GET, POST, etc.)
3. Add docstring with description
4. Return proper response type
5. Handle errors with HTTPException

Example:
```python
@router.get("/{file_id}/my-endpoint/")
def my_endpoint(file_id: str) -> MyResponseModel:
    """
    Brief description of what this endpoint does.
    
    Returns:
        MyResponseModel with results
    """
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Process and return
    return MyResponseModel(...)
```

---

## Frontend Development

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Key Files

#### [`client/src/api.ts`](client/src/api.ts)
API client with error handling:
```typescript
import { uploadFile, getMeasurements, getFileMetadata } from "./api";

const response = await uploadFile(file);
const measurements = await getMeasurements(uploadId);
```

#### [`client/src/types.ts`](client/src/types.ts)
TypeScript type definitions:
```typescript
interface UploadResponse {
  upload_id: string;
  filename: string;
  features: FeatureRecord[];
  // ...
}
```

#### [`client/src/App.tsx`](client/src/App.tsx)
Root component with routing and state management:
- Hash-based routing
- Upload session management
- API health checking
- Page navigation

### Adding a New Component

1. Create file in `client/src/components/`
2. Use TypeScript with proper types
3. Add JSDoc comments
4. Use Tailwind CSS for styling
5. Export as default

Example:
```typescript
// client/src/components/MyComponent.tsx
import { FC } from "react";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

/**
 * MyComponent - Brief description
 * 
 * Detailed description of what this component does.
 */
export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 bg-white rounded">
      <h2 className="text-lg font-bold">{title}</h2>
      <button onClick={onAction} className="mt-2 px-4 py-2 bg-green-600 text-white rounded">
        Action
      </button>
    </div>
  );
};

export default MyComponent;
```

### Adding a New Page

1. Create file in `client/src/pages/`
2. Add route to `App.tsx` hash routing
3. Add navigation link to `TopNav.tsx`
4. Use lazy loading with `React.lazy()`

---

## Adding Features

### Example: Add a New Spatial Operation

**Backend:**

1. Add function to `app/services/spatial_operations.py`
2. Add endpoint to `app/api/files.py`
3. Write tests in `tests/`

```python
# app/services/spatial_operations.py
def my_operation(feature: FeatureResponse) -> dict[str, Any]:
    """My operation description."""
    # Implementation
    return {"result": "value"}
```

```python
# app/api/files.py
@router.get("/{file_id}/my-operation/")
def my_operation_endpoint(file_id: str) -> StreamingResponse:
    """My operation endpoint."""
    record = get_upload(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Not found")
    
    result = my_operation(record.features[0])
    return StreamingResponse(iter([json.dumps(result)]), media_type="application/json")
```

**Frontend:**

1. Add API call to `client/src/api.ts`
2. Create component in `client/src/components/`
3. Integrate into page

```typescript
// client/src/api.ts
export async function myOperation(fileId: string): Promise<MyResult> {
  return requestJson<MyResult>(`/api/files/${encodeURIComponent(fileId)}/my-operation/`);
}
```

```typescript
// client/src/components/MyOperationComponent.tsx
const result = await myOperation(uploadId);
```

---

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_uploads.py

# Run with coverage
pytest --cov=app tests/

# Run with verbose output
pytest -v
```

### Writing Tests

```python
# tests/test_my_feature.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_my_feature():
    """Test description."""
    response = client.get("/api/files/test-id/my-endpoint/")
    assert response.status_code == 200
    assert response.json()["key"] == "expected_value"

def test_my_feature_error():
    """Test error handling."""
    response = client.get("/api/files/nonexistent/my-endpoint/")
    assert response.status_code == 404
```

### Test Coverage

Target: 90%+ coverage

```bash
pytest --cov=app --cov-report=html tests/
# Open htmlcov/index.html to view coverage report
```

---

## Code Standards

### Python

- **Style:** PEP 8 (use `black` for formatting)
- **Type Hints:** All functions must have type hints
- **Docstrings:** Google-style docstrings for all public functions
- **Logging:** Use `logger` from `app.logging_config`
- **Error Handling:** Use custom `UploadError` for API errors

```python
def my_function(param: str) -> dict[str, Any]:
    """
    Brief description.
    
    Longer description explaining the function's purpose,
    behavior, and any important details.
    
    Args:
        param: Description of parameter
        
    Returns:
        Description of return value
        
    Raises:
        UploadError: When something goes wrong
    """
    logger.info(f"Processing {param}")
    
    if not param:
        raise UploadError("Parameter is required", status_code=400)
    
    return {"result": "value"}
```

### TypeScript/React

- **Style:** ESLint + Prettier
- **Types:** Strict TypeScript with no `any`
- **Components:** Functional components with hooks
- **Props:** Interface for all component props
- **Comments:** JSDoc for complex logic

```typescript
interface MyComponentProps {
  title: string;
  onAction: (id: string) => void;
}

/**
 * MyComponent - Displays a title and action button
 * 
 * @param props - Component props
 * @returns React component
 */
export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      await onAction("id");
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={handleClick}>{title}</button>;
};
```

---

## Debugging

### Backend Debugging

**Enable Debug Logging:**
```bash
AEREO_LOG_LEVEL=DEBUG python -m uvicorn app.main:app --reload
```

**Use Python Debugger:**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

**Check Logs:**
```bash
# View recent logs
tail -f app.log

# Search for errors
grep ERROR app.log
```

### Frontend Debugging

**Browser DevTools:**
- Open DevTools (F12)
- Check Console for errors
- Use Network tab to inspect API calls
- Use React DevTools extension

**Debug Logging:**
```typescript
console.log("Debug info:", variable);
console.error("Error:", error);
```

**VS Code Debugging:**
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client/src"
    }
  ]
}
```

---

## Performance Optimization

### Backend

- Use streaming responses for large exports
- Implement pagination for feature lists
- Cache measurement results
- Use async/await for I/O operations

### Frontend

- Lazy load pages with `React.lazy()`
- Memoize expensive computations
- Use virtual scrolling for large lists
- Optimize bundle size with tree-shaking

---

## Contributing

### Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes with tests
4. Ensure all tests pass: `pytest`
5. Format code: `black app/` and `prettier client/src/`
6. Commit with clear message: `git commit -m "Add my feature"`
7. Push and create Pull Request

### Pull Request Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code formatted (black, prettier)
- [ ] Type hints added
- [ ] Docstrings added
- [ ] No breaking changes
- [ ] Changelog updated

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Shapely Documentation](https://shapely.readthedocs.io/)
- [PyProj Documentation](https://pyproj4.github.io/pyproj/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Happy coding!** 🚀
