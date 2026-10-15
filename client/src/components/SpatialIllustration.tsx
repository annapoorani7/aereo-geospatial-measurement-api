import { Activity, Crosshair, MoveUpRight } from "lucide-react";

export function SpatialIllustration() {
  return (
    <div className="spatial-stage" aria-label="Illustrative geospatial boundary and measurement workflow">
      <div className="spatial-stage-topline">
        <span><span className="stage-live-dot" /> COORDINATE STUDY / 01</span>
        <span>ILLUSTRATIVE GEOMETRY</span>
      </div>
      <svg className="spatial-artwork" viewBox="0 0 720 500" role="img" aria-labelledby="spatial-title spatial-description">
        <title id="spatial-title">Parcel geometry on a coordinate grid</title>
        <desc id="spatial-description">An illustrative polygon boundary, connected vertices, and a line feature. No measurement values are shown.</desc>
        <defs>
          <pattern id="geo-grid" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M 38 0 L 0 0 0 38" fill="none" stroke="#d5dfd8" strokeWidth="0.7" />
          </pattern>
          <pattern id="geo-grid-major" width="190" height="190" patternUnits="userSpaceOnUse">
            <path d="M 190 0 L 0 0 0 190" fill="none" stroke="#c1d0c8" strokeWidth="1" />
          </pattern>
          <clipPath id="geo-clip"><rect x="22" y="20" width="676" height="444" rx="2" /></clipPath>
        </defs>
        <g clipPath="url(#geo-clip)">
          <rect x="22" y="20" width="676" height="444" fill="url(#geo-grid)" />
          <rect x="22" y="20" width="676" height="444" fill="url(#geo-grid-major)" />
          <path className="contour contour-one" d="M-4 155 C104 73 147 112 246 71 S421 33 503 85 654 133 727 67" />
          <path className="contour contour-two" d="M-25 348 C70 281 151 309 234 249 S401 159 490 216 631 300 740 221" />
          <path className="contour contour-three" d="M-9 439 C115 378 163 398 268 339 S446 275 541 323 652 380 724 351" />
          <path className="secondary-boundary" d="M101 183 L232 119 348 156 405 264 330 347 194 328 128 270Z" />
          <path className="hero-boundary-fill" d="M223 145 L398 118 508 191 484 318 360 368 251 307 187 224Z" />
          <path className="hero-boundary" pathLength="1" d="M223 145 L398 118 508 191 484 318 360 368 251 307 187 224Z" />
          <path className="hero-axis" d="M183 224 L516 224" />
          <path className="hero-axis" d="M360 108 L360 380" />
          <path className="hero-line" pathLength="1" d="M248 293 L336 238 418 251 465 176" />
          <circle className="hero-line-node" cx="248" cy="293" r="5" />
          <circle className="hero-line-node" cx="336" cy="238" r="5" />
          <circle className="hero-line-node" cx="418" cy="251" r="5" />
          <circle className="hero-line-node" cx="465" cy="176" r="5" />
          {[[223,145],[398,118],[508,191],[484,318],[360,368],[251,307],[187,224]].map(([x,y], index) => (
            <g key={`${x}-${y}`} className="vertex-mark" style={{ animationDelay: `${0.65 + index * 0.11}s` }}>
              <circle cx={x} cy={y} r="10" />
              <circle cx={x} cy={y} r="2.5" />
            </g>
          ))}
          <path className="coordinate-tick" d="M187 224h-16m337-33h16M360 118v-15m0 265v15" />
          <text className="art-coordinate" x="42" y="445">Y / LOCAL GRID</text>
          <text className="art-coordinate" x="570" y="445">X / LOCAL GRID</text>
          <text className="art-axis-label" x="531" y="216">E</text>
          <text className="art-axis-label" x="369" y="101">N</text>
          <g className="art-callout" transform="translate(36 52)">
            <rect width="143" height="47" rx="4" />
            <circle cx="14" cy="16" r="3" />
            <text x="25" y="19">POLYGON</text>
            <text className="art-callout-sub" x="14" y="35">boundary extracted</text>
          </g>
          <g className="art-callout art-callout-line" transform="translate(518 343)">
            <rect width="150" height="47" rx="4" />
            <path d="M14 15h12" />
            <text x="34" y="19">LINESTRING</text>
            <text className="art-callout-sub" x="14" y="35">length in metres</text>
          </g>
        </g>
      </svg>
      <div className="spatial-stage-footer">
        <span><Crosshair size={13} /> SOURCE GEOMETRY</span>
        <span className="stage-footer-center"><Activity size={13} /> CRS-AWARE PROCESSING</span>
        <span>MEASUREMENTS <MoveUpRight size={12} /></span>
      </div>
    </div>
  );
}