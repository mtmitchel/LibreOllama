/**
 * Canvas Production Monitoring & Telemetry System
 * 
 * Provides comprehensive monitoring for:
 * - Performance metrics and bottlenecks
 * - Memory usage and leak detection
 * - Error tracking and diagnostics
 * - User interaction analytics
 * - System resource utilization
 */

import { canvasLog } from '../utils/canvasLogger';
import { WindowWithGC, ExtendedPerformance } from '../types/type-safe-replacements';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'interaction' | 'memory' | 'network' | 'error';
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
  type: 'click' | 'drag' | 'zoom' | 'edit' | 'create';
  duration: number;
  elementType?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class CanvasMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private interactionMetrics: InteractionMetric[] = [];
  
  private maxMetricsHistory = 1000; // Keep last 1000 metrics
  private flushInterval = 30000; // Flush every 30 seconds
  private memoryCheckInterval = 5000; // Check memory every 5 seconds
  private memoryWarnCooldown = 60000; // Min 60s between memory warnings
  private lastMemoryWarn = 0;
  
  private flushTimer: number | null = null;
  private memoryTimer: number | null = null;
  private isProduction: boolean;
  private lastMemorySample: { usedBytes: number; time: number } | null = null;
  private rapidGrowthHits = 0;
  private rapidGrowthLastWarn = 0;
  
  // Performance observers
  private performanceObserver: PerformanceObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.init();
  }

  private init() {
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupErrorHandling();
    this.setupPeriodicFlush();
    
    if (this.isProduction) {
      this.setupResourceMonitoring();
    }
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
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
        canvasLog.warn('Failed to setup PerformanceObserver:', error);
      }
    }
  }

  private setupMemoryMonitoring() {
    if (this.memoryTimer) return;
    
    this.memoryTimer = window.setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckInterval);
  }

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

  private setupPeriodicFlush() {
    if (this.flushTimer) return;
    
    this.flushTimer = window.setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  private setupResourceMonitoring() {
    // Monitor canvas-specific resource usage
    if ('ResizeObserver' in window) {
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
  }

  // Public API for recording metrics
  recordMetric(metric: PerformanceMetric) {
    // Clamp metric values to be non-negative to prevent bogus metrics
    const clampedMetric = {
      ...metric,
      value: Math.max(0, metric.value)
    };
    
    this.metrics.push(clampedMetric);
    
    // Keep metrics history under control
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
    
    // Log critical performance issues immediately
    if (clampedMetric.value > 100 && clampedMetric.category === 'render') {
      canvasLog.warn(`⚠️ [CanvasMonitor] Slow render detected:`, {
        name: clampedMetric.name,
        duration: `${clampedMetric.value.toFixed(2)}ms`,
        metadata: clampedMetric.metadata
      });
    }
  }

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
    canvasLog.error(`🚨 [CanvasMonitor] Error recorded:`, {
      context,
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    
    // Keep errors history under control
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  recordInteraction(interaction: InteractionMetric) {
    this.interactionMetrics.push({
      ...interaction,
      timestamp: performance.now()
    });
    
    // Keep interaction history under control
    if (this.interactionMetrics.length > 500) {
      this.interactionMetrics = this.interactionMetrics.slice(-500);
    }
  }

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

  private checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory) {
        const memoryMetric: MemoryMetric = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        canvasElements: this.getCanvasElementCount(),
        rafCallbacks: this.getRAFCallbackCount(),
        timestamp: performance.now()
      };
      
      // Track growth rate to detect leaks
      if (this.lastMemorySample) {
        const dt = memoryMetric.timestamp - this.lastMemorySample.time;
        const dBytes = memoryMetric.usedJSHeapSize - this.lastMemorySample.usedBytes;
        const growthPerSec = dt > 0 ? (dBytes / (dt / 1000)) : 0;
        
        // Flag if sustained growth > 5MB/s over 3+ samples
        const growthMBps = growthPerSec / (1024 * 1024);
        if (growthMBps > 5) {
          this.rapidGrowthHits++;
          const now = performance.now();
          if (this.rapidGrowthHits >= 3 && now - this.rapidGrowthLastWarn > 120000) { // 3 samples and 2min cooldown
            this.rapidGrowthLastWarn = now;
            canvasLog.warn('🧠 [CanvasMonitor] Sustained heap growth detected', {
              growthMBps: growthMBps.toFixed(2),
              usedMB: (memoryMetric.usedJSHeapSize / (1024 * 1024)).toFixed(2)
            });
            this.rapidGrowthHits = 0; // reset after reporting
          }
        } else {
          // reset counter on normal growth or shrink
          this.rapidGrowthHits = 0;
        }
      }
      this.lastMemorySample = { usedBytes: memoryMetric.usedJSHeapSize, time: memoryMetric.timestamp };
      
      this.memoryMetrics.push(memoryMetric);
      
      // Keep memory history under control
      if (this.memoryMetrics.length > 200) {
        this.memoryMetrics = this.memoryMetrics.slice(-200);
      }
      
      // Warn about high memory usage - debounce to avoid console spam
      const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
      const percentOfLimit = memory.jsHeapSizeLimit ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;
      const now = performance.now();
      const isActive = memoryMetric.canvasElements > 0 || memoryMetric.rafCallbacks > 0;
      // Use a percent-of-limit threshold to avoid false positives on large heaps
      const exceedsThreshold = percentOfLimit > 70 || memoryUsageMB > 1024; // 1GB absolute safeguard
      if (isActive && exceedsThreshold && now - this.lastMemoryWarn > this.memoryWarnCooldown) {
        this.lastMemoryWarn = now;
        canvasLog.warn(`🧠 [CanvasMonitor] High memory usage:`, {
          usedMB: memoryUsageMB.toFixed(2),
          percentOfLimit: (percentOfLimit).toFixed(2) + '%',
          canvasElements: memoryMetric.canvasElements
        });
      }
      }
    }
  }

  private getCurrentCanvasState(): Record<string, unknown> {
    try {
      // Get canvas state from store if available
      const canvasStore = (window as WindowWithGC).__CANVAS_STORE__ as any;
      if (canvasStore) {
        return {
          elementCount: canvasStore.elements?.size || 0,
          selectedCount: canvasStore.selectedElementIds?.length || 0,
          currentTool: canvasStore.selectedTool,
          viewport: canvasStore.viewport
        };
      }
    } catch (error) {
      // Fail silently if store is not accessible
    }
    
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100)
    };
  }

  private getCanvasElementCount(): number {
    try {
      const canvasStore = (window as WindowWithGC).__CANVAS_STORE__ as any;
      return canvasStore?.elements?.size || 0;
    } catch {
      return 0;
    }
  }

  private getRAFCallbackCount(): number {
    try {
      const rafManager = (window as WindowWithGC).__RAF_MANAGER_STATS__;
      return rafManager?.activeCount || 0;
    } catch {
      return 0;
    }
  }

  private flushMetrics() {
    if (this.metrics.length === 0 && this.errors.length === 0) return;
    
    const payload = {
      timestamp: Date.now(),
      session: this.getSessionId(),
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

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('canvas-monitor-session');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('canvas-monitor-session', sessionId);
    }
    return sessionId;
  }

  private getMemorySnapshot() {
    if ('memory' in performance) {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory) {
        return {
          usedMB: (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
          totalMB: (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
          limitMB: (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
        };
      }
    }
    return null;
  }

  private sendToAnalytics(payload: Record<string, unknown>) {
    // In production, send to analytics service
    // This would typically be sent to a logging service like DataDog, New Relic, etc.
    
    if ('navigator' in window && 'sendBeacon' in navigator) {
      try {
        navigator.sendBeacon('/api/canvas-analytics', JSON.stringify(payload));
      } catch (error) {
        canvasLog.warn('Failed to send analytics:', error);
      }
    } else {
      // Fallback to fetch for older browsers
      fetch('/api/canvas-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((error) => {
        canvasLog.warn('Failed to send analytics via fetch:', error);
      });
    }
  }

  private logMetricsToConsole(payload: Record<string, unknown>) {
    // Type-safe access to payload properties
    const metrics = Array.isArray(payload.metrics) ? payload.metrics as Array<{ category: string; value: number }> : [];
    const errors = Array.isArray(payload.errors) ? payload.errors as unknown[] : [];
    const system = payload.system as { memory?: { usedMB?: number } } | undefined;
    
    if (metrics.length > 0) {
      const renderMetrics = metrics.filter(m => m.category === 'render');
      const validRenderMetrics = renderMetrics.filter(m => typeof m.value === 'number' && m.value >= 0);
      const avgRenderTime = validRenderMetrics.length > 0 
        ? validRenderMetrics.reduce((acc, m) => acc + Math.max(0, m.value), 0) / validRenderMetrics.length
        : 0;
        
      canvasLog.debug('📊 [CanvasMonitor] Performance Metrics:', {
        count: metrics.length,
        averageRenderTime: Math.max(0, avgRenderTime),
        memoryUsageMB: system?.memory?.usedMB
      });
    }

    if (errors.length > 0) {
      canvasLog.warn('🚨 [CanvasMonitor] Errors:', errors.length);
    }
  }

  // Public API for getting current stats
  getStats() {
    return {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      totalInteractions: this.interactionMetrics.length,
      memorySnapshots: this.memoryMetrics.length,
      recentPerformance: this.getRecentPerformanceStats(),
      recentMemory: this.getRecentMemoryStats()
    };
  }

  private getRecentPerformanceStats() {
    const recent = this.metrics.slice(-20);
    const renderMetrics = recent.filter(m => m.category === 'render');
    
    // Guard against negative durations and division by zero
    const validRenderMetrics = renderMetrics.filter(m => m.value >= 0);
    const totalRenderTime = validRenderMetrics.reduce((acc, m) => Math.max(0, acc + m.value), 0);
    const avgRenderTime = validRenderMetrics.length > 0 ? totalRenderTime / validRenderMetrics.length : 0;
    
    return {
      averageRenderTime: Math.max(0, avgRenderTime),
      maxRenderTime: validRenderMetrics.length > 0 ? Math.max(...validRenderMetrics.map(m => m.value), 0) : 0,
      totalMetrics: recent.length
    };
  }

  private getRecentMemoryStats() {
    const recent = this.memoryMetrics.slice(-5);
    if (recent.length === 0) return null;
    
    const latest = recent[recent.length - 1];
    return {
      currentUsageMB: (latest.usedJSHeapSize / (1024 * 1024)).toFixed(2),
      percentOfLimit: ((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(2),
      canvasElements: latest.canvasElements,
      rafCallbacks: latest.rafCallbacks
    };
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Final flush
    this.flushMetrics();
  }
}

// Singleton instance
export const canvasMonitor = new CanvasMonitor();

// Convenience functions
export const recordCanvasMetric = (name: string, value: number, category: PerformanceMetric['category'], metadata?: Record<string, unknown>) => {
  canvasMonitor.recordMetric({ name, value, timestamp: performance.now(), category, metadata });
};

export const recordCanvasError = (error: Error, context: string, canvasState?: Record<string, unknown>) => {
  canvasMonitor.recordError(error, context, canvasState);
};

export const recordCanvasInteraction = (type: InteractionMetric['type'], duration: number, elementType?: string, metadata?: Record<string, unknown>) => {
  canvasMonitor.recordInteraction({ type, duration, timestamp: performance.now(), elementType, metadata });
};

export const startCanvasTimer = (type: InteractionMetric['type'], metadata?: Record<string, unknown>) => {
  return canvasMonitor.startInteractionTimer(type, metadata);
};

// Development helper
if (process.env.NODE_ENV === 'development') {
  (window as WindowWithGC).__CANVAS_MONITOR__ = canvasMonitor;
}