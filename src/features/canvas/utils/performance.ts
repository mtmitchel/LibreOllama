// src/features/canvas/utils/performance.ts
// Simplified performance monitoring for canvas operations
// Replaces 16 duplicate performance monitoring files

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
      console.debug(`Canvas render: ${component} - ${duration}ms`);
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
      console.debug(`Canvas operation: ${operation} - ${duration}ms`);
    } else {
      fn();
    }
  },
  
  trackAsyncOperation: async (operation: string, fn: () => Promise<void>) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      console.debug(`Canvas async operation: ${operation} - ${duration}ms`);
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
      console.debug(`Canvas components: ${count}`);
    }
  },

  addCanvasElements(count: number) {
    // Simplified - just for compatibility
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Canvas elements added: ${count}`);
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
      console.debug(`Canvas operation: ${name}`);
    }
    return operation();
  },

  addKonvaNode: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Konva nodes added: ${count}`);
    }
  },

  removeKonvaNode: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Konva nodes removed: ${count}`);
    }
  },

  addTextureMemory: (sizeMB: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Texture memory added: ${sizeMB}MB`);
    }
  },

  removeTextureMemory: (sizeMB: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Texture memory removed: ${sizeMB}MB`);
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
      console.debug('GC request (no-op in simplified version)');
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
      console.debug(`Event listeners: ${count}`);
    }
  },

  setCachedElements: (count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Cached elements: ${count}`);
    }
  }
};

// Legacy compatibility exports to minimize breaking changes
export const recordMetric = (name: string, value: number, category?: string, metadata?: object) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`Canvas metric: ${name} = ${value}`, category && { category }, metadata && { metadata });
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
