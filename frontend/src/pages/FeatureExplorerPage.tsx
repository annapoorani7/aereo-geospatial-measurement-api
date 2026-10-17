import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  CopyCheck,
  FileArchive,
  FileCode2,
  FileJson2,
  FilterX,
  RotateCcw,
  Search,
} from "lucide-react";
import type { FeatureMeasurement, SessionUpload } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { GeometryPreview } from "../components/GeometryPreview";
import { MapViewer } from "../components/MapViewer";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

interface FeatureExplorerPageProps {
  uploads: SessionUpload[];
  activeUpload: SessionUpload | null;
  onSelectUpload: (uploadId: string) => void;
  onRefresh: (uploadId: string) => void;
}

function measurementDisplay(item: FeatureMeasurement | undefined): { label: string; tone: "success" | "neutral" | "warning" } {
  if (!item) return { label: "—", tone: "neutral" };
  if (item.status === "measured") {
    if (typeof item.area_m2 === "number") {
      return { label: `${numberFormat.format(item.area_m2)} m²`, tone: "success" };
    }
    if (typeof item.length_m === "number") {
      return { label: `${numberFormat.format(item.length_m)} m`, tone: "success" };
    }
    return { label: "Measured", tone: "success" };
  }
  if (item.status === "not_applicable") {
    return { label: "N/A (Point)", tone: "neutral" };
  }
  return { label: item.error || "Unavailable", tone: "warning" };
}

function propertySummary(properties: Record<string, unknown>): string {
  const entries = Object.entries(properties);
  if (!entries.length) return "No properties";
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default function FeatureExplorerPage({
  uploads,
  activeUpload,
  onSelectUpload,
  onRefresh,
}: FeatureExplorerPageProps) {
  const [search, setSearch] = useState("");
  const [geometryFilter, setGeometryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    setExpandedId(null);
  }, [activeUpload?.upload.upload_id]);

  const measurementById = useMemo(
    () => new Map(activeUpload?.measurements?.measurements.map((item) => [item.feature_id, item]) ?? []),
    [activeUpload?.measurements]
  );

  const features = activeUpload?.upload.features ?? [];
  const geometryTypes = [...new Set(features.map((feature) => feature.geometry_type))].sort();

  const visibleFeatures = features.filter((feature) => {
    const measurement = measurementById.get(feature.feature_id);
    const status = measurement?.status ?? "not returned";
    const searchable = [
      feature.feature_id,
      feature.geometry_type,
      JSON.stringify(feature.properties),
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (geometryFilter === "all" || feature.geometry_type === geometryFilter) &&
      (statusFilter === "all" || status === statusFilter)
    );
  });

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied to clipboard`);
    } catch {
      setCopyFeedback("Unable to access clipboard in this browser");
    }
    window.setTimeout(() => setCopyFeedback(""), 2400);
  }

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="editorial-page-stack">
      {/* Editorial Header */}
      <section className="editorial-hero-intro">
        <div className="editorial-kicker">
          <span className="kicker-rule" />
          <span>SPATIAL INSPECTION · FEATURE EXPLORER</span>
        </div>
        <div className="editorial-heading-row">
          <div className="editorial-title-block">
            <h1 className="editorial-title">
              Inspect every feature.<br />
              <em>Original coordinates & planar math.</em>
            </h1>
            <p className="editorial-lede">
              Examine geometries, verify original coordinates, inspect feature properties, and review
              projected measurements calculated in local UTM space.
            </p>
          </div>
          {activeUpload && (
            <div className="editorial-cta-block">
              <button
                className="button button-quiet"
                onClick={() => onRefresh(activeUpload.upload.upload_id)}
                disabled={activeUpload.detailsLoading}
              >
                <RotateCcw size={14} />
                <span>Recheck API details</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Copy Notification Toast */}
      {copyFeedback && (
        <div className="copy-toast" role="status">
          <CopyCheck size={14} />
          <span>{copyFeedback}</span>
        </div>
      )}

      {!uploads.length ? (
        /* Empty state when no files exist in session */
        <article className="editorial-panel empty-explorer-panel">
          <div className="panel-empty-placeholder">
            <FileJson2 size={28} />
            <span className="editorial-kicker-small">NO DATA</span>
            <h3>No session files to explore</h3>
            <p>
              Upload a .kml document or zipped Shapefile in the Intake workspace to inspect its
              individual features and geometry measurements.
            </p>
          </div>
        </article>
      ) : (
        <>
          {/* File Picker Bar (when session has uploads) */}
          <div className="explorer-file-selector-strip">
            <div className="file-selector-group">
              <span className="selector-label">ACTIVE FILE:</span>
              <select
                className="editorial-select file-dropdown"
                value={activeUpload?.upload.upload_id ?? ""}
                onChange={(e) => onSelectUpload(e.target.value)}
                aria-label="Select file to inspect"
              >
                {uploads.map((item) => (
                  <option key={item.upload.upload_id} value={item.upload.upload_id}>
                    {item.upload.filename} ({item.upload.feature_count} features)
                  </option>
                ))}
              </select>
            </div>

            {activeUpload && (
              <div className="file-info-indicators">
                <span className="indicator-pill">
                  {activeUpload.upload.filename.toLowerCase().endsWith(".zip") ? (
                    <FileArchive size={13} />
                  ) : (
                    <FileCode2 size={13} />
                  )}
                  <span>{activeUpload.upload.filename.split(".").pop()?.toUpperCase()}</span>
                </span>
                <span className="indicator-pill">
                  <span>CRS:</span>
                  <strong>{activeUpload.upload.source_crs ?? "Unknown"}</strong>
                </span>
                <span className="indicator-pill">
                  <span>Features:</span>
                  <strong>{activeUpload.upload.feature_count}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Filter Toolbar */}
          <div className="explorer-filter-bar">
            <div className="search-box-wrap">
              <Search size={15} className="search-icon" />
              <input
                type="search"
                className="editorial-search-input"
                placeholder="Search by ID, geometry type, or property value…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search features"
              />
            </div>

            <div className="filter-select-group">
              <label htmlFor="geom-filter" className="filter-label">
                Type:
              </label>
              <select
                id="geom-filter"
                className="editorial-select"
                value={geometryFilter}
                onChange={(e) => setGeometryFilter(e.target.value)}
              >
                <option value="all">All geometries ({features.length})</option>
                {geometryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type} ({features.filter((f) => f.geometry_type === type).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-group">
              <label htmlFor="status-filter" className="filter-label">
                Measurement:
              </label>
              <select
                id="status-filter"
                className="editorial-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="measured">Measured</option>
                <option value="not_applicable">Not applicable</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {(search || geometryFilter !== "all" || statusFilter !== "all") && (
              <button
                className="button button-quiet clear-filters-btn"
                onClick={() => {
                  setSearch("");
                  setGeometryFilter("all");
                  setStatusFilter("all");
                }}
                title="Reset filters"
              >
                <FilterX size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Interactive Map Panel */}
          {activeUpload && showMap && (
            <article className="editorial-panel map-panel">
              <div className="panel-editorial-heading">
                <div>
                  <span className="editorial-kicker-small">SPATIAL VISUALIZATION</span>
                  <h2 className="panel-title">Interactive Feature Map</h2>
                </div>
                <button
                  className="button button-quiet"
                  onClick={() => setShowMap(false)}
                  title="Hide map"
                >
                  Close map
                </button>
              </div>
              <MapViewer
                key={activeUpload.upload.upload_id}
                features={activeUpload.upload.features}
                measurements={activeUpload.measurements}
                selectedFeatureId={expandedId}
                onFeatureSelect={setExpandedId}
                height="500px"
              />
            </article>
          )}

          {/* Features Table Panel */}
          <article className="editorial-panel feature-table-panel">
            <div className="panel-editorial-heading">
              <div>
                <span className="editorial-kicker-small">FEATURE RECORDS</span>
                <h2 className="panel-title">
                  Showing {visibleFeatures.length} of {features.length} features
                </h2>
              </div>
              {!showMap && (
                <button
                  className="button button-quiet"
                  onClick={() => setShowMap(true)}
                  title="Show interactive map"
                >
                  Show map
                </button>
              )}
            </div>

            {visibleFeatures.length > 0 ? (
              <div className="editorial-table-container">
                <table className="editorial-table feature-records-table" aria-label="Feature list">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "32px" }}>
                        <span className="sr-only">Expand</span>
                      </th>
                      <th scope="col">Feature ID</th>
                      <th scope="col">Geometry</th>
                      <th scope="col">Measurement</th>
                      <th scope="col">Properties</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFeatures.map((feature) => {
                      const measurement = measurementById.get(feature.feature_id);
                      const display = measurementDisplay(measurement);
                      const isExpanded = expandedId === feature.feature_id;

                      return (
                        <tr
                          key={feature.feature_id}
                          className={`feature-row-item${isExpanded ? " row-is-expanded" : ""}`}
                          onClick={() => toggleExpand(feature.feature_id)}
                        >
                          <td className="expand-cell" data-label="Expand">
                            <span className="expand-indicator-icon">
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </span>
                          </td>

                          <td className="feature-id-cell" data-label="Feature ID">
                            <span className="feature-id-badge" title={feature.feature_id}>
                              {feature.feature_id}
                            </span>
                          </td>

                          <td data-label="Geometry">
                            <span className="geom-type-tag">{feature.geometry_type}</span>
                          </td>

                          <td data-label="Measurement">
                            <span className={`measure-result-pill pill-${display.tone}`}>
                              {display.label}
                            </span>
                          </td>

                          <td data-label="Properties">
                            <span className="properties-cell-summary" title={JSON.stringify(feature.properties)}>
                              {propertySummary(feature.properties)}
                            </span>
                          </td>

                          <td className="actions-cell" data-label="Actions">
                            <button
                              type="button"
                              className="table-action-icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyToClipboard(feature.feature_id, "Feature ID");
                              }}
                              title="Copy Feature ID"
                              aria-label={`Copy Feature ID for ${feature.feature_id}`}
                            >
                              <Clipboard size={14} />
                            </button>
                            <button
                              type="button"
                              className="table-action-icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyToClipboard(JSON.stringify(feature, null, 2), "Feature GeoJSON");
                              }}
                              title="Copy Feature JSON"
                              aria-label={`Copy Feature JSON for ${feature.feature_id}`}
                            >
                              <FileJson2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-empty-placeholder">
                <FilterX size={24} />
                <p>No features match the current search or filters.</p>
                <button
                  className="button button-quiet"
                  onClick={() => {
                    setSearch("");
                    setGeometryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear search filters
                </button>
              </div>
            )}
          </article>

          {/* Feature Inspection Modal / Detail Drawer when a feature is selected */}
          {expandedId && (
            (() => {
              const selectedFeature = features.find((f) => f.feature_id === expandedId);
              if (!selectedFeature) return null;
              const measurement = measurementById.get(selectedFeature.feature_id);

              return (
                <article className="editorial-panel feature-inspector-panel">
                  <div className="panel-editorial-heading inspector-heading">
                    <div>
                      <span className="editorial-kicker-small">FEATURE DETAIL</span>
                      <h2 className="panel-title">{selectedFeature.feature_id}</h2>
                      <span className="inspector-geom-sub">
                        {selectedFeature.geometry_type} · Source CRS: {selectedFeature.source_crs ?? "Unknown"}
                      </span>
                    </div>
                    <div className="inspector-head-actions">
                      <button
                        className="button button-quiet"
                        onClick={() =>
                          void copyToClipboard(
                            JSON.stringify(selectedFeature, null, 2),
                            "Feature GeoJSON"
                          )
                        }
                      >
                        <FileJson2 size={14} />
                        <span>Copy GeoJSON</span>
                      </button>
                      <button
                        className="button button-quiet"
                        onClick={() => setExpandedId(null)}
                      >
                        Close detail
                      </button>
                    </div>
                  </div>

                  <div className="inspector-grid">
                    {/* Visual Geometry Preview */}
                    <div className="inspector-preview-box">
                      <span className="inspector-box-title">COORDINATE PREVIEW</span>
                      <GeometryPreview feature={selectedFeature} />
                      <div className="preview-caption">
                        <span>Derived from original returned vertex coordinates.</span>
                      </div>
                    </div>

                    {/* Properties & Measurement Specs */}
                    <div className="inspector-data-box">
                      <span className="inspector-box-title">MEASUREMENT SPECIFICATION</span>
                      <div className="measure-specs-list">
                        <div className="spec-row">
                          <span className="spec-label">Status</span>
                          <span className="spec-val">
                            <StatusBadge
                              tone={
                                measurement?.status === "measured"
                                  ? "success"
                                  : measurement?.status === "not_applicable"
                                  ? "neutral"
                                  : "warning"
                              }
                            >
                              {measurement?.status ?? "Not returned"}
                            </StatusBadge>
                          </span>
                        </div>
                        {measurement?.area_m2 !== null && measurement?.area_m2 !== undefined && (
                          <div className="spec-row">
                            <span className="spec-label">Planar Area</span>
                            <span className="spec-val">
                              <strong>{numberFormat.format(measurement.area_m2)} m²</strong>
                              <small> ({(measurement.area_m2 / 10000).toFixed(4)} ha)</small>
                            </span>
                          </div>
                        )}
                        {measurement?.length_m !== null && measurement?.length_m !== undefined && (
                          <div className="spec-row">
                            <span className="spec-label">Planar Length</span>
                            <span className="spec-val">
                              <strong>{numberFormat.format(measurement.length_m)} m</strong>
                              <small> ({(measurement.length_m / 1000).toFixed(3)} km)</small>
                            </span>
                          </div>
                        )}
                        {measurement?.measurement_crs && (
                          <div className="spec-row">
                            <span className="spec-label">Projected UTM CRS</span>
                            <span className="spec-val">
                              <code>{measurement.measurement_crs}</code>
                            </span>
                          </div>
                        )}
                        {measurement?.error && (
                          <div className="spec-row error-spec">
                            <span className="spec-label">Error Reason</span>
                            <span className="spec-val">{measurement.error}</span>
                          </div>
                        )}
                      </div>

                      <span className="inspector-box-title" style={{ marginTop: "18px" }}>
                        FEATURE PROPERTIES
                      </span>
                      {Object.keys(selectedFeature.properties).length > 0 ? (
                        <div className="properties-key-value-table">
                          {Object.entries(selectedFeature.properties).map(([key, val]) => (
                            <div key={key} className="prop-row">
                              <span className="prop-key">{key}</span>
                              <span className="prop-val">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-props-note">No attributes or properties in source record.</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })()
          )}
        </>
      )}
    </div>
  );
}