import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  FileArchive,
  FileCode2,
  Layers3,
  MapPinned,
  MoveRight,
  Ruler,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import type { ApiConnection, PageKey } from "../types";
import { API_BASE_URL } from "../api";
import { SpatialIllustration } from "../components/SpatialIllustration";

interface LandingPageProps {
  connection: ApiConnection;
  onNavigate: (page: PageKey) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  function backToTop() {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function goTo(page: PageKey) {
    onNavigate(page);
  }

  return (
    <div className="landing-page">
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <span className="kicker-rule" /> GEOSPATIAL FILE MEASUREMENT
            </div>
            <h1>
              Measure space.<br />
              <em>Know what it means.</em>
            </h1>
            <p className="landing-lede">
              Turn KML and zipped Shapefiles into clear, CRS-aware geometry and measurements. Your
              source coordinates stay yours.
            </p>
            <div className="landing-hero-actions">
              <button className="button button-hero" onClick={() => goTo("upload")}>
                Upload a geospatial file <ArrowRight size={17} />
              </button>
              <a className="landing-text-link" href="#workflow">
                Explore the workflow <ArrowDown size={14} />
              </a>
            </div>
            <div className="landing-support-line">
              <span>
                <FileCode2 size={14} /> KML
              </span>
              <span className="support-divider" />
              <span>
                <FileArchive size={14} /> ZIPPED SHAPEFILE
              </span>
              <span className="support-divider" />
              <span>NO DATABASE REQUIRED</span>
            </div>
          </div>
          <div className="landing-hero-art">
            <SpatialIllustration />
            <div className="hero-art-index">
              <span>FIG. 01</span>
              <span>BOUNDARY / BASELINE / VERTICES</span>
            </div>
          </div>
          <div className="hero-bottom-note">
            <span>A FIELD GUIDE TO MEASURABLE GEOMETRY</span>
            <span>
              SCROLL TO EXPLORE <MoveRight size={13} />
            </span>
          </div>
        </section>

        <section className="landing-capability-strip" aria-label="Supported output">
          <div className="capability-strip-label">
            FROM FILE<br />TO UNDERSTANDING
          </div>
          <div className="strip-item">
            <Layers3 size={17} />
            <span>Feature extraction</span>
          </div>
          <div className="strip-item">
            <Compass size={17} />
            <span>CRS awareness</span>
          </div>
          <div className="strip-item">
            <Ruler size={17} />
            <span>Metres, not degrees</span>
          </div>
          <div className="strip-item">
            <ShieldCheck size={17} />
            <span>Originals preserved</span>
          </div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="section-intro workflow-intro">
            <div className="landing-kicker landing-kicker-light">
              <span className="kicker-rule" /> A CLEAR ROUTE THROUGH YOUR DATA
            </div>
            <h2>
              Three steps.<br />
              <em>Nothing hidden.</em>
            </h2>
            <p>
              Move from a source file to inspectable geometry and measurements, with each step
              grounded in the data you sent.
            </p>
          </div>
          <div className="workflow-steps">
            <article className="workflow-step">
              <span className="workflow-index">01 / INPUT</span>
              <div className="workflow-step-icon">
                <FileArchive size={20} />
              </div>
              <h3>Upload</h3>
              <p>
                Bring a KML document or a zipped Shapefile. The API validates the actual file and
                extracts supported features.
              </p>
              <button className="workflow-link" onClick={() => goTo("upload")}>
                Choose a file <ArrowRight size={14} />
              </button>
            </article>
            <article className="workflow-step">
              <span className="workflow-index">02 / INSPECT</span>
              <div className="workflow-step-icon">
                <ScanLine size={20} />
              </div>
              <h3>Inspect</h3>
              <p>
                Explore feature identifiers, geometry types, properties, original coordinates, and
                source CRS.
              </p>
              <button className="workflow-link" onClick={() => goTo("features")}>
                Open explorer <ArrowRight size={14} />
              </button>
            </article>
            <article className="workflow-step">
              <span className="workflow-index">03 / MEASURE</span>
              <div className="workflow-step-icon">
                <Ruler size={20} />
              </div>
              <h3>Measure</h3>
              <p>
                Planar polygon area in m² and line length in metres calculated in a local UTM
                projection. Points marked N/A.
              </p>
              <button className="workflow-link" onClick={() => goTo("overview")}>
                View overview <ArrowRight size={14} />
              </button>
            </article>
          </div>
          <div className="workflow-footnote">
            <span>LOCAL UTM PROJECTION</span>
            <span>ORIGINAL SOURCE UNALTERED</span>
          </div>
        </section>

        <section className="landing-capabilities" id="capabilities">
          <div className="capabilities-heading">
            <div className="landing-kicker">
              <span className="kicker-rule" /> CAPABILITIES
            </div>
            <h2>
              Accurate measurements.<br />
              <em>Clear about limitations.</em>
            </h2>
          </div>

          <div className="capability-grid">
            <article className="capability-feature">
              <span className="capability-number">01</span>
              <h3>Original features first.</h3>
              <p>
                Features keep their identifiers, properties, and original coordinate geometry.
                Nothing is flattened or discarded.
              </p>
              <div className="geometry-study" aria-hidden="true">
                <svg viewBox="0 0 320 180">
                  <path
                    className="study-grid"
                    d="M0 30H320M0 60H320M0 90H320M0 120H320M0 150H320M40 0V180M80 0V180M120 0V180M160 0V180M200 0V180M240 0V180M280 0V180"
                  />
                  <path
                    className="study-route"
                    d="M51 124 105 50 178 67 233 38 274 105 205 144 119 132Z"
                  />
                  <circle cx="51" cy="124" r="4" />
                  <circle cx="105" cy="50" r="4" />
                  <circle cx="178" cy="67" r="4" />
                  <circle cx="233" cy="38" r="4" />
                  <circle cx="274" cy="105" r="4" />
                  <circle cx="205" cy="144" r="4" />
                  <circle cx="119" cy="132" r="4" />
                </svg>
                <span>VERTEX SEQUENCE / SOURCE FEATURE</span>
              </div>
            </article>
            <article className="capability-feature capability-feature-units">
              <span className="capability-number">02</span>
              <div className="unit-stamp">
                <strong>m²</strong>
                <span>AREA</span>
                <i /> <strong>m</strong>
                <span>LENGTH</span>
              </div>
              <h3>Put measurements in context.</h3>
              <p>
                Area and length are calculated from a projected copy of the geometry, not directly
                from longitude and latitude degrees.
              </p>
              <span className="capability-foot">PLANAR OUTPUT / METRIC UNITS</span>
            </article>
            <article className="capability-feature capability-feature-crs">
              <span className="capability-number">03</span>
              <div className="crs-orbit" aria-hidden="true">
                <span className="orbit-ring orbit-ring-one" />
                <span className="orbit-ring orbit-ring-two" />
                <span className="orbit-center">
                  <MapPinned size={24} />
                </span>
                <span className="orbit-point orbit-point-a" />
                <span className="orbit-point orbit-point-b" />
              </div>
              <h3>CRS is part of the answer.</h3>
              <p>
                Source CRS is shown when known. When it is missing or unsuitable, the API returns an
                unavailable result instead of guessing.
              </p>
              <button
                className="capability-foot capability-foot-link"
                onClick={() => goTo("status")}
              >
                Inspect API behavior <ArrowUpRight size={13} />
              </button>
            </article>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="cta-radial" aria-hidden="true" />
          <div className="landing-kicker landing-kicker-light">
            <span className="kicker-rule" /> READY WHEN YOUR FILE IS
          </div>
          <h2>
            Give your geometry<br />
            <em>a little more room.</em>
          </h2>
          <p>
            Start with a KML or zipped Shapefile. Finish with features you can inspect and
            measurements you can explain.
          </p>
          <button
            className="button button-hero button-hero-light"
            onClick={() => goTo("upload")}
          >
            Open the upload workspace <ArrowRight size={16} />
          </button>
          <span className="cta-note">
            <Check size={13} /> No account · no database · no guessed CRS
          </span>
        </section>
      </main>

      <footer className="landing-footer">
        <button className="landing-brand footer-brand" onClick={backToTop} aria-label="Back to top">
          <span className="landing-brand-mark">
            <MapPinned size={17} />
          </span>
          <span>
            <strong>Aereo</strong>
            <small>GEOMEASURE</small>
          </span>
        </button>
        <div className="footer-links">
          <button onClick={() => goTo("overview")}>Workspace</button>
          <button onClick={() => goTo("upload")}>Upload</button>
          <button onClick={() => goTo("features")}>Feature explorer</button>
          <button onClick={() => goTo("status")}>API status</button>
          <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">
            API docs
          </a>
        </div>
        <div className="footer-meta">
          <span>FASTAPI / REACT / CRS-AWARE</span>
          <span>SESSION RECORDS ARE IN MEMORY</span>
        </div>
      </footer>
    </div>
  );
}