// src/utils/performance/PerformanceMonitor.ts
/**
 * Central performance tracking system for LibreOllama Canvas
 * Provides comprehensive performance monitoring with minimal overhead
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'interaction' | 'memory' | 'network' | 'canvas';
  metadata?: Record<string, any> | undefined;
}

export interface PerformanceThresholds {
  renderTime: number; // ms
  interactionLatency: number; // ms
  memoryUsage: number; // MB
  frameRate: number; // FPS
}

class PerformanceMonitorImpl {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, (metric: PerformanceMetric) => void> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private thresholds: PerformanceThresholds = {
    renderTime: 16, // 60 FPS target
    interactionLatency: 100,
    memoryUsage: 200, // Increased from 100ms to 200ms to reduce noise
    frameRate: 55 // Minimum acceptable FPS
  };
  private lastWarningTime = new Map<string, number>(); // Throttle warnings
  private readonly WARNING_THROTTLE_MS = 10000; // 10 seconds between similar warnings

  constructor() {
    // Only enable in development or when explicitly requested
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && 
                     (window as any).__ENABLE_PERFORMANCE_MONITORING;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      category,
      ...(metadata && { metadata })
    };

    this.metrics.push(metric);
    
    // Maintain metric history size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify observers
    this.observers.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.warn('Performance observer error:', error);
      }
    });

    // Check thresholds and warn if exceeded (with throttling)
    this.checkThresholds(metric);
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'render', { 
        type: 'timing',
        startTime 
      });
    };
  }

  /**
   * Measure function execution time
   */
  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    _category: PerformanceMetric['category'] = 'render'
  ): T {
    if (!this.isEnabled) return fn;

    return ((...args: Parameters<T>) => {
      const endTiming = this.startTiming(name);
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.finally(() => endTiming());
        }
        
        endTiming();
        return result;
      } catch (error) {
        endTiming();
        throw error;
      }
    }) as T;
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (!this.isEnabled || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    this.recordMetric('memoryUsage', memory.usedJSHeapSize / 1024 / 1024, 'memory', {
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    });
  }

  /**
   * Subscribe to performance metrics
   */
  subscribe(id: string, callback: (metric: PerformanceMetric) => void): () => void {
    this.observers.set(id, callback);
    
    return () => {
      this.observers.delete(id);
    };
  }

  /**
   * Get metrics by category
   */
  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (!category) return [...this.metrics];
    return this.metrics.filter(m => m.category === category);
  }

  /**
   * Get average metric value over time period
   */
  getAverageMetric(name: string, timeWindowMs: number = 5000): number {
    const now = performance.now();
    const relevantMetrics = this.metrics.filter(m => 
      m.name === name && (now - m.timestamp) <= timeWindowMs
    );

    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.lastWarningTime.clear();
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Check if metric exceeds thresholds (with throttling)
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let threshold: number | undefined;

    switch (metric.name) {
      case 'renderTime':
        threshold = this.thresholds.renderTime;
        break;
      case 'interactionLatency':
        threshold = this.thresholds.interactionLatency;
        break;
      case 'memoryUsage':
        threshold = this.thresholds.memoryUsage;
        break;
      case 'frameRate':
        // Frame rate threshold is inverse (lower is worse)
        if (metric.value < this.thresholds.frameRate) {
          this.throttledWarning(metric.name, `⚠️ Low frame rate detected: ${metric.value.toFixed(2)} FPS`);
        }
        return;
    }

    if (threshold && metric.value > threshold) {
      this.throttledWarning(
        metric.name, 
        `⚠️ Performance threshold exceeded for ${metric.name}: ${metric.value.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Throttled warning to prevent console spam
   */
  private throttledWarning(key: string, message: string): void {
    const now = Date.now();
    const lastWarning = this.lastWarningTime.get(key);
    
    if (!lastWarning || (now - lastWarning) > this.WARNING_THROTTLE_MS) {
      console.warn(message);
      this.lastWarningTime.set(key, now);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalMetrics: number;
      averageRenderTime: number;
      averageMemoryUsage: number;
      slowestOperations: Array<{ name: string; time: number }>;
    };
    categories: Record<PerformanceMetric['category'], number>;
    recentMetrics: PerformanceMetric[];
  } {
    const now = performance.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= 30000); // Last 30 seconds

    const categories = this.metrics.reduce((acc, metric) => {
      acc[metric.category] = (acc[metric.category] || 0) + 1;
      return acc;
    }, {} as Record<PerformanceMetric['category'], number>);

    const renderMetrics = this.metrics.filter(m => m.category === 'render');
    const slowestOperations = renderMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({ name: m.name, time: m.value }));

    return {
      summary: {
        totalMetrics: this.metrics.length,
        averageRenderTime: this.getAverageMetric('renderTime'),
        averageMemoryUsage: this.getAverageMetric('memoryUsage'),
        slowestOperations
      },
      categories,
      recentMetrics
    };
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceMonitorImpl();

// Convenience functions
export const recordMetric = PerformanceMonitor.recordMetric.bind(PerformanceMonitor);
export const startTiming = PerformanceMonitor.startTiming.bind(PerformanceMonitor);
export const measureFunction = PerformanceMonitor.measureFunction.bind(PerformanceMonitor);
export const recordMemoryUsage = PerformanceMonitor.recordMemoryUsage.bind(PerformanceMonitor);