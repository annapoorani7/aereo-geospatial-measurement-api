import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PHASE 1 QUICK WIN #2: Loading State Indicators
 * Skeleton screens and contextual loading states for better perceived performance
 */

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '16px',
  className = ''
}) => (
  <div
    className={`skeleton-line ${className}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="skeleton-card">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card-item">
        <SkeletonLine width="30%" height="12px" className="mb-2" />
        <SkeletonLine width="100%" height="20px" className="mb-3" />
        <SkeletonLine width="85%" height="14px" />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} width="100%" height="14px" />
      ))}
    </div>
    <div className="skeleton-table-body">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonLine key={colIdx} width="100%" height="16px" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

interface LoadingStateProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const InlineLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false
}) => (
  <div className="inline-loading-state" role="status" aria-live="polite">
    <Loader2 size={16} className="spinner" />
    <div className="loading-content">
      <span>{message}</span>
      {showProgress && progress !== undefined && (
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  </div>
);

interface UploadProgressProps {
  fileName: string;
  progress: number;
  stage: 'validating' | 'parsing' | 'measuring' | 'complete';
  speed?: string;
  timeRemaining?: string;
  onCancel?: () => void;
}

export const UploadProgressIndicator: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  stage,
  speed,
  timeRemaining,
  onCancel
}) => {
  const stageLabels = {
    validating: 'Validating file...',
    parsing: 'Parsing geometries...',
    measuring: 'Computing measurements...',
    complete: 'Complete'
  };

  return (
    <div className="upload-progress-container">
      <div className="upload-progress-header">
        <div className="upload-progress-info">
          <h3 className="upload-progress-filename">{fileName}</h3>
          <p className="upload-progress-stage">{stageLabels[stage]}</p>
        </div>
        {onCancel && (
          <button 
            className="upload-progress-cancel"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            ✕
          </button>
        )}
      </div>

      <div className="upload-progress-bar-container">
        <div className="upload-progress-bar">
          <div 
            className="upload-progress-fill"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${progress}%`}
          />
        </div>
        <span className="upload-progress-percent">{progress}%</span>
      </div>

      <div className="upload-progress-metrics">
        {speed && <span className="metric">Speed: {speed}</span>}
        {timeRemaining && <span className="metric">Time remaining: {timeRemaining}</span>}
      </div>
    </div>
  );
};

interface MeasurementCalculationProps {
  processedCount: number;
  totalCount: number;
  currentGeometry?: string;
  estimatedTime?: string;
}

export const MeasurementCalculationIndicator: React.FC<MeasurementCalculationProps> = ({
  processedCount,
  totalCount,
  currentGeometry,
  estimatedTime
}) => {
  const progress = Math.round((processedCount / totalCount) * 100);

  return (
    <div className="measurement-calculation-container">
      <div className="calculation-header">
        <Loader2 size={18} className="spinner" />
        <h3>Computing measurements...</h3>
      </div>

      <div className="calculation-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="progress-text">
          {processedCount} of {totalCount} features processed
        </span>
      </div>

      {currentGeometry && (
        <p className="calculation-current">
          Currently processing: <code>{currentGeometry}</code>
        </p>
      )}

      {estimatedTime && (
        <p className="calculation-eta">
          Estimated time remaining: {estimatedTime}
        </p>
      )}
    </div>
  );
};
