import { useCallback, useEffect, useState } from 'react';

// Memory stats interface
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  elementCount: number;
  renderTime: number;
}

// Memory alert interface
export interface MemoryAlert {
  id: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: number;
  suggestion?: string;
}

// Performance thresholds
const MEMORY_THRESHOLDS = {
  WARNING: 0.7, // 70% of heap limit
  ERROR: 0.9,   // 90% of heap limit
  ELEMENT_WARNING: 1000,
  ELEMENT_ERROR: 2000,
};

/**
 * Hook for monitoring canvas memory usage and performance
 */
export function useCanvasMemoryStats(elementCount: number = 0) {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    elementCount,
    renderTime: 0,
  });

  const updateMemoryStats = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const startTime = performance.now();
      
      setMemoryStats(prev => ({
        ...prev,
        usedJSHeapSize: memory.usedJSHeapSize || 0,
        totalJSHeapSize: memory.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
        elementCount,
        renderTime: performance.now() - startTime,
      }));
    } else {
      // Fallback for browsers without memory API
      setMemoryStats(prev => ({
        ...prev,
        elementCount,
        renderTime: 0,
      }));
    }
  }, [elementCount]);

  useEffect(() => {
    updateMemoryStats();
    const interval = setInterval(updateMemoryStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateMemoryStats]);

  return memoryStats;
}

/**
 * Hook for generating memory alerts based on performance thresholds
 */
export function useMemoryAlerts(memoryStats: MemoryStats) {
  const [alerts, setAlerts] = useState<MemoryAlert[]>([]);

  useEffect(() => {
    const newAlerts: MemoryAlert[] = [];

    // Check memory usage
    if (memoryStats.jsHeapSizeLimit > 0) {
      const memoryUsageRatio = memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit;
      
      if (memoryUsageRatio > MEMORY_THRESHOLDS.ERROR) {
        newAlerts.push({
          id: `memory-error-${Date.now()}`,
          type: 'error',
          message: `Critical memory usage: ${Math.round(memoryUsageRatio * 100)}%`,
          timestamp: Date.now(),
          suggestion: 'Consider reducing canvas elements or clearing unused data',
        });
      } else if (memoryUsageRatio > MEMORY_THRESHOLDS.WARNING) {
        newAlerts.push({
          id: `memory-warning-${Date.now()}`,
          type: 'warning',
          message: `High memory usage: ${Math.round(memoryUsageRatio * 100)}%`,
          timestamp: Date.now(),
          suggestion: 'Monitor memory usage and consider optimizations',
        });
      }
    }

    // Check element count
    if (memoryStats.elementCount > MEMORY_THRESHOLDS.ELEMENT_ERROR) {
      newAlerts.push({
        id: `elements-error-${Date.now()}`,
        type: 'error',
        message: `Too many elements: ${memoryStats.elementCount}`,
        timestamp: Date.now(),
        suggestion: 'Consider grouping elements or using pagination',
      });
    } else if (memoryStats.elementCount > MEMORY_THRESHOLDS.ELEMENT_WARNING) {
      newAlerts.push({
        id: `elements-warning-${Date.now()}`,
        type: 'warning',
        message: `Many elements: ${memoryStats.elementCount}`,
        timestamp: Date.now(),
        suggestion: 'Monitor performance and consider optimizations',
      });
    }

    setAlerts(newAlerts);
  }, [memoryStats]);

  return alerts;
}

/**
 * Main performance monitoring hook that combines memory stats and alerts
 */
export function useCanvasPerformance(elementCount: number = 0) {
  const memoryStats = useCanvasMemoryStats(elementCount);
  const alerts = useMemoryAlerts(memoryStats);

  return {
    memoryStats,
    alerts,
    isHealthy: alerts.length === 0,
    hasWarnings: alerts.some(alert => alert.type === 'warning'),
    hasErrors: alerts.some(alert => alert.type === 'error'),
  };
}

// Export default for backward compatibility
export default useCanvasPerformance;
