import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * PHASE 1 QUICK WIN #3: Form Validation Feedback
 * Real-time validation with visual feedback and helpful guidance
 */

export type ValidationStatus = 'idle' | 'validating' | 'success' | 'error' | 'warning';

interface ValidationFeedbackProps {
  status: ValidationStatus;
  message?: string;
  suggestion?: string;
  showIcon?: boolean;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  status,
  message,
  suggestion,
  showIcon = true
}) => {
  if (status === 'idle') return null;

  const iconMap = {
    validating: <div className="spinner" />,
    success: <CheckCircle2 size={16} />,
    error: <AlertCircle size={16} />,
    warning: <AlertTriangle size={16} />
  };

  const classNameMap = {
    validating: 'validation-feedback validation-validating',
    success: 'validation-feedback validation-success',
    error: 'validation-feedback validation-error',
    warning: 'validation-feedback validation-warning'
  };

  return (
    <div className={classNameMap[status]} role="status" aria-live="polite">
      {showIcon && <span className="validation-icon">{iconMap[status]}</span>}
      <div className="validation-content">
        {message && <p className="validation-message">{message}</p>}
        {suggestion && <p className="validation-suggestion">{suggestion}</p>}
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidate?: (value: string) => Promise<ValidationStatus>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  successMessage?: string;
  warningMessage?: string;
}

export const ValidatedFormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  onValidate,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  errorMessage,
  successMessage,
  warningMessage
}) => {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  const handleChange = useCallback(async (newValue: string) => {
    onChange(newValue);

    if (onValidate) {
      setStatus('validating');
      try {
        const result = await onValidate(newValue);
        setStatus(result);

        if (result === 'success') {
          setValidationMessage(successMessage || 'Valid input');
        } else if (result === 'error') {
          setValidationMessage(errorMessage || 'Invalid input');
        } else if (result === 'warning') {
          setValidationMessage(warningMessage || 'Warning');
        }
      } catch (error) {
        setStatus('error');
        setValidationMessage('Validation error');
      }
    }
  }, [onChange, onValidate, successMessage, errorMessage, warningMessage]);

  return (
    <div className="form-field-group">
      <label className="form-field-label">
        {label}
        {required && <span className="form-field-required">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`form-field-input form-field-${status}`}
        required={required}
        aria-describedby={helpText ? `${label}-help` : undefined}
      />

      {helpText && (
        <p id={`${label}-help`} className="form-field-help">
          {helpText}
        </p>
      )}

      <ValidationFeedback
        status={status}
        message={validationMessage}
      />
    </div>
  );
};

interface FileValidationProps {
  fileName: string;
  fileSize: number;
  maxSize?: number;
  acceptedFormats?: string[];
}

export const FileValidationFeedback: React.FC<FileValidationProps> = ({
  fileName,
  fileSize,
  maxSize = 20 * 1024 * 1024,
  acceptedFormats = ['kml', 'zip']
}) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const isValidFormat = acceptedFormats.includes(extension);
  const isValidSize = fileSize <= maxSize;

  const formatStatus = isValidFormat ? 'success' : 'error';
  const sizeStatus = isValidSize ? 'success' : 'error';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="file-validation-container">
      <div className="validation-check">
        <ValidationFeedback
          status={formatStatus}
          message={`Format: .${extension}`}
          suggestion={!isValidFormat ? `Accepted formats: ${acceptedFormats.join(', ')}` : undefined}
          showIcon
        />
      </div>

      <div className="validation-check">
        <ValidationFeedback
          status={sizeStatus}
          message={`Size: ${formatBytes(fileSize)}`}
          suggestion={!isValidSize ? `Maximum size: ${formatBytes(maxSize)}` : undefined}
          showIcon
        />
      </div>
    </div>
  );
};

interface SuccessConfirmationProps {
  title: string;
  message: string;
  details?: Record<string, string>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  title,
  message,
  details,
  actions
}) => (
  <div className="success-confirmation" role="status" aria-live="polite">
    <div className="success-icon-container">
      <CheckCircle2 size={32} className="success-icon" />
    </div>

    <h3 className="success-title">{title}</h3>
    <p className="success-message">{message}</p>

    {details && (
      <div className="success-details">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="success-detail-row">
            <span className="detail-label">{key}:</span>
            <span className="detail-value">{value}</span>
          </div>
        ))}
      </div>
    )}

    {actions && (
      <div className="success-actions">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`button button-${action.variant || 'primary'}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

interface FormValidationGroupProps {
  fields: Array<{
    name: string;
    status: ValidationStatus;
    message?: string;
  }>;
  title?: string;
}

export const FormValidationGroup: React.FC<FormValidationGroupProps> = ({
  fields,
  title
}) => {
  const allValid = fields.every(f => f.status === 'success' || f.status === 'idle');
  const hasErrors = fields.some(f => f.status === 'error');

  return (
    <div className="form-validation-group">
      {title && <h4 className="validation-group-title">{title}</h4>}

      <div className="validation-items">
        {fields.map((field) => (
          <div key={field.name} className={`validation-item validation-item-${field.status}`}>
            <span className="validation-item-icon">
              {field.status === 'success' && <CheckCircle2 size={14} />}
              {field.status === 'error' && <AlertCircle size={14} />}
              {field.status === 'warning' && <AlertTriangle size={14} />}
              {field.status === 'validating' && <div className="spinner-small" />}
            </span>
            <span className="validation-item-name">{field.name}</span>
            {field.message && <span className="validation-item-message">{field.message}</span>}
          </div>
        ))}
      </div>

      {allValid && (
        <p className="validation-summary validation-summary-success">
          ✓ All validations passed
        </p>
      )}

      {hasErrors && (
        <p className="validation-summary validation-summary-error">
          ✕ Please fix the errors above
        </p>
      )}
    </div>
  );
};
