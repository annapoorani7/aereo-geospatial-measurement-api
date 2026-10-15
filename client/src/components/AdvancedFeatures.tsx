import React, { useState, useCallback } from 'react';
import { Search, Filter, Download } from 'lucide-react';

/**
 * PHASE 2: CORE ENHANCEMENTS
 * Advanced Filtering, Batch Operations, Export Customization, Dark Mode, Collaboration
 */

// ============================================================================
// PHASE 2.1: ADVANCED FILTERING SYSTEM
// ============================================================================

interface FilterConfig {
  searchTerm: string;
  geometryTypes: string[];
  measurementStatus: 'available' | 'unavailable' | 'all';
  crsFilter: string[];
  dateRange?: [Date, Date];
  customProperties: Record<string, any>;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterConfig) => void;
  availableGeometryTypes: string[];
  availableCRS: string[];
  onSavePreset?: (name: string, filters: FilterConfig) => void;
  savedPresets?: Array<{ name: string; filters: FilterConfig }>;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterProps> = ({
  onFilterChange,
  availableGeometryTypes,
  availableCRS,
  onSavePreset,
  savedPresets = []
}) => {
  const [filters, setFilters] = useState<FilterConfig>({
    searchTerm: '',
    geometryTypes: [],
    measurementStatus: 'all',
    crsFilter: [],
    customProperties: {}
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  const handleFilterChange = useCallback((newFilters: Partial<FilterConfig>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);

    const count = [
      updated.searchTerm ? 1 : 0,
      updated.geometryTypes.length,
      updated.measurementStatus !== 'all' ? 1 : 0,
      updated.crsFilter.length,
      Object.keys(updated.customProperties).length
    ].reduce((a, b) => a + b, 0);

    setFilterCount(count);
  }, [filters, onFilterChange]);

  return (
    <div className="advanced-filter-panel">
      <div className="filter-header">
        <button
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <Filter size={16} />
          <span>Advanced Filters</span>
          {filterCount > 0 && <span className="filter-badge">{filterCount}</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search features..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                className="filter-input"
              />
            </div>
          </div>

          {/* Geometry Types */}
          <div className="filter-group">
            <label className="filter-label">Geometry Types</label>
            <div className="filter-checkboxes">
              {availableGeometryTypes.map((type) => (
                <label key={type} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.geometryTypes.includes(type)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...filters.geometryTypes, type]
                        : filters.geometryTypes.filter((t) => t !== type);
                      handleFilterChange({ geometryTypes: updated });
                    }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Measurement Status */}
          <div className="filter-group">
            <label className="filter-label">Measurement Status</label>
            <select
              value={filters.measurementStatus}
              onChange={(e) =>
                handleFilterChange({
                  measurementStatus: e.target.value as any
                })
              }
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* CRS Filter */}
          <div className="filter-group">
            <label className="filter-label">Coordinate Reference Systems</label>
            <div className="filter-checkboxes">
              {availableCRS.map((crs) => (
                <label key={crs} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.crsFilter.includes(crs)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...filters.crsFilter, crs]
                        : filters.crsFilter.filter((c) => c !== crs);
                      handleFilterChange({ crsFilter: updated });
                    }}
                  />
                  <span>{crs}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="filter-actions">
            <button
              className="button button-quiet"
              onClick={() =>
                handleFilterChange({
                  searchTerm: '',
                  geometryTypes: [],
                  measurementStatus: 'all',
                  crsFilter: [],
                  customProperties: {}
                })
              }
            >
              Clear All
            </button>
            {onSavePreset && (
              <button
                className="button button-quiet"
                onClick={() => {
                  const name = prompt('Preset name:');
                  if (name) onSavePreset(name, filters);
                }}
              >
                Save Preset
              </button>
            )}
          </div>

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="filter-presets">
              <p className="filter-presets-label">Saved Presets</p>
              {savedPresets.map((preset) => (
                <button
                  key={preset.name}
                  className="filter-preset-btn"
                  onClick={() => handleFilterChange(preset.filters)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PHASE 2.2: BATCH OPERATIONS
// ============================================================================

interface BatchOperationProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchExport?: () => void;
  onBatchCopy?: () => void;
  onBatchDelete?: () => void;
}

export const BatchOperationToolbar: React.FC<BatchOperationProps> = ({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBatchExport,
  onBatchCopy,
  onBatchDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="batch-operation-toolbar" role="toolbar" aria-label="Batch operations">
      <div className="batch-info">
        <span className="batch-count">{selectedCount} selected</span>
      </div>

      <div className="batch-actions">
        {onSelectAll && (
          <button className="button button-quiet" onClick={onSelectAll}>
            Select All
          </button>
        )}
        {onDeselectAll && (
          <button className="button button-quiet" onClick={onDeselectAll}>
            Deselect All
          </button>
        )}

        <div className="batch-divider" />

        {onBatchExport && (
          <button className="button button-quiet" onClick={onBatchExport}>
            <Download size={14} />
            Export Selected
          </button>
        )}
        {onBatchCopy && (
          <button className="button button-quiet" onClick={onBatchCopy}>
            Copy Coordinates
          </button>
        )}
        {onBatchDelete && (
          <button
            className="button button-quiet"
            onClick={() => {
              if (confirm(`Delete ${selectedCount} features?`)) {
                onBatchDelete();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 2.3: EXPORT CUSTOMIZATION
// ============================================================================

interface ExportOptions {
  format: 'csv' | 'geojson' | 'json' | 'html';
  includeFields: string[];
  filterApplied: boolean;
  selectedOnly: boolean;
  includeMetadata: boolean;
}

interface ExportCustomizerProps {
  availableFields: string[];
  onExport: (options: ExportOptions) => void;
  isLoading?: boolean;
}

export const ExportCustomizer: React.FC<ExportCustomizerProps> = ({
  availableFields,
  onExport,
  isLoading = false
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: availableFields,
    filterApplied: true,
    selectedOnly: false,
    includeMetadata: true
  });

  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="export-customizer">
      <div className="export-section">
        <label className="export-label">Format</label>
        <select
          value={options.format}
          onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
          className="export-select"
        >
          <option value="csv">CSV</option>
          <option value="geojson">GeoJSON</option>
          <option value="json">JSON</option>
          <option value="html">HTML Report</option>
        </select>
      </div>

      <div className="export-section">
        <label className="export-label">Fields to Include</label>
        <div className="export-field-list">
          {availableFields.map((field) => (
            <label key={field} className="export-field-checkbox">
              <input
                type="checkbox"
                checked={options.includeFields.includes(field)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...options.includeFields, field]
                    : options.includeFields.filter((f) => f !== field);
                  setOptions({ ...options, includeFields: updated });
                }}
              />
              <span>{field}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-section">
        <label className="export-checkbox">
          <input
            type="checkbox"
            checked={options.selectedOnly}
            onChange={(e) => setOptions({ ...options, selectedOnly: e.target.checked })}
          />
          <span>Export selected features only</span>
        </label>

        <label className="export-checkbox">
          <input
            type="checkbox"
            checked={options.includeMetadata}
            onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
          />
          <span>Include metadata</span>
        </label>
      </div>

      <div className="export-actions">
        <button
          className="button button-quiet"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button
          className="button button-hero"
          onClick={() => onExport(options)}
          disabled={isLoading}
        >
          {isLoading ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {showPreview && (
        <div className="export-preview">
          <p className="export-preview-label">Preview (first 5 rows)</p>
          <pre className="export-preview-content">
            {JSON.stringify(
              {
                format: options.format,
                fields: options.includeFields,
                rowCount: '...',
                sample: 'Preview data will appear here'
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PHASE 2.4: DARK MODE SUPPORT
// ============================================================================

interface DarkModeToggleProps {
  onToggle?: (isDark: boolean) => void;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ onToggle }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-preference');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const handleToggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('theme-preference', newValue ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
    onToggle?.(newValue);
  };

  return (
    <button
      className="dark-mode-toggle"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Current theme: ${isDark ? 'dark' : 'light'}`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

// ============================================================================
// PHASE 2.5: REAL-TIME COLLABORATION
// ============================================================================

interface Participant {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
}

interface CollaborationStatusProps {
  participants: Participant[];
  isConnected: boolean;
  onDisconnect?: () => void;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  participants,
  isConnected,
  onDisconnect
}) => (
  <div className="collaboration-status">
    <div className={`collaboration-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="collaboration-dot" />
      <span className="collaboration-text">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>

    {participants.length > 0 && (
      <div className="collaboration-participants">
        <span className="participants-label">Active:</span>
        {participants.map((p) => (
          <div
            key={p.id}
            className="participant-badge"
            style={{ borderColor: p.color }}
            title={p.name}
          >
            {p.name.charAt(0)}
          </div>
        ))}
      </div>
    )}

    {!isConnected && onDisconnect && (
      <button className="button button-quiet" onClick={onDisconnect}>
        Reconnect
      </button>
    )}
  </div>
);
