# Aereo GeoMeasure — User Guide

Welcome to Aereo GeoMeasure, a privacy-first geospatial file inspection and measurement tool. This guide will help you get started and make the most of the application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Files](#uploading-files)
3. [Viewing Features](#viewing-features)
4. [Measurements](#measurements)
5. [Exporting Data](#exporting-data)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is Aereo GeoMeasure?

Aereo GeoMeasure is a lightweight, privacy-preserving tool for:
- **Uploading** KML documents and Shapefiles
- **Inspecting** geospatial features (points, lines, polygons)
- **Measuring** polygon areas and line lengths with CRS-aware accuracy
- **Exporting** results in multiple formats (CSV, GeoJSON, HTML, JSON)

### Key Features

✅ **Privacy-First** — Your data never leaves your machine  
✅ **Accurate Measurements** — CRS-aware UTM projections  
✅ **Multiple Formats** — KML, Shapefile, GeoJSON export  
✅ **No Installation** — Works in your browser  
✅ **Offline-Capable** — Works without internet after initial load  

---

## Uploading Files

### Supported Formats

**KML Documents** (`.kml`)
- Standard KML 2.2 format
- Automatically uses WGS 84 (EPSG:4326) coordinates
- Supports Placemarks with Point, LineString, and Polygon geometries
- Preserves properties, names, and descriptions

**Shapefiles** (`.zip`)
- ZIP archive containing a single Shapefile
- Must include: `.shp`, `.shx`, `.dbf` files
- Optional: `.prj` file for CRS information
- Supports Point, LineString, and Polygon geometries

### Upload Limits

| Limit | Value |
|-------|-------|
| File size | 20 MiB |
| Features per file | 10,000 |
| Vertices per feature | 10,000 |
| ZIP members | 256 |
| Extracted size | 100 MiB |

### How to Upload

1. Navigate to the **Upload & Analyze** page
2. Click the drop zone or drag-and-drop your file
3. Select a `.kml` or `.zip` file
4. Wait for processing to complete
5. View results in the **Feature Explorer**

### Upload Status

- **Processing** — File is being analyzed
- **Processed** — File is ready for inspection
- **Error** — Check the error message and try again

---

## Viewing Features

### Feature Explorer

The Feature Explorer shows all extracted features with:
- **Feature ID** — Unique identifier
- **Geometry Type** — Point, LineString, or Polygon
- **Properties** — Custom attributes from the file
- **Coordinates** — Original source coordinates
- **Measurements** — Area (m²) or length (m)

### Feature List

- Click a feature to highlight it
- View detailed properties in the sidebar
- See coordinate preview (SVG visualization)
- Check measurement status and results

### Geometry Preview

Each feature shows:
- **Coordinate visualization** — SVG preview of the geometry
- **Bounding box** — Extent of the feature
- **Vertex count** — Number of points in the geometry
- **Measurement status** — Whether measurements are available

---

## Measurements

### How Measurements Work

Aereo GeoMeasure uses **CRS-aware planar measurements**:

1. **Identify CRS** — Reads source CRS from file metadata
2. **Project to UTM** — Converts to local UTM zone for accuracy
3. **Calculate** — Computes area (m²) or length (m)
4. **Preserve Original** — Never modifies source coordinates

### Measurement Results

**Polygon Features**
- **Status: Measured** — Area calculated in m²
- **Status: Unavailable** — CRS missing, geometry invalid, or spans >6°
- **Status: Not Applicable** — Point features (no area)

**LineString Features**
- **Status: Measured** — Length calculated in m
- **Status: Unavailable** — CRS missing, geometry invalid, or spans >6°
- **Status: Not Applicable** — Point features (no length)

**Point Features**
- **Status: Not Applicable** — Points have no area or length

### Why Measurements Might Be Unavailable

- ❌ **Missing CRS** — Shapefile has no `.prj` file
- ❌ **Unknown CRS** — CRS format not recognized
- ❌ **Invalid Geometry** — Self-intersecting polygon or bowtie
- ❌ **Excessive Span** — Feature spans >6° longitude/latitude
- ❌ **Outside UTM Range** — Latitude outside −80° to 84°

### Measurement Accuracy

Measurements are accurate for:
- **Local features** — Regions up to ~600 km across
- **Regional data** — Typical GIS datasets
- **Planar calculations** — Not geodesic (great-circle)

For global or polar datasets, consider geodesic measurement tools.

---

## Exporting Data

### Export Formats

**CSV** — Tabular format with measurements
```
feature_id,geometry_type,status,area_m2,length_m,measurement_crs,error
point-1,Point,not_applicable,,,EPSG:4326,
line-1,LineString,measured,,1000.5,EPSG:32631,
polygon-1,Polygon,measured,1000000,,EPSG:32631,
```

**GeoJSON** — Standard geospatial format with measurements as properties
```json
{
  "type": "FeatureCollection",
  "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
  "features": [
    {
      "type": "Feature",
      "id": "polygon-1",
      "geometry": {...},
      "properties": {
        "area_m2": 1000000,
        "measurement_status": "measured",
        ...
      }
    }
  ]
}
```

**JSON** — Detailed measurement data
```json
{
  "upload_id": "...",
  "filename": "survey.kml",
  "measurements": [
    {
      "feature_id": "polygon-1",
      "geometry_type": "Polygon",
      "status": "measured",
      "area_m2": 1000000,
      "measurement_crs": "EPSG:32631"
    }
  ]
}
```

**HTML Report** — Formatted report with charts and statistics
- Summary statistics
- Geometry breakdown
- Measurement status breakdown
- Detailed measurement table
- Printable format

**Summary JSON** — Aggregated statistics
```json
{
  "total_features": 10,
  "valid_features": 9,
  "geometry_breakdown": {"Polygon": 5, "LineString": 4, "Point": 1},
  "totals": {"total_area_m2": 5000000, "total_length_m": 50000}
}
```

### How to Export

1. Go to **Feature Explorer**
2. Click **Export** button
3. Choose format (CSV, GeoJSON, JSON, HTML, Summary)
4. File downloads automatically

---

## Advanced Features

### Geometry Validation

Check geometry quality:
- **Topology validation** — Detect self-intersections
- **Degenerate detection** — Find zero-area or zero-length geometries
- **Complexity analysis** — Identify excessive vertices or holes

### Spatial Operations

Perform advanced analysis:
- **Buffer zones** — Create buffers around features
- **Intersections** — Find overlapping features
- **Union/Dissolve** — Merge adjacent features
- **Centroid** — Calculate feature centers
- **Convex hull** — Find bounding convex polygon
- **Simplification** — Reduce vertex count

### CRS Conversion

- **Transform coordinates** — Convert between CRS
- **Find UTM zone** — Identify appropriate UTM zone
- **CRS information** — View detailed CRS metadata
- **Compatibility check** — Verify CRS transformation feasibility

### Batch Processing

- Upload multiple files at once
- Process in parallel
- Compare results across uploads
- Export batch summaries

---

## Troubleshooting

### Upload Fails

**"Filename must not contain a path"**
- Remove directory paths from filename
- Use only the filename (e.g., `survey.kml` not `data/survey.kml`)

**"Only .kml and .zip uploads are supported"**
- Ensure file extension is `.kml` or `.zip`
- Check file is not corrupted

**"Upload exceeds the 20 MiB size limit"**
- File is too large
- Split into smaller files or remove unnecessary features

**"Malformed or unreadable KML document"**
- KML file is corrupted or invalid
- Validate with QGIS or another GIS tool first

**"Shapefile archive is missing essential components"**
- ZIP must contain `.shp`, `.shx`, and `.dbf` files
- All files must have the same name (e.g., `areas.shp`, `areas.shx`, `areas.dbf`)

### Measurements Unavailable

**"Source CRS is missing"**
- Shapefile has no `.prj` file
- Add `.prj` file to ZIP archive
- Or manually specify CRS

**"Feature spans more than 6 degrees"**
- Feature is too large for local UTM projection
- Split into smaller regions
- Or use geodesic measurement tool

**"Feature geometry is invalid"**
- Polygon has self-intersections
- LineString is degenerate
- Use geometry validation to identify issues

### Performance Issues

**Slow upload processing**
- File has many features (>5,000)
- File has complex geometries (>10,000 vertices)
- Try splitting into smaller files

**Slow measurement calculation**
- Many features with complex geometries
- Browser may need more time
- Try refreshing or using a different browser

### Browser Compatibility

Aereo GeoMeasure works best on:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Tips & Best Practices

### For Best Results

1. **Validate files first** — Use QGIS to check for geometry errors
2. **Include CRS information** — Add `.prj` files to Shapefiles
3. **Keep features simple** — Simplify complex geometries before upload
4. **Use appropriate CRS** — Projected CRS (UTM) for local measurements
5. **Export regularly** — Save results in multiple formats

### Privacy & Security

- ✅ All data processing happens locally
- ✅ No data is sent to external servers
- ✅ Browser session data is cleared on refresh
- ✅ No cookies or tracking

### Performance Tips

- Use smaller files for faster processing
- Simplify geometries with excessive vertices
- Close other browser tabs to free memory
- Use modern browsers for best performance

---

## Getting Help

### Common Questions

**Q: Can I use this offline?**
A: Yes, after the initial page load, Aereo GeoMeasure works offline.

**Q: Is my data secure?**
A: Yes, all data stays on your machine. Nothing is sent to servers.

**Q: Can I measure geodesic distances?**
A: No, Aereo GeoMeasure uses planar (UTM) measurements. For geodesic measurements, use specialized tools.

**Q: What CRS formats are supported?**
A: EPSG codes (e.g., EPSG:4326), WKT strings, and PROJ strings.

**Q: Can I batch process files?**
A: Yes, upload multiple files and compare results.

### Reporting Issues

If you encounter problems:
1. Check the error message
2. Review this troubleshooting guide
3. Try a different file or browser
4. Report the issue with details (file type, error message, browser)

---

## Learn More

- [Developer Guide](DEVELOPER_GUIDE.md) — For developers
- [Deployment Guide](DEPLOYMENT.md) — For system administrators
- [API Reference](API_REFERENCE.md) — For API users
- [GitHub Repository](https://github.com/aereo/geomeasure) — Source code

---

**Aereo GeoMeasure** — Geospatial measurements, made precise.
