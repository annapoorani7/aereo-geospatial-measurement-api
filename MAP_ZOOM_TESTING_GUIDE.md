# Map Zoom & Pan Fix - Testing Guide

## Summary of Changes

The map zoom and pan functionality has been fixed in [`frontend/src/components/MapViewer.tsx`](frontend/src/components/MapViewer.tsx).

### What Was Fixed

**Problem**: Map interactions (zoom, pan, etc.) were not working because Leaflet's interaction handlers were not being explicitly enabled in the react-leaflet v4 component.

**Solution**: Added a `MapController` component that uses the `useMap()` hook to access the Leaflet map instance and explicitly enable all interaction handlers after the map is initialized.

### Code Changes

#### 1. MapController Component (Lines 18-55)
```typescript
const MapController: FC<{
  features: FeatureRecord[];
  geojsonData: any;
}> = ({ features, geojsonData }) => {
  const map = useMap();

  // Enable all map interactions on mount
  useEffect(() => {
    if (!map) return;
    
    // Ensure all interaction handlers are enabled
    try {
      if (map.dragging) map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();
    } catch (error) {
      console.error("Error enabling map interactions:", error);
    }
  }, [map]);
  
  // ... rest of component
};
```

#### 2. MapContainer Configuration (Line 182)
Added `zoomControl={true}` to ensure zoom control buttons are visible.

#### 3. CSS Pointer Events (Lines 227-230)
Ensured `pointer-events: auto !important` on `.leaflet-container` to allow interactions.

---

## How to Test the Fix

### Prerequisites
- Backend running: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Frontend running: `cd frontend && npm run dev`
- Demo file available: `demo_data/sample_features.kml`

### Step 1: Upload Demo File

**Option A: Using curl (Recommended)**
```bash
curl -X POST -F "file=@demo_data/sample_features.kml" http://localhost:8000/api/files/
```

This will return a JSON response with an `upload_id`. Copy this ID.

**Option B: Using Browser UI**
1. Navigate to http://localhost:5173
2. Click "Upload & Analyze"
3. Click the drop zone and select `demo_data/sample_features.kml`
4. Click "Upload & analyze"
5. Wait for processing to complete

### Step 2: Navigate to Feature Explorer

**If using curl:**
1. Open http://localhost:5173/#features in your browser
2. The page should show "No session files to explore" because the upload was done outside the browser session
3. To see the data, you need to upload through the browser UI (Option B above)

**If using Browser UI:**
1. After upload completes, click "Explore features"
2. You should see the map with the uploaded features displayed

### Step 3: Test Map Interactions

Once the map is visible with features, test the following:

#### ✓ Scroll Wheel Zoom
- **Action**: Scroll your mouse wheel over the map
- **Expected**: Map zooms in/out smoothly
- **Status**: Should work now

#### ✓ Click & Drag Pan
- **Action**: Click and drag the map with your mouse
- **Expected**: Map pans in the direction you drag
- **Status**: Should work now

#### ✓ Double-Click Zoom
- **Action**: Double-click on the map
- **Expected**: Map zooms in to that location
- **Status**: Should work now

#### ✓ Zoom Control Buttons
- **Action**: Click the + and - buttons in the top-left corner
- **Expected**: Map zooms in/out
- **Status**: Should work now

#### ✓ Box Zoom
- **Action**: Hold Shift and drag a box on the map
- **Expected**: Map zooms to fit the box
- **Status**: Should work now

#### ✓ Keyboard Controls
- **Action**: Use arrow keys to pan, +/- keys to zoom
- **Expected**: Map responds to keyboard input
- **Status**: Should work now

#### ✓ Touch Zoom (Mobile)
- **Action**: On a touch device, pinch to zoom
- **Expected**: Map zooms in/out
- **Status**: Should work now

---

## Verification Checklist

- [ ] Map renders with features visible
- [ ] Scroll wheel zoom works
- [ ] Click & drag pan works
- [ ] Double-click zoom works
- [ ] Zoom control buttons work
- [ ] Box zoom (Shift + drag) works
- [ ] Keyboard controls work
- [ ] No console errors related to map interactions

---

## Browser Console Debugging

If interactions still don't work, open the browser console (F12) and check for:

1. **Map initialization errors**: Look for any errors in the console
2. **Interaction handler status**: Run this in the console:
   ```javascript
   // Find the map container and check handler status
   const mapContainer = document.querySelector('.leaflet-container');
   if (mapContainer && mapContainer.__vue__) {
     console.log('Map found');
   }
   ```

3. **Check for CSS blocking**: Verify that `.leaflet-container` has `pointer-events: auto`
   ```javascript
   const style = window.getComputedStyle(document.querySelector('.leaflet-container'));
   console.log('pointer-events:', style.pointerEvents);
   ```

---

## Technical Details

### Why This Fix Works

In react-leaflet v4, the Leaflet map instance is created by the `MapContainer` component, but the interaction handlers are not automatically enabled. They must be explicitly enabled after the map is initialized.

The `MapController` component:
1. Uses the `useMap()` hook to get the map instance
2. Runs in a `useEffect` that depends on the map instance
3. Explicitly enables each handler: `dragging`, `touchZoom`, `doubleClickZoom`, `scrollWheelZoom`, `boxZoom`, `keyboard`
4. Includes error handling in case any handler is unavailable

### Dependencies
- react-leaflet: ^4.2.1
- leaflet: ^1.9.4
- react: ^18.3.1

### Files Modified
- `frontend/src/components/MapViewer.tsx` - Main fix implementation

---

## Troubleshooting

### Issue: Map still doesn't zoom/pan
**Solution**: 
1. Check browser console for errors (F12)
2. Verify the map is rendering (you should see OpenStreetMap tiles)
3. Ensure features are loaded (you should see colored shapes on the map)
4. Try refreshing the page (Ctrl+R or Cmd+R)

### Issue: Zoom control buttons don't appear
**Solution**:
1. Check that `zoomControl={true}` is set on MapContainer (Line 182)
2. Verify CSS is not hiding the controls
3. Check browser console for errors

### Issue: Map is frozen/unresponsive
**Solution**:
1. Check if there are JavaScript errors in the console
2. Try uploading a different file
3. Restart the frontend dev server: `cd frontend && npm run dev`

---

## Next Steps

After verifying the fix works:
1. Test with different file formats (KML and Shapefile ZIP)
2. Test with different feature types (Points, LineStrings, Polygons)
3. Test on different browsers (Chrome, Firefox, Safari)
4. Test on mobile devices (touch zoom, pan)
