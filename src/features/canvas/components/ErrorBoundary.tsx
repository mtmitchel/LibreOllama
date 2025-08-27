/**
 * Enhanced Error Boundary for Canvas System
 * Provides graceful error handling with recovery mechanisms and detailed error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { canvasLog } from '../utils/canvasLogger';
import { CanvasElement, ElementId } from '../types/enhanced.types';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  recoveryAttempts: number;
  lastErrorTime: number;
  errorHistory: ErrorLogEntry[];
}

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo: {
    componentStack: string;
  };
  context: {
    url: string;
    userAgent: string;
    canvasElementCount?: number;
    activetool?: string;
    selectedElementCount?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  maxRecoveryAttempts?: number;
  isolateErrors?: boolean;
  reportErrors?: boolean;
  level?: 'canvas' | 'tool' | 'element' | 'layer';
  context?: {
    canvasId?: string;
    toolId?: string;
    elementId?: ElementId;
    layerName?: string;
  };
}

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
  errorInfo: null,
  errorId: null,
  recoveryAttempts: 0,
  lastErrorTime: 0,
  errorHistory: []
};

export class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimer: NodeJS.Timeout | null = null;
  private errorReportingQueue: ErrorLogEntry[] = [];
  private maxHistorySize = 50;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = INITIAL_STATE;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `canvas-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, reportErrors = true, level = 'canvas' } = this.props;
    
    // Create error log entry
    const errorEntry = this.createErrorLogEntry(error, errorInfo);
    
    // Update error history
    this.setState(prevState => ({
      errorInfo,
      recoveryAttempts: prevState.recoveryAttempts,
      errorHistory: [
        errorEntry,
        ...prevState.errorHistory.slice(0, this.maxHistorySize - 1)
      ]
    }));

    // Log error
    canvasLog.error(`🚨 [ErrorBoundary:${level}] Canvas error caught:`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      context: this.props.context,
      errorId: this.state.errorId
    });

    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        canvasLog.error('🚨 [ErrorBoundary] Error in custom error handler:', handlerError);
      }
    }

    // Report error if enabled
    if (reportErrors) {
      this.reportError(errorEntry);
    }

    // Attempt recovery if enabled
    if (this.props.enableRecovery !== false) {
      this.attemptRecovery();
    }
  }

  private createErrorLogEntry(error: Error, errorInfo: ErrorInfo): ErrorLogEntry {
    const severity = this.determineSeverity(error);
    
    return {
      id: this.state.errorId || `error-${Date.now()}`,
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || ''
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        canvasElementCount: this.getCanvasElementCount(),
        activetool: this.getActiveTool(),
        selectedElementCount: this.getSelectedElementCount(),
        ...this.props.context
      },
      severity,
      recovered: false
    };
  }

  private determineSeverity(error: Error): ErrorLogEntry['severity'] {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors
    if (
      errorName.includes('syntaxerror') ||
      errorName.includes('referenceerror') ||
      errorMessage.includes('cannot read properties of null') ||
      errorMessage.includes('maximum call stack')
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('canvas') ||
      errorMessage.includes('konva')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('type') ||
      errorMessage.includes('render')
    ) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  private getCanvasElementCount(): number | undefined {
    try {
      // This would integrate with the canvas store
      return (window as any).__CANVAS_ELEMENT_COUNT__;
    } catch {
      return undefined;
    }
  }

  private getActiveTool(): string | undefined {
    try {
      // This would integrate with the canvas store
      return (window as any).__CANVAS_ACTIVE_TOOL__;
    } catch {
      return undefined;
    }
  }

  private getSelectedElementCount(): number | undefined {
    try {
      // This would integrate with the canvas store
      return (window as any).__CANVAS_SELECTED_COUNT__;
    } catch {
      return undefined;
    }
  }

  private attemptRecovery(): void {
    const { maxRecoveryAttempts = 3 } = this.props;
    const { recoveryAttempts, lastErrorTime } = this.state;

    // Check if we've exceeded max recovery attempts
    if (recoveryAttempts >= maxRecoveryAttempts) {
      canvasLog.warn('🚨 [ErrorBoundary] Max recovery attempts exceeded');
      return;
    }

    // Check if errors are happening too frequently
    const timeSinceLastError = Date.now() - lastErrorTime;
    if (timeSinceLastError < 1000 && recoveryAttempts > 0) {
      canvasLog.warn('🚨 [ErrorBoundary] Errors occurring too frequently, skipping recovery');
      return;
    }

    canvasLog.info('🔄 [ErrorBoundary] Attempting error recovery...', {
      attempt: recoveryAttempts + 1,
      maxAttempts: maxRecoveryAttempts
    });

    // Clear the recovery timer if it exists
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }

    // Attempt recovery after a delay
    this.recoveryTimer = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        recoveryAttempts: prevState.recoveryAttempts + 1,
        errorHistory: prevState.errorHistory.map(entry => 
          entry.id === prevState.errorId ? { ...entry, recovered: true } : entry
        )
      }));

      canvasLog.info('✅ [ErrorBoundary] Recovery attempt completed');
    }, 1000 + recoveryAttempts * 500); // Exponential backoff
  }

  private reportError(errorEntry: ErrorLogEntry): void {
    // Add to reporting queue
    this.errorReportingQueue.push(errorEntry);

    // In a real implementation, this would send errors to a logging service
    canvasLog.info('📊 [ErrorBoundary] Error queued for reporting:', {
      errorId: errorEntry.id,
      severity: errorEntry.severity,
      queueSize: this.errorReportingQueue.length
    });

    // Simulate async error reporting
    if (this.errorReportingQueue.length === 1) {
      this.flushErrorQueue();
    }
  }

  private async flushErrorQueue(): Promise<void> {
    while (this.errorReportingQueue.length > 0) {
      const errors = this.errorReportingQueue.splice(0, 10); // Send in batches
      
      try {
        // In a real implementation, send to error reporting service
        await this.sendErrorsToService(errors);
        canvasLog.debug('📊 [ErrorBoundary] Errors reported successfully');
      } catch (reportingError) {
        canvasLog.warn('📊 [ErrorBoundary] Failed to report errors:', reportingError);
        // Put failed errors back in queue for retry
        this.errorReportingQueue.unshift(...errors);
        break;
      }
    }
  }

  private async sendErrorsToService(errors: ErrorLogEntry[]): Promise<void> {
    // Simulate API call to error reporting service
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Error reporting service unavailable'));
        }
      }, 1000);
    });
  }

  private handleRetry = (): void => {
    canvasLog.info('🔄 [ErrorBoundary] Manual retry triggered');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReload = (): void => {
    canvasLog.info('🔄 [ErrorBoundary] Page reload triggered');
    window.location.reload();
  };

  private renderErrorDetails(): ReactNode {
    const { error, errorInfo, errorId, recoveryAttempts } = this.state;
    const { level = 'canvas' } = this.props;

    if (!error || !errorInfo) return null;

    return (
      <details className="canvas-error-details" style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Technical Details
        </summary>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px', 
          fontFamily: 'monospace',
          fontSize: '0.85em',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Error ID:</strong> {errorId}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Level:</strong> {level}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Recovery Attempts:</strong> {recoveryAttempts}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Error:</strong> {error.name}: {error.message}
          </div>
          {error.stack && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Stack Trace:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>
                {error.stack}
              </pre>
            </div>
          )}
          <div>
            <strong>Component Stack:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>
              {errorInfo.componentStack}
            </pre>
          </div>
        </div>
      </details>
    );
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, level = 'canvas', enableRecovery = true } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI based on level
      return (
        <div 
          className={`canvas-error-boundary canvas-error-boundary--${level}`}
          style={{
            padding: '2rem',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            margin: '1rem',
            textAlign: 'center',
            color: '#d63031'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {level === 'canvas' ? '🎨' : level === 'tool' ? '🔧' : level === 'element' ? '📦' : '⚠️'}
          </div>
          
          <h2 style={{ color: '#d63031', marginBottom: '1rem' }}>
            {this.getErrorTitle(level)}
          </h2>
          
          <p style={{ marginBottom: '1.5rem', color: '#636e72' }}>
            {this.getErrorMessage(level, error)}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
            {enableRecovery && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#00b894',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reload Page
            </button>
          </div>

          {this.renderErrorDetails()}
        </div>
      );
    }

    return children;
  }

  private getErrorTitle(level: string): string {
    switch (level) {
      case 'canvas':
        return 'Canvas System Error';
      case 'tool':
        return 'Tool Error';
      case 'element':
        return 'Element Error';
      case 'layer':
        return 'Layer Error';
      default:
        return 'Application Error';
    }
  }

  private getErrorMessage(level: string, error: Error | null): string {
    const baseMessage = error?.message || 'An unexpected error occurred';
    
    switch (level) {
      case 'canvas':
        return `The canvas system encountered an error: ${baseMessage}. You can try to recover or reload the page to restore functionality.`;
      case 'tool':
        return `The current tool encountered an error: ${baseMessage}. Try switching to a different tool or reloading the page.`;
      case 'element':
        return `A canvas element encountered an error: ${baseMessage}. The element may not display correctly until the issue is resolved.`;
      case 'layer':
        return `A canvas layer encountered an error: ${baseMessage}. Some elements may not be visible until the issue is resolved.`;
      default:
        return `${baseMessage}. Please try reloading the page or contact support if the problem persists.`;
    }
  }

  componentWillUnmount(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }
}

// Higher-order component for adding error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <CanvasErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </CanvasErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error boundaries for different canvas levels
export const CanvasLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <CanvasErrorBoundary {...props} level="canvas" />
);

export const ToolLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <CanvasErrorBoundary {...props} level="tool" />
);

export const ElementLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <CanvasErrorBoundary {...props} level="element" />
);

export const LayerLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <CanvasErrorBoundary {...props} level="layer" />
);

// Error boundary hook for functional components
export function useErrorHandler(): (error: Error, errorInfo?: ErrorInfo) => void {
  return (error: Error, errorInfo?: ErrorInfo) => {
    canvasLog.error('🚨 [useErrorHandler] Error caught in functional component:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo
    });

    // In a real implementation, this would integrate with the error reporting system
    throw error; // Re-throw to trigger the nearest error boundary
  };
}