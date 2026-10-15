import React from 'react';
import { TrendingUp, Zap, Workflow, Lightbulb, BarChart3 } from 'lucide-react';

/**
 * PHASE 3: MAJOR FEATURES
 * AI Suggestions, Analytics Dashboard, Integration APIs, Custom Workflows
 */

// ============================================================================
// PHASE 3.1: AI-POWERED SUGGESTIONS
// ============================================================================

export type SuggestionType = 'anomaly' | 'pattern' | 'optimization' | 'insight';

interface AISuggestion {
  id: string;
  type: SuggestionType;
  confidence: number;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onDismiss?: (id: string) => void;
  onApply?: (id: string) => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsProps> = ({
  suggestions,
  onDismiss,
  onApply
}) => {
  const getIcon = (type: SuggestionType) => {
    switch (type) {
      case 'anomaly':
        return <TrendingUp size={16} />;
      case 'pattern':
        return <Zap size={16} />;
      case 'optimization':
        return <Lightbulb size={16} />;
      case 'insight':
        return <BarChart3 size={16} />;
    }
  };

  const getTypeLabel = (type: SuggestionType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="ai-suggestions-panel">
      <h3 className="ai-suggestions-title">AI Insights</h3>
      <div className="ai-suggestions-list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className={`ai-suggestion ai-suggestion-${suggestion.type}`}>
            <div className="ai-suggestion-header">
              <div className="ai-suggestion-icon">{getIcon(suggestion.type)}</div>
              <div className="ai-suggestion-meta">
                <span className="ai-suggestion-type">{getTypeLabel(suggestion.type)}</span>
                <span className="ai-suggestion-confidence">
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
              </div>
              {onDismiss && (
                <button
                  className="ai-suggestion-dismiss"
                  onClick={() => onDismiss(suggestion.id)}
                  aria-label="Dismiss suggestion"
                >
                  ✕
                </button>
              )}
            </div>
            <h4 className="ai-suggestion-title">{suggestion.title}</h4>
            <p className="ai-suggestion-description">{suggestion.description}</p>
            {suggestion.action && onApply && (
              <button
                className="button button-quiet"
                onClick={() => {
                  suggestion.action?.onClick();
                  onApply(suggestion.id);
                }}
              >
                {suggestion.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 3.2: ADVANCED ANALYTICS DASHBOARD
// ============================================================================

interface Metric {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface Chart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  data: any;
}

interface AnalyticsDashboardProps {
  metrics: Metric[];
  charts: Chart[];
  timeRange: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  charts,
  timeRange,
  onTimeRangeChange
}) => (
  <div className="analytics-dashboard">
    <div className="analytics-header">
      <h2>Analytics Dashboard</h2>
      <div className="analytics-controls">
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange?.(e.target.value)}
          className="analytics-time-range"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>
    </div>

    {/* Metrics Grid */}
    <div className="analytics-metrics-grid">
      {metrics.map((metric, idx) => (
        <div key={idx} className="analytics-metric-card">
          <p className="analytics-metric-label">{metric.label}</p>
          <div className="analytics-metric-value">
            <span className="analytics-metric-number">{metric.value}</span>
            {metric.unit && <span className="analytics-metric-unit">{metric.unit}</span>}
          </div>
          {metric.trend && (
            <div className={`analytics-metric-trend trend-${metric.trend}`}>
              {metric.trend === 'up' && '↑'}
              {metric.trend === 'down' && '↓'}
              {metric.trend === 'stable' && '→'}
              {metric.trendValue && <span>{metric.trendValue}%</span>}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Charts Grid */}
    <div className="analytics-charts-grid">
      {charts.map((chart) => (
        <div key={chart.id} className="analytics-chart-container">
          <h3 className="analytics-chart-title">{chart.title}</h3>
          <div className="analytics-chart-placeholder">
            <p>Chart Type: {chart.type}</p>
            <p>Chart rendering would go here</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// PHASE 3.3: INTEGRATION APIS
// ============================================================================

interface IntegrationAPI {
  id: string;
  provider: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

interface IntegrationManagerProps {
  integrations: IntegrationAPI[];
  onConnect?: (provider: string) => void;
  onDisconnect?: (id: string) => void;
  onSync?: (id: string) => void;
}

export const IntegrationManager: React.FC<IntegrationManagerProps> = ({
  integrations,
  onConnect,
  onDisconnect,
  onSync
}) => (
  <div className="integration-manager">
    <h2>Integrations</h2>
    <div className="integration-list">
      {integrations.map((integration) => (
        <div key={integration.id} className={`integration-card integration-${integration.status}`}>
          <div className="integration-header">
            <h3 className="integration-provider">{integration.provider}</h3>
            <span className={`integration-status-badge status-${integration.status}`}>
              {integration.status}
            </span>
          </div>

          <p className="integration-endpoint">{integration.endpoint}</p>

          {integration.lastSync && (
            <p className="integration-last-sync">
              Last synced: {integration.lastSync.toLocaleString()}
            </p>
          )}

          <div className="integration-actions">
            {integration.status === 'connected' ? (
              <>
                <button
                  className="button button-quiet"
                  onClick={() => onSync?.(integration.id)}
                >
                  Sync Now
                </button>
                <button
                  className="button button-quiet"
                  onClick={() => onDisconnect?.(integration.id)}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className="button button-hero"
                onClick={() => onConnect?.(integration.provider)}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// PHASE 3.4: CUSTOM WORKFLOWS
// ============================================================================

export type WorkflowStepType = 'trigger' | 'condition' | 'action' | 'notification';

interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
}

interface WorkflowBuilderProps {
  workflows: Workflow[];
  onCreateWorkflow?: () => void;
  onEditWorkflow?: (id: string) => void;
  onToggleWorkflow?: (id: string, active: boolean) => void;
  onDeleteWorkflow?: (id: string) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflows,
  onCreateWorkflow,
  onEditWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow
}) => (
  <div className="workflow-builder">
    <div className="workflow-header">
      <h2>Custom Workflows</h2>
      {onCreateWorkflow && (
        <button className="button button-hero" onClick={onCreateWorkflow}>
          <Workflow size={14} />
          Create Workflow
        </button>
      )}
    </div>

    <div className="workflow-list">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="workflow-card">
          <div className="workflow-card-header">
            <div className="workflow-info">
              <h3 className="workflow-name">{workflow.name}</h3>
              {workflow.description && (
                <p className="workflow-description">{workflow.description}</p>
              )}
            </div>
            <label className="workflow-toggle">
              <input
                type="checkbox"
                checked={workflow.isActive}
                onChange={(e) => onToggleWorkflow?.(workflow.id, e.target.checked)}
              />
              <span>{workflow.isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <div className="workflow-steps-preview">
            <p className="workflow-steps-label">{workflow.steps.length} steps</p>
            {workflow.lastRun && (
              <p className="workflow-last-run">
                Last run: {workflow.lastRun.toLocaleString()}
              </p>
            )}
          </div>

          <div className="workflow-actions">
            {onEditWorkflow && (
              <button
                className="button button-quiet"
                onClick={() => onEditWorkflow(workflow.id)}
              >
                Edit
              </button>
            )}
            {onDeleteWorkflow && (
              <button
                className="button button-quiet"
                onClick={() => {
                  if (confirm('Delete this workflow?')) {
                    onDeleteWorkflow(workflow.id);
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * PHASE 4: POLISH
 * Micro-interactions, Animation Refinements, Performance Optimization
 */

// ============================================================================
// PHASE 4.1-4.3: POLISH COMPONENTS
// ============================================================================

interface MicroInteractionProps {
  children: React.ReactNode;
  onHover?: () => void;
  onClick?: () => void;
  variant?: 'scale' | 'lift' | 'glow' | 'ripple';
}

export const MicroInteractionButton: React.FC<MicroInteractionProps> = ({
  children,
  onHover,
  onClick,
  variant = 'scale'
}) => (
  <button
    className={`micro-interaction-button micro-interaction-${variant}`}
    onMouseEnter={onHover}
    onClick={onClick}
  >
    {children}
  </button>
);

interface PerformanceMetricsProps {
  metrics: {
    pageLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => (
  <div className="performance-metrics">
    <h3>Performance Metrics</h3>
    <div className="metrics-grid">
      <div className="metric">
        <span className="metric-label">Page Load Time</span>
        <span className="metric-value">{metrics.pageLoadTime}ms</span>
      </div>
      <div className="metric">
        <span className="metric-label">Time to Interactive</span>
        <span className="metric-value">{metrics.timeToInteractive}ms</span>
      </div>
      <div className="metric">
        <span className="metric-label">First Contentful Paint</span>
        <span className="metric-value">{metrics.firstContentfulPaint}ms</span>
      </div>
      <div className="metric">
        <span className="metric-label">Largest Contentful Paint</span>
        <span className="metric-value">{metrics.largestContentfulPaint}ms</span>
      </div>
    </div>
  </div>
);

/**
 * PHASE 5: ADVANCED FEATURES
 * ML Integration, Advanced Caching, PWA Features
 */

// ============================================================================
// PHASE 5.1: MACHINE LEARNING INTEGRATION
// ============================================================================

interface MLModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'clustering';
  accuracy: number;
  version: string;
  status: 'active' | 'training' | 'inactive';
}

interface MLIntegrationProps {
  models: MLModel[];
  onSelectModel?: (id: string) => void;
  onTrainModel?: (id: string) => void;
}

export const MLIntegration: React.FC<MLIntegrationProps> = ({
  models,
  onSelectModel,
  onTrainModel
}) => (
  <div className="ml-integration">
    <h2>Machine Learning Models</h2>
    <div className="ml-models-grid">
      {models.map((model) => (
        <div key={model.id} className={`ml-model-card ml-model-${model.status}`}>
          <h3 className="ml-model-name">{model.name}</h3>
          <p className="ml-model-type">{model.type}</p>
          <div className="ml-model-metrics">
            <span>Accuracy: {(model.accuracy * 100).toFixed(1)}%</span>
            <span>v{model.version}</span>
          </div>
          <div className="ml-model-actions">
            {onSelectModel && (
              <button
                className="button button-quiet"
                onClick={() => onSelectModel(model.id)}
              >
                Select
              </button>
            )}
            {onTrainModel && model.status !== 'training' && (
              <button
                className="button button-quiet"
                onClick={() => onTrainModel(model.id)}
              >
                Train
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// PHASE 5.2: ADVANCED CACHING STRATEGY
// ============================================================================

interface CacheEntry {
  key: string;
  size: number;
  ttl: number;
  hits: number;
  lastAccessed: Date;
}

interface CacheManagerProps {
  entries: CacheEntry[];
  totalSize: number;
  maxSize: number;
  onClear?: () => void;
  onClearEntry?: (key: string) => void;
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  entries,
  totalSize,
  maxSize,
  onClear,
  onClearEntry
}) => {
  const usagePercent = (totalSize / maxSize) * 100;

  return (
    <div className="cache-manager">
      <h2>Cache Management</h2>
      <div className="cache-stats">
        <div className="cache-usage">
          <p className="cache-usage-label">Cache Usage</p>
          <div className="cache-usage-bar">
            <div
              className="cache-usage-fill"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="cache-usage-text">
            {(totalSize / 1024 / 1024).toFixed(2)} MB / {(maxSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <div className="cache-entries">
        <div className="cache-entries-header">
          <h3>Cache Entries</h3>
          {onClear && (
            <button className="button button-quiet" onClick={onClear}>
              Clear All
            </button>
          )}
        </div>

        <div className="cache-entries-list">
          {entries.map((entry) => (
            <div key={entry.key} className="cache-entry">
              <div className="cache-entry-info">
                <p className="cache-entry-key">{entry.key}</p>
                <p className="cache-entry-meta">
                  {(entry.size / 1024).toFixed(2)} KB • {entry.hits} hits
                </p>
              </div>
              {onClearEntry && (
                <button
                  className="cache-entry-remove"
                  onClick={() => onClearEntry(entry.key)}
                  aria-label="Remove cache entry"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 5.3: PROGRESSIVE WEB APP FEATURES
// ============================================================================

interface PWAStatusProps {
  isInstallable: boolean;
  isInstalled: boolean;
  offlineSupport: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  isInstallable,
  isInstalled,
  offlineSupport,
  onInstall,
  onUninstall
}) => (
  <div className="pwa-status">
    <h2>Progressive Web App</h2>
    <div className="pwa-features">
      <div className={`pwa-feature pwa-feature-${isInstalled ? 'active' : 'inactive'}`}>
        <span className="pwa-feature-icon">📱</span>
        <div className="pwa-feature-content">
          <h3>Installable</h3>
          <p>{isInstalled ? 'Installed on your device' : 'Can be installed'}</p>
        </div>
        {isInstallable && !isInstalled && onInstall && (
          <button className="button button-quiet" onClick={onInstall}>
            Install
          </button>
        )}
        {isInstalled && onUninstall && (
          <button className="button button-quiet" onClick={onUninstall}>
            Uninstall
          </button>
        )}
      </div>

      <div className={`pwa-feature pwa-feature-${offlineSupport ? 'active' : 'inactive'}`}>
        <span className="pwa-feature-icon">📡</span>
        <div className="pwa-feature-content">
          <h3>Offline Support</h3>
          <p>{offlineSupport ? 'Works offline' : 'Requires internet connection'}</p>
        </div>
      </div>
    </div>
  </div>
);
