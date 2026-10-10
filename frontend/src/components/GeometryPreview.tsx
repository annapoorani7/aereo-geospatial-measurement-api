import { useMemo } from "react";
import type { FeatureRecord } from "../types";

type Coordinate = [number, number];

function collectCoordinates(value: unknown, coordinates: Coordinate[]): void {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    coordinates.push([value[0], value[1]]);
    return;
  }
  value.forEach((child) => collectCoordinates(child, coordinates));
}

interface GeometryPreviewProps {
  feature: FeatureRecord;
}

export function GeometryPreview({ feature }: GeometryPreviewProps) {
  const preview = useMemo(() => {
    const coordinates: Coordinate[] = [];
    collectCoordinates(feature.geometry.coordinates, coordinates);
    if (!coordinates.length) return null;

    const xs = coordinates.map(([x]) => x);
    const ys = coordinates.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const pad = 44;
    const plotWidth = 520;
    const plotHeight = 245;
    const scale = Math.min((plotWidth - pad * 2) / width, (plotHeight - pad * 2) / height);
    const drawnWidth = width * scale;
    const drawnHeight = height * scale;
    const offsetX = (plotWidth - drawnWidth) / 2;
    const offsetY = (plotHeight - drawnHeight) / 2;
    const points = coordinates.map(([x, y]) => [
      offsetX + (x - minX) * scale,
      plotHeight - offsetY - (y - minY) * scale,
    ] as Coordinate);
    return { points, plotWidth, plotHeight };
  }, [feature.geometry.coordinates]);

  if (!preview) {
    return <div className="geometry-preview-empty">No drawable coordinates returned for this feature.</div>;
  }

  const points = preview.points.map(([x, y]) => `${x},${y}`).join(" ");
  const first = preview.points[0];
  const shapeType = feature.geometry.type;

  return (
    <div className="geometry-preview-frame">
      <svg viewBox={`0 0 ${preview.plotWidth} ${preview.plotHeight}`} role="img" aria-label={`${feature.geometry_type} preview for ${feature.feature_id}`}>
        <defs>
          <pattern id="feature-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="#dbe5df" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width={preview.plotWidth} height={preview.plotHeight} fill="url(#feature-grid)" />
        {shapeType === "Polygon" ? <polygon className="feature-shape-polygon" points={points} /> : null}
        {shapeType === "LineString" ? <polyline className="feature-shape-line" points={points} /> : null}
        {shapeType === "Point" && first ? <circle className="feature-shape-point" cx={first[0]} cy={first[1]} r="7" /> : null}
        {shapeType === "LineString" && preview.points.map(([x, y], index) => <circle className="feature-shape-vertex" key={`${x}-${y}-${index}`} cx={x} cy={y} r="3.2" />)}
        {shapeType === "Polygon" && preview.points.map(([x, y], index) => <circle className="feature-shape-vertex" key={`${x}-${y}-${index}`} cx={x} cy={y} r="3.2" />)}
      </svg>
      <div className="geometry-preview-caption"><span>ORIGINAL COORDINATES</span><span>{feature.source_crs ?? "CRS UNKNOWN"}</span></div>
    </div>
  );
}