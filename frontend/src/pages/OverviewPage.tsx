import {
  ArrowRight,
  Compass,
  FileArchive,
  FileCode2,
  FilePlus2,
  Layers3,
  MoveRight,
  Ruler,
  ScanLine,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SessionUpload } from "../types";
import { MeasurementSummary } from "../components/MeasurementSummary";
import { StatusBadge } from "../components/StatusBadge";

const chartColors = ["#285f4d", "#bd784b", "#3c7fc8", "#748174", "#667269"];
const integerFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

interface OverviewPageProps {
  uploads: SessionUpload[];
  activeUpload: SessionUpload | null;
  onUpload: () => void;
  onSelectUpload: (uploadId: string) => void;
}

export default function OverviewPage({
  uploads,
  activeUpload,
  onUpload,
  onSelectUpload,
}: OverviewPageProps) {
  const latest = uploads[0] ?? null;
  const geometryCounts = uploads
    .flatMap((item) => item.upload.features)
    .reduce<Record<string, number>>((counts, feature) => {
      counts[feature.geometry_type] = (counts[feature.geometry_type] ?? 0) + 1;
      return counts;
    }, {});

  const chartData = Object.entries(geometryCounts).map(([name, value]) => ({ name, value }));
  const featureTotal = uploads.reduce((total, item) => total + item.upload.feature_count, 0);

  return (
    <div className="editorial-page-stack">
      {/* Editorial Header */}
      <section className="editorial-hero-intro">
        <div className="editorial-kicker">
          <span className="kicker-rule" />
          <span>SPATIAL WORKSPACE · FIELD SUMMARY</span>
        </div>
        <div className="editorial-heading-row">
          <div className="editorial-title-block">
            <h1 className="editorial-title">
              Spatial intelligence.<br />
              <em>Grounded in real geometry.</em>
            </h1>
            <p className="editorial-lede">
              Inspect incoming geospatial files, verify coordinate reference systems, and review
              traceable, CRS-aware planar measurements from this browser session.
            </p>
          </div>
          <div className="editorial-cta-block">
            <button className="button button-hero" onClick={onUpload}>
              <FilePlus2 size={16} />
              <span>Upload a file</span>
              <ArrowRight size={15} />
            </button>
            <span className="cta-caption">Accepts .kml and .zip Shapefiles</span>
          </div>
        </div>
      </section>

      {/* Session Memory Notice */}
      <div className="session-editorial-note" role="note">
        <span className="note-indicator" />
        <p>
          <strong>Session storage:</strong> Uploads are held in current browser memory; the backend
          stores records in process memory only. A page refresh or backend restart resets records.
        </p>
      </div>

      {uploads.length > 0 ? (
        <>
          {/* Editorial Metrics Banner */}
          <section className="editorial-stats-strip" aria-label="Session summary metrics">
            <div className="stat-card">
              <span className="stat-label">SESSION UPLOADS</span>
              <div className="stat-figure">
                <strong>{integerFormat.format(uploads.length)}</strong>
                <span className="stat-unit">file{uploads.length === 1 ? "" : "s"}</span>
              </div>
              <span className="stat-sub">Active in this tab</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">EXTRACTED FEATURES</span>
              <div className="stat-figure">
                <strong>{integerFormat.format(featureTotal)}</strong>
                <span className="stat-unit">features</span>
              </div>
              <span className="stat-sub">Across all files</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">LATEST SOURCE CRS</span>
              <div className="stat-figure">
                <strong className="stat-text-value">
                  {latest?.upload.source_crs ?? "Unknown"}
                </strong>
              </div>
              <span className="stat-sub">CRS status: {latest?.upload.crs_status ?? "—"}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">LATEST FILE</span>
              <div className="stat-figure">
                <strong className="stat-text-value stat-filename" title={latest?.upload.filename}>
                  {latest?.upload.filename ?? "—"}
                </strong>
              </div>
              <span className="stat-sub">
                {latest ? `${integerFormat.format(latest.upload.feature_count)} features` : "No upload"}
              </span>
            </div>
          </section>

          {/* Main Content: Latest Analysis & Geometry Mix */}
          <div className="overview-two-col">
            {/* Latest Analysis Panel */}
            <article className="editorial-panel latest-analysis-panel">
              <div className="panel-editorial-heading">
                <div>
                  <span className="editorial-kicker-small">CURRENT ANALYSIS</span>
                  <h2 className="panel-title">
                    {activeUpload ? activeUpload.upload.filename : "Select an uploaded file"}
                  </h2>
                </div>
                {activeUpload && (
                  <StatusBadge tone={activeUpload.detailsError ? "warning" : "success"}>
                    {activeUpload.detailsError ? "Needs refresh" : "Processed"}
                  </StatusBadge>
                )}
              </div>

              {activeUpload ? (
                <div className="analysis-body">
                  <div className="file-meta-pills">
                    <span className="meta-pill">
                      {activeUpload.upload.filename.toLowerCase().endsWith(".zip") ? (
                        <FileArchive size={13} />
                      ) : (
                        <FileCode2 size={13} />
                      )}
                      <span>{activeUpload.upload.filename.split(".").pop()?.toUpperCase()}</span>
                    </span>
                    <span className="meta-pill">
                      <Compass size={13} />
                      <span>{activeUpload.upload.source_crs ?? "Unknown CRS"}</span>
                    </span>
                    <span className="meta-pill">
                      <ScanLine size={13} />
                      <span>{integerFormat.format(activeUpload.upload.feature_count)} features</span>
                    </span>
                  </div>

                  {activeUpload.detailsLoading && (
                    <div className="inline-loading-state">
                      <span className="spinner" />
                      <span>Requesting file details and measurements from API…</span>
                    </div>
                  )}

                  {activeUpload.detailsError && (
                    <div className="inline-warning-box">{activeUpload.detailsError}</div>
                  )}

                  <MeasurementSummary data={activeUpload.measurements} />

                  <div className="panel-bottom-action">
                    <button
                      className="button button-dark"
                      onClick={() => onSelectUpload(activeUpload.upload.upload_id)}
                    >
                      <span>Explore all features</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="panel-empty-placeholder">
                  <Ruler size={24} />
                  <p>Select a recent upload below to inspect measurements.</p>
                </div>
              )}
            </article>

            {/* Geometry Distribution Panel */}
            <article className="editorial-panel geometry-mix-panel">
              <div className="panel-editorial-heading">
                <div>
                  <span className="editorial-kicker-small">GEOMETRY BREAKDOWN</span>
                  <h2 className="panel-title">Feature mix</h2>
                </div>
                <span className="panel-stat-badge">{integerFormat.format(featureTotal)} total</span>
              </div>

              {chartData.length > 0 ? (
                <div className="geometry-distribution-wrap">
                  <div className="chart-canvas-wrap">
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="65%"
                          outerRadius="90%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {chartData.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#192921",
                            border: "none",
                            borderRadius: "4px",
                            color: "#faf9f3",
                            fontSize: "11px",
                          }}
                          formatter={(value) => [`${value} features`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-donut-caption">
                      <strong>{integerFormat.format(featureTotal)}</strong>
                      <span>features</span>
                    </div>
                  </div>

                  <ul className="geometry-legend-list">
                    {chartData.map((item, index) => {
                      const pct = featureTotal > 0 ? Math.round((item.value / featureTotal) * 100) : 0;
                      return (
                        <li key={item.name} className="legend-row">
                          <span
                            className="legend-color-dot"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span className="legend-geom-name">{item.name}</span>
                          <span className="legend-pct">{pct}%</span>
                          <strong className="legend-count">{integerFormat.format(item.value)}</strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="panel-empty-placeholder">
                  <Layers3 size={24} />
                  <p>Geometry summaries will appear here after your first upload.</p>
                </div>
              )}
            </article>
          </div>

          {/* Session Uploads Table */}
          <section className="editorial-panel recent-table-panel">
            <div className="panel-editorial-heading">
              <div>
                <span className="editorial-kicker-small">SESSION HISTORY</span>
                <h2 className="panel-title">Uploaded files</h2>
              </div>
              <span className="panel-stat-badge">{uploads.length} recorded</span>
            </div>

            <div className="editorial-table-container">
              <table className="editorial-table" aria-label="Session uploads">
                <thead>
                  <tr>
                    <th scope="col">File name</th>
                    <th scope="col">Features</th>
                    <th scope="col">Source CRS</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((item) => (
                    <tr key={item.upload.upload_id}>
                      <td>
                        <button
                          className="table-file-btn"
                          onClick={() => onSelectUpload(item.upload.upload_id)}
                        >
                          <span className="table-file-icon">
                            {item.upload.filename.toLowerCase().endsWith(".zip") ? (
                              <FileArchive size={15} />
                            ) : (
                              <FileCode2 size={15} />
                            )}
                          </span>
                          <span className="table-file-names">
                            <strong>{item.upload.filename}</strong>
                            <small>{item.upload.upload_id.slice(0, 8)}…</small>
                          </span>
                        </button>
                      </td>
                      <td>{integerFormat.format(item.upload.feature_count)}</td>
                      <td>
                        <span className="crs-tag">{item.upload.source_crs ?? "Unknown"}</span>
                      </td>
                      <td>
                        {new Date(item.uploadedAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <StatusBadge tone={item.detailsError ? "warning" : "success"}>
                          {item.detailsError ? "Sync issue" : "Ready"}
                        </StatusBadge>
                      </td>
                      <td className="table-action-cell">
                        <button
                          className="table-explore-link"
                          onClick={() => onSelectUpload(item.upload.upload_id)}
                          aria-label={`Inspect features in ${item.upload.filename}`}
                        >
                          <span>Explore</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        /* Polished Empty State for Fresh Session */
        <section className="editorial-empty-state" aria-label="Empty session">
          <div className="empty-state-graphic">
            <svg
              viewBox="0 0 240 120"
              className="empty-spatial-lines"
              role="presentation"
              aria-hidden="true"
            >
              <line x1="20" y1="30" x2="220" y2="30" stroke="#d7ded4" strokeDasharray="4 4" />
              <line x1="20" y1="60" x2="220" y2="60" stroke="#c8d5c8" />
              <line x1="20" y1="90" x2="220" y2="90" stroke="#d7ded4" strokeDasharray="4 4" />
              <polygon
                points="50,85 100,45 170,75 130,100"
                fill="rgba(40, 95, 77, 0.08)"
                stroke="#285f4d"
                strokeWidth="1.5"
              />
              <circle cx="50" cy="85" r="3.5" fill="#faf9f3" stroke="#285f4d" strokeWidth="1.5" />
              <circle cx="100" cy="45" r="3.5" fill="#faf9f3" stroke="#285f4d" strokeWidth="1.5" />
              <circle cx="170" cy="75" r="3.5" fill="#faf9f3" stroke="#285f4d" strokeWidth="1.5" />
              <circle cx="130" cy="100" r="3.5" fill="#faf9f3" stroke="#285f4d" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="empty-copy-block">
            <span className="editorial-kicker-small">READY FOR DATA</span>
            <h2>No files uploaded in this session yet</h2>
            <p>
              Upload a valid <code>.kml</code> document or a <code>.zip</code> archive containing a
              Shapefile. You will be able to inspect geometries, verify CRS definitions, and view
              planar polygon area and line lengths in metres.
            </p>
            <div className="empty-actions">
              <button className="button button-hero" onClick={onUpload}>
                <FilePlus2 size={16} />
                <span>Upload your first geospatial file</span>
                <MoveRight size={15} />
              </button>
            </div>
            <div className="empty-format-hints">
              <span>
                <FileCode2 size={13} /> KML (WGS 84 lon/lat)
              </span>
              <span className="hint-sep">·</span>
              <span>
                <FileArchive size={13} /> Zipped Shapefile (.shp, .shx, .dbf, .prj)
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}