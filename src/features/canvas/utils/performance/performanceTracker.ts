/**
 * Unified Performance Tracking System
 * Consolidates canvasMonitor, and old performance monitoring utilities
 * into a single, optimized performance tracking solution
 */

import { memoryManager } from '../memoryManager';

// Simple inline logger to avoid circular dependencies
const inlineLogger = {
  debug: (...args: any[]) => console.debug(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  group: (label: string) => console.group(label),
  groupEnd: () => console.groupEnd(),
};

// Type definitions consolidated from multiple sources
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'interaction' | 'memory' | 'network' | 'error' | 'canvas' | 'gmail';
  metadata?: Record<string, unknown>;
}

interface ErrorMetric {
  error: Error;
  context: string;
  timestamp: number;
  stackTrace: string;
  userAgent: string;
  canvasState: Record<string, unknown>;
}

interface MemoryMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  canvasElements: number;
  rafCallbacks: number;
  timestamp: number;
}

interface InteractionMetric {
  type: 'click' | 'drag' | 'zoom' | 'edit' | 'create' | 'tool_switch' | 'element_creation';
  duration: number;
  elementType?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceThresholds {
  maxFrameTime: number;
  maxInteractionLatency: number; 
  maxMemoryUsage: number;
  maxElementCreationTime: number;
  maxApiRequestTime: number;
  targetFPS: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxFrameTime: 16.67, // 60fps
  maxInteractionLatency: 100,
  maxMemoryUsage: 256, // MB
  maxElementCreationTime: 250, // Adjusted from test findings
  maxApiRequestTime: 5000,
  targetFPS: 60
};

class UnifiedPerformanceTracker {
  // Data storage
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private interactionMetrics: InteractionMetric[] = [];
  
  // Configuration
  private readonly maxMetricsHistory = 1000;
  private readonly flushInterval = 30000; // 30 seconds
  private readonly memoryCheckInterval = 5000; // 5 seconds
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  
  // State tracking
  private isMonitoring: boolean = false;
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameDrops: number = 0;
  private lastMemoryWarn = 0;
  private lastMemorySample: { usedBytes: number; time: number } | null = null;
  
  // Timers and observers
  private flushTimer: number | null = null;
  private memoryTimer: number | null = null;
  private monitoringInterval: number | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  // Session management
  private sessionId: string = '';
  private isProduction: boolean = false;

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    this.isProduction = process.env.NODE_ENV === 'production';
    if (customThresholds) {
      this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
    }
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return; // SSR safety
    
    this.setupErrorHandling();
    
    // Make instance available globally for debugging
    if (!this.isProduction) {
      (window as any).__PERFORMANCE_TRACKER__ = this;
    }
  }

  // Public API - Start monitoring
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.frameDrops = 0;
    
    inlineLogger.info('🔍 [PerformanceTracker] Unified monitoring started', {
      sessionId: this.sessionId,
      thresholds: this.thresholds
    });
    
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupPeriodicFlush();
    this.monitorFrameRate();
    this.startPeriodicChecks();
    
    if (this.isProduction) {
      this.setupResourceMonitoring();
    }
  }

  // Public API - Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Cleanup timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Cleanup observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Final flush and summary
    this.flushMetrics();
    this.logPerformanceSummary();
    
    inlineLogger.info('🔍 [PerformanceTracker] Monitoring stopped');
  }

  // Track performance of synchronous operations
  trackOperation<T>(operation: string, fn: () => T, category: PerformanceMetric['category'] = 'canvas', metadata?: Record<string, unknown>): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: operation,
        value: duration,
        timestamp: performance.now(),
        category,
        metadata
      });
      
      // Check thresholds based on category
      this.checkThresholds(operation, duration, category, metadata);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordError(
        error instanceof Error ? error : new Error(String(error)),
        `${operation} failed`
      );
      
      this.recordMetric({
        name: `${operation}_error`,
        value: duration,
        timestamp: performance.now(),
        category: 'error',
        metadata
      });
      
      throw error;
    }
  }

  // Track performance of asynchronous operations
  async trackAsyncOperation<T>(
    operation: string, 
    fn: () => Promise<T>, 
    category: PerformanceMetric['category'] = 'canvas',
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: operation,
        value: duration,
        timestamp: performance.now(),
        category,
        metadata
      });
      
      this.checkThresholds(operation, duration, category, metadata);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordError(
        error instanceof Error ? error : new Error(String(error)),
        `${operation} failed`
      );
      
      this.recordMetric({
        name: `${operation}_error`,
        value: duration,
        timestamp: performance.now(),
        category: 'error',
        metadata
      });
      
      throw error;
    }
  }

  // Record custom metric
  recordMetric(metric: PerformanceMetric) {
    // Validate and clamp metric values
    const clampedMetric = {
      ...metric,
      value: Math.max(0, metric.value),
      timestamp: metric.timestamp || performance.now()
    };
    
    this.metrics.push(clampedMetric);
    
    // Keep metrics history under control
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
    
    // Log critical performance issues immediately
    if (clampedMetric.value > 100 && clampedMetric.category === 'render') {
      inlineLogger.warn(`⚠️ [PerformanceTracker] Slow render detected:`, {
        name: clampedMetric.name,
        duration: `${clampedMetric.value.toFixed(2)}ms`,
        metadata: clampedMetric.metadata
      });
    }
  }

  // Record error
  recordError(error: Error, context: string, canvasState?: Record<string, unknown>) {
    const errorMetric: ErrorMetric = {
      error,
      context,
      timestamp: performance.now(),
      stackTrace: error.stack || '',
      userAgent: navigator.userAgent,
      canvasState: canvasState || this.getCurrentCanvasState()
    };
    
    this.errors.push(errorMetric);
    
    // Log error immediately
          inlineLogger.error(`🚨 [PerformanceTracker] Error recorded:`, {
      context,
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    
    // Keep errors history under control
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  // Record user interaction
  recordInteraction(interaction: InteractionMetric) {
    this.interactionMetrics.push({
      ...interaction,
      timestamp: interaction.timestamp || performance.now()
    });
    
    // Keep interaction history under control
    if (this.interactionMetrics.length > 500) {
      this.interactionMetrics = this.interactionMetrics.slice(-500);
    }
  }

  // Start interaction timer
  startInteractionTimer(type: InteractionMetric['type'], metadata?: Record<string, unknown>): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordInteraction({
        type,
        duration,
        timestamp: performance.now(),
        metadata
      });
    };
  }

  // Performance observer setup
  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.name.includes('canvas') || entry.name.includes('konva')) {
            this.recordMetric({
              name: entry.name,
              value: entry.duration || 0,
              timestamp: performance.now(),
              category: 'render',
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            });
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint']
      });
    } catch (error) {
      inlineLogger.warn('Failed to setup PerformanceObserver:', error);
    }
  }

  // Memory monitoring setup
  private setupMemoryMonitoring() {
    if (this.memoryTimer) return;
    
    this.memoryTimer = window.setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckInterval);
  }

  // Error handling setup
  private setupErrorHandling() {
    // Global error handler
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (source?.includes('canvas') || (typeof message === 'string' && message.includes('konva'))) {
        this.recordError(
          error || new Error(String(message)),
          `Global error: ${source}:${lineno}:${colno}`
        );
      }
      
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Unhandled promise rejections
    const originalRejectionHandler = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (event.reason?.stack?.includes('canvas')) {
        this.recordError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          'Unhandled promise rejection'
        );
      }
      
      if (originalRejectionHandler) {
        return originalRejectionHandler.call(window, event);
      }
    };
  }

  // Periodic flush setup
  private setupPeriodicFlush() {
    if (this.flushTimer) return;
    
    this.flushTimer = window.setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  // Resource monitoring setup (production only)
  private setupResourceMonitoring() {
    if (!('ResizeObserver' in window)) return;
    
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.classList.contains('konvajs-content')) {
          this.recordMetric({
            name: 'canvas-resize',
            value: entry.contentRect.width * entry.contentRect.height,
            timestamp: performance.now(),
            category: 'render',
            metadata: {
              width: entry.contentRect.width,
              height: entry.contentRect.height
            }
          });
        }
      });
    });
  }

  // Frame rate monitoring
  private monitorFrameRate() {
    if (!this.isMonitoring) return;
    
    const monitorFrame = () => {
      if (!this.isMonitoring) return;
      
      const now = performance.now();
      
      if (this.lastFrameTime > 0) {
        const frameDuration = now - this.lastFrameTime;
        
        // Record frame time
        this.recordMetric({
          name: 'frame-duration',
          value: frameDuration,
          timestamp: now,
          category: 'render'
        });
        
        // Detect frame drops
        const targetFrameTime = 1000 / this.thresholds.targetFPS;
        if (frameDuration > targetFrameTime * 1.5) {
          this.frameDrops++;
          
          if (frameDuration > targetFrameTime * 2) {
            inlineLogger.warn('⚠️ [PerformanceTracker] Severe frame drop detected', {
              duration: `${frameDuration.toFixed(2)}ms`,
              targetFrameTime: `${targetFrameTime.toFixed(2)}ms`,
              fps: `${(1000 / frameDuration).toFixed(1)}`,
              memoryUsage: this.getCurrentMemoryUsage()
            });
          }
        }
      }
      
      this.lastFrameTime = now;
      this.frameCount++;
      
      requestAnimationFrame(monitorFrame);
    };
    
    requestAnimationFrame(monitorFrame);
  }

  // Periodic performance checks
  private startPeriodicChecks() {
    this.monitoringInterval = window.setInterval(() => {
      this.checkPerformanceThresholds();
    }, 5000);
  }

  // Check memory usage
  private checkMemoryUsage() {
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    
    if (!perfWithMemory.memory) return;
    
    const memory = perfWithMemory.memory;
    const memoryMetric: MemoryMetric = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      canvasElements: this.getCanvasElementCount(),
      rafCallbacks: this.getRAFCallbackCount(),
      timestamp: performance.now()
    };
    
    this.memoryMetrics.push(memoryMetric);
    
    // Keep memory history under control
    if (this.memoryMetrics.length > 200) {
      this.memoryMetrics = this.memoryMetrics.slice(-200);
    }
    
    // Check memory warnings with cooldown
    const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
    const percentOfLimit = memory.jsHeapSizeLimit ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;
    const now = performance.now();
    const isActive = memoryMetric.canvasElements > 0 || memoryMetric.rafCallbacks > 0;
    const exceedsThreshold = percentOfLimit > 70 || memoryUsageMB > 1024;
    
    if (isActive && exceedsThreshold && now - this.lastMemoryWarn > 60000) {
      this.lastMemoryWarn = now;
      inlineLogger.warn(`🧠 [PerformanceTracker] High memory usage:`, {
        usedMB: memoryUsageMB.toFixed(2),
        percentOfLimit: percentOfLimit.toFixed(2) + '%',
        canvasElements: memoryMetric.canvasElements
      });
    }
  }

  // Check performance thresholds
  private checkThresholds(operation: string, duration: number, category: PerformanceMetric['category'], metadata?: Record<string, unknown>) {
    let threshold = 0;
    let thresholdType = '';
    
    if (category === 'canvas' && operation.includes('element_creation')) {
      threshold = this.thresholds.maxElementCreationTime;
      thresholdType = 'element creation';
    } else if (category === 'gmail' || category === 'network') {
      threshold = this.thresholds.maxApiRequestTime;
      thresholdType = 'API request';
    } else if (category === 'interaction') {
      threshold = this.thresholds.maxInteractionLatency;
      thresholdType = 'interaction latency';
    } else if (category === 'render') {
      threshold = this.thresholds.maxFrameTime;
      thresholdType = 'render time';
    }
    
    if (threshold > 0 && duration > threshold) {
      inlineLogger.warn(`⚠️ [PerformanceTracker] Slow ${thresholdType} detected:`, {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${threshold}ms`,
        metadata
      });
      
      if (this.isProduction) {
        this.reportPerformanceIssue(`slow_${thresholdType.replace(' ', '_')}`, {
          operation,
          duration,
          threshold,
          metadata
        });
      }
    }
  }

  // Check general performance thresholds
  private checkPerformanceThresholds() {
    if (this.startTime === 0) return;
    
    const totalTime = performance.now() - this.startTime;
    const currentFPS = this.frameCount / (totalTime / 1000);
    
    if (currentFPS < this.thresholds.targetFPS * 0.8) {
      inlineLogger.warn('⚠️ [PerformanceTracker] Low FPS detected', {
        current: currentFPS.toFixed(1),
        target: this.thresholds.targetFPS,
        frameDrops: this.frameDrops
      });
    }
  }

  // Utility methods
  private getCurrentCanvasState(): Record<string, unknown> {
    try {
      const canvasStore = (window as any).__CANVAS_STORE__;
      if (canvasStore) {
        return {
          elementCount: canvasStore.elements?.size || 0,
          selectedCount: canvasStore.selectedElementIds?.length || 0,
          currentTool: canvasStore.selectedTool,
          viewport: canvasStore.viewport
        };
      }
    } catch (error) {
      // Fail silently
    }
    
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100)
    };
  }

  private getCanvasElementCount(): number {
    try {
      const canvasStore = (window as any).__CANVAS_STORE__;
      return canvasStore?.elements?.size || 0;
    } catch {
      return 0;
    }
  }

  private getRAFCallbackCount(): number {
    try {
      const rafManager = (window as any).__RAF_MANAGER_STATS__;
      return rafManager?.activeCount || 0;
    } catch {
      return 0;
    }
  }

  private getCurrentMemoryUsage(): string {
    const perfWithMemory = performance as Performance & {
      memory?: { usedJSHeapSize: number };
    };
    
    if (perfWithMemory.memory) {
      const usedMB = perfWithMemory.memory.usedJSHeapSize / (1024 * 1024);
      return `${usedMB.toFixed(2)}MB`;
    }
    
    return 'N/A';
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('performance-tracker-session');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('performance-tracker-session', sessionId);
    }
    return sessionId;
  }

  // Report performance issues (production)
  private async reportPerformanceIssue(type: string, data: Record<string, unknown>) {
    try {
      if (this.isProduction) {
        // Send to monitoring service
        if ('navigator' in window && 'sendBeacon' in navigator) {
          navigator.sendBeacon('/api/performance-analytics', JSON.stringify({ type, data, sessionId: this.sessionId }));
        } else {
          fetch('/api/performance-analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data, sessionId: this.sessionId })
          }).catch(() => {/* fail silently */});
        }
      } else {
        inlineLogger.debug('📊 [PerformanceTracker] Performance issue:', { type, data });
      }
    } catch (error) {
      // Fail silently to avoid impacting app performance
    }
  }

  // Flush metrics
  private flushMetrics() {
    if (this.metrics.length === 0 && this.errors.length === 0) return;
    
    const payload = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metrics: this.metrics.slice(),
      errors: this.errors.slice(),
      memoryMetrics: this.memoryMetrics.slice(),
      interactionMetrics: this.interactionMetrics.slice(),
      system: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        online: navigator.onLine,
        memory: this.getMemorySnapshot()
      }
    };
    
    if (this.isProduction) {
      this.sendToAnalytics(payload);
    } else {
      this.logMetricsToConsole(payload);
    }
    
    // Clear flushed metrics but keep recent ones for debugging
    this.metrics = this.metrics.slice(-50);
    this.errors = this.errors.slice(-10);
    this.memoryMetrics = this.memoryMetrics.slice(-20);
    this.interactionMetrics = this.interactionMetrics.slice(-50);
  }

  private getMemorySnapshot() {
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    
    if (perfWithMemory.memory) {
      const memory = perfWithMemory.memory;
      return {
        usedMB: (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
        totalMB: (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
        limitMB: (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
      };
    }
    return null;
  }

  private sendToAnalytics(payload: Record<string, unknown>) {
    if ('navigator' in window && 'sendBeacon' in navigator) {
      try {
        navigator.sendBeacon('/api/canvas-analytics', JSON.stringify(payload));
      } catch (error) {
        inlineLogger.warn('Failed to send analytics:', error);
      }
    } else {
      fetch('/api/canvas-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {/* fail silently */});
    }
  }

  private logMetricsToConsole(payload: Record<string, unknown>) {
    const metrics = Array.isArray(payload.metrics) ? payload.metrics as PerformanceMetric[] : [];
    const errors = Array.isArray(payload.errors) ? payload.errors as unknown[] : [];
    const system = payload.system as { memory?: { usedMB?: string } } | undefined;
    
    if (metrics.length > 0) {
      const renderMetrics = metrics.filter(m => m.category === 'render');
      const validRenderMetrics = renderMetrics.filter(m => typeof m.value === 'number' && m.value >= 0);
      const avgRenderTime = validRenderMetrics.length > 0 
        ? validRenderMetrics.reduce((acc, m) => acc + Math.max(0, m.value), 0) / validRenderMetrics.length
        : 0;
        
      inlineLogger.debug('📊 [PerformanceTracker] Performance Metrics:', {
        count: metrics.length,
        averageRenderTime: Math.max(0, avgRenderTime).toFixed(2) + 'ms',
        memoryUsageMB: system?.memory?.usedMB
      });
    }

    if (errors.length > 0) {
      inlineLogger.warn('🚨 [PerformanceTracker] Errors:', errors.length);
    }
  }

  // Performance summary
  private logPerformanceSummary() {
    const totalTime = performance.now() - this.startTime;
    const avgFPS = this.frameCount / (totalTime / 1000);
    
    inlineLogger.group('📊 Performance Summary');
          inlineLogger.info('🚀 Session Stats', {
      duration: `${(totalTime / 1000).toFixed(2)}s`,
      avgFPS: avgFPS.toFixed(1),
      frameDrops: this.frameDrops,
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length
    });
    
    const recentMemory = this.memoryMetrics.slice(-1)[0];
    if (recentMemory) {
      inlineLogger.info('🧠 Memory Stats', {
        usedMB: (recentMemory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
        canvasElements: recentMemory.canvasElements,
        rafCallbacks: recentMemory.rafCallbacks
      });
    }
    
    inlineLogger.groupEnd();
  }

  // Public API - Get stats
  getStats() {
    return {
      sessionId: this.sessionId,
      isMonitoring: this.isMonitoring,
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      totalInteractions: this.interactionMetrics.length,
      memorySnapshots: this.memoryMetrics.length,
      frameDrops: this.frameDrops,
      avgFPS: this.startTime > 0 ? this.frameCount / ((performance.now() - this.startTime) / 1000) : 0,
      thresholds: this.thresholds
    };
  }

  // Update thresholds
  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    inlineLogger.info('🎯 [PerformanceTracker] Thresholds updated', this.thresholds);
  }
}

// Singleton instance
export const performanceTracker = new UnifiedPerformanceTracker();

// Convenience functions for easy migration from existing monitoring systems
export const recordCanvasMetric = (name: string, value: number, category: PerformanceMetric['category'], metadata?: Record<string, unknown>) => {
  performanceTracker.recordMetric({ name, value, timestamp: performance.now(), category, metadata });
};

export const recordCanvasError = (error: Error, context: string, canvasState?: Record<string, unknown>) => {
  performanceTracker.recordError(error, context, canvasState);
};

export const recordCanvasInteraction = (type: InteractionMetric['type'], duration: number, elementType?: string, metadata?: Record<string, unknown>) => {
  performanceTracker.recordInteraction({ type, duration, timestamp: performance.now(), elementType, metadata });
};

export const startCanvasTimer = (type: InteractionMetric['type'], metadata?: Record<string, unknown>) => {
  return performanceTracker.startInteractionTimer(type, metadata);
};

// Canvas operations tracking (replaces canvasMonitor functions)
export const trackCanvasOperation = <T>(operation: string, fn: () => T, elementCount?: number): T => {
  return performanceTracker.trackOperation(operation, fn, 'canvas', { elementCount });
};

export const trackGmailOperation = async <T>(operation: string, fn: () => Promise<T>, accountId?: string): Promise<T> => {
  return performanceTracker.trackAsyncOperation(operation, fn, 'gmail', { accountId });
};

// Performance monitoring lifecycle
export const startPerformanceMonitoring = (thresholds?: Partial<PerformanceThresholds>) => {
  if (thresholds) performanceTracker.setThresholds(thresholds);
  performanceTracker.startMonitoring();
};

export const stopPerformanceMonitoring = () => {
  performanceTracker.stopMonitoring();
};

export const getPerformanceStats = () => {
  return performanceTracker.getStats();
};

// Performance measurement utilities
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  return performanceTracker.trackOperation(name, fn, 'canvas');
};

export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return performanceTracker.trackAsyncOperation(name, fn, 'canvas');
};

// Export types for external use
export type { PerformanceMetric, ErrorMetric, MemoryMetric, InteractionMetric, PerformanceThresholds };