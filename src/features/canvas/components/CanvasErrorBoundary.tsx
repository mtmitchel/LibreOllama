import React, { Component, ErrorInfo, ReactNode } from 'react';
import { canvasLog } from '../utils/canvasLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  renderCount: number;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  private renderTimer: NodeJS.Timeout | null = null;
  private lastErrorTime: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      renderCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is likely an infinite loop error
    const isInfiniteLoopError = 
      error.message.includes('Maximum update depth exceeded') ||
      error.message.includes('setState') ||
      error.message.includes('infinite');

    return {
      hasError: true,
      error,
      renderCount: isInfiniteLoopError ? 999 : 1
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;

    // If errors are happening too frequently, it's likely an infinite loop
    if (timeSinceLastError < 1000) {
      console.error('🚨 [CanvasErrorBoundary] Rapid successive errors detected - likely infinite loop!', {
        error: error.message,
        timeSinceLastError,
        componentStack: errorInfo.componentStack
      });
      
      // Force a longer recovery period for infinite loops
      this.setState({ renderCount: this.state.renderCount + 10 });
    }

    this.lastErrorTime = now;
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log the error details
    console.error('🛑 [CanvasErrorBoundary] Canvas error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      renderCount: this.state.renderCount
    });

    // Auto-recovery after a delay
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }

    const recoveryDelay = Math.min(5000, this.state.renderCount * 500); // Max 5 seconds
    this.renderTimer = setTimeout(() => {
              canvasLog.log('🔄 [CanvasErrorBoundary] Attempting auto-recovery...');
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        renderCount: 0
      });
    }, recoveryDelay);
  }

  componentWillUnmount() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{
          padding: '20px',
          margin: '10px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe6e6',
          color: '#d63031',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#d63031' }}>
            🛑 Canvas Error Boundary
          </h3>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <p><strong>Render Count:</strong> {this.state.renderCount}</p>
          {this.state.renderCount > 5 && (
            <p style={{ color: '#e17055', fontWeight: 'bold' }}>
              ⚠️ Possible infinite loop detected - implementing longer recovery delay
            </p>
          )}
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Stack Trace
            </summary>
            <pre style={{ 
              overflow: 'auto', 
              maxHeight: '200px', 
              backgroundColor: '#f8f8f8',
              padding: '10px',
              margin: '10px 0',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({
              hasError: false,
              error: null,
              errorInfo: null,
              renderCount: 0
            })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd79a8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '10px'
            }}
          >
            🔄 Manual Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary; 