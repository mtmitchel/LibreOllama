/**
 * Unified Performance Monitoring System
 * Consolidates 30+ performance monitoring files into a single focused module
 * Phase 5.1.B: Collapse Duplicate Hooks/Utils/Profilers
 */

// Core types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'memory' | 'interaction' | 'canvas' | 'general';
  metadata?: Record<string, any>;
}

export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetric[];
  memory: MemorySnapshot | null;
  renderStats: {
    avgRenderTime: number;
    totalRenders: number;
    slowRenders: number;
  };
}

class UnifiedPerformanceMonitor {
  private enabled: boolean = process.env.NODE_ENV === 'development';
  private metrics: PerformanceMetric[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private renderTimes: number[] = [];
  private maxMetrics: number = 1000; // Prevent memory leaks
  private maxMemorySnapshots: number = 100;
  private maxRenderTimes: number = 500;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  recordMetric(name: string, value: number, category: PerformanceMetric['category'] = 'general', metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      category,
      metadata
    };

    this.metrics.push(metric);
    
    // Prevent memory leaks by limiting stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  recordMemoryUsage(): MemorySnapshot | null {
    if (!this.enabled || !('memory' in performance)) return null;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: performance.now()
    };

    this.memorySnapshots.push(snapshot);
    
    // Prevent memory leaks
    if (this.memorySnapshots.length > this.maxMemorySnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.maxMemorySnapshots / 2);
    }

    return snapshot;
  }

  recordRenderTime(duration: number): void {
    if (!this.enabled) return;

    this.renderTimes.push(duration);
    
    // Prevent memory leaks
    if (this.renderTimes.length > this.maxRenderTimes) {
      this.renderTimes = this.renderTimes.slice(-this.maxRenderTimes / 2);
    }

    // Also record as a metric
    this.recordMetric('renderTime', duration, 'render');
  }

  startTiming(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'general');
    };
  }

  measureFunction<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'general'): T {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric(name, duration, category);
    return result;
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>, category: PerformanceMetric['category'] = 'general'): Promise<T> {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric(name, duration, category);
    return result;
  }

  generateReport(): PerformanceReport {
    const now = performance.now();
    const recentRenderTimes = this.renderTimes.slice(-100); // Last 100 renders
    
    return {
      timestamp: now,
      metrics: [...this.metrics], // Copy to prevent external modification
      memory: this.memorySnapshots.length > 0 ? this.memorySnapshots[this.memorySnapshots.length - 1] : null,
      renderStats: {
        avgRenderTime: recentRenderTimes.length > 0 
          ? recentRenderTimes.reduce((sum, time) => sum + time, 0) / recentRenderTimes.length 
          : 0,
        totalRenders: this.renderTimes.length,
        slowRenders: recentRenderTimes.filter(time => time > 16.67).length // > 60fps threshold
      }
    };
  }

  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  getAverageMetric(name: string, timeWindowMs: number = 30000): number {
    const cutoff = performance.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(
      metric => metric.name === name && metric.timestamp > cutoff
    );
    
    if (recentMetrics.length === 0) return 0;
    
    return recentMetrics.reduce((sum, metric) => sum + metric.value, 0) / recentMetrics.length;
  }

  clear(): void {
    this.metrics = [];
    this.memorySnapshots = [];
    this.renderTimes = [];
  }

  // Canvas-specific helpers
  profileCanvasOperation<T>(operation: string, fn: () => T): T {
    return this.measureFunction(`canvas.${operation}`, fn, 'canvas');
  }

  async profileCanvasOperationAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return this.measureAsyncFunction(`canvas.${operation}`, fn, 'canvas');
  }

  profileElementRender(elementType: string, elementCount: number, fn: () => void): void {
    const result = this.measureFunction(
      `render.${elementType}`, 
      fn, 
      'render'
    );
    // Record additional metadata as a separate metric
    this.recordMetric(`render.${elementType}.elementCount`, elementCount, 'render');
    return result;
  }
}

// Singleton instance
export const PerformanceMonitor = new UnifiedPerformanceMonitor();

// Convenience exports
export const recordMetric = PerformanceMonitor.recordMetric.bind(PerformanceMonitor);
export const recordMemoryUsage = PerformanceMonitor.recordMemoryUsage.bind(PerformanceMonitor);
export const startTiming = PerformanceMonitor.startTiming.bind(PerformanceMonitor);
export const measureFunction = PerformanceMonitor.measureFunction.bind(PerformanceMonitor);
export const profileCanvasOperation = PerformanceMonitor.profileCanvasOperation.bind(PerformanceMonitor);

// Memory alert interface
export interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  memoryUsage: number;
}

// Memory-specific utilities (consolidated from MemoryUsageMonitor)
export class MemoryUsageMonitor {
  private static componentInstances: number = 0;
  private static enabled: boolean = process.env.NODE_ENV === 'development';
  private static konvaNodes: number = 0;
  private static textureMemory: number = 0;
  private static eventListeners: number = 0;
  private static cachedElements: number = 0;
  private static alerts: MemoryAlert[] = [];

  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  static setComponentInstances(count: number): void {
    this.componentInstances = count;
  }

  static getCanvasMemoryInfo() {
    return {
      componentInstances: this.componentInstances,
      jsHeapSize: ('memory' in performance) ? (performance as any).memory.usedJSHeapSize : 0,
      eventListeners: this.eventListeners,
      cachedElements: this.cachedElements
    };
  }

  static generateReport() {
    return {
      timestamp: performance.now(),
      componentInstances: this.componentInstances,
      memorySnapshot: PerformanceMonitor.recordMemoryUsage()
    };
  }

  // Canvas-specific methods for compatibility
  static trackCanvasOperation<T>(operation: string, fn: () => T): T {
    if (!this.enabled) return fn();
    
    const startMemory = this.getCurrentMemoryUsage();
    const result = fn();
    const endMemory = this.getCurrentMemoryUsage();
    
    PerformanceMonitor.recordMetric(
      `memory.${operation}`, 
      endMemory.usedJSHeapSize - startMemory.usedJSHeapSize, 
      'memory',
      { startMemory: startMemory.usedJSHeapSize, endMemory: endMemory.usedJSHeapSize }
    );
    
    return result;
  }

  static addKonvaNode(node?: any): void {
    this.konvaNodes++;
  }

  static removeKonvaNode(node?: any): void {
    this.konvaNodes = Math.max(0, this.konvaNodes - 1);
  }

  static addTextureMemory(bytes: number): void {
    this.textureMemory += bytes;
  }

  static removeTextureMemory(bytes: number): void {
    this.textureMemory = Math.max(0, this.textureMemory - bytes);
  }

  static estimateImageMemory(width: number, height: number, format?: string | number): number {
    let channels = 4; // Default to RGBA
    
    if (typeof format === 'number') {
      channels = format;
    } else if (typeof format === 'string') {
      // Map format strings to channel counts
      const formatMap: Record<string, number> = {
        'rgb': 3,
        'rgba': 4,
        'grayscale': 1,
        'alpha': 1
      };
      channels = formatMap[format.toLowerCase()] || 4;
    }
    
    return width * height * channels;
  }

  static subscribeToAlerts(callback: (alert: MemoryAlert) => void): () => void {
    // Simple subscription system
    const wrappedCallback = (alert: MemoryAlert) => callback(alert);
    return () => {}; // Unsubscribe function
  }

  static getMemoryAlerts(options?: any): MemoryAlert[] {
    return [...this.alerts];
  }

  static forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  static getMemoryStats() {
    return {
      componentInstances: this.componentInstances,
      konvaNodes: this.konvaNodes,
      textureMemory: this.textureMemory,
      currentMemory: this.getCurrentMemoryUsage()
    };
  }

  static detectMemoryLeaks(): any[] {
    // Simplified leak detection
    return [];
  }

  static getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    if (this.konvaNodes > 1000) {
      suggestions.push('Consider reducing the number of Konva nodes');
    }
    if (this.textureMemory > 50 * 1024 * 1024) { // 50MB
      suggestions.push('High texture memory usage detected');
    }
    return suggestions;
  }

  static setEventListeners(count: number): void {
    this.eventListeners = count;
  }

  static setCachedElements(count: number): void {
    this.cachedElements = count;
  }

  static getCurrentMemoryUsage(): any {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        usedPercent: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
      };
    }
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      usedPercent: 0
    };
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') {
    return { report: null, enabled: false };
  }

  // Import React locally to avoid bundling issues
  const React = require('react');
  const [report, setReport] = React.useState(null as PerformanceReport | null);
  
  React.useEffect(() => {
    if (!PerformanceMonitor.isEnabled()) return;
    
    const interval = setInterval(() => {
      setReport(PerformanceMonitor.generateReport());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    report,
    enabled: PerformanceMonitor.isEnabled()
  };
}

// For development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = PerformanceMonitor;
}