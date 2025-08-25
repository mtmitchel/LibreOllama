/**
 * PerformanceMonitor - Track and report canvas performance metrics
 * 
 * Monitors FPS, memory usage, render times, and tool performance
 * for the new direct Konva API implementation.
 */

import { canvasLog } from '../utils/canvasLogger';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  renderTime: number;
  memoryUsage: {
    nodes: number;
    estimatedMB: number;
    leaks: number;
  };
  toolMetrics: {
    switchTime: number;
    eventHandlingTime: number;
    lastTool: string;
  };
  renderMetrics: {
    batchedUpdates: number;
    directUpdates: number;
    layerRedraws: number;
  };
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private enabled: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fpsHistory: number[] = [];
  private maxHistorySize: number = 60;
  
  // Metrics
  private currentFps: number = 60;
  private averageFps: number = 60;
  private minFps: number = 60;
  private maxFps: number = 60;
  
  // Tool metrics
  private lastToolSwitch: number = 0;
  private lastEventHandling: number = 0;
  private currentTool: string = '';
  
  // Render metrics
  private batchedUpdates: number = 0;
  private directUpdates: number = 0;
  private layerRedraws: number = 0;
  
  // Memory metrics
  private nodeCount: number = 0;
  private estimatedMemory: number = 0;
  private detectedLeaks: number = 0;
  
  // Callbacks
  private onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  private rafId?: number;
  
  constructor(config?: {
    enabled?: boolean;
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  }) {
    this.enabled = config?.enabled ?? false;
    this.onMetricsUpdate = config?.onMetricsUpdate;
    
    if (this.enabled) {
      this.start();
    }
  }
  
  /**
   * Start monitoring
   */
  public start(): void {
    if (this.enabled) return;
    
    this.enabled = true;
    this.lastFrameTime = performance.now();
    this.measureFrame();
    
    canvasLog.debug('[PerformanceMonitor] Started');
  }
  
  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    
    canvasLog.debug('[PerformanceMonitor] Stopped');
  }
  
  /**
   * Measure frame performance
   */
  private measureFrame = (): void => {
    if (!this.enabled) return;
    
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // Calculate FPS
    if (frameTime > 0) {
      this.currentFps = Math.round(1000 / frameTime);
      this.fpsHistory.push(this.currentFps);
      
      // Maintain history size
      if (this.fpsHistory.length > this.maxHistorySize) {
        this.fpsHistory.shift();
      }
      
      // Update statistics
      this.updateFpsStats();
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
    
    // Report metrics every 30 frames (~0.5 seconds at 60fps)
    if (this.frameCount % 30 === 0) {
      this.reportMetrics();
    }
    
    // Continue monitoring
    this.rafId = requestAnimationFrame(this.measureFrame);
  };
  
  /**
   * Update FPS statistics
   */
  private updateFpsStats(): void {
    if (this.fpsHistory.length === 0) return;
    
    // Calculate average
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    this.averageFps = Math.round(sum / this.fpsHistory.length);
    
    // Find min/max
    this.minFps = Math.min(...this.fpsHistory);
    this.maxFps = Math.max(...this.fpsHistory);
  }
  
  /**
   * Report current metrics
   */
  private reportMetrics(): void {
    const metrics = this.getMetrics();
    
    // Log if in development
    if (process.env.NODE_ENV === 'development') {
      // Only log warnings for poor performance
      if (metrics.fps < 30) {
        canvasLog.warn('[PerformanceMonitor] Low FPS detected:', metrics);
      } else if (metrics.memoryUsage.leaks > 0) {
        canvasLog.warn('[PerformanceMonitor] Memory leaks detected:', metrics.memoryUsage);
      }
    }
    
    // Call callback
    this.onMetricsUpdate?.(metrics);
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFps,
      averageFps: this.averageFps,
      minFps: this.minFps,
      maxFps: this.maxFps,
      frameTime: this.lastFrameTime,
      renderTime: 0, // Will be set by renderer
      memoryUsage: {
        nodes: this.nodeCount,
        estimatedMB: this.estimatedMemory,
        leaks: this.detectedLeaks
      },
      toolMetrics: {
        switchTime: this.lastToolSwitch,
        eventHandlingTime: this.lastEventHandling,
        lastTool: this.currentTool
      },
      renderMetrics: {
        batchedUpdates: this.batchedUpdates,
        directUpdates: this.directUpdates,
        layerRedraws: this.layerRedraws
      }
    };
  }
  
  /**
   * Record tool switch
   */
  public recordToolSwitch(toolId: string, duration: number): void {
    this.currentTool = toolId;
    this.lastToolSwitch = duration;
  }
  
  /**
   * Record event handling
   */
  public recordEventHandling(duration: number): void {
    this.lastEventHandling = duration;
  }
  
  /**
   * Update memory metrics
   */
  public updateMemoryMetrics(nodes: number, estimatedMB: number, leaks: number): void {
    this.nodeCount = nodes;
    this.estimatedMemory = estimatedMB;
    this.detectedLeaks = leaks;
  }
  
  /**
   * Update render metrics
   */
  public updateRenderMetrics(batched: number, direct: number, redraws: number): void {
    this.batchedUpdates = batched;
    this.directUpdates = direct;
    this.layerRedraws = redraws;
  }
  
  /**
   * Record render time
   */
  public recordRenderTime(duration: number): void {
    // This would be called by the renderer
  }
  
  /**
   * Reset metrics
   */
  public reset(): void {
    this.frameCount = 0;
    this.fpsHistory = [];
    this.currentFps = 60;
    this.averageFps = 60;
    this.minFps = 60;
    this.maxFps = 60;
    this.batchedUpdates = 0;
    this.directUpdates = 0;
    this.layerRedraws = 0;
  }
  
  /**
   * Get performance report
   */
  public getReport(): string {
    const metrics = this.getMetrics();
    
    return `
Performance Report:
==================
FPS: ${metrics.fps} (avg: ${metrics.averageFps}, min: ${metrics.minFps}, max: ${metrics.maxFps})
Memory: ${metrics.memoryUsage.nodes} nodes, ~${metrics.memoryUsage.estimatedMB.toFixed(2)}MB
Leaks: ${metrics.memoryUsage.leaks}
Current Tool: ${metrics.toolMetrics.lastTool}
Tool Switch: ${metrics.toolMetrics.switchTime.toFixed(2)}ms
Event Handling: ${metrics.toolMetrics.eventHandlingTime.toFixed(2)}ms
Batched Updates: ${metrics.renderMetrics.batchedUpdates}
Direct Updates: ${metrics.renderMetrics.directUpdates}
Layer Redraws: ${metrics.renderMetrics.layerRedraws}
    `.trim();
  }
  
  /**
   * Dispose
   */
  public dispose(): void {
    this.stop();
    this.reset();
    this.onMetricsUpdate = undefined;
  }
}

// Global singleton instance
let globalMonitor: PerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor({
      enabled: process.env.NODE_ENV === 'development'
    });
  }
  return globalMonitor;
}

/**
 * Performance measurement decorator
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const duration = performance.now() - start;
    
    // Log slow operations
    if (duration > 16) { // Slower than 60fps frame budget
      canvasLog.warn(`[Performance] ${propertyKey} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
  
  return descriptor;
}