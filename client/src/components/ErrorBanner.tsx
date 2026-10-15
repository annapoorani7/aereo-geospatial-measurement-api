import { AlertCircle, ExternalLink, X } from "lucide-react";
import { ErrorMessage } from "../utils/errorMessages";

interface ErrorBannerProps {
  error: ErrorMessage;
  onDismiss?: () => void;
  showDocLink?: boolean;
}

/**
 * Enhanced error banner with contextual message and suggestions
 */
export function ErrorBanner({ error, onDismiss, showDocLink = true }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <div className="error-banner-content">
        <div className="error-icon">
          <AlertCircle size={18} strokeWidth={2} />
        </div>
        <div className="error-text">
          <strong className="error-title">{error.title}</strong>
          <p className="error-message">{error.message}</p>
          {error.suggestion && <p className="error-suggestion">{error.suggestion}</p>}
        </div>
        {onDismiss && (
          <button
            className="error-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {showDocLink && error.docLink && (
        <div className="error-actions">
          <a href={error.docLink} className="error-doc-link">
            Learn more <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

interface ValidationFeedbackProps {
  isValid: boolean;
  message: string;
  type?: "success" | "error" | "warning";
}

/**
 * Real-time validation feedback component
 */
export function ValidationFeedback({
  isValid,
  message,
  type = isValid ? "success" : "error"
}: ValidationFeedbackProps) {
  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠"
  };

  return (
    <div className={`validation-feedback validation-${type}`}>
      <span className="validation-icon">{icons[type]}</span>
      <span className="validation-message">{message}</span>
    </div>
  );
}

interface ValidationGroupProps {
  validations: ValidationFeedbackProps[];
}

/**
 * Group of validation feedback items
 */
export function ValidationGroup({ validations }: ValidationGroupProps) {
  return (
    <div className="validation-group">
      {validations.map((validation, index) => (
        <ValidationFeedback key={index} {...validation} />
      ))}
    </div>
  );
}
