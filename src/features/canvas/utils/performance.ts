// src/features/canvas/utils/performance.ts
// Simplified performance monitoring for canvas operations
// Replaces 16 duplicate performance monitoring files

import { performanceLogger } from '../../../core/lib/logger'; // Import performanceLogger

export interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  threshold: number;
  current: number;
}

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercent: number;
}

export const canvasMetrics = {
  trackRender: (component: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Canvas render: ${component} - ${duration}ms`); // Use performanceLogger
    }
  },
  
  trackMemory: () => {
    if (typeof (performance as any)?.memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },
  
  trackOperation: (operation: string, fn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      fn();
      const duration = performance.now() - start;
      performanceLogger.debug(`Canvas operation: ${operation} - ${duration}ms`); // Use performanceLogger
    } else {
      fn();
    }
  },
  
  trackAsyncOperation: async (operation: string, fn: () => Promise<void>) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      performanceLogger.debug(`Canvas async operation: ${operation} - ${duration}ms`); // Use performanceLogger
    } else {
      await fn();
    }
  }
};

// Simplified Memory Usage Monitor (replaces complex MemoryUsageMonitor)
export const MemoryUsageMonitor = {
  takeSnapshot(): MemorySnapshot | null {
    if (typeof (performance as any)?.memory === 'undefined') return null;
    
    const memory = (performance as any).memory;
    return {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  },

  getCurrentMemoryUsage(): number {
    if (typeof (performance as any)?.memory === 'undefined') return 0;
    return (performance as any).memory.usedJSHeapSize;
  },

  getCanvasMemoryInfo() {
    return {
      componentInstances: 0, // Simplified for MVP
      cacheEntries: 0,
      totalMemoryUsage: this.getCurrentMemoryUsage(),
      eventListeners: 0,
      cachedElements: 0 // Added missing property
    };
  },

  setComponentInstances(count: number) {
    // Simplified - just for compatibility
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Canvas components: ${count}`); // Use performanceLogger
    }
  },

  addCanvasElements(count: number) {
    // Simplified - just for compatibility
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Canvas elements added: ${count}`); // Use performanceLogger
    }
  },

  checkMemoryThresholds(): MemoryAlert[] {
    const snapshot = this.takeSnapshot();
    if (!snapshot) return [];
    
    const alerts: MemoryAlert[] = [];
    
    if (snapshot.usedPercent > 90) {
      alerts.push({
        type: 'critical',
        message: 'Memory usage critical',
        threshold: 90,
        current: snapshot.usedPercent
      });
    } else if (snapshot.usedPercent > 75) {
      alerts.push({
        type: 'warning',
        message: 'Memory usage high',
        threshold: 75,
        current: snapshot.usedPercent
      });
    }
    
    return alerts;
  },

  // Compatibility stubs for MVP - simplified implementations
  trackCanvasOperation: <T>(name: string, operation: () => T): T => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Canvas operation: ${name}`); // Use performanceLogger
    }
    return operation();
  },

  addKonvaNode: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Konva nodes added: ${count}`); // Use performanceLogger
    }
  },

  removeKonvaNode: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Konva nodes removed: ${count}`); // Use performanceLogger
    }
  },

  addTextureMemory: (sizeMB: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Texture memory added: ${sizeMB}MB`); // Use performanceLogger
    }
  },

  removeTextureMemory: (sizeMB: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Texture memory removed: ${sizeMB}MB`); // Use performanceLogger
    }
  },

  estimateImageMemory: (width: number, height: number, format?: string) => {
    // Simple estimation: width * height * 4 bytes (RGBA) / 1024 / 1024 for MB
    return (width * height * 4) / (1024 * 1024);
  },

  subscribeToAlerts: (callback: (alert: MemoryAlert) => void) => {
    // Simplified - return no-op unsubscribe
    return () => {};
  },

  getMemoryAlerts: (timeWindowMs?: number): MemoryAlert[] => {
    return [];
  },

  forceGarbageCollection: () => {
    // No-op for compatibility
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug('GC request (no-op in simplified version)'); // Use performanceLogger
    }
  },

  getMemoryStats: () => ({
    current: MemoryUsageMonitor.getCurrentMemoryUsage(),
    peak: MemoryUsageMonitor.getCurrentMemoryUsage(),
    average: MemoryUsageMonitor.getCurrentMemoryUsage()
  }),

  detectMemoryLeaks: () => ({
    isLeak: false,
    confidence: 0,
    growthRate: 0,
    recommendations: []
  }),

  getOptimizationSuggestions: () => [],

  setEventListeners: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Event listeners: ${count}`); // Use performanceLogger
    }
  },

  setCachedElements: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug(`Cached elements: ${count}`); // Use performanceLogger
    }
  }
};

// Legacy compatibility exports to minimize breaking changes
export const recordMetric = (name: string, value: number, category?: string, metadata?: object) => {
  if (process.env.NODE_ENV === 'development') {
    performanceLogger.debug(`Canvas metric: ${name} = ${value}`, category && { category }, metadata && { metadata }); // Use performanceLogger
  }
};

export const startTiming = (name: string) => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    canvasMetrics.trackRender(name, duration);
  };
};

// Legacy PerformanceMonitor compatibility
export const PerformanceMonitor = {
  recordMetric,
  startTiming,
  trackRender: canvasMetrics.trackRender,
  trackMemory: canvasMetrics.trackMemory
};

export const measureFunction = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  canvasMetrics.trackRender(name, duration);
  return result;
};

export const recordMemoryUsage = () => canvasMetrics.trackMemory();

// Simplified types for compatibility
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  render: number;
  operation: number;
  memory: number;
}
