import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileArchive,
  FileCode2,
  FileUp,
  Layers3,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { MeasurementSummary } from "../components/MeasurementSummary";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError } from "../api";
import type { SessionUpload, UploadResponse } from "../types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

interface UploadPageProps {
  activeUpload: SessionUpload | null;
  onUpload: (file: File) => Promise<UploadResponse>;
  onRefresh: (uploadId: string) => void;
  onStartAnother: () => void;
  onExplore: () => void;
}

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

export default function UploadPage({
  activeUpload,
  onUpload,
  onRefresh,
  onStartAnother,
  onExplore,
}: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["kml", "zip"].includes(extension)) {
      setSelectedFile(null);
      setError("Please choose a valid .kml file or a .zip archive containing a Shapefile.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setSelectedFile(null);
      setError("The selected file exceeds the 20 MiB upload limit.");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  function handleZoneKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  async function submitUpload() {
    if (!selectedFile || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "The upload failed unexpectedly. Please ensure the backend is running and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  // Active Upload Result view
  if (activeUpload && !selectedFile) {
    const response = activeUpload.upload;
    return (
      <div className="editorial-page-stack">
        <section className="editorial-hero-intro">
          <div className="editorial-kicker">
            <span className="kicker-rule" />
            <span>ANALYSIS COMPLETE · PROCESSED RECORD</span>
          </div>
          <div className="editorial-heading-row">
            <div className="editorial-title-block">
              <h1 className="editorial-title">
                File verified.<br />
                <em>Geometry and measurements ready.</em>
              </h1>
              <p className="editorial-lede">
                Extracted features, CRS definitions, and UTM-projected planar measurements are
                ready for review.
              </p>
            </div>
            <div className="editorial-cta-block">
              <button className="button button-hero" onClick={onExplore}>
                <Layers3 size={16} />
                <span>Explore features</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* Upload Success Card */}
        <article className="editorial-panel upload-result-panel">
          <div className="panel-editorial-heading">
            <div className="result-headline-group">
              <div className="success-icon-badge">
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div>
                <span className="editorial-kicker-small">UPLOAD RECEIPT</span>
                <h2 className="panel-title">{response.filename}</h2>
                <span className="upload-id-code">ID: {response.upload_id}</span>
              </div>
            </div>
            <StatusBadge tone="success">
              {activeUpload.metadata?.processing_status ?? response.processing_status}
            </StatusBadge>
          </div>

          {/* Metadata Grid */}
          <div className="result-meta-strip">
            <div className="meta-box">
              <span className="meta-box-label">SOURCE CRS</span>
              <strong className="meta-box-val">{response.source_crs ?? "Unknown"}</strong>
              <small className="meta-box-sub">Status: {response.crs_status}</small>
            </div>
            <div className="meta-box">
              <span className="meta-box-label">FEATURE COUNT</span>
              <strong className="meta-box-val">{response.feature_count.toLocaleString()}</strong>
              <small className="meta-box-sub">Extracted geometry records</small>
            </div>
            <div className="meta-box">
              <span className="meta-box-label">FILE FORMAT</span>
              <strong className="meta-box-val">
                {response.filename.split(".").pop()?.toUpperCase()}
              </strong>
              <small className="meta-box-sub">
                {response.filename.toLowerCase().endsWith(".zip") ? "Shapefile archive" : "KML document"}
              </small>
            </div>
            <div className="meta-box">
              <span className="meta-box-label">PROCESSING</span>
              <strong className="meta-box-val">Complete</strong>
              <small className="meta-box-sub">In-process memory</small>
            </div>
          </div>

          {activeUpload.detailsLoading && (
            <div className="inline-loading-state">
              <span className="spinner" />
              <span>Requesting measurements from backend…</span>
            </div>
          )}

          {activeUpload.detailsError && (
            <div className="inline-warning-box">
              <AlertCircle size={16} />
              <span>{activeUpload.detailsError}</span>
            </div>
          )}

          {/* Measurements summary */}
          {activeUpload.measurements && <MeasurementSummary data={activeUpload.measurements} />}

          <div className="result-actions-strip">
            <button className="button button-dark" onClick={onExplore}>
              <Layers3 size={15} />
              <span>Open in Feature Explorer</span>
              <ArrowRight size={14} />
            </button>
            <button
              className="button button-quiet"
              onClick={() => onRefresh(response.upload_id)}
              disabled={activeUpload.detailsLoading}
            >
              <RotateCcw size={14} />
              <span>Re-fetch API details</span>
            </button>
            <button className="button button-quiet" onClick={onStartAnother}>
              <FileUp size={14} />
              <span>Upload another file</span>
            </button>
          </div>
        </article>
      </div>
    );
  }

  // Upload Input view
  return (
    <div className="editorial-page-stack">
      <section className="editorial-hero-intro">
        <div className="editorial-kicker">
          <span className="kicker-rule" />
          <span>DATA INTAKE · SPATIAL INPUT</span>
        </div>
        <div className="editorial-heading-row">
          <div className="editorial-title-block">
            <h1 className="editorial-title">
              Upload & analyze.<br />
              <em>Direct from source.</em>
            </h1>
            <p className="editorial-lede">
              Bring a KML document or a zipped Shapefile. The backend parses geometries safely,
              preserves original coordinates, and computes planar area and length in metres.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Box */}
      <article className="editorial-panel upload-intake-panel">
        <div className="panel-editorial-heading">
          <div>
            <span className="editorial-kicker-small">STEP 01</span>
            <h2 className="panel-title">Choose geospatial file</h2>
          </div>
          <span className="panel-stat-badge">Max 20 MiB</span>
        </div>

        {/* Drop Zone */}
        <div
          className={`editorial-drop-zone${dragging ? " is-dragging" : ""}${selectedFile ? " has-file" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Upload file dropzone. Drop a .kml or .zip file here, or click to choose."
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleZoneKey}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".kml,.zip,application/vnd.google-earth.kml+xml,application/zip"
            onChange={(e) => chooseFile(e.target.files?.[0])}
            aria-label="Select a .kml or .zip Shapefile"
          />

          {selectedFile ? (
            <div className="chosen-file-display">
              <div className="chosen-file-icon">
                {selectedFile.name.toLowerCase().endsWith(".zip") ? (
                  <FileArchive size={26} strokeWidth={1.8} />
                ) : (
                  <FileCode2 size={26} strokeWidth={1.8} />
                )}
              </div>
              <div className="chosen-file-info">
                <strong>{selectedFile.name}</strong>
                <span>{fileSize(selectedFile.size)} · Ready for upload</span>
              </div>
              <button
                type="button"
                className="chosen-file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remove chosen file"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="drop-zone-idle-content">
              <div className="drop-zone-icon-circle">
                <FileUp size={24} strokeWidth={1.7} />
              </div>
              <h3 className="drop-prompt">
                Drop your file here, or <span className="browse-underline">browse files</span>
              </h3>
              <p className="drop-subtext">
                Accepts standalone <code>.kml</code> or zipped <code>.zip</code> containing one Shapefile
              </p>
              <div className="format-tags-row">
                <span className="format-tag">
                  <FileCode2 size={13} /> KML (WGS 84)
                </span>
                <span className="format-tag">
                  <FileArchive size={13} /> Shapefile ZIP (.shp, .shx, .dbf, .prj)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="upload-error-banner" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Footer */}
        <div className="upload-controls-bar">
          <div className="upload-specs-note">
            <ShieldCheck size={15} />
            <span>Source coordinates remain untouched; measurements use local planar UTM.</span>
          </div>
          <div className="upload-buttons-group">
            {selectedFile && (
              <button
                type="button"
                className="button button-quiet"
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={busy}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="button button-hero"
              onClick={submitUpload}
              disabled={!selectedFile || busy}
            >
              {busy ? (
                <>
                  <span className="spinner spinner-light" />
                  <span>Uploading & analyzing…</span>
                </>
              ) : (
                <>
                  <FileUp size={16} />
                  <span>Upload & analyze</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Educational Note */}
      <div className="intake-method-guide">
        <div className="guide-card">
          <span className="guide-num">01</span>
          <h4>KML Documents</h4>
          <p>
            Parsed with FastKML. Coordinates are assumed to be WGS 84 (EPSG:4326) longitude/latitude
            per KML specification.
          </p>
        </div>
        <div className="guide-card">
          <span className="guide-num">02</span>
          <h4>Zipped Shapefiles</h4>
          <p>
            Archive must contain exactly one Shapefile set. The <code>.prj</code> file provides the
            source CRS. If missing, measurements are marked unavailable.
          </p>
        </div>
        <div className="guide-card">
          <span className="guide-num">03</span>
          <h4>Planar Measurements</h4>
          <p>
            Geometries are projected into centered local UTM zones using PyProj. Polygon areas are
            reported in m² and line lengths in metres.
          </p>
        </div>
      </div>
    </div>
  );
}