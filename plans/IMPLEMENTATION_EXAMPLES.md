# Aereo GeoMeasure: Implementation Examples & Code Patterns

## Overview

This document provides concrete implementation examples for the most impactful UI/UX improvements. These examples demonstrate how to implement the recommendations from the roadmap.

---

## Phase 1: Quick Wins - Implementation Examples

### 1. Contextual Error Messages

#### Current Implementation
```typescript
// Current: Generic error
catch (error) {
  setError("The upload failed unexpectedly. Please ensure the backend is running and try again.");
}
```

#### Improved Implementation
```typescript
// Improved: Contextual error messages
function getContextualErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "File format not supported. Please upload a .kml file or a .zip archive containing a Shapefile (.shp, .shx, .dbf, .prj).";
    }
    if (error.status === 413) {
      return "File exceeds 20 MiB limit. Please compress or split your file and try again.";
    }
    if (error.status === 422) {
      return "File validation failed. Ensure your KML is valid XML or your Shapefile contains all required files.";
    }
    if (error.status === 503) {
      return "Backend service is temporarily unavailable. Please check that the API server is running and try again.";
    }
  }
  return "Upload failed. Please check your file and try again.";
}
```

#### UI Component
```tsx
{error && (
  <div className="upload-error-banner" role="alert">
    <AlertCircle size={17} />
    <div>
      <strong>Upload failed</strong>
      <p>{error}</p>
      <a href="/docs/troubleshooting">View troubleshooting guide →</a>
    </div>
  </div>
)}
```

---

### 2. Real-Time Validation Feedback

#### Implementation
```typescript
function validateFile(file: File | undefined): ValidationResult {
  if (!file) return { valid: false, message: "" };
  
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isValidFormat = extension && ["kml", "zip"].includes(extension);
  const isValidSize = file.size <= MAX_FILE_BYTES;
  
  return {
    valid: isValidFormat && isValidSize,
    format: {
      valid: isValidFormat,
      message: isValidFormat ? "✓ Format supported" : "✗ Only .kml or .zip files accepted"
    },
    size: {
      valid: isValidSize,
      message: isValidSize 
        ? `✓ ${fileSize(file.size)} (within 20 MiB limit)`
        : `✗ ${fileSize(file.size)} exceeds 20 MiB limit`
    }
  };
}

// In component
const validation = validateFile(selectedFile);

return (
  <>
    {selectedFile && (
      <div className="validation-feedback">
        <div className={`validation-item ${validation.format.valid ? 'valid' : 'invalid'}`}>
          {validation.format.valid ? <Check size={16} /> : <X size={16} />}
          <span>{validation.format.message}</span>
        </div>
        <div className={`validation-item ${validation.size.valid ? 'valid' : 'invalid'}`}>
          {validation.size.valid ? <Check size={16} /> : <X size={16} />}
          <span>{validation.size.message}</span>
        </div>
      </div>
    )}
  </>
);
```

#### CSS
```css
.validation-feedback {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 4px;
  background-color: var(--paper);
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.validation-item.valid {
  color: var(--forest);
}

.validation-item.invalid {
  color: var(--crimson);
}
```

---

### 3. Success Confirmations

#### Component
```tsx
interface SuccessConfirmationProps {
  filename: string;
  featureCount: number;
  processingTime: number;
}

export function SuccessConfirmation({
  filename,
  featureCount,
  processingTime
}: SuccessConfirmationProps) {
  return (
    <div className="success-confirmation" role="status" aria-live="polite">
      <div className="success-icon-animated">
        <Check size={24} strokeWidth={3} />
      </div>
      <h3>Upload successful!</h3>
      <div className="success-details">
        <p><strong>{filename}</strong></p>
        <p>{featureCount.toLocaleString()} features extracted</p>
        <p className="processing-time">Processed in {processingTime}ms</p>
      </div>
      <div className="success-actions">
        <button className="button button-hero">Explore features</button>
        <button className="button button-quiet">Upload another</button>
      </div>
    </div>
  );
}
```

#### CSS with Animation
```css
.success-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
  border-radius: 6px;
  background-color: var(--forest-tint);
  animation: success-slide-in 400ms cubic-bezier(0.2, 0.7, 0.25, 1) both;
}

.success-icon-animated {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 50%;
  background-color: var(--forest);
  color: white;
  margin-bottom: 16px;
  animation: success-scale 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes success-slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes success-scale {
  from {
    transform: scale(0.5);
  }
  to {
    transform: scale(1);
  }
}
```

---

### 4. Enhanced Metric Cards

#### Component
```tsx
interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  stats?: {
    min: number;
    max: number;
    average: number;
  };
  data?: number[];
}

export function EnhancedMetricCard({
  label,
  value,
  unit,
  stats,
  data
}: MetricCardProps) {
  return (
    <div className="metric-card-enhanced">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-unit">{unit}</span>
      </div>
      
      <div className="metric-value-display">
        <strong className="metric-value">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </strong>
      </div>
      
      {data && data.length > 0 && (
        <div className="metric-sparkline">
          <Sparkline data={data} />
        </div>
      )}
      
      {stats && (
        <div className="metric-stats">
          <div className="stat-row">
            <span className="stat-label">Min:</span>
            <span className="stat-value">{stats.min.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Max:</span>
            <span className="stat-value">{stats.max.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg:</span>
            <span className="stat-value">{stats.average.toLocaleString()}</span>
          </div>
        </div>
      )}
      
      {unit === "m²" && (
        <div className="metric-conversions">
          <small>
            {(value / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 })} hectares
          </small>
        </div>
      )}
    </div>
  );
}
```

#### CSS
```css
.metric-card-enhanced {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--rule);
  border-radius: 4px;
  background-color: var(--paper-card);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  text-transform: uppercase;
}

.metric-unit {
  font-size: 10px;
  color: var(--ink-soft);
  font-weight: 600;
}

.metric-value-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value {
  font-family: var(--editorial);
  font-size: 28px;
  font-weight: 480;
  color: var(--ink-deep);
}

.metric-sparkline {
  height: 32px;
  margin: 4px 0;
}

.metric-stats {
  display: grid;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--rule-light);
  font-size: 11px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: var(--ink-soft);
  font-weight: 600;
}

.stat-value {
  color: var(--forest);
  font-weight: 700;
}

.metric-conversions {
  color: var(--ink-muted);
  font-size: 10px;
  padding-top: 4px;
  border-top: 1px solid var(--rule-light);
}
```

---

### 5. Measurement Status Legend

#### Component
```tsx
const STATUS_LEGEND = [
  {
    status: "available",
    label: "Measurement Available",
    description: "Area/length calculated in local UTM projection",
    icon: Check,
    color: "var(--forest)"
  },
  {
    status: "unavailable",
    label: "Measurement Unavailable",
    description: "CRS unknown or geometry spans > 6° longitude",
    icon: AlertCircle,
    color: "var(--amber)"
  },
  {
    status: "not_applicable",
    label: "Not Applicable",
    description: "Point geometries cannot be measured for area/length",
    icon: Info,
    color: "var(--ink-soft)"
  }
];

export function MeasurementStatusLegend() {
  return (
    <div className="status-legend">
      <h3>Measurement Status Guide</h3>
      <div className="legend-items">
        {STATUS_LEGEND.map(item => (
          <div key={item.status} className="legend-item">
            <div className="legend-icon" style={{ color: item.color }}>
              <item.icon size={18} />
            </div>
            <div className="legend-content">
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
            <button className="legend-help" title="Learn more">
              <HelpCircle size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### CSS
```css
.status-legend {
  padding: 16px;
  border: 1px solid var(--rule);
  border-radius: 4px;
  background-color: var(--paper);
}

.status-legend h3 {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-deep);
}

.legend-items {
  display: grid;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  border-radius: 4px;
  background-color: var(--paper-card);
}

.legend-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.legend-content {
  flex: 1;
  min-width: 0;
}

.legend-content strong {
  display: block;
  font-size: 12px;
  color: var(--ink-deep);
  margin-bottom: 2px;
}

.legend-content p {
  margin: 0;
  font-size: 11px;
  color: var(--ink-soft);
  line-height: 1.4;
}

.legend-help {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
}

.legend-help:hover {
  color: var(--forest);
}
```

---

## Phase 2: Core Enhancements - Implementation Examples

### 1. Skeleton Screen Component

#### Component
```tsx
interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  className = ""
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

// Table skeleton
export function FeatureTableSkeleton() {
  return (
    <div className="skeleton-table">
      <div className="skeleton-row">
        <Skeleton width="40px" height="20px" />
        <Skeleton width="120px" height="20px" />
        <Skeleton width="80px" height="20px" />
        <Skeleton width="200px" height="20px" />
        <Skeleton width="100px" height="20px" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <Skeleton width="40px" height="20px" />
          <Skeleton width="120px" height="20px" />
          <Skeleton width="80px" height="20px" />
          <Skeleton width="200px" height="20px" />
          <Skeleton width="100px" height="20px" />
        </div>
      ))}
    </div>
  );
}
```

#### CSS
```css
.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--paper) 0%,
    var(--paper-card) 50%,
    var(--paper) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-table {
  display: grid;
  gap: 8px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 40px 120px 80px 1fr 100px;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--rule-light);
  border-radius: 4px;
  background-color: var(--paper-card);
}
```

---

### 2. Advanced Filtering Component

#### Component
```tsx
interface FilterState {
  search: string;
  geometryType: string[];
  measurementStatus: string[];
  crsStatus: string[];
}

export function AdvancedFilterBar() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    geometryType: [],
    measurementStatus: [],
    crsStatus: []
  });

  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="filter-bar">
      <div className="search-box-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="editorial-search-input"
          placeholder="Search by ID, properties, measurements..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Geometry Type</label>
        <select
          multiple
          className="editorial-select"
          value={filters.geometryType}
          onChange={(e) => setFilters({
            ...filters,
            geometryType: Array.from(e.target.selectedOptions, o => o.value)
          })}
        >
          <option value="Point">Point</option>
          <option value="LineString">LineString</option>
          <option value="Polygon">Polygon</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Measurement Status</label>
        <select
          multiple
          className="editorial-select"
          value={filters.measurementStatus}
          onChange={(e) => setFilters({
            ...filters,
            measurementStatus: Array.from(e.target.selectedOptions, o => o.value)
          })}
        >
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="not_applicable">Not Applicable</option>
        </select>
      </div>

      {activeFilterCount > 0 && (
        <button
          className="clear-filters-btn"
          onClick={() => setFilters({
            search: "",
            geometryType: [],
            measurementStatus: [],
            crsStatus: []
          })}
        >
          Clear filters ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
```

---

## Phase 3: Major Features - Implementation Examples

### 1. Interactive Map Component

#### Component
```tsx
import L from "leaflet";
import { useEffect, useRef } from "react";

interface MapViewerProps {
  features: Feature[];
  selectedFeatureId?: string;
  onFeatureSelect?: (featureId: string) => void;
}

export function MapViewer({
  features,
  selectedFeatureId,
  onFeatureSelect
}: MapViewerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(mapRef.current);
    }

    // Add features to map
    features.forEach(feature => {
      const layer = L.geoJSON(feature.geometry, {
        style: {
          color: selectedFeatureId === feature.id ? "#285f4d" : "#3f8067",
          weight: selectedFeatureId === feature.id ? 3 : 2,
          opacity: 0.8
        },
        onEachFeature: (_, layer) => {
          layer.on("click", () => onFeatureSelect?.(feature.id));
        }
      });

      layersRef.current.set(feature.id, layer);
      layer.addTo(mapRef.current!);
    });

    return () => {
      layersRef.current.forEach(layer => layer.remove());
      layersRef.current.clear();
    };
  }, [features, selectedFeatureId, onFeatureSelect]);

  return <div id="map" style={{ width: "100%", height: "400px" }} />;
}
```

---

## Accessibility Implementation Examples

### 1. Keyboard Navigation

#### Implementation
```typescript
// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  "?": "Show help",
  "/": "Focus search",
  "g": "Go to Feature Explorer",
  "u": "Go to Upload",
  "o": "Go to Overview",
  "s": "Go to API Status",
  "Escape": "Close modal/menu"
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Show help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showHelpModal();
      }

      // Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        document.querySelector(".editorial-search-input")?.focus();
      }

      // Navigation shortcuts
      if (e.altKey) {
        switch (e.key) {
          case "g":
            navigate("features");
            break;
          case "u":
            navigate("upload");
            break;
          case "o":
            navigate("overview");
            break;
          case "s":
            navigate("status");
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe("SuccessConfirmation", () => {
  it("displays filename and feature count", () => {
    render(
      <SuccessConfirmation
        filename="test.kml"
        featureCount={42}
        processingTime={1234}
      />
    );
    expect(screen.getByText("test.kml")).toBeInTheDocument();
    expect(screen.getByText(/42 features/)).toBeInTheDocument();
  });

  it("has accessible status role", () => {
    render(
      <SuccessConfirmation
        filename="test.kml"
        featureCount={42}
        processingTime={1234}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
```

### Accessibility Tests
```typescript
describe("Accessibility", () => {
  it("meets WCAG color contrast standards", async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("supports keyboard navigation", () => {
    render(<FeatureExplorer />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    userEvent.tab();
    expect(searchInput).toHaveFocus();
  });
});
```

---

## Performance Optimization Tips

### 1. Lazy Load Map
```typescript
const MapViewer = lazy(() => import("./MapViewer"));

export function FeatureExplorer() {
  return (
    <Suspense fallback={<Skeleton height="400px" />}>
      <MapViewer features={features} />
    </Suspense>
  );
}
```

### 2. Memoize Expensive Components
```typescript
export const MetricCard = memo(function MetricCard(props: MetricCardProps) {
  return (
    // Component JSX
  );
}, (prev, next) => {
  return prev.value === next.value && prev.label === next.label;
});
```

### 3. Virtual Scrolling for Large Tables
```typescript
import { FixedSizeList } from "react-window";

export function FeatureTable({ features }: { features: Feature[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={features.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <FeatureRow feature={features[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Conclusion

These implementation examples provide concrete patterns for implementing the UI/UX improvements outlined in the roadmap. Each example includes:

- **Component code** with TypeScript types
- **CSS styling** following the design system
- **Accessibility considerations**
- **Performance optimizations**
- **Testing approaches**

Use these as templates and adapt them to your specific needs and design system.

---

**Document Version:** 1.0  
**Last Updated:** October 13, 2026  
**Status:** Ready for Development
