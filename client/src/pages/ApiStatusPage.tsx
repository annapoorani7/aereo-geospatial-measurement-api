import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Radio,
  RotateCcw,
  Server,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import { API_BASE_URL, API_DISPLAY_URL } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { ApiConnection, SessionUpload } from "../types";

interface ApiStatusPageProps {
  connection: ApiConnection;
  error: string | null;
  checkedAt: number | null;
  checking: boolean;
  activeUpload: SessionUpload | null;
  onCheck: () => void;
  onRefreshUpload: (uploadId: string) => void;
}

const endpoints = [
  {
    method: "GET",
    path: "/health",
    desc: "Health probe verifying backend availability",
    statusTone: "success" as const,
    auth: "Public",
  },
  {
    method: "GET",
    path: "/",
    desc: "Service root returning welcome message and doc links",
    statusTone: "neutral" as const,
    auth: "Public",
  },
  {
    method: "POST",
    path: "/api/files/",
    desc: "Multipart form upload for .kml or .zip Shapefiles (max 20 MiB)",
    statusTone: "neutral" as const,
    auth: "Public",
  },
  {
    method: "GET",
    path: "/api/files/{file_id}/",
    desc: "Retrieves metadata and parsed features for an upload ID",
    statusTone: "neutral" as const,
    auth: "Public",
  },
  {
    method: "GET",
    path: "/api/files/{file_id}/measurements/",
    desc: "Calculates CRS-aware planar polygon area and line lengths",
    statusTone: "neutral" as const,
    auth: "Public",
  },
];

export default function ApiStatusPage({
  connection,
  error,
  checkedAt,
  checking,
  activeUpload,
  onCheck,
  onRefreshUpload,
}: ApiStatusPageProps) {
  const isOnline = connection === "online";
  const isOffline = connection === "offline";
  const isChecking = connection === "checking" || checking;
  const isDegraded = isOnline && Boolean(activeUpload?.detailsError);

  return (
    <div className="editorial-page-stack">
      {/* Editorial Header */}
      <section className="editorial-hero-intro">
        <div className="editorial-kicker">
          <span className="kicker-rule" />
          <span>SYSTEM DIAGNOSTICS · TELEMETRY</span>
        </div>
        <div className="editorial-heading-row">
          <div className="editorial-title-block">
            <h1 className="editorial-title">
              API Status & diagnostics.<br />
              <em>Real-time health telemetry.</em>
            </h1>
            <p className="editorial-lede">
              Verify backend connectivity, review supported REST endpoints, and inspect local
              development service parameters.
            </p>
          </div>
          <div className="editorial-cta-block">
            <button
              className="button button-hero"
              onClick={onCheck}
              disabled={isChecking}
              aria-label="Probe backend health"
            >
              <RotateCcw size={15} className={isChecking ? "spin-icon" : ""} />
              <span>{isChecking ? "Testing connection…" : "Test API connection"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Health Status Panel */}
      <article
        className={`editorial-panel health-main-panel ${
          isOnline
            ? isDegraded
              ? "status-degraded-border"
              : "status-online-border"
            : "status-offline-border"
        }`}
        aria-live="polite"
      >
        <div className="health-status-header">
          <div className="health-symbol-badge">
            {isOnline ? (
              isDegraded ? (
                <AlertTriangle size={24} className="symbol-warning" />
              ) : (
                <CheckCircle2 size={24} className="symbol-success" />
              )
            ) : isOffline ? (
              <XCircle size={24} className="symbol-error" />
            ) : (
              <Radio size={24} className="symbol-checking spin-icon" />
            )}
          </div>
          <div className="health-headline-group">
            <span className="editorial-kicker-small">BACKEND CONNECTIVITY</span>
            <h2 className="panel-title">
              {isOnline
                ? isDegraded
                  ? "API reachable; active session record requires refresh"
                  : "FastAPI backend online & responding"
                : isOffline
                ? "Backend unreachable or offline"
                : "Checking backend connectivity…"}
            </h2>
            <p className="health-detail-text">
              {isOnline
                ? isDegraded
                  ? activeUpload?.detailsError
                  : "GET /health endpoint responded with 200 OK. CORS and geospatial libraries are operational."
                : error ||
                  "Could not connect to the API server at " +
                    API_DISPLAY_URL +
                    ". Verify that uvicorn is running."}
            </p>
          </div>
          <div className="health-badge-wrap">
            <StatusBadge
              tone={
                isOnline
                  ? isDegraded
                    ? "warning"
                    : "success"
                  : isOffline
                  ? "error"
                  : "neutral"
              }
            >
              {isOnline ? (isDegraded ? "Degraded" : "Connected") : isOffline ? "Offline" : "Probing"}
            </StatusBadge>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="health-telemetry-grid">
          <div className="telemetry-item">
            <div className="telemetry-icon">
              <Server size={16} />
            </div>
            <div className="telemetry-copy">
              <span className="telemetry-label">CONFIGURED API URL</span>
              <strong className="telemetry-value code-font">{API_DISPLAY_URL}</strong>
              <small className="telemetry-sub">VITE_API_BASE_URL</small>
            </div>
          </div>

          <div className="telemetry-item">
            <div className="telemetry-icon">
              <Clock size={16} />
            </div>
            <div className="telemetry-copy">
              <span className="telemetry-label">LAST HEALTH CHECK</span>
              <strong className="telemetry-value">
                {checkedAt ? new Date(checkedAt).toLocaleTimeString() : "Pending"}
              </strong>
              <small className="telemetry-sub">Polls automatically every 30s</small>
            </div>
          </div>

          <div className="telemetry-item">
            <div className="telemetry-icon">
              <Globe size={16} />
            </div>
            <div className="telemetry-copy">
              <span className="telemetry-label">CLIENT ORIGIN</span>
              <strong className="telemetry-value code-font">
                {typeof window !== "undefined" ? window.location.origin : "localhost:5173"}
              </strong>
              <small className="telemetry-sub">Allowed via FastAPI CORS</small>
            </div>
          </div>
        </div>
      </article>

      {/* Documented Endpoints */}
      <article className="editorial-panel endpoints-panel">
        <div className="panel-editorial-heading">
          <div>
            <span className="editorial-kicker-small">REST ARCHITECTURE</span>
            <h2 className="panel-title">Documented API Endpoints</h2>
          </div>
          <a
            className="external-docs-button"
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
          >
            <span>Interactive Swagger UI</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="editorial-table-container">
          <table className="editorial-table endpoints-table" aria-label="API endpoints">
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Path</th>
                <th scope="col">Description</th>
                <th scope="col">Access</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td>
                    <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td>
                    <code className="endpoint-code">{ep.path}</code>
                  </td>
                  <td>{ep.desc}</td>
                  <td>
                    <span className="auth-tag">{ep.auth}</span>
                  </td>
                  <td>
                    <StatusBadge
                      tone={
                        ep.path === "/health"
                          ? isOnline
                            ? "success"
                            : "error"
                          : "neutral"
                      }
                    >
                      {ep.path === "/health"
                        ? isOnline
                          ? "Available"
                          : "Unreachable"
                        : "Documented"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Local Development & Architecture Guidance */}
      <div className="diagnostics-guidance-grid">
        <article className="editorial-panel guide-card-panel">
          <div className="guide-panel-header">
            <Terminal size={17} />
            <h3>Local Backend Startup</h3>
          </div>
          <p className="guide-panel-text">
            To run the FastAPI backend locally, execute the following from the project root:
          </p>
          <pre className="code-block">
            <code>
              .\.venv\Scripts\Activate.ps1{"\n"}
              python -m uvicorn app.main:app --reload
            </code>
          </pre>
          <p className="guide-panel-note">
            The backend serves at <code>http://127.0.0.1:8000</code> by default.
          </p>
        </article>

        <article className="editorial-panel guide-card-panel">
          <div className="guide-panel-header">
            <ShieldCheck size={17} />
            <h3>In-Memory Storage Architecture</h3>
          </div>
          <p className="guide-panel-text">
            <strong>Honest storage disclosure:</strong> The backend stores uploaded files and parsed
            features in Python process memory (<code>app.storage.UPLOAD_STORE</code>).
          </p>
          <ul className="guide-list">
            <li>There is no persistent database configured.</li>
            <li>Restarting the FastAPI server clears all uploaded records.</li>
            <li>
              If the frontend requests a record after a backend restart, a clear <code>404</code>{" "}
              error is displayed.
            </li>
          </ul>
        </article>
      </div>

      {/* Active Session Upload Card if one exists */}
      {activeUpload && (
        <article className="editorial-panel active-record-panel">
          <div className="panel-editorial-heading">
            <div>
              <span className="editorial-kicker-small">ACTIVE SESSION RECORD</span>
              <h2 className="panel-title">{activeUpload.upload.filename}</h2>
              <span className="active-record-id">ID: {activeUpload.upload.upload_id}</span>
            </div>
            <button
              className="button button-quiet"
              onClick={() => onRefreshUpload(activeUpload.upload.upload_id)}
              disabled={activeUpload.detailsLoading}
            >
              <RotateCcw size={14} className={activeUpload.detailsLoading ? "spin-icon" : ""} />
              <span>Verify record on backend</span>
            </button>
          </div>
          <p className="active-record-explainer">
            This file was uploaded during this browser session. If you restart the backend, clicking
            the button above will detect that the record was cleared and report it transparently.
          </p>
        </article>
      )}
    </div>
  );
}