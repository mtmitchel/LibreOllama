// src/utils/performance/index.ts
/**
 * Performance monitoring utilities for LibreOllama Canvas
 * Centralized exports for all performance monitoring components
 */

// Core performance monitoring
export {
  PerformanceMonitor,
  recordMetric,
  startTiming,
  measureFunction,
  recordMemoryUsage,
  type PerformanceMetric,
  type PerformanceThresholds
} from './PerformanceMonitor';

// Render time tracking
export {
  RenderTimeTracker,
  useRenderTimeTracker,
  withRenderTracking,
  trackRenderTime,
  type RenderProfile
} from './RenderTimeTracker';

// Memory usage monitoring
export {
  MemoryUsageMonitor,
  type MemorySnapshot,
  type MemoryLeakDetection
} from './MemoryUsageMonitor';

// Canvas-specific profiling
export {
  CanvasProfiler,
  profileCanvasFunction,
  profileElementRender,
  profileTextEdit,
  profileInteraction,
  type CanvasOperation,
  type CanvasPerformanceReport
} from './CanvasProfiler';

// Comprehensive metrics collection
export {
  MetricsCollector,
  type ComprehensivePerformanceReport,
  type PerformanceAlert
} from './MetricsCollector';

// Memory leak detection
export {
  MemoryLeakDetector,
  useMemoryLeakDetector,
  type LeakReport,
  type TrackedResource
} from './MemoryLeakDetector';

// Canvas performance profiling
export {
  CanvasPerformanceProfiler,
  profileCanvasOperation,
  profileCanvasOperationAsync,
  type PerformanceProfile
} from './CanvasPerformanceProfiler';

// Convenience function to enable all monitoring
export function enableAllPerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    (window as any).__ENABLE_PERFORMANCE_MONITORING = true;
    (window as any).__ENABLE_RENDER_TRACKING = true;
    (window as any).__ENABLE_MEMORY_MONITORING = true;
    (window as any).__ENABLE_CANVAS_PROFILING = true;
    (window as any).__ENABLE_METRICS_COLLECTION = true;
  }
}

// Convenience function to disable all monitoring
export function disableAllPerformanceMonitoring(): void {
  // Import locally to avoid circular dependencies
  const { PerformanceMonitor } = require('./PerformanceMonitor');
  const { RenderTimeTracker } = require('./RenderTimeTracker');
  const { MemoryUsageMonitor } = require('./MemoryUsageMonitor');
  const { CanvasProfiler } = require('./CanvasProfiler');
  const { MetricsCollector } = require('./MetricsCollector');
  
  PerformanceMonitor.setEnabled(false);
  RenderTimeTracker.setEnabled(false);
  MemoryUsageMonitor.setEnabled(false);
  CanvasProfiler.setEnabled(false);
  MetricsCollector.setEnabled(false);
}

// Get a comprehensive performance snapshot
export function getPerformanceSnapshot() {
  // Import locally to avoid circular dependencies
  const { PerformanceMonitor } = require('./PerformanceMonitor');
  const { RenderTimeTracker } = require('./RenderTimeTracker');
  const { MemoryUsageMonitor } = require('./MemoryUsageMonitor');
  const { CanvasProfiler } = require('./CanvasProfiler');
  const { MetricsCollector } = require('./MetricsCollector');
  
  return {
    timestamp: performance.now(),
    general: PerformanceMonitor.generateReport(),
    rendering: RenderTimeTracker.generateReport(),
    memory: MemoryUsageMonitor.generateReport(),
    canvas: CanvasProfiler.generateReport(),
    comprehensive: MetricsCollector.generateComprehensiveReport()
  };
}

// Performance monitoring hooks for React components
export function usePerformanceMonitoring() {
  const React = require('react');
  const { MetricsCollector } = require('./MetricsCollector');
  
  const [performanceData, setPerformanceData] = React.useState(() => getPerformanceSnapshot());
  
  React.useEffect(() => {    const unsubscribe = MetricsCollector.subscribe((_report: any) => {
      setPerformanceData(getPerformanceSnapshot());
    });
    
    return unsubscribe;
  }, []);
  
  return performanceData;
}