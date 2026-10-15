export type Geometry = {
  type: string;
  coordinates?: unknown;
};

export interface FeatureRecord {
  feature_id: string;
  geometry_type: string;
  geometry: Geometry;
  source_crs: string | null;
  properties: Record<string, unknown>;
}

export interface UploadResponse {
  upload_id: string;
  filename: string;
  feature_count: number;
  source_crs: string | null;
  crs_status: "known" | "missing" | "unknown";
  processing_status: "processed";
  features: FeatureRecord[];
}

export interface UploadMetadata {
  upload_id: string;
  filename: string;
  processing_status: "processed";
  feature_count: number;
  source_crs: string | null;
  crs_status: "known" | "missing" | "unknown";
}

export interface FeatureMeasurement {
  feature_id: string;
  geometry_type: string;
  status: "measured" | "not_applicable" | "unavailable";
  area_m2: number | null;
  length_m: number | null;
  measurement_crs: string | null;
  error: string | null;
}

export interface MeasurementsResponse {
  upload_id: string;
  filename: string;
  source_crs: string | null;
  crs_status: "known" | "missing" | "unknown";
  measurement_method: string;
  status: "complete" | "partial";
  measurements: FeatureMeasurement[];
}

export interface SessionUpload {
  upload: UploadResponse;
  metadata: UploadMetadata | null;
  measurements: MeasurementsResponse | null;
  detailsLoading: boolean;
  detailsError: string | null;
  uploadedAt: number;
}

export type PageKey = "landing" | "overview" | "upload" | "features" | "status";
export type ApiConnection = "checking" | "online" | "offline";