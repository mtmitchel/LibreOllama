/**
 * Enhanced Performance Monitor for Canvas Load Times and Operations
 * React 19 + Tauri 2.x performance tracking with comprehensive metrics
 */

import { memoryManager } from '../memoryManager';
import { canvasLog } from '../canvasLogger';

interface PerformanceMetrics {
  canvasInitTime: number;
  toolbarReadyTime: number;
  firstInteractionTime: number;
  toolSwitchTimes: Record<string, number>;
  frameDrops: number;
  memoryUsage: number;
  elementCreationTimes: Record<string, number[]>;
  renderingTimes: {
    average: number;
    max: number;
    min: number;
    samples: number;
  };
  interactionLatency: {
    average: number;
    max: number;
    samples: number;
  };
  spatialIndexStats: {
    queryTimes: number[];
    elementCounts: number[];
    cullingEfficiency: number[];
  };
  rafStats: {
    scheduledCount: number;
    completedCount: number;
    averageExecutionTime: number;
    frameBudgetExceeded: number;
  };
}

interface PerformanceThresholds {
  maxFrameTime: number; // ms
  maxInteractionLatency: number; // ms
  maxMemoryUsage: number; // MB
  maxElementCreationTime: number; // ms
  targetFPS: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxFrameTime: 16.67, // 60fps
  maxInteractionLatency: 100,
  maxMemoryUsage: 256,
  maxElementCreationTime: 50,
  targetFPS: 60
};

class CanvasPerformanceMonitor {
  private lastMemoryWarnAt = 0;
  private metrics: Partial<PerformanceMetrics> = {};
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameDrops: number = 0;
  private isMonitoring: boolean = false;
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private renderingTimes: number[] = [];
  private interactionLatencies: number[] = [];
  private monitoringInterval: number | null = null;
  private lastInteractionTime: number = 0;

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    this.startTime = performance.now();
    if (customThresholds) {
      this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
    }
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.metrics = {
      elementCreationTimes: {},
      renderingTimes: {
        average: 0,
        max: 0,
        min: Infinity,
        samples: 0
      },
      interactionLatency: {
        average: 0,
        max: 0,
        samples: 0
      },
      spatialIndexStats: {
        queryTimes: [],
        elementCounts: [],
        cullingEfficiency: []
      },
      rafStats: {
        scheduledCount: 0,
        completedCount: 0,
        averageExecutionTime: 0,
        frameBudgetExceeded: 0
      }
    };
  }

  // Start comprehensive performance monitoring
  startMonitoring() {
    this.isMonitoring = true;
    this.startTime = performance.now();
    canvasLog.info('🔍 [CanvasPerformance] Enhanced monitoring started', {
      thresholds: this.thresholds
    });
    
    // Monitor frame rate
    this.monitorFrameRate();
    
    // Monitor memory usage if available
    this.monitorMemoryUsage();
    
    // Start periodic performance checks
    this.startPeriodicChecks();
    
    // Integrate with global performance observer if available
    this.setupPerformanceObserver();
  }

  // Start periodic performance checks
  private startPeriodicChecks(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.checkPerformanceThresholds();
      this.updateRenderingStats();
      this.collectSpatialIndexStats();
      this.collectRAFStats();
    }, 5000);
  }

  // Setup Performance Observer for more detailed metrics
  private setupPerformanceObserver(): void {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.includes('canvas')) {
            this.recordRenderingTime(entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    } catch (error) {
      canvasLog.warn('Performance Observer not supported:', error);
    }
  }

  // Mark canvas initialization complete
  markCanvasReady() {
    if (!this.isMonitoring) return;
    
    const initTime = performance.now() - this.startTime;
    this.metrics.canvasInitTime = initTime;
    console.log(`🎨 [CanvasPerformance] Canvas ready in ${initTime.toFixed(2)}ms`);
  }

  // Mark toolbar ready for interaction
  markToolbarReady() {
    if (!this.isMonitoring) return;
    
    const toolbarTime = performance.now() - this.startTime;
    this.metrics.toolbarReadyTime = toolbarTime;
    console.log(`🧰 [CanvasPerformance] Toolbar ready in ${toolbarTime.toFixed(2)}ms`);
  }

  // Mark first user interaction
  markFirstInteraction() {
    if (!this.isMonitoring) return;
    
    const interactionTime = performance.now() - this.startTime;
    this.metrics.firstInteractionTime = interactionTime;
    console.log(`👆 [CanvasPerformance] First interaction at ${interactionTime.toFixed(2)}ms`);
  }

  // Track tool switch performance
  markToolSwitch(toolName: string) {
    if (!this.isMonitoring) return;
    
    const switchTime = performance.now();
    if (!this.metrics.toolSwitchTimes) {
      this.metrics.toolSwitchTimes = {};
    }
    
    // Calculate interaction latency
    if (this.lastInteractionTime > 0) {
      const latency = switchTime - this.lastInteractionTime;
      this.recordInteractionLatency(latency);
    }
    
    // Store switch time for analysis
    const lastSwitchTime = this.metrics.toolSwitchTimes[toolName] || this.startTime;
    const timeSinceLastSwitch = switchTime - lastSwitchTime;
    this.metrics.toolSwitchTimes[toolName] = switchTime;
    this.lastInteractionTime = switchTime;
    
    canvasLog.debug('🔧 [CanvasPerformance] Tool switched', {
      tool: toolName,
      timeSinceLastSwitch: `${timeSinceLastSwitch.toFixed(2)}ms`
    });

    // Check if tool switch exceeds threshold
    if (timeSinceLastSwitch > this.thresholds.maxInteractionLatency) {
      canvasLog.warn('⚠️ [CanvasPerformance] Slow tool switch detected', {
        tool: toolName,
        latency: `${timeSinceLastSwitch.toFixed(2)}ms`,
        threshold: `${this.thresholds.maxInteractionLatency}ms`
      });
    }
  }

  // Track element creation performance
  markElementCreation(elementType: string, creationTime: number): void {
    if (!this.isMonitoring) return;

    if (!this.metrics.elementCreationTimes![elementType]) {
      this.metrics.elementCreationTimes![elementType] = [];
    }

    this.metrics.elementCreationTimes![elementType].push(creationTime);

    // Keep only recent samples (last 100)
    if (this.metrics.elementCreationTimes![elementType].length > 100) {
      this.metrics.elementCreationTimes![elementType].shift();
    }

    // Check if creation time exceeds threshold
    if (creationTime > this.thresholds.maxElementCreationTime) {
      canvasLog.warn('⚠️ [CanvasPerformance] Slow element creation', {
        type: elementType,
        time: `${creationTime.toFixed(2)}ms`,
        threshold: `${this.thresholds.maxElementCreationTime}ms`
      });
    }
  }

  // Record rendering time
  recordRenderingTime(renderTime: number): void {
    if (!this.isMonitoring) return;

    this.renderingTimes.push(renderTime);
    
    // Keep only recent samples (last 1000)
    if (this.renderingTimes.length > 1000) {
      this.renderingTimes.shift();
    }

    // Update rendering stats
    const stats = this.metrics.renderingTimes!;
    stats.max = Math.max(stats.max, renderTime);
    stats.min = Math.min(stats.min, renderTime);
    stats.samples++;
  }

  // Record interaction latency
  private recordInteractionLatency(latency: number): void {
    this.interactionLatencies.push(latency);
    
    // Keep only recent samples (last 100)
    if (this.interactionLatencies.length > 100) {
      this.interactionLatencies.shift();
    }

    // Update latency stats
    const stats = this.metrics.interactionLatency!;
    stats.max = Math.max(stats.max, latency);
    stats.samples++;
  }

  // Enhanced frame rate monitoring with detailed analysis
  private monitorFrameRate() {
    const monitorFrame = () => {
      if (!this.isMonitoring) return;
      
      const now = performance.now();
      
      if (this.lastFrameTime > 0) {
        const frameDuration = now - this.lastFrameTime;
        
        // Record rendering time
        this.recordRenderingTime(frameDuration);
        
        // Detect frame drops based on target FPS
        const targetFrameTime = 1000 / this.thresholds.targetFPS;
        if (frameDuration > targetFrameTime * 1.5) {
          this.frameDrops++;
          
          // Log severe frame drops with more context
          if (frameDuration > targetFrameTime * 2) {
            canvasLog.warn('⚠️ [CanvasPerformance] Severe frame drop detected', {
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
      
      // Continue monitoring
      requestAnimationFrame(monitorFrame);
    };
    
    requestAnimationFrame(monitorFrame);
  }

  // Get current memory usage
  private getCurrentMemoryUsage(): string {
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      };
    };
    
    if (perfWithMemory.memory) {
      const usedMB = perfWithMemory.memory.usedJSHeapSize / (1024 * 1024);
      return `${usedMB.toFixed(2)}MB`;
    }
    
    return 'N/A';
  }

  // Enhanced memory monitoring with trend analysis
  private monitorMemoryUsage() {
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    
    if (!perfWithMemory.memory) {
      canvasLog.warn('Memory monitoring not available - performance.memory not supported');
      return;
    }
    
    const memoryHistory: number[] = [];
    
    const checkMemory = () => {
      if (!this.isMonitoring) return;
      
      const memory = perfWithMemory.memory!;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMB = memory.totalJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      
      this.metrics.memoryUsage = usedMB;
      memoryHistory.push(usedMB);
      
      // Keep only recent history (last 20 samples = 100 seconds)
      if (memoryHistory.length > 20) {
        memoryHistory.shift();
      }
      
      // Check memory thresholds and trends
      const percentOfLimit = (limitMB > 0) ? (usedMB / limitMB) * 100 : 0;
      const globalStats = (window as any).__RAF_MANAGER_STATS__;
      const isActive = (this.renderingTimes.length > 0) || (globalStats && globalStats.activeCount > 0);
      const now = performance.now();
      const exceeded = percentOfLimit > 70 || usedMB > 1024; // 1GB safeguard
      if (isActive && exceeded) {
        const memoryManagerStats = memoryManager.getMemoryStats();
        if (performance.now() - this.lastMemoryWarnAt > 60000) {
          this.lastMemoryWarnAt = performance.now();
          canvasLog.warn('🧠 [CanvasPerformance] High memory usage detected', {
          used: `${usedMB.toFixed(2)}MB`,
          total: `${totalMB.toFixed(2)}MB`,
          limit: `${limitMB.toFixed(2)}MB`,
          threshold: `${this.thresholds.maxMemoryUsage}MB`,
          memoryManagerStats
        });
        }
      }
      
      // Detect memory leaks (sustained growth)
      if (memoryHistory.length >= 10) {
        const recent = memoryHistory.slice(-5);
        const older = memoryHistory.slice(-10, -5);
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;
        
        if (recentAvg > olderAvg * 1.2) {
          canvasLog.warn('🚨 [CanvasPerformance] Potential memory leak detected', {
            trend: `${((recentAvg - olderAvg) / olderAvg * 100).toFixed(1)}% increase`,
            recent: `${recentAvg.toFixed(2)}MB`,
            older: `${olderAvg.toFixed(2)}MB`
          });
        }
      }
      
      // Check memory every 5 seconds
      setTimeout(checkMemory, 5000);
      this.lastMemoryWarnAt = this.lastMemoryWarnAt || 0;
    };
    
    setTimeout(checkMemory, 1000);
  }

  // Check performance thresholds
  private checkPerformanceThresholds(): void {
    const currentFPS = this.frameCount / ((performance.now() - this.startTime) / 1000);
    
    if (currentFPS < this.thresholds.targetFPS * 0.8) {
      canvasLog.warn('⚠️ [CanvasPerformance] Low FPS detected', {
        current: currentFPS.toFixed(1),
        target: this.thresholds.targetFPS,
        frameDrops: this.frameDrops
      });
    }
  }

  // Update rendering statistics
  private updateRenderingStats(): void {
    if (this.renderingTimes.length === 0) return;

    const stats = this.metrics.renderingTimes!;
    const sum = this.renderingTimes.reduce((a, b) => a + b, 0);
    stats.average = sum / this.renderingTimes.length;
  }

  // Collect spatial index statistics
  private collectSpatialIndexStats(): void {
    const spatialStats = this.metrics.spatialIndexStats!;
    const last = (typeof window !== 'undefined' ? (window as any).__SPATIAL_INDEX_LAST__ : null);
    if (last) {
      spatialStats.queryTimes.push(last.queryTime);
      spatialStats.elementCounts.push(last.total);
      spatialStats.cullingEfficiency.push(Math.round(last.cullingEfficiency * 100));
    }
    // Fallback: keep previous simulated logic if no data
    // If no new data was recorded, we can skip. Otherwise, stats are appended above.
  }

  // Collect RAF statistics
  private collectRAFStats(): void {
    // This would integrate with the RAF manager
    // For now, we'll check if RAF stats are available globally
    if (typeof window !== 'undefined' && (window as any).__RAF_MANAGER_STATS__) {
      const globalRAFStats = (window as any).__RAF_MANAGER_STATS__;
      const rafStats = this.metrics.rafStats!;
      
      rafStats.scheduledCount = globalRAFStats.totalCreated || 0;
      rafStats.completedCount = globalRAFStats.totalCreated - globalRAFStats.activeCount || 0;
      rafStats.frameBudgetExceeded = globalRAFStats.frameBudgetExceeded || 0;
    }
  }

  // Get comprehensive performance report
  getPerformanceReport(): PerformanceMetrics & {
    frameDrops: number;
    avgFPS: number;
    recommendations: string[];
  } {
    const totalTime = performance.now() - this.startTime;
    const avgFPS = this.frameCount / (totalTime / 1000);
    
    // Update final statistics
    this.updateRenderingStats();
    if (this.interactionLatencies.length > 0) {
      const latencySum = this.interactionLatencies.reduce((a, b) => a + b, 0);
      this.metrics.interactionLatency!.average = latencySum / this.interactionLatencies.length;
    }
    
    const report = {
      canvasInitTime: this.metrics.canvasInitTime || 0,
      toolbarReadyTime: this.metrics.toolbarReadyTime || 0,
      firstInteractionTime: this.metrics.firstInteractionTime || 0,
      toolSwitchTimes: this.metrics.toolSwitchTimes || {},
      frameDrops: this.frameDrops,
      memoryUsage: this.metrics.memoryUsage || 0,
      avgFPS: parseFloat(avgFPS.toFixed(2)),
      elementCreationTimes: this.metrics.elementCreationTimes!,
      renderingTimes: this.metrics.renderingTimes!,
      interactionLatency: this.metrics.interactionLatency!,
      spatialIndexStats: this.metrics.spatialIndexStats!,
      rafStats: this.metrics.rafStats!,
      recommendations: this.generateRecommendations(avgFPS)
    };
    
    return report;
  }

  // Generate performance recommendations
  private generateRecommendations(avgFPS: number): string[] {
    const recommendations: string[] = [];
    
    if (avgFPS < this.thresholds.targetFPS * 0.8) {
      recommendations.push('Consider enabling spatial indexing for large element counts');
      recommendations.push('Check for memory leaks - high memory usage detected');
    }
    
    if (this.frameDrops > 10) {
      recommendations.push('Optimize rendering pipeline - frequent frame drops detected');
      recommendations.push('Consider reducing element complexity or implementing LOD');
    }
    
    if (this.metrics.memoryUsage! > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Memory usage is high - enable aggressive cleanup');
      recommendations.push('Consider implementing object pooling for frequently created elements');
    }
    
    if (this.metrics.interactionLatency!.average > this.thresholds.maxInteractionLatency) {
      recommendations.push('Interaction latency is high - optimize event handlers');
      recommendations.push('Consider debouncing or throttling frequent operations');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal - no recommendations');
    }
    
    return recommendations;
  }

  // Log comprehensive performance summary
  logPerformanceSummary() {
    const report = this.getPerformanceReport();
    
    canvasLog.group('📊 Canvas Performance Summary');
    canvasLog.info('🚀 Initialization Times', {
      canvasInit: `${report.canvasInitTime.toFixed(2)}ms`,
      toolbarReady: `${report.toolbarReadyTime.toFixed(2)}ms`,
      firstInteraction: `${report.firstInteractionTime.toFixed(2)}ms`
    });
    
    canvasLog.info('🎬 Rendering Performance', {
      avgFPS: report.avgFPS,
      frameDrops: report.frameDrops,
      avgRenderTime: `${report.renderingTimes.average.toFixed(2)}ms`,
      maxRenderTime: `${report.renderingTimes.max.toFixed(2)}ms`,
      minRenderTime: `${report.renderingTimes.min.toFixed(2)}ms`
    });
    
    canvasLog.info('🧠 Memory & Resources', {
      memoryUsage: `${report.memoryUsage.toFixed(2)}MB`,
      avgInteractionLatency: `${report.interactionLatency.average.toFixed(2)}ms`,
      maxInteractionLatency: `${report.interactionLatency.max.toFixed(2)}ms`
    });
    
    canvasLog.info('🔧 RAF Statistics', {
      scheduledRAFs: report.rafStats.scheduledCount,
      completedRAFs: report.rafStats.completedCount,
      frameBudgetExceeded: report.rafStats.frameBudgetExceeded
    });
    
    if (report.recommendations.length > 0) {
      canvasLog.info('💡 Performance Recommendations', {
        recommendations: report.recommendations
      });
    }
    
    canvasLog.groupEnd();
  }

  // Stop monitoring with cleanup
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.logPerformanceSummary();
    canvasLog.info('🔍 [CanvasPerformance] Enhanced monitoring stopped');
  }

  // Export performance data for external analysis
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      sessionDuration: performance.now() - this.startTime,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: report
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Set custom thresholds
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    canvasLog.info('🎯 [CanvasPerformance] Thresholds updated', this.thresholds);
  }
}

// Global instance
export const canvasPerformanceMonitor = new CanvasPerformanceMonitor();

// Helper functions for easy integration
export const markCanvasReady = () => canvasPerformanceMonitor.markCanvasReady();
export const markToolbarReady = () => canvasPerformanceMonitor.markToolbarReady();
export const markFirstInteraction = () => canvasPerformanceMonitor.markFirstInteraction();
export const markToolSwitch = (toolName: string) => canvasPerformanceMonitor.markToolSwitch(toolName);
export const markElementCreation = (elementType: string, creationTime: number) => 
  canvasPerformanceMonitor.markElementCreation(elementType, creationTime);
export const recordRenderingTime = (renderTime: number) => 
  canvasPerformanceMonitor.recordRenderingTime(renderTime);
export const startPerformanceMonitoring = (thresholds?: Partial<PerformanceThresholds>) => {
  if (thresholds) canvasPerformanceMonitor.setThresholds(thresholds);
  canvasPerformanceMonitor.startMonitoring();
};
export const getPerformanceReport = () => canvasPerformanceMonitor.getPerformanceReport();
export const exportPerformanceData = () => canvasPerformanceMonitor.exportPerformanceData();
export const stopPerformanceMonitoring = () => canvasPerformanceMonitor.stopMonitoring();

// Performance measurement utility
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  performance.mark(`canvas-${name}-start`);
  performance.mark(`canvas-${name}-end`);
  performance.measure(`canvas-${name}`, `canvas-${name}-start`, `canvas-${name}-end`);
  
  canvasLog.debug(`⏱️ [CanvasPerformance] ${name} completed in ${duration.toFixed(2)}ms`);
  
  return result;
};

// Async performance measurement utility
export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  performance.mark(`canvas-${name}-start`);
  performance.mark(`canvas-${name}-end`);
  performance.measure(`canvas-${name}`, `canvas-${name}-start`, `canvas-${name}-end`);
  
  canvasLog.debug(`⏱️ [CanvasPerformance] ${name} completed in ${duration.toFixed(2)}ms`);
  
  return result;
};