# Demo Data for Aereo GeoMeasure

This directory contains sample geospatial data files for testing the Aereo GeoMeasure application.

## Files

### `sample_features.kml`

A comprehensive KML file containing various geospatial feature types for testing:

**Points of Interest (3 features)**
- City Center - Downtown area landmark
- Park Entrance - Main entrance to central park
- Museum Location - Natural history museum

**Routes and Paths (3 features)**
- Main Street Route - Primary commercial route (5 vertices)
- Park Trail - Walking trail through park (6 vertices)
- River Path - Scenic riverside walk (7 vertices)

**Areas and Zones (5 features)**
- Downtown District - Central business district (rectangular polygon)
- Central Park - Large urban park (rectangular polygon)
- Residential Zone A - Residential neighborhood (rectangular polygon)
- Industrial Zone - Industrial area with warehouse district (rectangular polygon)
- Complex Polygon with Hole - Area with interior exclusion zone (polygon with hole)

**Mixed Features (3 features)**
- Shopping District - Commercial shopping area (polygon)
- Transit Hub - Major transportation interchange (point)
- Subway Line A - Major subway route (line with 7 vertices)

**Standalone Features (2 features)**
- Landmark Building - Historic landmark structure (polygon)
- Water Feature - River or water body (line with 5 vertices)

**Total: 16 features**
- 5 Point features
- 5 LineString features
- 6 Polygon features (including 1 with interior ring)

## Coordinate System

All features use WGS84 (EPSG:4326) coordinates:
- Longitude range: -74.03 to -73.93 (approximately New York City area)
- Latitude range: 40.70 to 40.81 (approximately New York City area)
- Elevation: All features at 0 meters

## How to Test

### 1. Upload the File

1. Open the application at `http://localhost:5173`
2. Navigate to the **Upload** page
3. Click "Choose File" and select `sample_features.kml`
4. Click "Upload" button
5. Wait for processing to complete

### 2. View Features

1. Navigate to **Feature Explorer** page
2. You should see all 16 features listed in the table
3. Features are organized by type (Point, LineString, Polygon)

### 3. Interact with Map

1. The interactive map displays all features
2. Click on features in the table to highlight them on the map
3. Click on features on the map to select them
4. Features are color-coded by measurement status:
   - **Green**: Measurement available
   - **Red**: Measurement unavailable
   - **Gray**: Not applicable for this feature type

### 4. View Measurements

1. Click on any feature to view its measurements
2. For LineString features: Total length in meters and kilometers
3. For Polygon features: Area in square meters and square kilometers
4. For Point features: Coordinates in decimal degrees

### 5. Export Data

1. Use the export buttons to download data in various formats:
   - **CSV**: Tabular format with measurements
   - **GeoJSON**: Standard geospatial format
   - **JSON**: Detailed JSON with all properties
   - **Summary**: Aggregated statistics
   - **HTML**: Formatted report with styling

### 6. Test Validation

1. Navigate to validation features (if implemented)
2. Check geometry quality metrics:
   - Self-intersection detection
   - Topology validation
   - Vertex count analysis

### 7. Test Spatial Operations

1. Use spatial analysis tools (if implemented):
   - Buffer zones around features
   - Intersection detection between features
   - Union/dissolve operations
   - Centroid calculation
   - Convex hull generation

## Feature Statistics

| Type | Count | Total Vertices | Avg Vertices |
|------|-------|-----------------|--------------|
| Point | 5 | 0 | 0 |
| LineString | 5 | 30 | 6 |
| Polygon | 6 | 35 | 5.8 |
| **Total** | **16** | **65** | **4.1** |

## Measurement Examples

### LineString Features
- Main Street Route: ~0.0025 km
- Park Trail: ~0.0035 km
- River Path: ~0.0045 km
- Subway Line A: ~0.0085 km
- Water Feature: ~0.0055 km

### Polygon Features
- Downtown District: ~0.0001 km²
- Central Park: ~0.0009 km²
- Residential Zone A: ~0.0001 km²
- Industrial Zone: ~0.00005 km²
- Complex Polygon with Hole: ~0.00008 km²
- Shopping District: ~0.00001 km²
- Landmark Building: ~0.000003 km²

## Testing Scenarios

### Scenario 1: Basic Upload and Viewing
1. Upload `sample_features.kml`
2. Verify all 16 features appear in the table
3. Verify map displays all features
4. Verify feature count matches

### Scenario 2: Feature Selection
1. Click on different features in the table
2. Verify feature highlights on map
3. Verify measurements display correctly
4. Verify feature properties show in detail panel

### Scenario 3: Map Interaction
1. Click on features directly on the map
2. Verify table row highlights
3. Verify popup shows feature information
4. Verify zoom/pan works correctly

### Scenario 4: Export Functionality
1. Export as CSV and verify format
2. Export as GeoJSON and verify structure
3. Export as JSON and verify completeness
4. Export as HTML and verify styling
5. Export summary and verify statistics

### Scenario 5: Geometry Validation
1. Check validation results for each feature
2. Verify no self-intersections detected
3. Verify topology is valid
4. Verify vertex counts are accurate

### Scenario 6: Spatial Analysis
1. Create buffer zones around features
2. Test intersection detection
3. Test union operations
4. Calculate centroids
5. Generate convex hulls

## Troubleshooting

### File Won't Upload
- Ensure file is valid KML format
- Check file size is under limit (default 10MB)
- Verify coordinates are in valid range

### Features Not Displaying
- Check browser console for errors
- Verify backend is running on port 8000
- Check network tab for API responses

### Measurements Incorrect
- Verify coordinate system is WGS84
- Check calculation formulas
- Compare with external GIS tools

### Map Not Showing
- Verify Leaflet.js is loaded
- Check browser console for JavaScript errors
- Verify OpenStreetMap tiles are accessible

## Additional Test Data

To create additional test files:

1. **Simple Point File**: Single point feature
2. **Complex Polygon File**: Polygon with multiple holes
3. **MultiGeometry File**: Mixed geometry types
4. **Large Dataset**: 1000+ features for performance testing
5. **Invalid Geometry**: Self-intersecting polygons for validation testing

## Resources

- **KML Reference**: https://developers.google.com/kml/documentation
- **GeoJSON Spec**: https://tools.ietf.org/html/rfc7946
- **WGS84 Info**: https://en.wikipedia.org/wiki/World_Geodetic_System
- **Leaflet.js**: https://leafletjs.com/

## Notes

- All coordinates are in WGS84 (EPSG:4326)
- Measurements are calculated using geodetic formulas
- Features are organized in folders for better organization
- Some features intentionally have complex geometries for testing edge cases
