# Map Zoom and Pan Investigation

## Current implementation

The React map is implemented in [`client/src/components/MapViewer.tsx`](../client/src/components/MapViewer.tsx) with React-Leaflet 4.2.1 and Leaflet 1.9.4. [`client/src/pages/FeatureExplorerPage.tsx`](../client/src/pages/FeatureExplorerPage.tsx) mounts the map for the active upload, provides a show/hide control, and passes the active features, measurements, selected feature ID, and selection callback.

`MapController` is a child of `MapContainer` and obtains the Leaflet instance with `useMap()`. Its mount effect enables dragging, touch zoom, double-click zoom, scroll-wheel zoom, box zoom, and keyboard navigation; a ref prevents repeated enabling. A separate effect calculates the feature bounds and calls `fitBounds` with padding when the feature count changes. `MapContainer` enables its zoom control. The component CSS sets pointer events on the map container so the surrounding UI does not intentionally disable interaction.

The current source enables handlers through the controller; it does not set every interaction option as a `MapContainer` prop. Keep the implementation and this description aligned if the map is changed.

## Investigation history and decisions

- The first report attributed the problem to a callback-ref pattern on `MapContainer` and moved map access into a child component using `useMap()`. This is the pattern used by the current component.
- A diagnostic iteration added console output to inspect Leaflet handler state and possible CSS/event interference. That logging was a troubleshooting step, not a separate runtime feature.
- The fix summary describes explicitly enabling the six Leaflet handlers and setting `zoomControl`. Those actions are present in the current source. It also records a pointer-events safeguard in the component styles.
- A later note describes passing all interaction booleans directly to `MapContainer`. That is a documented alternative approach, but those props are not in the current source. Do not treat that note as a description of the final implementation.
- The documents report development-server hot reload and expected working interactions, but they do not include captured browser-test results. The production build verifies TypeScript/Vite compilation, not real pointer, touch, or keyboard input.

## Regression scenarios

After starting the backend and client as described in [`setup.md`](setup.md), upload `server/demo_data/sample_features.kml` through the application and open Feature Explorer. Verify:

1. The map renders with the uploaded features and fits their bounds.
2. Scroll-wheel zoom, plus/minus controls, double-click zoom, and click-drag pan respond.
3. Shift-drag box zoom and keyboard arrow/plus/minus controls respond.
4. Touch pinch and pan work on a touch-capable device.
5. Selecting a feature on the map updates selection; feature popups show the feature ID/type and available measurement details.
6. Hiding and showing the map preserves the active upload and feature table.
7. No browser-console exceptions occur while features are loaded or the map is shown/hidden.

The repository has no automated browser test for these interactions. [`client/test-map.html`](../client/test-map.html) is a standalone Leaflet harness with sample GeoJSON and programmatic zoom/pan checks. It helps separate core Leaflet/tile behavior from the React-Leaflet application integration; it does not test uploads, React state, or actual user-generated pointer gestures. The screenshots in `screenshots/` are retained visual artifacts, not executable tests.

## Troubleshooting

- Confirm the backend is reachable at `http://127.0.0.1:8000/health` and the browser is using the configured `VITE_API_BASE_URL`.
- Check the browser console and network panel for React errors, failed API requests, or blocked OpenStreetMap tiles.
- Inspect whether a parent element or overlay intercepts pointer input and whether computed `pointer-events` on `.leaflet-container` is `auto`.
- Confirm `MapController` is rendered as a child of `MapContainer`; `useMap()` requires the React-Leaflet map context.
- If the controls work but map dragging does not, inspect `map.dragging.enabled()` and the other handler states in DevTools. Do not leave temporary diagnostic logging in production code.
- If fitting is stale after replacing features with a different set of the same count, review the bounds effect dependency in `MapViewer.tsx`; it currently keys the fit effect to `features.length`.
