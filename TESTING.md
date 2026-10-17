# Quick Testing Guide

## Getting Started with Aereo GeoMeasure

Both servers are now running and ready for testing!

### Access Points

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend UI | `http://localhost:5173` | Main application interface |
| Backend API | `http://localhost:8000` | REST API server |
| API Docs (Swagger) | `http://localhost:8000/docs` | Interactive API documentation |
| API Docs (ReDoc) | `http://localhost:8000/redoc` | Alternative API documentation |

## Step-by-Step Testing

### 1. Open the Application

Open your browser and navigate to: **`http://localhost:5173`**

You should see the Aereo GeoMeasure landing page with navigation options.

### 2. Upload Demo Data

1. Click on **"Upload"** in the navigation menu
2. Click **"Choose File"** button
3. Navigate to `demo_data/sample_features.kml`
4. Select the file and click **"Open"**
5. Click **"Upload"** button
6. Wait for the upload to complete (you should see a success message)

### 3. View Features

1. Click on **"Feature Explorer"** in the navigation menu
2. You should see a table with all 16 features from the KML file
3. Features are organized by type:
   - **Points**: 5 features
   - **LineStrings**: 5 features
   - **Polygons**: 6 features

### 4. Interact with the Map

1. On the Feature Explorer page, you'll see an interactive map
2. The map displays all uploaded features
3. **Click on features in the table** to highlight them on the map
4. **Click on features on the map** to select them
5. Features are color-coded:
   - 🟢 **Green**: Measurement available
   - 🔴 **Red**: Measurement unavailable
   - ⚫ **Gray**: Not applicable

### 5. View Measurements

1. Click on any feature in the table
2. A detail panel will show:
   - Feature name and description
   - Geometry type
   - Measurements:
     - **LineString**: Length in meters and kilometers
     - **Polygon**: Area in square meters and square kilometers
     - **Point**: Coordinates in decimal degrees

### 6. Export Data

1. On the Feature Explorer page, look for export buttons
2. Available export formats:
   - **CSV**: Tabular format with measurements
   - **GeoJSON**: Standard geospatial format
   - **JSON**: Detailed JSON with all properties
   - **Summary**: Aggregated statistics
   - **HTML**: Formatted report with styling

### 7. Test API Directly

1. Open **`http://localhost:8000/docs`** (Swagger UI)
2. You can test API endpoints directly:
   - `POST /api/files/upload` - Upload a file
   - `GET /api/files` - List all files
   - `GET /api/files/{file_id}` - Get file details
   - `GET /api/files/{file_id}/measurements` - Get measurements
   - `GET /api/files/{file_id}/export/csv` - Export as CSV
   - `GET /api/files/{file_id}/export/geojson` - Export as GeoJSON

## Testing Checklist

### Upload Functionality
- [ ] File uploads successfully
- [ ] Success message appears
- [ ] File appears in file list
- [ ] Features are parsed correctly

### Feature Display
- [ ] All 16 features appear in table
- [ ] Features are grouped by type
- [ ] Feature names are correct
- [ ] Feature descriptions are visible

### Map Visualization
- [ ] Map displays all features
- [ ] Features are visible on map
- [ ] Map is interactive (zoom, pan)
- [ ] Features are color-coded correctly

### Feature Selection
- [ ] Clicking table row highlights feature on map
- [ ] Clicking map feature highlights table row
- [ ] Detail panel shows feature information
- [ ] Measurements display correctly

### Measurements
- [ ] LineString features show length
- [ ] Polygon features show area
- [ ] Point features show coordinates
- [ ] Units are correct (meters, km, degrees)

### Export Functionality
- [ ] CSV export downloads successfully
- [ ] GeoJSON export is valid
- [ ] JSON export contains all data
- [ ] HTML report displays correctly
- [ ] Summary shows statistics

### API Endpoints
- [ ] GET /api/files returns file list
- [ ] GET /api/files/{id} returns file details
- [ ] GET /api/files/{id}/measurements returns measurements
- [ ] Export endpoints return correct formats

## Common Issues and Solutions

### Issue: Map not displaying
**Solution:**
- Check browser console for errors (F12)
- Verify Leaflet.js is loaded
- Check that OpenStreetMap tiles are accessible
- Refresh the page

### Issue: Features not appearing in table
**Solution:**
- Check backend logs for parsing errors
- Verify KML file is valid
- Try uploading a different file
- Check browser console for API errors

### Issue: Measurements showing as 0
**Solution:**
- Verify features have valid geometries
- Check coordinate system is WGS84
- Ensure features have sufficient vertices
- Check calculation formulas in backend

### Issue: Export not working
**Solution:**
- Verify file has been uploaded
- Check backend is running
- Try different export format
- Check browser console for errors

### Issue: Backend not responding
**Solution:**
- Verify backend is running: `ps aux | grep uvicorn`
- Check port 8000 is available: `lsof -i :8000`
- Restart backend: `python -m uvicorn app.main:app --reload`
- Check for Python errors in terminal

### Issue: Frontend not loading
**Solution:**
- Verify frontend is running: `npm run dev` in `frontend/` directory
- Check port 5173 is available: `lsof -i :5173`
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors

## Performance Testing

### Test with Different File Sizes

1. **Small file** (< 10 features): Should load instantly
2. **Medium file** (10-100 features): Should load in < 1 second
3. **Large file** (100-1000 features): Should load in < 5 seconds

### Test with Different Geometry Types

1. **Points only**: Fastest rendering
2. **LineStrings**: Medium rendering time
3. **Polygons**: Slower rendering (especially with holes)
4. **Mixed geometries**: Test overall performance

## Advanced Testing

### Test Geometry Validation (if implemented)

1. Upload file with invalid geometries
2. Check validation results
3. Verify error messages are helpful
4. Test self-intersection detection

### Test Spatial Operations (if implemented)

1. Create buffer zones around features
2. Test intersection detection
3. Test union operations
4. Calculate centroids
5. Generate convex hulls

### Test CRS Conversion (if implemented)

1. Upload file with different CRS
2. Verify automatic CRS detection
3. Test coordinate transformation
4. Verify measurements are accurate

## Browser Developer Tools

### Useful Shortcuts

- **F12**: Open Developer Tools
- **Ctrl+Shift+I**: Open Inspector
- **Ctrl+Shift+J**: Open Console
- **Ctrl+Shift+K**: Open Console (Firefox)
- **Ctrl+Shift+E**: Open Network tab

### What to Check

1. **Console tab**: Look for JavaScript errors
2. **Network tab**: Check API requests and responses
3. **Application tab**: Check local storage and cookies
4. **Performance tab**: Monitor page load time

## API Testing with cURL

### Upload a file
```bash
curl -X POST -F "file=@demo_data/sample_features.kml" \
  http://localhost:8000/api/files/upload
```

### List files
```bash
curl http://localhost:8000/api/files
```

### Get file details
```bash
curl http://localhost:8000/api/files/{file_id}
```

### Get measurements
```bash
curl http://localhost:8000/api/files/{file_id}/measurements
```

### Export as CSV
```bash
curl http://localhost:8000/api/files/{file_id}/export/csv \
  -o export.csv
```

### Export as GeoJSON
```bash
curl http://localhost:8000/api/files/{file_id}/export/geojson \
  -o export.geojson
```

## Next Steps

After testing the basic functionality:

1. **Test with your own data**: Upload your own KML/GeoJSON files
2. **Test edge cases**: Try files with unusual geometries
3. **Test performance**: Upload large files and monitor performance
4. **Test integrations**: Test with external GIS tools
5. **Provide feedback**: Report any issues or suggestions

## Support Resources

- **API Documentation**: `http://localhost:8000/docs`
- **User Guide**: [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
- **Developer Guide**: [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)
- **Demo Data**: [`demo_data/README.md`](demo_data/README.md)
- **Setup Guide**: [`SETUP.md`](SETUP.md)

## Feedback

If you encounter any issues or have suggestions:

1. Check the troubleshooting section above
2. Review the relevant documentation
3. Check browser console for error messages
4. Check backend logs for server errors
5. Report issues with detailed information

Happy testing! 🚀
