"""
Data export service for Aereo GeoMeasure.

Provides functionality to export measurements and features in multiple formats:
- CSV: Tabular format with measurements
- GeoJSON: Standard geospatial format with measurements as properties
- JSON: Raw measurement data
"""

import csv
import json
from html import escape as escape_html
from io import StringIO, BytesIO
from typing import Any

from app.logging_config import get_logger
from app.schemas.files import MeasurementsResponse, UploadResponse

logger = get_logger(__name__)


def export_measurements_csv(measurements: MeasurementsResponse) -> str:
    """
    Export measurements to CSV format.

    Creates a CSV with columns:
    - feature_id: Feature identifier
    - geometry_type: Point, LineString, or Polygon
    - status: measured, not_applicable, or unavailable
    - area_m2: Polygon area in square meters (if measured)
    - length_m: LineString length in meters (if measured)
    - measurement_crs: CRS used for measurement
    - error: Error message if unavailable

    Args:
        measurements: MeasurementsResponse object

    Returns:
        CSV content as string
    """
    logger.info(f"Exporting {len(measurements.measurements)} measurements to CSV")

    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "feature_id",
            "geometry_type",
            "status",
            "area_m2",
            "length_m",
            "measurement_crs",
            "error",
        ],
    )

    writer.writeheader()
    for measurement in measurements.measurements:
        writer.writerow({
            "feature_id": measurement.feature_id,
            "geometry_type": measurement.geometry_type,
            "status": measurement.status,
            "area_m2": measurement.area_m2 or "",
            "length_m": measurement.length_m or "",
            "measurement_crs": measurement.measurement_crs or "",
            "error": measurement.error or "",
        })

    return output.getvalue()


def export_measurements_json(measurements: MeasurementsResponse) -> str:
    """
    Export measurements to JSON format.

    Returns the complete MeasurementsResponse as formatted JSON.

    Args:
        measurements: MeasurementsResponse object

    Returns:
        JSON content as string
    """
    logger.info(f"Exporting {len(measurements.measurements)} measurements to JSON")

    data = {
        "upload_id": measurements.upload_id,
        "filename": measurements.filename,
        "source_crs": measurements.source_crs,
        "crs_status": measurements.crs_status,
        "measurement_method": measurements.measurement_method,
        "status": measurements.status,
        "measurements": [
            {
                "feature_id": m.feature_id,
                "geometry_type": m.geometry_type,
                "status": m.status,
                "area_m2": m.area_m2,
                "length_m": m.length_m,
                "measurement_crs": m.measurement_crs,
                "error": m.error,
            }
            for m in measurements.measurements
        ],
    }

    return json.dumps(data, indent=2)


def export_features_geojson(upload: UploadResponse, measurements: MeasurementsResponse | None = None) -> str:
    """
    Export features to GeoJSON format with optional measurements.

    Creates a GeoJSON FeatureCollection where each feature includes:
    - Original geometry and properties
    - Measurement results (if provided)
    - Source CRS information

    Args:
        upload: UploadResponse with features
        measurements: Optional MeasurementsResponse with measurement data

    Returns:
        GeoJSON content as string
    """
    logger.info(f"Exporting {len(upload.features)} features to GeoJSON")

    # Build measurement lookup
    measurement_map = {}
    if measurements:
        for m in measurements.measurements:
            measurement_map[m.feature_id] = {
                "measurement_status": m.status,
                "area_m2": m.area_m2,
                "length_m": m.length_m,
                "measurement_crs": m.measurement_crs,
                "measurement_error": m.error,
            }

    features = []
    for feature in upload.features:
        properties = dict(feature.properties)
        properties["feature_id"] = feature.feature_id
        properties["geometry_type"] = feature.geometry_type
        properties["source_crs"] = feature.source_crs

        # Add measurements if available
        if feature.feature_id in measurement_map:
            properties.update(measurement_map[feature.feature_id])

        geojson_feature = {
            "type": "Feature",
            "id": feature.feature_id,
            "geometry": feature.geometry,
            "properties": properties,
        }
        features.append(geojson_feature)

    geojson = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {
                "name": upload.source_crs or "unknown",
            },
        },
        "features": features,
    }

    return json.dumps(geojson, indent=2)


def export_summary_json(measurements: MeasurementsResponse) -> str:
    """
    Export a summary of measurements with statistics.

    Includes:
    - Total features and their breakdown by type
    - Measurement status breakdown
    - Total area and length (if applicable)
    - CRS information

    Args:
        measurements: MeasurementsResponse object

    Returns:
        JSON summary as string
    """
    logger.info(f"Generating summary for {len(measurements.measurements)} measurements")

    # Count by geometry type
    geometry_counts: dict[str, int] = {}
    for m in measurements.measurements:
        geometry_counts[m.geometry_type] = geometry_counts.get(m.geometry_type, 0) + 1

    # Count by status
    status_counts: dict[str, int] = {}
    for m in measurements.measurements:
        status_counts[m.status] = status_counts.get(m.status, 0) + 1

    # Calculate totals
    total_area_m2 = sum(m.area_m2 or 0 for m in measurements.measurements if m.area_m2)
    total_length_m = sum(m.length_m or 0 for m in measurements.measurements if m.length_m)

    summary = {
        "upload_id": measurements.upload_id,
        "filename": measurements.filename,
        "source_crs": measurements.source_crs,
        "crs_status": measurements.crs_status,
        "measurement_status": measurements.status,
        "total_features": len(measurements.measurements),
        "geometry_breakdown": geometry_counts,
        "measurement_status_breakdown": status_counts,
        "totals": {
            "total_area_m2": total_area_m2,
            "total_length_m": total_length_m,
        },
    }

    return json.dumps(summary, indent=2)


def export_html_report(
    upload: UploadResponse,
    measurements: MeasurementsResponse,
) -> str:
    """
    Export a formatted HTML report with measurements and statistics.

    Includes:
    - Header with file information
    - Summary statistics
    - Detailed measurement table
    - Geometry type breakdown chart (as HTML table)

    Args:
        upload: UploadResponse with features
        measurements: MeasurementsResponse with measurement data

    Returns:
        HTML content as string
    """
    logger.info(f"Generating HTML report for {upload.filename}")

    # Calculate statistics
    geometry_counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}
    total_area_m2 = 0.0
    total_length_m = 0.0

    for m in measurements.measurements:
        geometry_counts[m.geometry_type] = geometry_counts.get(m.geometry_type, 0) + 1
        status_counts[m.status] = status_counts.get(m.status, 0) + 1
        if m.area_m2:
            total_area_m2 += m.area_m2
        if m.length_m:
            total_length_m += m.length_m

    # Build geometry breakdown table
    geometry_rows = "".join(
        f"<tr><td>{escape_html(geom_type, quote=True)}</td><td>{count}</td></tr>"
        for geom_type, count in sorted(geometry_counts.items())
    )

    # Build status breakdown table
    status_rows = "".join(
        f"<tr><td>{escape_html(status, quote=True)}</td><td>{count}</td></tr>"
        for status, count in sorted(status_counts.items())
    )

    # Build measurements table
    measurement_rows = "".join(
        f"""<tr>
            <td>{escape_html(m.feature_id, quote=True)}</td>
            <td>{escape_html(m.geometry_type, quote=True)}</td>
            <td>{escape_html(m.status, quote=True)}</td>
            <td>{m.area_m2 or '-'}</td>
            <td>{m.length_m or '-'}</td>
            <td>{escape_html(m.measurement_crs or '-', quote=True)}</td>
            <td>{escape_html(m.error or '-', quote=True)}</td>
        </tr>"""
        for m in measurements.measurements
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aereo GeoMeasure Report - {escape_html(upload.filename, quote=True)}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2d5016;
            border-bottom: 3px solid #2d5016;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #2d5016;
            margin-top: 30px;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .info-card {{
            background: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #2d5016;
            border-radius: 4px;
        }}
        .info-card strong {{
            color: #2d5016;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th {{
            background: #2d5016;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
        }}
        tr:hover {{
            background: #f9f9f9;
        }}
        .status-measured {{
            color: #27ae60;
            font-weight: 600;
        }}
        .status-unavailable {{
            color: #e74c3c;
        }}
        .status-not-applicable {{
            color: #95a5a6;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Aereo GeoMeasure Report</h1>

        <div class="info-grid">
            <div class="info-card">
                <strong>Filename:</strong><br>{escape_html(upload.filename, quote=True)}
            </div>
            <div class="info-card">
                <strong>Upload ID:</strong><br>{escape_html(upload.upload_id, quote=True)}
            </div>
            <div class="info-card">
                <strong>Source CRS:</strong><br>{escape_html(upload.source_crs or 'Unknown', quote=True)}
            </div>
            <div class="info-card">
                <strong>CRS Status:</strong><br>{escape_html(upload.crs_status, quote=True)}
            </div>
            <div class="info-card">
                <strong>Total Features:</strong><br>{len(measurements.measurements)}
            </div>
            <div class="info-card">
                <strong>Measurement Status:</strong><br>{escape_html(measurements.status, quote=True)}
            </div>
        </div>

        <h2>Geometry Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Geometry Type</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
                {geometry_rows}
            </tbody>
        </table>

        <h2>Measurement Status Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
                {status_rows}
            </tbody>
        </table>

        <h2>Totals</h2>
        <div class="info-grid">
            <div class="info-card">
                <strong>Total Area:</strong><br>{total_area_m2:,.2f} m²
            </div>
            <div class="info-card">
                <strong>Total Length:</strong><br>{total_length_m:,.2f} m
            </div>
        </div>

        <h2>Detailed Measurements</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature ID</th>
                    <th>Geometry Type</th>
                    <th>Status</th>
                    <th>Area (m²)</th>
                    <th>Length (m)</th>
                    <th>Measurement CRS</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody>
                {measurement_rows}
            </tbody>
        </table>

        <div class="footer">
            <p>Generated by Aereo GeoMeasure</p>
            <p>Measurement Method: {escape_html(measurements.measurement_method, quote=True)}</p>
        </div>
    </div>
</body>
</html>"""

    return html
