/**
 * Contextual Error Message Generator
 * Provides user-friendly, actionable error messages based on error type and context
 */

import { ApiError } from "../api";

export interface ErrorContext {
  type: "upload" | "validation" | "network" | "processing" | "unknown";
  details?: Record<string, unknown>;
}

export interface ErrorMessage {
  title: string;
  message: string;
  suggestion?: string;
  docLink?: string;
}

/**
 * Generate contextual error message based on error type and context
 */
export function getContextualErrorMessage(
  error: unknown,
  context: ErrorContext
): ErrorMessage {
  // Handle API errors
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, context);
  }

  // Handle standard errors
  if (error instanceof Error) {
    return getStandardErrorMessage(error, context);
  }

  // Fallback for unknown errors
  return {
    title: "An error occurred",
    message: "Something unexpected happened. Please try again.",
    suggestion: "If the problem persists, check the API Status page to verify the backend is running.",
    docLink: "#status"
  };
}

/**
 * Generate error message for API errors
 */
function getApiErrorMessage(error: ApiError, _context: ErrorContext): ErrorMessage {
  switch (error.status) {
    case 400:
      return {
        title: "Invalid file format",
        message:
          "The file format is not supported. Please upload a .kml file or a .zip archive containing a Shapefile.",
        suggestion:
          "Ensure your file has the correct extension (.kml or .zip) and contains valid geospatial data.",
        docLink: "/docs/file-formats"
      };

    case 413:
      return {
        title: "File too large",
        message: "The file exceeds the 20 MiB upload limit.",
        suggestion:
          "Try compressing your file, splitting it into smaller parts, or removing unnecessary features.",
        docLink: "/docs/limits"
      };

    case 422:
      return {
        title: "File validation failed",
        message:
          "The file could not be parsed. It may be corrupted or in an unsupported format.",
        suggestion:
          "For KML files: Ensure the XML is valid. For Shapefiles: Include all required files (.shp, .shx, .dbf, .prj).",
        docLink: "/docs/troubleshooting"
      };

    case 503:
      return {
        title: "Backend service unavailable",
        message: "The API server is not responding. It may be temporarily down or not running.",
        suggestion:
          "Check that the backend server is running on port 8000. Verify your API URL in the settings.",
        docLink: "#status"
      };

    case 504:
      return {
        title: "Request timeout",
        message: "The request took too long to complete. The file may be too large or complex.",
        suggestion: "Try uploading a smaller file or simplifying the geometry.",
        docLink: "/docs/limits"
      };

    default:
      return {
        title: `Error (${error.status})`,
        message: error.message || "An API error occurred.",
        suggestion: "Check the API Status page or try again later.",
        docLink: "#status"
      };
  }
}

/**
 * Generate error message for standard errors
 */
function getStandardErrorMessage(error: Error, _context: ErrorContext): ErrorMessage {
  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return {
      title: "Network error",
      message: "Could not connect to the backend API.",
      suggestion:
        "Check your internet connection and verify the API URL is correct. Ensure the backend server is running.",
      docLink: "#status"
    };
  }

  if (message.includes("timeout")) {
    return {
      title: "Request timeout",
      message: "The request took too long to complete.",
      suggestion: "Try again with a smaller file or check your internet connection.",
      docLink: "/docs/troubleshooting"
    };
  }

  if (message.includes("cors")) {
    return {
      title: "CORS error",
      message: "The backend rejected the request due to CORS policy.",
      suggestion:
        "This usually means the backend is not configured to accept requests from this origin.",
      docLink: "/docs/deployment"
    };
  }

  return {
    title: "Error",
    message: error.message || "An unexpected error occurred.",
    suggestion: "Try again or contact support if the problem persists.",
    docLink: "/docs/troubleshooting"
  };
}

/**
 * Get validation error message for file validation
 */
export function getFileValidationError(file: File | undefined): ErrorMessage | null {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isValidFormat = extension && ["kml", "zip"].includes(extension);

  if (!isValidFormat) {
    return {
      title: "Invalid file format",
      message: `File type ".${extension}" is not supported.`,
      suggestion: "Please upload a .kml file or a .zip archive containing a Shapefile.",
      docLink: "/docs/file-formats"
    };
  }

  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_BYTES) {
    return {
      title: "File too large",
      message: `File size is ${formatBytes(file.size)}, exceeding the 20 MiB limit.`,
      suggestion: "Try compressing your file or splitting it into smaller parts.",
      docLink: "/docs/limits"
    };
  }

  return null;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 0 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

/**
 * Get CRS-related error message
 */
export function getCrsErrorMessage(crsStatus: string): ErrorMessage | null {
  const messages: Record<string, ErrorMessage> = {
    unknown: {
      title: "Unknown CRS",
      message: "The coordinate reference system could not be determined.",
      suggestion:
        "For Shapefiles, ensure the .prj file is included. For KML, coordinates are assumed to be WGS 84.",
      docLink: "/docs/crs"
    },
    invalid: {
      title: "Invalid CRS",
      message: "The coordinate reference system is not recognized.",
      suggestion: "Verify the CRS definition in your file is valid and supported.",
      docLink: "/docs/crs"
    },
    unsupported: {
      title: "Unsupported CRS",
      message: "The coordinate reference system is not supported for measurements.",
      suggestion:
        "Measurements are only available for CRS that can be projected to UTM zones.",
      docLink: "/docs/crs"
    }
  };

  return messages[crsStatus] || null;
}
