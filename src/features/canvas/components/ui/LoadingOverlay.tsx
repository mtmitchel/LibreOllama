/**
 * Loading Overlay Component for Canvas Operations
 * Provides visual feedback during canvas operations
 */

import React from 'react';
import './LoadingOverlay.css';

export interface CanvasLoadingState {
  isLoading: boolean;
  operation?: 'saving' | 'loading' | 'processing' | 'exporting' | 'importing' | undefined;
  progress?: number | undefined;
  message?: string | undefined;
  details?: string | undefined;
}

interface LoadingOverlayProps {
  state: CanvasLoadingState;
  className?: string;
  style?: React.CSSProperties;
}

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  className = '', 
  showPercentage = true 
}) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={`progress-bar-container ${className}`}>
      <div className="progress-bar">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showPercentage && (
        <span className="progress-percentage">{percentage}%</span>
      )}
    </div>
  );
};

const Spinner: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  return (
    <div className={`spinner spinner-${size}`} role="status" aria-label="Loading">
      <div className="spinner-inner" />
    </div>
  );
};

/**
 * Main loading overlay component
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  state, 
  className = '',
  style = {}
}) => {
  if (!state.isLoading) return null;

  const getOperationMessage = (operation?: string): string => {
    switch (operation) {
      case 'saving':
        return 'Saving canvas...';
      case 'loading':
        return 'Loading canvas...';
      case 'processing':
        return 'Processing...';
      case 'exporting':
        return 'Exporting canvas...';
      case 'importing':
        return 'Importing data...';
      default:
        return 'Loading...';
    }
  };

  const operationMessage = state.message || getOperationMessage(state.operation);

  return (
    <div 
      className={`canvas-loading-overlay ${className}`}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="loading-backdrop" />
      <div className="loading-content">
        <Spinner size="large" />
        
        <div className="loading-text">
          <h3 className="loading-title">{operationMessage}</h3>
          
          {state.details && (
            <p className="loading-details">{state.details}</p>
          )}
          
          {state.progress !== undefined && (
            <ProgressBar 
              value={state.progress} 
              max={100}
              className="loading-progress"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Compact loading indicator for smaller operations
 */
export const CompactLoadingIndicator: React.FC<{
  isLoading: boolean;
  message?: string;
  className?: string;
}> = ({ isLoading, message = 'Loading...', className = '' }) => {
  if (!isLoading) return null;

  return (
    <div className={`compact-loading-indicator ${className}`}>
      <Spinner size="small" />
      <span className="compact-loading-text">{message}</span>
    </div>
  );
};

/**
 * Progress indicator for operations with known duration
 */
export const ProgressIndicator: React.FC<{
  progress: number;
  total: number;
  operation: string;
  className?: string;
}> = ({ progress, total, operation, className = '' }) => {
  return (
    <div className={`progress-indicator ${className}`}>
      <div className="progress-header">
        <span className="progress-operation">{operation}</span>
        <span className="progress-count">{progress} / {total}</span>
      </div>
      <ProgressBar 
        value={progress} 
        max={total}
        showPercentage={false}
      />
    </div>
  );
};

/**
 * Hook for managing canvas loading states
 */
export function useCanvasLoading() {
  const [loadingState, setLoadingState] = React.useState<CanvasLoadingState>({
    isLoading: false
  });

  const startLoading = React.useCallback((
    operation?: CanvasLoadingState['operation'],
    message?: string,
    details?: string
  ) => {
    setLoadingState({
      isLoading: true,
      operation,
      message,
      details
    });
  }, []);

  const updateProgress = React.useCallback((progress: number, details?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      details: details || prev.details
    }));
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoadingState({
      isLoading: false
    });
  }, []);

  const setError = React.useCallback((message: string) => {
    setLoadingState({
      isLoading: false,
      operation: 'processing',
      message: `Error: ${message}`
    });
  }, []);

  return {
    loadingState,
    startLoading,
    updateProgress,
    stopLoading,
    setError
  };
}

/**
 * Higher-order component for wrapping components with loading capability
 */
export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return React.forwardRef<any, P & { loadingState?: CanvasLoadingState }>((props, ref) => {
    const { loadingState, ...otherProps } = props;
    
    return (
      <div className="with-loading-container">
        <WrappedComponent {...(otherProps as P)} ref={ref} />
        {loadingState && <LoadingOverlay state={loadingState} />}
      </div>
    );
  });
}

export default LoadingOverlay;
