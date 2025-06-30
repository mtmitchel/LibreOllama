/**
 * Konva Performance Monitoring Utilities
 * Based on the production readiness document recommendations
 */

import Konva from 'konva';
import { logger } from '@/core/lib/logger';

export interface RenderStats {
  totalNodes: number;
  shapes: number;
  groups: number;
  cached: number;
  listening: number;
  layers: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  nodeCount: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface CanvasMetrics {
  elementCount: number;
  renderTime: number;
  fps: number;
  operationDuration: number;
  operation: string;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring for Konva canvas operations
 */
export class KonvaPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private isMonitoring = false;
  /**
   * Log detailed render statistics for debugging
   */
  static logRenderStats(): RenderStats | null {
    const stages = Konva.stages;
    if (stages.length === 0) {
      console.warn('KonvaPerformanceMonitor: No Konva stages found');
      return null;
    }

    const stage = stages[0];
    if (!stage) {
      console.warn('KonvaPerformanceMonitor: Stage is undefined');
      return null;
    }

    const allNodes = stage.find('*');
    const shapes = stage.find('Shape');
    const groups = stage.find('Group');
    const layers = stage.getLayers();

    const stats: RenderStats = {
      totalNodes: allNodes.length,
      shapes: shapes.length,
      groups: groups.length,
      cached: shapes.filter(s => s.isCached()).length,
      listening: allNodes.filter(n => n.listening()).length,
      layers: layers.length
    };

    console.group('📊 Konva Render Stats');
    logger.log('Total Nodes:', stats.totalNodes);
    logger.log('Shapes:', stats.shapes);
    logger.log('Groups:', stats.groups);
    logger.log('Cached Nodes:', stats.cached);
    logger.log('Listening Nodes:', stats.listening);
    logger.log('Layers:', stats.layers);
    
    // Performance warnings
    if (stats.totalNodes > 1000) {
      console.warn('⚠️ High node count detected. Consider virtualization.');
    }
    if (stats.listening > 500) {
      console.warn('⚠️ Many listening nodes. Consider disabling listening on decorative elements.');
    }
    if (stats.cached / stats.shapes < 0.1 && stats.shapes > 100) {
      console.warn('⚠️ Low cache usage. Consider caching complex shapes.');
    }
    
    console.groupEnd();
    return stats;
  }
  /**
   * Measure and log redraw performance
   */
  static measureRedraw(): number {
    const stages = Konva.stages;
    if (stages.length === 0) {
      console.warn('KonvaPerformanceMonitor: No Konva stages found');
      return 0;
    }

    const stage = stages[0];
    if (!stage) {
      console.warn('KonvaPerformanceMonitor: Stage is undefined');
      return 0;
    }

    const start = performance.now();
    stage.draw();
    const duration = performance.now() - start;

    logger.log(`🎨 Redraw took ${duration.toFixed(2)}ms`);
    
    if (duration > 16) {
      console.warn(`⚠️ Slow redraw detected (${duration.toFixed(2)}ms). Target: <16ms for 60fps`);
    }

    return duration;
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    logger.log('🔍 Started Konva performance monitoring');

    const monitor = () => {
      if (!this.isMonitoring) return;

      const renderTime = KonvaPerformanceMonitor.measureRedraw();
      const stats = KonvaPerformanceMonitor.logRenderStats();
      
      if (stats) {
        const metric: PerformanceMetrics = {
          renderTime,
          fps: 1000 / Math.max(renderTime, 1),
          nodeCount: stats.totalNodes,
          timestamp: Date.now()
        };

        this.metrics.push(metric);
        
        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
          this.metrics = this.metrics.slice(-this.maxMetrics);
        }
      }

      // Monitor every 5 seconds
      setTimeout(monitor, 5000);
    };

    monitor();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    logger.log('⏹️ Stopped Konva performance monitoring');
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageRenderTime: number;
    averageFps: number;
    averageNodeCount: number;
    peakNodeCount: number;
    slowFrames: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageFps: 0,
        averageNodeCount: 0,
        peakNodeCount: 0,
        slowFrames: 0
      };
    }

    const total = this.metrics.length;
    const averageRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / total;
    const averageFps = this.metrics.reduce((sum, m) => sum + m.fps, 0) / total;
    const averageNodeCount = this.metrics.reduce((sum, m) => sum + m.nodeCount, 0) / total;
    const peakNodeCount = Math.max(...this.metrics.map(m => m.nodeCount));
    const slowFrames = this.metrics.filter(m => m.renderTime > 16).length;

    return {
      averageRenderTime,
      averageFps,
      averageNodeCount,
      peakNodeCount,
      slowFrames
    };
  }

  /**
   * Clear stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Canvas metrics tracking for analytics
 */
export class CanvasMetrics {
  private static instance: CanvasMetrics;
  
  static getInstance(): CanvasMetrics {
    if (!CanvasMetrics.instance) {
      CanvasMetrics.instance = new CanvasMetrics();
    }
    return CanvasMetrics.instance;
  }

  /**
   * Track rendering performance
   */
  trackRenderTime(elementCount: number, time: number): void {
    const fps = 1000 / Math.max(time, 1);
    
    // In a real app, this would send to analytics service
    if (process.env.NODE_ENV === 'development') {
      logger.log('📈 Canvas Render Metrics:', {
        elementCount,
        renderTime: time,
        fps,
        timestamp: Date.now()
      });
    }

    // Example analytics call (would be replaced with actual service)
    // analytics.track('canvas.render', { elementCount, renderTime: time, fps, timestamp: Date.now() });
  }

  /**
   * Track canvas operations
   */
  trackOperation(operation: string, duration: number, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      logger.log('⚡ Canvas Operation:', {
        operation,
        duration,
        ...metadata
      });
    }

    // Example analytics call
    // analytics.track('canvas.operation', { operation, duration, ...metadata });
  }

  /**
   * Track canvas errors
   */
  trackError(error: Error, context: Record<string, any>): void {
    console.error('🚨 Canvas Error:', error, context);

    // Example error reporting (would be replaced with actual service)
    // errorReporter.captureException(error, { tags: { feature: 'canvas' }, context });
  }

  /**
   * Track memory usage (if available)
   */
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      logger.log('🧠 Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  }
}

/**
 * Enhanced debug helpers for development
 */
export const CanvasDebugHelpers = {
  /**
   * Add debug helpers to window object
   */
  attachToWindow(): void {
    if (process.env.NODE_ENV !== 'development') return;

    (window as any).debugCanvas = {
      logRenderStats: KonvaPerformanceMonitor.logRenderStats,
      measureRedraw: KonvaPerformanceMonitor.measureRedraw,
      
      logCoordinates: (elementId: string) => {
        logger.log(`Element ${elementId} coordinates would be logged here`);
        // This would integrate with your store to get actual element data
      },
      
      validateSections: () => {
        logger.log('Section validation would run here');
        // This would check for circular references, orphaned elements, etc.
      },

      stressTest: (nodeCount: number = 1000) => {
        logger.log(`Creating ${nodeCount} nodes for stress testing...`);
        // This would create many elements to test performance
      },

      profileRedraw: (iterations: number = 10) => {
        logger.log(`Profiling ${iterations} redraws...`);
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          times.push(KonvaPerformanceMonitor.measureRedraw());
        }
        
        const average = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        logger.log(`Redraw Profile: avg=${average.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
      }
    };

    logger.log('🛠️ Canvas debug helpers attached to window.debugCanvas');
  },

  /**
   * Remove debug helpers
   */
  detachFromWindow(): void {
    if (typeof window !== 'undefined') {
      delete (window as any).debugCanvas;
    }
  }
};

// Create singleton instance
export const performanceMonitor = new KonvaPerformanceMonitor();
export const canvasMetrics = CanvasMetrics.getInstance();

// Auto-attach debug helpers in development
if (process.env.NODE_ENV === 'development') {
  CanvasDebugHelpers.attachToWindow();
}

export default {
  KonvaPerformanceMonitor,
  CanvasMetrics,
  CanvasDebugHelpers,
  performanceMonitor,
  canvasMetrics
};
