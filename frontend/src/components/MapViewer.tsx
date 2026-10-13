import { FC, useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureRecord, MeasurementsResponse } from "../types";
import "leaflet/dist/leaflet.css";

interface MapViewerProps {
  features: FeatureRecord[];
  measurements?: MeasurementsResponse | null;
  selectedFeatureId?: string | null;
  onFeatureSelect?: (featureId: string) => void;
  height?: string;
}

/**
 * MapController - Helper component to handle map operations
 */
const MapController: FC<{
  features: FeatureRecord[];
  geojsonData: any;
}> = ({ features, geojsonData }) => {
  const map = useMap();
  const interactionsEnabledRef = useRef(false);

  // Enable all map interactions on mount - only once
  useEffect(() => {
    if (!map || interactionsEnabledRef.current) return;
    
    // Ensure all interaction handlers are enabled
    try {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      
      interactionsEnabledRef.current = true;
    } catch (error) {
      console.error("Error enabling map interactions:", error);
    }
  }, [map]);

  useEffect(() => {
    if (features.length === 0 || !map) return;

    try {
      const bounds = L.geoJSON(geojsonData).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [features.length, map]);

  return null;
};

/**
 * MapViewer - Interactive map component for geospatial features
 *
 * Displays features on an interactive Leaflet map with:
 * - Feature visualization (points, lines, polygons)
 * - Feature selection and highlighting
 * - Measurement display
 * - Automatic bounds fitting
 * - Popup information
 */
export const MapViewer: FC<MapViewerProps> = ({
  features,
  measurements,
  selectedFeatureId,
  onFeatureSelect,
  height = "500px",
}) => {
  const [center, setCenterCoords] = useState<[number, number]>([20, 0]);

  // Build GeoJSON FeatureCollection
  const geojsonData = {
    type: "FeatureCollection" as const,
    features: features.map((feature) => ({
      type: "Feature" as const,
      id: feature.feature_id,
      geometry: feature.geometry,
      properties: {
        feature_id: feature.feature_id,
        geometry_type: feature.geometry_type,
        ...feature.properties,
      },
    })),
  };

  // Calculate center from features - only when feature count changes
  useEffect(() => {
    if (features.length === 0) return;

    try {
      const bounds = L.geoJSON(geojsonData).getBounds();
      if (bounds.isValid()) {
        setCenterCoords([bounds.getCenter().lat, bounds.getCenter().lng]);
      }
    } catch (error) {
      console.error("Error calculating bounds:", error);
    }
  }, [features.length]);

  // Style features based on type and selection
  const getFeatureStyle = (feature: any) => {
    const isSelected = feature.properties.feature_id === selectedFeatureId;
    const measurement = measurements?.measurements.find(
      (m) => m.feature_id === feature.properties.feature_id
    );

    const baseStyle: L.PathOptions = {
      weight: isSelected ? 3 : 2,
      opacity: isSelected ? 1 : 0.7,
      fillOpacity: isSelected ? 0.6 : 0.4,
    };

    // Color based on measurement status
    if (measurement) {
      if (measurement.status === "measured") {
        baseStyle.color = "#27ae60"; // Green
        baseStyle.fillColor = "#27ae60";
      } else if (measurement.status === "unavailable") {
        baseStyle.color = "#e74c3c"; // Red
        baseStyle.fillColor = "#e74c3c";
      } else if (measurement.status === "not_applicable") {
        baseStyle.color = "#95a5a6"; // Gray
        baseStyle.fillColor = "#95a5a6";
      }
    } else {
      baseStyle.color = "#2d5016"; // Forest green
      baseStyle.fillColor = "#2d5016";
    }

    return baseStyle;
  };

  // Handle feature click
  const handleFeatureClick = (e: L.LeafletEvent) => {
    const layer = e.target;
    const featureId = layer.feature?.properties?.feature_id;
    if (featureId && onFeatureSelect) {
      onFeatureSelect(featureId);
    }
  };

  // Create popup content
  const getPopupContent = (feature: any) => {
    const featureId = feature.properties.feature_id;
    const measurement = measurements?.measurements.find(
      (m) => m.feature_id === featureId
    );

    let content = `<div class="map-popup">
      <strong>${featureId}</strong><br/>
      Type: ${feature.properties.geometry_type}<br/>`;

    if (measurement) {
      content += `Status: ${measurement.status}<br/>`;
      if (measurement.area_m2) {
        content += `Area: ${measurement.area_m2.toLocaleString()} m²<br/>`;
      }
      if (measurement.length_m) {
        content += `Length: ${measurement.length_m.toLocaleString()} m<br/>`;
      }
      if (measurement.error) {
        content += `Error: ${measurement.error}<br/>`;
      }
    }

    content += `</div>`;
    return content;
  };

  return (
    <div className="map-viewer-container" style={{ height }}>
      {/* @ts-ignore - react-leaflet type definitions issue */}
      <MapContainer
        center={center}
        zoom={4}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        {/* @ts-ignore - react-leaflet type definitions issue */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController features={features} geojsonData={geojsonData} />

        {features.length > 0 && (
          /* @ts-ignore - react-leaflet type definitions issue */
          <GeoJSON
            data={geojsonData}
            style={(feature: any) => getFeatureStyle(feature)}
            onEachFeature={(feature: any, layer: any) => {
              layer.on("click", handleFeatureClick);
              const popupContent = getPopupContent(feature);
              layer.bindPopup(popupContent);
            }}
          />
        )}
      </MapContainer>

      <style>{`
        .map-viewer-container {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          pointer-events: auto;
        }

        .map-popup {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.5;
        }

        .map-popup strong {
          color: #2d5016;
          display: block;
          margin-bottom: 4px;
        }

        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          pointer-events: auto !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .leaflet-popup-tip {
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default MapViewer;
