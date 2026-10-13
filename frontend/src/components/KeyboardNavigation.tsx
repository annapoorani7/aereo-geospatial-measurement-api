import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';

/**
 * PHASE 1 QUICK WIN #4: Keyboard Navigation Enhancements
 * Full keyboard accessibility with shortcuts and skip links
 */

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

interface KeyboardHelpProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardHelpDialog: React.FC<KeyboardHelpProps> = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="keyboard-help-overlay" onClick={() => setIsOpen(false)}>
      <div className="keyboard-help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-help-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            className="keyboard-help-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close keyboard help"
          >
            ✕
          </button>
        </div>

        <div className="keyboard-help-content">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="keyboard-shortcut-row">
              <kbd className="keyboard-key">
                {shortcut.ctrl && <span>Ctrl+</span>}
                {shortcut.shift && <span>Shift+</span>}
                {shortcut.alt && <span>Alt+</span>}
                {shortcut.key.toUpperCase()}
              </kbd>
              <span className="keyboard-description">{shortcut.description}</span>
            </div>
          ))}
        </div>

        <p className="keyboard-help-hint">Press ? to toggle this dialog</p>
      </div>
    </div>
  );
};

interface SkipLinksProps {
  links: Array<{ label: string; href: string }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => (
  <nav className="skip-links" aria-label="Skip to section">
    {links.map((link, idx) => (
      <a key={idx} href={link.href} className="skip-link">
        {link.label}
      </a>
    ))}
  </nav>
);

interface FocusTrapProps {
  children: React.ReactNode;
  onEscape?: () => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, onEscape }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }

      if (e.key === 'Tab') {
        const focusableElements = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => containerRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);

  return <div ref={containerRef}>{children}</div>;
};

/**
 * PHASE 1 QUICK WIN #6: Tooltip System
 * Comprehensive tooltip system with keyboard support
 */

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`tooltip tooltip-${position}`} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
};

interface HelpIconProps {
  content: string;
  label?: string;
}

export const HelpIcon: React.FC<HelpIconProps> = ({ content, label = 'Help' }) => (
  <Tooltip content={content} position="right">
    <button
      className="help-icon-button"
      aria-label={label}
      tabIndex={0}
    >
      <HelpCircle size={16} />
    </button>
  </Tooltip>
);

/**
 * PHASE 1 QUICK WIN #7: Breadcrumb Navigation
 * Contextual breadcrumb navigation for better wayfinding
 */

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol className="breadcrumbs-list">
      {items.map((item, idx) => (
        <li key={idx} className="breadcrumb-item">
          {item.current ? (
            <span className="breadcrumb-current" aria-current="page">
              {item.label}
            </span>
          ) : (
            <>
              {item.href ? (
                <a href={item.href} className="breadcrumb-link">
                  {item.label}
                </a>
              ) : (
                <button
                  className="breadcrumb-link"
                  onClick={item.onClick}
                  type="button"
                >
                  {item.label}
                </button>
              )}
              {idx < items.length - 1 && (
                <ChevronRight size={14} className="breadcrumb-separator" />
              )}
            </>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

/**
 * PHASE 1 QUICK WIN #8: Progress Indicators
 * Multi-step progress indicators for workflows
 */

interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  vertical?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  vertical = false
}) => (
  <div className={`progress-indicator ${vertical ? 'vertical' : 'horizontal'}`}>
    {steps.map((step, idx) => (
      <div
        key={idx}
        className={`progress-step progress-step-${step.status}`}
        aria-current={idx === currentStep ? 'step' : undefined}
      >
        <div className="progress-step-marker">
          <span className="progress-step-number">{idx + 1}</span>
        </div>
        <div className="progress-step-content">
          <h4 className="progress-step-label">{step.label}</h4>
          {step.description && (
            <p className="progress-step-description">{step.description}</p>
          )}
        </div>
        {idx < steps.length - 1 && <div className="progress-step-connector" />}
      </div>
    ))}
  </div>
);

interface StepperProps {
  steps: ProgressStep[];
  currentStep: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onNext,
  onPrevious
}) => (
  <div className="stepper-container">
    <ProgressIndicator steps={steps} currentStep={currentStep} />

    <div className="stepper-controls">
      <button
        className="button button-quiet"
        onClick={onPrevious}
        disabled={currentStep === 0}
        aria-label="Go to previous step"
      >
        Previous
      </button>

      <span className="stepper-counter">
        Step {currentStep + 1} of {steps.length}
      </span>

      <button
        className="button button-hero"
        onClick={onNext}
        disabled={currentStep === steps.length - 1}
        aria-label="Go to next step"
      >
        Next
      </button>
    </div>
  </div>
);
