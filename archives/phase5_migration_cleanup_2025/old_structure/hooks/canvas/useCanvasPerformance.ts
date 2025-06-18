// src/hooks/canvas/useCanvasPerformance.ts
import { useCallback, useEffect, useState } from 'react';
import { PerformanceMonitor, recordMetric } from '../utils/performance';

interface CanvasPerformanceMetrics {
  renderTime: number;
  elementCount: number;
  memoryUsage: number;
  fps: number;
  lastUpdate: number;
}

interface UseCanvasPerformanceOptions {
  enableLogging?: boolean;
  sampleSize?: number;
  throttleInterval?: number;
}

/**
 * useCanvasPerformance - Performance monitoring hook for canvas operations
 * - Integrates with existing performance monitoring system
 * - Tracks render times, element counts, memory usage
 * - Provides performance optimization recommendations
 */
export const useCanvasPerformance = (options: UseCanvasPerformanceOptions = {}) => {
  const {
    enableLogging = false,
    sampleSize = 60,
    throttleInterval = 1000
  } = options;

  const [metrics, setMetrics] = useState<CanvasPerformanceMetrics>({
    renderTime: 0,
    elementCount: 0,
    memoryUsage: 0,
    fps: 0,
    lastUpdate: Date.now()
  });

  const [renderTimes, setRenderTimes] = useState<number[]>([]);

  // Record render time for a canvas operation
  const recordRenderTime = useCallback((renderTime: number, elementCount: number = 0) => {
    setRenderTimes(prev => {
      const newTimes = [...prev, renderTime];
      if (newTimes.length > sampleSize) {
        newTimes.shift(); // Remove oldest sample
      }
      return newTimes;
    });

    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : renderTime;

    setMetrics(prev => ({
      ...prev,
      renderTime: avgRenderTime,
      elementCount,
      lastUpdate: Date.now()
    }));

    // Record metric in the global performance system
    recordMetric('canvasRender', renderTime, 'canvas', {
      elementCount: elementCount.toString(),
      avgRenderTime: avgRenderTime.toString()
    });

    if (enableLogging && renderTime > 16) { // Log slow renders (>16ms for 60fps)
      console.warn('🐌 [CANVAS PERFORMANCE] Slow render detected:', {
        renderTime: `${renderTime.toFixed(2)}ms`,
        elementCount,
        avgRenderTime: `${avgRenderTime.toFixed(2)}ms`
      });
    }
  }, [renderTimes, sampleSize, enableLogging]);

  // Start timing a render operation
  const startRenderTiming = useCallback(() => {
    return PerformanceMonitor.startTiming('canvasRender');
  }, []);

  // Update memory usage
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsageMB = memInfo.usedJSHeapSize / (1024 * 1024);
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryUsageMB
      }));

      recordMetric('canvasMemory', memoryUsageMB, 'canvas');
    }
  }, []);

  // Calculate FPS from render times
  useEffect(() => {
    if (renderTimes.length > 10) {
      const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const fps = avgRenderTime > 0 ? Math.min(60, 1000 / avgRenderTime) : 60;
      
      setMetrics(prev => ({
        ...prev,
        fps
      }));
    }
  }, [renderTimes]);

  // Throttled memory usage updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateMemoryUsage();
    }, throttleInterval);

    return () => clearInterval(interval);
  }, [updateMemoryUsage, throttleInterval]);

  // Performance optimization recommendations
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.renderTime > 16) {
      recommendations.push('Consider reducing element count or implementing viewport culling');
    }

    if (metrics.elementCount > 1000) {
      recommendations.push('Large number of elements detected - enable viewport culling');
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push('High memory usage - consider element pooling or cleanup');
    }

    if (metrics.fps < 30) {
      recommendations.push('Low FPS detected - optimize render pipeline');
    }

    return recommendations;
  }, [metrics]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    return {
      ...metrics,
      isPerformanceGood: metrics.renderTime < 16 && metrics.fps > 45,
      recommendations: getOptimizationRecommendations()
    };
  }, [metrics, getOptimizationRecommendations]);

  return {
    metrics,
    recordRenderTime,
    startRenderTiming,
    updateMemoryUsage,
    getOptimizationRecommendations,
    getPerformanceSummary
  };
};
