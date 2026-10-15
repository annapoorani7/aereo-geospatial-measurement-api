import { AlertCircle, CircleHelp, Compass, Ruler, ScanLine } from "lucide-react";
import type { MeasurementsResponse } from "../types";
import { MetricCard } from "./MetricCard";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

interface MeasurementSummaryProps {
  data: MeasurementsResponse | null;
}

export function MeasurementSummary({ data }: MeasurementSummaryProps) {
  if (!data) {
    return (
      <div className="inline-empty">
        <CircleHelp size={17} />
        <span>Measurement results are not available for this upload.</span>
      </div>
    );
  }

  const measured = data.measurements.filter((item) => item.status === "measured");
  const unavailable = data.measurements.filter((item) => item.status === "unavailable");
  const notApplicable = data.measurements.filter((item) => item.status === "not_applicable");
  const area = measured.reduce((total, item) => total + (item.area_m2 ?? 0), 0);
  const length = measured.reduce((total, item) => total + (item.length_m ?? 0), 0);
  const polygonCount = measured.filter((item) => item.area_m2 !== null).length;
  const lineCount = measured.filter((item) => item.length_m !== null).length;
  const hasArea = polygonCount > 0;
  const hasLength = lineCount > 0;

  return (
    <>
      <div className="summary-grid">
        <MetricCard
          label="Polygon area"
          value={hasArea ? `${numberFormat.format(area)} m²` : "—"}
          detail={hasArea ? `${numberFormat.format(area / 10_000)} ha · ${polygonCount} polygon${polygonCount === 1 ? "" : "s"}` : "No measured polygons"}
          icon={<Compass size={18} />}
          tone="teal"
        />
        <MetricCard
          label="Line length"
          value={hasLength ? `${numberFormat.format(length)} m` : "—"}
          detail={hasLength ? `${numberFormat.format(length / 1_000)} km · ${lineCount} line${lineCount === 1 ? "" : "s"}` : "No measured lines"}
          icon={<Ruler size={18} />}
          tone="blue"
        />
        <MetricCard
          label="Measured features"
          value={numberFormat.format(measured.length)}
          detail="Polygon or line result returned"
          icon={<ScanLine size={18} />}
          tone="slate"
        />
        <MetricCard
          label="Not measured"
          value={numberFormat.format(notApplicable.length + unavailable.length)}
          detail={`${notApplicable.length} not applicable · ${unavailable.length} unavailable`}
          icon={<AlertCircle size={18} />}
          tone={unavailable.length ? "amber" : "slate"}
        />
      </div>

      <div className="method-note">
        <span className="method-note-label">METHOD</span>
        <p>{data.measurement_method}</p>
      </div>

      {unavailable.length > 0 && (
        <section className="warning-panel" aria-labelledby="unavailable-title">
          <div className="warning-panel-heading">
            <AlertCircle size={17} />
            <h3 id="unavailable-title">Some measurements are unavailable</h3>
          </div>
          <ul>
            {unavailable.map((item) => (
              <li key={item.feature_id}>
                <strong>{item.feature_id}</strong>
                <span>{item.error || "The backend did not return a measurement."}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}