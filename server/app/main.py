import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.files import router as files_router

STATIC_DIR = Path(__file__).resolve().parent / "static"
APP_URL = os.getenv("AEREO_APP_URL", "http://127.0.0.1:5173")

app = FastAPI(
    title="Aereo GeoMeasure API",
    description=(
        "Local geospatial file inspection and planar metric measurement API. "
        "Upload KML documents or zipped Shapefiles, extract features, and review "
        "CRS-aware polygon area and line length results."
    ),
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.include_router(files_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def welcome() -> dict[str, str]:
    return {
        "message": "Welcome to the Aereo Geospatial Measurement API.",
        "docs": "/docs",
    }


@app.get("/docs", response_class=HTMLResponse, include_in_schema=False)
def custom_swagger_ui_html() -> HTMLResponse:
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aereo GeoMeasure — API Documentation</title>
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="stylesheet" type="text/css" href="/static/docs.css" />
</head>
<body>
  <header class="aereo-docs-header">
    <div class="aereo-docs-nav">
      <a href="{APP_URL}" class="aereo-docs-brand" title="Aereo GeoMeasure home">
        <div class="aereo-brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/>
            <circle cx="12" cy="8" r="2"/>
          </svg>
        </div>
        <div class="aereo-brand-titles">
          <div class="aereo-brand-title-line">
            <span class="aereo-brand-name">Aereo</span>
            <span class="aereo-brand-product">GEOMEASURE</span>
          </div>
          <span class="aereo-brand-tagline">Geospatial measurements, made precise.</span>
        </div>
      </a>
      <div class="aereo-nav-actions">
        <span class="aereo-status-badge">REST API · OpenAPI 3.1</span>
        <a href="{APP_URL}" class="aereo-back-button" title="Return to Aereo GeoMeasure web workspace">
          <span>&larr; Back to application</span>
        </a>
      </div>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {{
      window.ui = SwaggerUIBundle({{
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout',
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1
      }});
    }};
  </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)
