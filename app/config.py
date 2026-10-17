"""
Centralized configuration management for Aereo GeoMeasure API.

All limits, thresholds, and environment-based settings are defined here.
"""

import os
from typing import Literal

# ============================================================================
# Upload Limits
# ============================================================================

MAX_UPLOAD_BYTES = int(os.getenv("AEREO_MAX_UPLOAD_BYTES", 20 * 1024 * 1024))
"""Maximum upload file size in bytes (default: 20 MiB)"""

UPLOAD_CHUNK_BYTES = int(os.getenv("AEREO_UPLOAD_CHUNK_BYTES", 64 * 1024))
"""Chunk size for streaming uploads in bytes (default: 64 KiB)"""

# ============================================================================
# Archive Limits
# ============================================================================

MAX_ARCHIVE_MEMBERS = int(os.getenv("AEREO_MAX_ARCHIVE_MEMBERS", 256))
"""Maximum number of files in a ZIP archive (default: 256)"""

MAX_EXTRACTED_BYTES = int(os.getenv("AEREO_MAX_EXTRACTED_BYTES", 100 * 1024 * 1024))
"""Maximum extracted archive size in bytes (default: 100 MiB)"""

# ============================================================================
# Feature Limits
# ============================================================================

MAX_FEATURES = int(os.getenv("AEREO_MAX_FEATURES", 10_000))
"""Maximum number of features per upload (default: 10,000)"""

MAX_VERTICES = int(os.getenv("AEREO_MAX_VERTICES", 10_000))
"""Maximum number of vertices per feature (default: 10,000)"""

# ============================================================================
# Measurement Limits
# ============================================================================

MAX_UTM_SPAN_DEGREES = float(os.getenv("AEREO_MAX_UTM_SPAN_DEGREES", 6.0))
"""Maximum longitude/latitude span for UTM projection in degrees (default: 6°)"""

MIN_UTM_LATITUDE = float(os.getenv("AEREO_MIN_UTM_LATITUDE", -80.0))
"""Minimum latitude for UTM projection (default: -80°)"""

MAX_UTM_LATITUDE = float(os.getenv("AEREO_MAX_UTM_LATITUDE", 84.0))
"""Maximum latitude for UTM projection (default: 84°)"""

# ============================================================================
# API Configuration
# ============================================================================

APP_URL = os.getenv("AEREO_APP_URL", "http://127.0.0.1:5173")
"""Frontend application URL for CORS and documentation links"""

CORS_ORIGINS = os.getenv(
    "AEREO_CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
"""Comma-separated list of allowed CORS origins"""

API_TITLE = "Aereo GeoMeasure API"
"""API title for OpenAPI documentation"""

API_VERSION = "1.0.0"
"""API version"""

API_DESCRIPTION = (
    "Local geospatial file inspection and planar metric measurement API. "
    "Upload KML documents or zipped Shapefiles, extract features, and review "
    "CRS-aware polygon area and line length results."
)
"""API description for OpenAPI documentation"""

# ============================================================================
# Logging Configuration
# ============================================================================

LOG_LEVEL = os.getenv("AEREO_LOG_LEVEL", "INFO").upper()
"""Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"""

LOG_FORMAT = os.getenv(
    "AEREO_LOG_FORMAT",
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
"""Logging format string"""

# ============================================================================
# Database Configuration (for future use)
# ============================================================================

DATABASE_URL = os.getenv(
    "AEREO_DATABASE_URL",
    "sqlite:///./aereo.db"
)
"""Database connection URL (default: SQLite for development)"""

# ============================================================================
# Feature Flags
# ============================================================================

ENABLE_PERSISTENCE = os.getenv("AEREO_ENABLE_PERSISTENCE", "false").lower() == "true"
"""Enable database persistence (default: false for backward compatibility)"""

ENABLE_BATCH_PROCESSING = os.getenv("AEREO_ENABLE_BATCH_PROCESSING", "true").lower() == "true"
"""Enable batch upload processing (default: true)"""

ENABLE_EXPORT = os.getenv("AEREO_ENABLE_EXPORT", "true").lower() == "true"
"""Enable data export functionality (default: true)"""

ENABLE_VALIDATION = os.getenv("AEREO_ENABLE_VALIDATION", "true").lower() == "true"
"""Enable geometry validation (default: true)"""

# ============================================================================
# Supported File Extensions
# ============================================================================

SUPPORTED_EXTENSIONS = {".kml", ".zip"}
"""Set of supported file extensions"""

# ============================================================================
# Geometry Configuration
# ============================================================================

SUPPORTED_GEOMETRIES = {"Point", "LineString", "Polygon"}
"""Set of supported geometry types"""

SUPPORT_MULTI_GEOMETRIES = os.getenv("AEREO_SUPPORT_MULTI_GEOMETRIES", "false").lower() == "true"
"""Enable support for Multi* geometry types (default: false)"""

SUPPORT_3D_GEOMETRIES = os.getenv("AEREO_SUPPORT_3D_GEOMETRIES", "false").lower() == "true"
"""Enable support for 3D geometries with Z coordinates (default: false)"""

# ============================================================================
# Environment
# ============================================================================

ENVIRONMENT: Literal["development", "staging", "production"] = os.getenv(
    "AEREO_ENVIRONMENT", "development"
).lower()  # type: ignore
"""Deployment environment (development, staging, production)"""

DEBUG = ENVIRONMENT == "development"
"""Debug mode enabled (only in development)"""
