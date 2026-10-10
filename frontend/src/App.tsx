import { lazy, Suspense, useEffect, useState } from "react";
import { ApiError, checkHealth, getFileMetadata, getMeasurements, uploadFile } from "./api";
import { TopNav } from "./components/TopNav";
import type { ApiConnection, PageKey, SessionUpload, UploadResponse } from "./types";

const ApiStatusPage = lazy(() => import("./pages/ApiStatusPage"));
const FeatureExplorerPage = lazy(() => import("./pages/FeatureExplorerPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));

function detailsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "The backend no longer recognizes this upload ID. It may have restarted and cleared its in-memory records.";
  }
  return error instanceof Error ? error.message : "Could not refresh file details from the API.";
}

function pageFromHash(): PageKey {
  if (typeof window === "undefined") return "landing";
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (hash === "overview") return "overview";
  if (hash === "upload") return "upload";
  if (hash === "features" || hash === "explorer") return "features";
  if (hash === "status") return "status";
  return "landing";
}

export default function App() {
  const [page, setPage] = useState<PageKey>(() => pageFromHash());
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [apiConnection, setApiConnection] = useState<ApiConnection>("checking");
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthCheckedAt, setHealthCheckedAt] = useState<number | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  const activeUpload = uploads.find((item) => item.upload.upload_id === activeUploadId) ?? null;

  async function refreshApiHealth() {
    setHealthChecking(true);
    setApiConnection("checking");
    setHealthError(null);
    try {
      await checkHealth();
      setApiConnection("online");
      setHealthCheckedAt(Date.now());
    } catch (error) {
      setApiConnection("offline");
      setHealthError(error instanceof Error ? error.message : "The API health check failed.");
      setHealthCheckedAt(Date.now());
    } finally {
      setHealthChecking(false);
    }
  }

  // Periodic health check
  useEffect(() => {
    void refreshApiHealth();
    const interval = window.setInterval(() => void refreshApiHealth(), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Browser hash change listener for Back/Forward and direct URL navigation
  useEffect(() => {
    function onHashChange() {
      const targetPage = pageFromHash();
      setPage(targetPage);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  async function refreshUpload(uploadId: string) {
    setUploads((current) =>
      current.map((item) =>
        item.upload.upload_id === uploadId
          ? { ...item, detailsLoading: true, detailsError: null }
          : item
      )
    );

    const [metadataResult, measurementsResult] = await Promise.allSettled([
      getFileMetadata(uploadId),
      getMeasurements(uploadId),
    ]);
    const errors: string[] = [];
    if (metadataResult.status === "rejected") errors.push(detailsErrorMessage(metadataResult.reason));
    if (measurementsResult.status === "rejected") errors.push(detailsErrorMessage(measurementsResult.reason));

    setUploads((current) =>
      current.map((item) =>
        item.upload.upload_id === uploadId
          ? {
              ...item,
              metadata: metadataResult.status === "fulfilled" ? metadataResult.value : item.metadata,
              measurements: measurementsResult.status === "fulfilled" ? measurementsResult.value : item.measurements,
              detailsLoading: false,
              detailsError: errors.length ? [...new Set(errors)].join(" ") : null,
            }
          : item
      )
    );
  }

  async function handleUpload(file: File): Promise<UploadResponse> {
    const response = await uploadFile(file);
    const sessionUpload: SessionUpload = {
      upload: response,
      metadata: null,
      measurements: null,
      detailsLoading: true,
      detailsError: null,
      uploadedAt: Date.now(),
    };
    setUploads((current) => [sessionUpload, ...current]);
    setActiveUploadId(response.upload_id);
    void refreshUpload(response.upload_id);
    return response;
  }

  function selectUpload(uploadId: string, destination: PageKey = "features") {
    if (!uploadId) return;
    setActiveUploadId(uploadId);
    navigate(destination);
    void refreshUpload(uploadId);
  }

  function startAnotherUpload() {
    setActiveUploadId(null);
  }

  function navigate(destination: PageKey) {
    setPage(destination);
    const targetHash = destination === "landing" ? "" : `#${destination}`;
    if (window.location.hash !== targetHash) {
      if (destination === "landing") {
        window.history.pushState(null, "", window.location.pathname);
      } else {
        window.location.hash = targetHash;
      }
    }
    if (destination === "status") void refreshApiHealth();
    // Scroll to top on page switch
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="aereo-application-frame">
      {/* Unified top navigation with zero sidebar across every page */}
      <TopNav
        page={page}
        connection={apiConnection}
        onNavigate={navigate}
        uploadCount={uploads.length}
      />

      <main className="aereo-main-viewport">
        <Suspense
          fallback={
            <div className="unified-view-loader" aria-live="polite">
              <span className="spinner" />
              <span>Loading workspace view…</span>
            </div>
          }
        >
          {page === "landing" && (
            <LandingPage connection={apiConnection} onNavigate={navigate} />
          )}

          {page === "overview" && (
            <div className="workspace-page-wrapper">
              <OverviewPage
                uploads={uploads}
                activeUpload={activeUpload}
                onUpload={() => navigate("upload")}
                onSelectUpload={(uploadId) => selectUpload(uploadId, "features")}
              />
            </div>
          )}

          {page === "upload" && (
            <div className="workspace-page-wrapper">
              <UploadPage
                activeUpload={activeUpload}
                onUpload={handleUpload}
                onRefresh={(uploadId) => void refreshUpload(uploadId)}
                onStartAnother={startAnotherUpload}
                onExplore={() => navigate("features")}
              />
            </div>
          )}

          {page === "features" && (
            <div className="workspace-page-wrapper">
              <FeatureExplorerPage
                uploads={uploads}
                activeUpload={activeUpload}
                onSelectUpload={(uploadId) => selectUpload(uploadId, "features")}
                onRefresh={(uploadId) => void refreshUpload(uploadId)}
              />
            </div>
          )}

          {page === "status" && (
            <div className="workspace-page-wrapper">
              <ApiStatusPage
                connection={apiConnection}
                error={healthError}
                checkedAt={healthCheckedAt}
                checking={healthChecking}
                activeUpload={activeUpload}
                onCheck={() => void refreshApiHealth()}
                onRefreshUpload={(uploadId) => void refreshUpload(uploadId)}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* Global quiet workspace footer on workspace pages */}
      {page !== "landing" && (
        <footer className="aereo-workspace-footer">
          <div className="workspace-footer-inner">
            <span className="footer-lead">Aereo GeoMeasure</span>
            <span className="footer-sub">
              Planar metric measurements · Session data is held in browser memory only
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}