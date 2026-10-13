# Map Zoom & Pan - Diagnostic Guide

## Current Status

I've updated the MapViewer component with enhanced logging to help diagnose why zoom/pan interactions are not working.

## What Changed

Added console logging in the MapController component that will output:
1. "Enabling map interactions..." - when the component tries to enable handlers
2. A detailed object showing the state of each handler after enabling

## How to Diagnose

1. **Open Browser DevTools**: Press F12 in your browser
2. **Go to Console Tab**: Click on the "Console" tab
3. **Upload a file and navigate to Feature Explorer**
4. **Look for these console messages**:
   - "Enabling map interactions..." 
   - An object showing handler states like:
     ```
     {
       dragging: true/false,
       scrollWheelZoom: true/false,
       touchZoom: true/false,
       doubleClickZoom: true/false,
       boxZoom: true/false,
       keyboard: true/false
     }
     ```

## What This Tells Us

- **If all handlers show `true`**: The handlers are being enabled correctly, but something else is blocking interactions (CSS, event propagation, etc.)
- **If handlers show `false`**: The `.enable()` calls are not working, which means the issue is deeper in react-leaflet or Leaflet initialization
- **If you don't see the messages**: The MapController component is not being mounted or the useEffect is not running

## Next Steps Based on Console Output

### Scenario 1: All handlers enabled but still not working
- Check if there's a parent element with `pointer-events: none`
- Check if there's a modal or overlay blocking the map
- Check if there's JavaScript preventing event propagation

### Scenario 2: Handlers not enabled (showing false)
- The issue is with how react-leaflet v4 initializes handlers
- May need to use a different approach (e.g., direct Leaflet API instead of react-leaflet)
- May need to check if handlers exist before calling `.enable()`

### Scenario 3: Console messages not appearing
- MapController component is not rendering
- useEffect is not running
- Check if there are any errors in the console

## Files Modified

- `frontend/src/components/MapViewer.tsx` - Added console logging and useRef to track initialization

## Testing Instructions

1. Upload demo file: `curl -X POST -F "file=@demo_data/sample_features.kml" http://localhost:8000/api/files/`
2. Navigate to Feature Explorer in browser
3. Open DevTools Console (F12)
4. Look for the diagnostic messages
5. Report what you see in the console

This will help us understand exactly where the problem is and what the next fix should be.
