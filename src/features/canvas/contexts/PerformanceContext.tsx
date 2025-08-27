/**
 * Performance Context Provider
 * Centralized performance monitoring for the entire canvas system
 */

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { 
  canvasPerformanceMonitor, 
  startPerformanceMonitoring, 
  stopPerformanceMonitoring,
  getPerformanceReport,
  exportPerformanceData 
} from '../utils/performance/performanceMonitor';
import { canvasLog } from '../utils/canvasLogger';

interface PerformanceContextValue {
  // State
  isMonitoring: boolean;
  performanceData: any;
  
  // Control
  startMonitoring: (thresholds?: any) => void;
  stopMonitoring: () => void;
  refreshData: () => void;
  
  // Markers
  markCanvasReady: () => void;
  markToolbarReady: () => void;
  markFirstInteraction: () => void;
  markToolSwitch: (toolName: string) => void;
  markElementCreation: (elementType: string, creationTime: number) => void;
  
  // Measurement
  measureOperation: <T>(name: string, operation: () => T) => T;
  measureAsyncOperation: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
  
  // Reporting
  exportData: () => void;
  getReport: () => any;
  
  // Configuration
  setThresholds: (thresholds: any) => void;
  
  // Dashboard
  showDashboard: boolean;
  toggleDashboard: () => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

interface PerformanceProviderProps {
  children: ReactNode;
  autoStart?: boolean;
  updateInterval?: number;
  enableDashboard?: boolean;
  defaultThresholds?: any;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
  children,
  autoStart = true,
  updateInterval = 2000,
  enableDashboard = process.env.NODE_ENV === 'development',
  defaultThresholds
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const updateIntervalRef = useRef<number | null>(null);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart && process.env.NODE_ENV === 'development') {
      handleStartMonitoring(defaultThresholds);
    }

    // Cleanup on unmount
    return () => {
      if (isMonitoring) {
        handleStopMonitoring();
      }
    };
  }, [autoStart, defaultThresholds]);

  // Performance data updates
  useEffect(() => {
    if (!isMonitoring) return;

    const updateData = () => {
      try {
        const report = getPerformanceReport();
        setPerformanceData(report);
      } catch (error) {
        canvasLog.error('Failed to update performance data:', error);
      }
    };

    updateData(); // Initial update
    updateIntervalRef.current = window.setInterval(updateData, updateInterval);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isMonitoring, updateInterval]);

  // Control functions
  const handleStartMonitoring = (thresholds?: any) => {
    if (isMonitoring) return;

    try {
      startPerformanceMonitoring(thresholds);
      setIsMonitoring(true);
      canvasLog.info('🚀 Performance monitoring started from context');
    } catch (error) {
      canvasLog.error('Failed to start performance monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    if (!isMonitoring) return;

    try {
      stopPerformanceMonitoring();
      setIsMonitoring(false);
      setPerformanceData(null);
      canvasLog.info('🛑 Performance monitoring stopped from context');
    } catch (error) {
      canvasLog.error('Failed to stop performance monitoring:', error);
    }
  };

  const refreshData = () => {
    if (!isMonitoring) return;

    try {
      const report = getPerformanceReport();
      setPerformanceData(report);
    } catch (error) {
      canvasLog.error('Failed to refresh performance data:', error);
    }
  };

  // Marker functions
  const markCanvasReady = () => {
    if (!isMonitoring) return;
    canvasPerformanceMonitor.markCanvasReady();
  };

  const markToolbarReady = () => {
    if (!isMonitoring) return;
    canvasPerformanceMonitor.markToolbarReady();
  };

  const markFirstInteraction = () => {
    if (!isMonitoring) return;
    canvasPerformanceMonitor.markFirstInteraction();
  };

  const markToolSwitch = (toolName: string) => {
    if (!isMonitoring) return;
    canvasPerformanceMonitor.markToolSwitch(toolName);
  };

  const markElementCreation = (elementType: string, creationTime: number) => {
    if (!isMonitoring) return;
    canvasPerformanceMonitor.markElementCreation(elementType, creationTime);
  };

  // Measurement functions
  const measureOperation = <T,>(name: string, operation: () => T): T => {
    if (!isMonitoring) return operation();

    const startTime = performance.now();
    try {
      const result = operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      canvasLog.debug(`⏱️ Operation '${name}' completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      canvasLog.error(`❌ Operation '${name}' failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  const measureAsyncOperation = async <T,>(name: string, operation: () => Promise<T>): Promise<T> => {
    if (!isMonitoring) return operation();

    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      canvasLog.debug(`⏱️ Async operation '${name}' completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      canvasLog.error(`❌ Async operation '${name}' failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  // Reporting functions
  const exportData = () => {
    try {
      const data = exportPerformanceData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas-performance-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      canvasLog.info('📥 Performance data exported successfully');
    } catch (error) {
      canvasLog.error('Failed to export performance data:', error);
    }
  };

  const getReport = () => {
    try {
      return getPerformanceReport();
    } catch (error) {
      canvasLog.error('Failed to get performance report:', error);
      return null;
    }
  };

  // Configuration
  const setThresholds = (thresholds: any) => {
    try {
      canvasPerformanceMonitor.setThresholds(thresholds);
    } catch (error) {
      canvasLog.error('Failed to set performance thresholds:', error);
    }
  };

  // Dashboard control
  const toggleDashboard = () => {
    if (!enableDashboard) {
      canvasLog.warn('Performance dashboard is disabled');
      return;
    }
    setShowDashboard(!showDashboard);
  };

  // Keyboard shortcut for dashboard
  useEffect(() => {
    if (!enableDashboard) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle performance dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        toggleDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableDashboard]);

  const contextValue: PerformanceContextValue = {
    // State
    isMonitoring,
    performanceData,
    
    // Control
    startMonitoring: handleStartMonitoring,
    stopMonitoring: handleStopMonitoring,
    refreshData,
    
    // Markers
    markCanvasReady,
    markToolbarReady,
    markFirstInteraction,
    markToolSwitch,
    markElementCreation,
    
    // Measurement
    measureOperation,
    measureAsyncOperation,
    
    // Reporting
    exportData,
    getReport,
    
    // Configuration
    setThresholds,
    
    // Dashboard
    showDashboard,
    toggleDashboard
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {/* Performance Dashboard */}
      {enableDashboard && showDashboard && (
        <div style={{ position: 'relative', zIndex: 10000 }}>
          {/* Lazy load dashboard component to avoid circular dependencies */}
        </div>
      )}
    </PerformanceContext.Provider>
  );
};

// Hook to use performance context
export const usePerformanceContext = (): PerformanceContextValue => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};

// HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const performance = usePerformanceContext();
    const renderStartTime = useRef(window.performance.now());
    
    useEffect(() => {
      const renderTime = window.performance.now() - renderStartTime.current;
      canvasLog.debug(`🎯 Component '${componentName}' mounted in ${renderTime.toFixed(2)}ms`);
    }, []);
    
    return <WrappedComponent {...(props as any)} ref={ref} />;
  });
}

// Development helper to show performance warnings
export const PerformanceWarnings: React.FC = () => {
  const { performanceData, isMonitoring } = usePerformanceContext();
  const [warnings, setWarnings] = useState<string[]>([]);
  
  useEffect(() => {
    if (!isMonitoring || !performanceData) return;
    
    const newWarnings: string[] = [];
    
    if (performanceData.avgFPS < 45) {
      newWarnings.push(`Low FPS: ${performanceData.avgFPS.toFixed(1)}`);
    }
    
    if (performanceData.memoryUsage > 200) {
      newWarnings.push(`High memory usage: ${performanceData.memoryUsage.toFixed(1)}MB`);
    }
    
    if (performanceData.frameDrops > 5) {
      newWarnings.push(`Frame drops detected: ${performanceData.frameDrops}`);
    }
    
    setWarnings(newWarnings);
  }, [performanceData, isMonitoring]);
  
  if (process.env.NODE_ENV !== 'development' || warnings.length === 0) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      backgroundColor: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: 6,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: 300
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>⚠️ Performance Warnings</div>
      {warnings.map((warning, index) => (
        <div key={index}>• {warning}</div>
      ))}
    </div>
  );
};

export default PerformanceProvider;