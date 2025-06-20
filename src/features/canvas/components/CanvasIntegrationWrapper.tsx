/**
 * Canvas Integration Wrapper
 * Provides seamless transition between legacy and refactored canvas components
 * 
 * This wrapper:
 * - Uses feature flags to control which canvas implementation is active
 * - Maintains API compatibility between old and new systems
 * - Provides fallback mechanisms for safety
 * - Enables A/B testing and gradual rollout
 */

import React, { useState, useEffect, useMemo } from 'react';
import Konva from 'konva';
import { useCanvasFeatureFlag } from '../utils/featureFlags';

// Import both canvas implementations
import LegacyKonvaCanvas from './KonvaCanvas'; // Existing implementation
import RefactoredKonvaCanvas from './KonvaCanvasRefactored'; // New implementation

// Shared props interface that both implementations must support
interface CanvasWrapperProps {
  width: number;
  height: number;
  onElementSelect?: (element: any) => void;
  panZoomState: {
    scale: number;
    position: { x: number; y: number };
  };
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

/**
 * Main Canvas Integration Component
 * Switches between legacy and refactored implementations based on feature flags
 */
export const CanvasIntegrationWrapper: React.FC<CanvasWrapperProps> = (props) => {
  const useRefactoredCanvas = useCanvasFeatureFlag('useRefactoredCanvas');
  const enablePerformanceMonitoring = useCanvasFeatureFlag('enablePerformanceMonitoring');
  
  // Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    renderTime: number;
    component: 'legacy' | 'refactored';
    timestamp: number;
  } | null>(null);

  // Error boundary state for fallback handling
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setPerformanceMetrics({
        renderTime,
        component: useRefactoredCanvas && !hasError ? 'refactored' : 'legacy',
        timestamp: Date.now()
      });

      // Log performance metrics for analysis
      console.log(`Canvas Render Performance [${useRefactoredCanvas && !hasError ? 'Refactored' : 'Legacy'}]:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    };
  }, [useRefactoredCanvas, hasError, enablePerformanceMonitoring]);

  // Error handling with automatic fallback
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Canvas Error:', error);
    console.error('Error Info:', errorInfo);
    
    setHasError(true);
    setErrorInfo(error.message + (errorInfo ? ` | ${errorInfo}` : ''));
    
    // Report error for monitoring (could integrate with error tracking service)
    if (enablePerformanceMonitoring) {
      console.warn('Falling back to legacy canvas due to error:', error.message);
    }
  };

  // Memoized component selection to prevent unnecessary re-renders
  const CanvasComponent = useMemo(() => {
    // Always use legacy canvas if there's an error or feature flag is disabled
    if (hasError || !useRefactoredCanvas) {
      console.log(`🔄 Canvas Integration: Using LEGACY canvas`, {
        hasError,
        useRefactoredCanvas,
        reason: hasError ? 'error fallback' : 'feature flag disabled'
      });
      return LegacyKonvaCanvas;
    }
    
    console.log(`✨ Canvas Integration: Using REFACTORED canvas with new coordinate system`);
    return RefactoredKonvaCanvas;
  }, [useRefactoredCanvas, hasError]);

  // Enhanced props for refactored canvas (when applicable)
  const enhancedProps = useMemo(() => {
    if (hasError || !useRefactoredCanvas) {
      return props; // Pass through original props for legacy canvas
    }

    // For refactored canvas, we can add additional props or transformations here
    return {
      ...props,
      // Add any refactored-specific props
      performanceMonitoring: enablePerformanceMonitoring,
      onError: handleError,
    };
  }, [props, useRefactoredCanvas, hasError, enablePerformanceMonitoring]);

  // Error boundary wrapper for refactored canvas
  if (useRefactoredCanvas && !hasError) {
    return (
      <CanvasErrorBoundary onError={handleError}>
        <CanvasComponent {...enhancedProps} />
        {enablePerformanceMonitoring && <PerformanceOverlay metrics={performanceMetrics} />}
      </CanvasErrorBoundary>
    );
  }

  // Legacy canvas (no error boundary needed - it's proven stable)
  return (
    <>
      <CanvasComponent {...props} />
      {enablePerformanceMonitoring && <PerformanceOverlay metrics={performanceMetrics} />}
      {hasError && <ErrorNotification error={errorInfo} />}
    </>
  );
};

/**
 * Error Boundary Component for Refactored Canvas
 * Catches errors and triggers fallback to legacy canvas
 */
interface CanvasErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error, errorInfo?: string) => void;
}

class CanvasErrorBoundary extends React.Component<
  CanvasErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, errorInfo.componentStack || 'Unknown error location');
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="canvas-error-fallback">
          <p>Canvas error detected. Falling back to stable version...</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Performance Monitoring Overlay (Development Only)
 */
const PerformanceOverlay: React.FC<{
  metrics: { renderTime: number; component: string; timestamp: number } | null;
}> = ({ metrics }) => {
  if (!metrics || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
      <div>Canvas: {metrics.component}</div>
      <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
      <div className={metrics.renderTime < 50 ? 'text-green-400' : metrics.renderTime < 100 ? 'text-yellow-400' : 'text-red-400'}>
        {metrics.renderTime < 50 ? '✓ Excellent' : metrics.renderTime < 100 ? '⚠ Good' : '⚠ Slow'}
      </div>
    </div>
  );
};

/**
 * Error Notification Component
 */
const ErrorNotification: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded shadow-lg max-w-sm z-50">
      <div className="font-semibold">Canvas Error (Fallback Active)</div>
      <div className="text-sm mt-1">{error}</div>
      <button 
        className="text-xs underline mt-2"
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
    </div>
  );
};

/**
 * Development Utilities for Testing Integration
 */
export const CanvasIntegrationUtils = {
  /**
   * Force enable refactored canvas for testing
   */
  enableRefactored: () => {
    const url = new URL(window.location.href);
    url.searchParams.set('refactored-canvas', 'true');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  },

  /**
   * Force disable refactored canvas (use legacy)
   */
  enableLegacy: () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('refactored-canvas');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  },

  /**
   * Get current canvas mode
   */
  getCurrentMode: (): 'legacy' | 'refactored' => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('refactored-canvas') === 'true' ? 'refactored' : 'legacy';
  },

  /**
   * Performance comparison utility
   */
  runPerformanceComparison: async () => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Performance comparison not available in production');
      return;
    }

    console.log('Starting canvas performance comparison...');
    
    // This would require more sophisticated testing setup
    // For now, just log the current mode
    console.log(`Current mode: ${CanvasIntegrationUtils.getCurrentMode()}`);
    console.log('Switch modes using URL parameter: ?refactored-canvas=true');
  }
};

export default CanvasIntegrationWrapper;
