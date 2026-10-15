import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Compass,
  ExternalLink,
  FileUp,
  Layers3,
  MapPinned,
  Menu,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../api";
import type { ApiConnection, PageKey } from "../types";

interface TopNavProps {
  page: PageKey;
  connection: ApiConnection;
  onNavigate: (page: PageKey) => void;
  uploadCount?: number;
}

const navItems: { id: PageKey; label: string; icon: typeof Compass }[] = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "upload", label: "Upload & Analyze", icon: FileUp },
  { id: "features", label: "Feature Explorer", icon: Layers3 },
  { id: "status", label: "API Status", icon: Activity },
];

export function TopNav({ page, connection, onNavigate, uploadCount = 0 }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNavigate(dest: PageKey) {
    setMobileMenuOpen(false);
    onNavigate(dest);
  }

  const connectionLabel =
    connection === "online"
      ? "API ready"
      : connection === "offline"
      ? "API offline"
      : "Checking API";

  return (
    <header className="unified-nav-wrap">
      <nav className="unified-nav" aria-label="Main navigation">
        <button
          className="brand-button"
          onClick={() => handleNavigate("landing")}
          aria-label="Aereo GeoMeasure home"
        >
          <span className="brand-mark">
            <MapPinned size={18} strokeWidth={2.2} />
          </span>
          <span className="brand-text">
            <strong>Aereo</strong>
            <small>GEOMEASURE</small>
          </span>
        </button>

        {/* Desktop navigation links */}
        <div className="nav-desktop-links">
          {page === "landing" && (
            <>
              <a href="#workflow" className="nav-link">
                How it works
              </a>
              <a href="#capabilities" className="nav-link">
                Capabilities
              </a>
            </>
          )}

          {navItems.map(({ id, label }) => {
            const isActive = page === id;
            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`nav-link${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
                {id === "overview" && uploadCount > 0 && (
                  <span className="nav-count-badge">{uploadCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side status and actions */}
        <div className="nav-actions">
          <div
            className={`connection-indicator connection-${connection}`}
            aria-live="polite"
            title={`Backend health: ${connection}`}
          >
            <span className="connection-dot" />
            <span className="connection-text">{connectionLabel}</span>
          </div>

          {page !== "upload" ? (
            <button
              className="button button-nav-cta"
              onClick={() => handleNavigate("upload")}
            >
              <span>Upload file</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <a
              className="nav-docs-link"
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noreferrer"
              title="Open FastAPI interactive documentation"
            >
              <span>API docs</span>
              <ExternalLink size={13} />
            </a>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" role="dialog" aria-label="Mobile navigation">
          <div className="mobile-drawer-links">
            <button
              className={`mobile-nav-item${page === "landing" ? " is-active" : ""}`}
              onClick={() => handleNavigate("landing")}
            >
              <Compass size={17} />
              <span>Landing Page</span>
            </button>

            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`mobile-nav-item${page === id ? " is-active" : ""}`}
                onClick={() => handleNavigate(id)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "overview" && uploadCount > 0 && (
                  <span className="nav-count-badge">{uploadCount}</span>
                )}
              </button>
            ))}

            <div className="mobile-drawer-footer">
              <div className={`connection-indicator connection-${connection}`}>
                <span className="connection-dot" />
                <span>{connectionLabel}</span>
              </div>
              <a
                className="mobile-docs-link"
                href={`${API_BASE_URL}/docs`}
                target="_blank"
                rel="noreferrer"
              >
                API Docs <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
