/**
 * React hook for canvas performance monitoring
 * Provides easy integration with the enhanced performance monitor
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  canvasPerformanceMonitor,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  markCanvasReady,
  markToolbarReady,
  markFirstInteraction,
  markToolSwitch,
  markElementCreation,
  recordRenderingTime,
  getPerformanceReport,
  measurePerformance,
  measureAsyncPerformance
} from '../utils/performance/performanceMonitor';
import { canvasLog } from '../utils/canvasLogger';

interface PerformanceMonitoringConfig {
  enabled?: boolean;
  autoStart?: boolean;
  customThresholds?: {
    maxFrameTime?: number;
    maxInteractionLatency?: number;
    maxMemoryUsage?: number;
    maxElementCreationTime?: number;
    targetFPS?: number;
  };
}

const DEFAULT_CONFIG: PerformanceMonitoringConfig = {
  enabled: true,
  autoStart: true,
  customThresholds: {
    maxFrameTime: 16.67, // 60fps
    maxInteractionLatency: 100,
    maxMemoryUsage: 256,
    maxElementCreationTime: 50,
    targetFPS: 60
  }
};

export function usePerformanceMonitoring(
  componentName: string,
  config: PerformanceMonitoringConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const isMonitoringRef = useRef(false);
  const componentStartTime = useRef(performance.now());

  // Initialize performance monitoring
  useEffect(() => {
    if (!mergedConfig.enabled) return;

    if (mergedConfig.autoStart && !isMonitoringRef.current) {
      startPerformanceMonitoring(mergedConfig.customThresholds);
      isMonitoringRef.current = true;
      canvasLog.info(`🔍 [${componentName}] Performance monitoring started`);
    }

    return () => {
      if (isMonitoringRef.current) {
        stopPerformanceMonitoring();
        isMonitoringRef.current = false;
        canvasLog.info(`🔍 [${componentName}] Performance monitoring stopped`);
      }
    };
  }, [mergedConfig.enabled, mergedConfig.autoStart, componentName]);

  // Mark component as ready
  const markComponentReady = useCallback((readyType: 'canvas' | 'toolbar' | 'interaction') => {
    if (!mergedConfig.enabled) return;

    const readyTime = performance.now() - componentStartTime.current;
    canvasLog.debug(`✅ [${componentName}] ${readyType} ready in ${readyTime.toFixed(2)}ms`);

    switch (readyType) {
      case 'canvas':
        markCanvasReady();
        break;
      case 'toolbar':
        markToolbarReady();
        break;
      case 'interaction':
        markFirstInteraction();
        break;
    }
  }, [mergedConfig.enabled, componentName]);

  // Track tool performance
  const trackToolSwitch = useCallback((toolName: string) => {
    if (!mergedConfig.enabled) return;
    markToolSwitch(toolName);
  }, [mergedConfig.enabled]);

  // Track element creation performance
  const trackElementCreation = useCallback((elementType: string) => {
    if (!mergedConfig.enabled) return;

    return {
      start: () => performance.now(),
      end: (startTime: number) => {
        const creationTime = performance.now() - startTime;
        markElementCreation(elementType, creationTime);
        return creationTime;
      }
    };
  }, [mergedConfig.enabled]);

  // Track rendering performance
  const trackRenderingPerformance = useCallback(() => {
    if (!mergedConfig.enabled) return null;

    const startTime = performance.now();
    
    return {
      end: () => {
        const renderTime = performance.now() - startTime;
        recordRenderingTime(renderTime);
        return renderTime;
      }
    };
  }, [mergedConfig.enabled]);

  // Measure operation performance
  const measureOperation = useCallback(<T>(operationName: string, operation: () => T): T => {
    if (!mergedConfig.enabled) return operation();
    
    return measurePerformance(`${componentName}-${operationName}`, operation);
  }, [mergedConfig.enabled, componentName]);

  // Measure async operation performance
  const measureAsyncOperation = useCallback(async <T>(
    operationName: string, 
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!mergedConfig.enabled) return operation();
    
    return measureAsyncPerformance(`${componentName}-${operationName}`, operation);
  }, [mergedConfig.enabled, componentName]);

  // Get performance report
  const getReport = useCallback(() => {
    if (!mergedConfig.enabled) return null;
    return getPerformanceReport();
  }, [mergedConfig.enabled]);

  // Log performance summary
  const logSummary = useCallback(() => {
    if (!mergedConfig.enabled) return;
    const report = getPerformanceReport();
    
    canvasLog.group(`📊 [${componentName}] Performance Summary`);
    canvasLog.info('Performance metrics:', report);
    canvasLog.groupEnd();
  }, [mergedConfig.enabled, componentName]);

  // Performance warning system
  const checkPerformanceWarnings = useCallback(() => {
    if (!mergedConfig.enabled) return [];

    const report = getPerformanceReport();
    const warnings: string[] = [];

    if (report.avgFPS < (mergedConfig.customThresholds?.targetFPS || 60) * 0.8) {
      warnings.push(`Low FPS: ${report.avgFPS.toFixed(1)} (target: ${mergedConfig.customThresholds?.targetFPS || 60})`);
    }

    if (report.frameDrops > 10) {
      warnings.push(`High frame drops: ${report.frameDrops}`);
    }

    if (report.memoryUsage > (mergedConfig.customThresholds?.maxMemoryUsage || 256)) {
      warnings.push(`High memory usage: ${report.memoryUsage.toFixed(2)}MB`);
    }

    if (report.interactionLatency.average > (mergedConfig.customThresholds?.maxInteractionLatency || 100)) {
      warnings.push(`High interaction latency: ${report.interactionLatency.average.toFixed(2)}ms`);
    }

    return warnings;
  }, [mergedConfig.enabled, mergedConfig.customThresholds]);

  return {
    // State
    isMonitoring: isMonitoringRef.current && mergedConfig.enabled,
    
    // Lifecycle markers
    markComponentReady,
    
    // Performance tracking
    trackToolSwitch,
    trackElementCreation,
    trackRenderingPerformance,
    
    // Measurement utilities
    measureOperation,
    measureAsyncOperation,
    
    // Reporting
    getReport,
    logSummary,
    checkPerformanceWarnings,
    
    // Configuration
    config: mergedConfig
  };
}

/**
 * Hook for tracking specific canvas operations
 */
export function useCanvasOperationTracking() {
  const operationTimes = useRef<Map<string, number>>(new Map());
  
  const startOperation = useCallback((operationName: string) => {
    operationTimes.current.set(operationName, performance.now());
  }, []);
  
  const endOperation = useCallback((operationName: string) => {
    const startTime = operationTimes.current.get(operationName);
    if (!startTime) {
      canvasLog.warn(`Operation '${operationName}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    operationTimes.current.delete(operationName);
    
    canvasLog.debug(`🎯 [CanvasOperation] ${operationName} completed in ${duration.toFixed(2)}ms`);
    
    return duration;
  }, []);
  
  const isOperationInProgress = useCallback((operationName: string) => {
    return operationTimes.current.has(operationName);
  }, []);
  
  return {
    startOperation,
    endOperation,
    isOperationInProgress
  };
}

/**
 * Hook for monitoring component render performance
 */
export function useRenderPerformanceTracking(componentName: string) {
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);
  const lastRenderTime = useRef(0);
  
  useEffect(() => {
    const renderStart = performance.now();
    
    return () => {
      const renderEnd = performance.now();
      const renderDuration = renderEnd - renderStart;
      
      renderCount.current++;
      totalRenderTime.current += renderDuration;
      lastRenderTime.current = renderDuration;
      
      // Log slow renders
      if (renderDuration > 16.67) { // Slower than 60fps
        canvasLog.warn(`🐌 [RenderTracking] Slow render in ${componentName}`, {
          duration: `${renderDuration.toFixed(2)}ms`,
          renderCount: renderCount.current
        });
      }
      
      // Periodic reporting
      if (renderCount.current % 100 === 0) {
        const avgRenderTime = totalRenderTime.current / renderCount.current;
        canvasLog.info(`📈 [RenderTracking] ${componentName} render stats`, {
          renderCount: renderCount.current,
          avgRenderTime: `${avgRenderTime.toFixed(2)}ms`,
          lastRenderTime: `${renderDuration.toFixed(2)}ms`
        });
      }
    };
  });
  
  const getRenderStats = useCallback(() => ({
    renderCount: renderCount.current,
    totalRenderTime: totalRenderTime.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0,
    lastRenderTime: lastRenderTime.current
  }), []);
  
  return {
    getRenderStats
  };
}