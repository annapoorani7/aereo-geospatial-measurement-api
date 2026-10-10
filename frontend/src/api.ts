import type {
  MeasurementsResponse,
  UploadMetadata,
  UploadResponse,
} from "./types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const API_DISPLAY_URL = (() => {
  try {
    const url = new URL(API_BASE_URL);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "Configured API endpoint";
  }
})();

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function apiDetail(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const detail = payload.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (isRecord(item) && typeof item.msg === "string" ? item.msg : ""))
      .filter(Boolean)
      .join("; ");
  }
  return null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      `Could not reach ${API_DISPLAY_URL}. Check that the backend is running and reachable.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      `The API returned a malformed response (HTTP ${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    const detail = response.status >= 500
      ? "The API encountered an internal error. Check backend logs and try again."
      : apiDetail(payload) ?? `API request failed with HTTP ${response.status}.`;
    throw new ApiError(
      `${detail} (HTTP ${response.status})`,
      response.status,
    );
  }
  if (!isRecord(payload)) {
    throw new ApiError("The API returned an unexpected response shape.", response.status);
  }
  return payload as T;
}

function validateUpload(payload: UploadResponse): UploadResponse {
  if (
    typeof payload.upload_id !== "string" ||
    typeof payload.filename !== "string" ||
    typeof payload.feature_count !== "number" ||
    !Array.isArray(payload.features)
  ) {
    throw new ApiError("The API returned malformed upload data.");
  }
  return payload;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const payload = await requestJson<UploadResponse>("/api/files/", {
    method: "POST",
    body: form,
  });
  return validateUpload(payload);
}

export async function getFileMetadata(fileId: string): Promise<UploadMetadata> {
  const payload = await requestJson<UploadMetadata>(
    `/api/files/${encodeURIComponent(fileId)}/`,
  );
  if (typeof payload.filename !== "string" || typeof payload.feature_count !== "number") {
    throw new ApiError("The API returned malformed file metadata.");
  }
  return payload;
}

export async function getMeasurements(
  fileId: string,
): Promise<MeasurementsResponse> {
  const payload = await requestJson<MeasurementsResponse>(
    `/api/files/${encodeURIComponent(fileId)}/measurements/`,
  );
  if (!Array.isArray(payload.measurements) || typeof payload.measurement_method !== "string") {
    throw new ApiError("The API returned malformed measurement data.");
  }
  return payload;
}

export async function checkHealth(): Promise<void> {
  const payload = await requestJson<{ status: string }>("/health");
  if (payload.status !== "ok") {
    throw new ApiError("The health endpoint returned an unexpected status.");
  }
}