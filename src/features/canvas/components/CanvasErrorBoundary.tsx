import React from 'react';
import { logger } from '../../../lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class CanvasErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[CanvasErrorBoundary] Canvas rendering error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    console.error('[CanvasErrorBoundary] Canvas rendering error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full w-full bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Canvas Error</h2>
              <p className="text-red-600 mb-4">
                {this.state.error?.message || 'An error occurred while rendering the canvas'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  // Try to recover by reloading the page
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Canvas
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}