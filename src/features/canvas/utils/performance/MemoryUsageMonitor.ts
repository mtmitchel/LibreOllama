// src/utils/performance/MemoryUsageMonitor.ts
/**
 * Enhanced Memory usage monitoring and leak detection for LibreOllama Canvas
 * Tracks memory consumption patterns and identifies potential leaks
 * Part of Phase 4 Performance Optimizations - Enhanced with real-time tracking
 */

import { PerformanceMonitor } from './PerformanceMonitor';

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercent: number;
}

export interface MemoryLeakDetection {
  isLeak: boolean;
  confidence: number;
  growthRate: number; // MB per minute
  recommendations: string[];
}

export interface CanvasMemoryInfo {
  konvaNodes: number;
  textureMemory: number; // Estimated texture memory in MB
  cachedElements: number;
  eventListeners: number;
  componentInstances: number;
}

export interface MemoryAlert {
  level: 'info' | 'warning' | 'critical';
  type: 'growth' | 'leak' | 'threshold' | 'gc';
  message: string;
  timestamp: number;
  memoryUsage: number;
  recommendations: string[];
}

class MemoryUsageMonitorImpl {
  private snapshots: MemorySnapshot[] = [];
  private isEnabled: boolean = true;
  private monitoringInterval: number | null = null;
  private readonly maxSnapshots = 100;
  private readonly monitoringIntervalMs = 5000; // 5 seconds
  
  // Enhanced tracking for Phase 4
  private canvasMemoryInfo: CanvasMemoryInfo = {
    konvaNodes: 0,
    textureMemory: 0,
    cachedElements: 0,
    eventListeners: 0,
    componentInstances: 0
  };
  private memoryAlerts: MemoryAlert[] = [];
  private lastGCTime = 0;
  private gcDetectionThreshold = 10; // MB reduction to detect GC
  private alertSubscribers = new Set<(alert: MemoryAlert) => void>();

  constructor() {
    this.isEnabled = this.canMonitorMemory() && (
      process.env.NODE_ENV === 'development' || 
      typeof window !== 'undefined' && 
      (window as any).__ENABLE_MEMORY_MONITORING
    );

    if (this.isEnabled) {
      this.startMonitoring();
    }
  }

  /**
   * Check if memory monitoring is available
   */
  private canMonitorMemory(): boolean {
    return typeof window !== 'undefined' && 
           'performance' in window && 
           'memory' in (performance as any);
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot | null {
    if (!this.canMonitorMemory()) return null;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: performance.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };

    // Add to snapshots with size limit
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }    // Check for garbage collection if we have a previous snapshot
    if (this.snapshots.length > 1) {
      const previousSnapshot = this.snapshots[this.snapshots.length - 2];
      if (previousSnapshot) {
        this.detectGarbageCollection(snapshot, previousSnapshot);
      }
    }

    // Record in global performance monitor
    PerformanceMonitor.recordMetric(
      'memoryUsage',
      snapshot.usedJSHeapSize / 1024 / 1024, // Convert to MB
      'memory',
      {
        usedPercent: snapshot.usedPercent,
        totalMB: snapshot.totalJSHeapSize / 1024 / 1024,
        limitMB: snapshot.jsHeapSizeLimit / 1024 / 1024
      }
    );

    return snapshot;
  }

  /**
   * Start automatic memory monitoring
   */
  startMonitoring(): void {
    if (!this.isEnabled || this.monitoringInterval) return;

    this.monitoringInterval = window.setInterval(() => {
      this.takeSnapshot();
    }, this.monitoringIntervalMs);
  }

  /**
   * Stop automatic memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get all memory snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get recent memory snapshots
   */
  getRecentSnapshots(timeWindowMs: number = 60000): MemorySnapshot[] {
    const now = performance.now();
    return this.snapshots.filter(snapshot => 
      (now - snapshot.timestamp) <= timeWindowMs
    );
  }
  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemorySnapshot | null {
    return this.takeSnapshot();
  }

  /**
   * Get the time of the last detected garbage collection
   */
  getLastGCTime(): number {
    return this.lastGCTime;
  }

  /**
   * Calculate memory growth rate
   */
  getMemoryGrowthRate(timeWindowMs: number = 300000): number {
    const recentSnapshots = this.getRecentSnapshots(timeWindowMs);
    if (recentSnapshots.length < 2) return 0;

    const first = recentSnapshots[0];
    const last = recentSnapshots[recentSnapshots.length - 1];
    
    if (!first || !last) return 0;
    
    const timeDiffMinutes = (last.timestamp - first.timestamp) / 60000;
    const memoryDiffMB = (last.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024;
    
    return timeDiffMinutes > 0 ? memoryDiffMB / timeDiffMinutes : 0;
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): MemoryLeakDetection {
    const growthRate = this.getMemoryGrowthRate();
    const recentSnapshots = this.getRecentSnapshots();
    
    let isLeak = false;
    let confidence = 0;
    const recommendations: string[] = [];

    // Check for consistent memory growth
    if (growthRate > 1) { // More than 1MB per minute growth
      isLeak = true;
      confidence += 0.4;
      recommendations.push('Memory is growing at an unusual rate');
    }

    // Check for high memory usage
    const currentSnapshot = this.getCurrentMemoryUsage();
    if (currentSnapshot && currentSnapshot.usedPercent > 80) {
      isLeak = true;
      confidence += 0.3;
      recommendations.push('Memory usage is very high (>80%)');
    }

    // Check for memory not being released
    if (recentSnapshots.length >= 10) {
      const last10 = recentSnapshots.slice(-10);
      const isIncreasing = last10.every((snapshot, index) =>
        index === 0 || (last10[index - 1] && snapshot.usedJSHeapSize >= last10[index - 1]!.usedJSHeapSize)
      );
      
      if (isIncreasing) {
        isLeak = true;
        confidence += 0.3;
        recommendations.push('Memory usage shows consistent increase without decreases');
      }
    }

    // Generate specific recommendations
    if (isLeak) {
      recommendations.push('Consider running garbage collection manually');
      recommendations.push('Check for event listener leaks');
      recommendations.push('Verify proper cleanup in useEffect hooks');
      recommendations.push('Look for circular references in data structures');
    }

    return {
      isLeak,
      confidence: Math.min(confidence, 1),
      growthRate,
      recommendations
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): boolean {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
      return true;
    }
    return false;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    current: MemorySnapshot | null;
    peak: MemorySnapshot | null;
    average: number;
    growthRate: number;
    totalSnapshots: number;
  } {
    const current = this.getCurrentMemoryUsage();
    const peak = this.snapshots.reduce((max, snapshot) => 
      !max || snapshot.usedJSHeapSize > max.usedJSHeapSize ? snapshot : max, 
      null as MemorySnapshot | null
    );
    
    const average = this.snapshots.length > 0 
      ? this.snapshots.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / this.snapshots.length / 1024 / 1024
      : 0;

    return {
      current,
      peak,
      average,
      growthRate: this.getMemoryGrowthRate(),
      totalSnapshots: this.snapshots.length
    };
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled && this.canMonitorMemory()) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
      this.clear();
    }
  }

  /**
   * Generate memory usage report
   */
  generateReport(): {
    summary: {
      currentUsageMB: number;
      peakUsageMB: number;
      averageUsageMB: number;
      growthRateMBPerMin: number;
    };
    leakDetection: MemoryLeakDetection;
    snapshots: MemorySnapshot[];
    recommendations: string[];
  } {
    const stats = this.getMemoryStats();
    const leakDetection = this.detectMemoryLeaks();
    const recommendations: string[] = [];

    // General recommendations
    if (stats.current && stats.current.usedPercent > 60) {
      recommendations.push('Consider optimizing large data structures');
      recommendations.push('Review caching strategies');
    }

    if (this.snapshots.length < 5) {
      recommendations.push('Monitor for longer to get better insights');
    }

    return {
      summary: {
        currentUsageMB: stats.current ? stats.current.usedJSHeapSize / 1024 / 1024 : 0,
        peakUsageMB: stats.peak ? stats.peak.usedJSHeapSize / 1024 / 1024 : 0,
        averageUsageMB: stats.average,
        growthRateMBPerMin: stats.growthRate
      },
      leakDetection,
      snapshots: this.getRecentSnapshots(),
      recommendations: [...recommendations, ...leakDetection.recommendations]
    };
  }

  /**
   * Enhanced memory tracking for Phase 4
   */
  
  /**
   * Track Konva nodes for canvas-specific memory monitoring
   */
  trackKonvaNodes(count: number): void {
    this.canvasMemoryInfo.konvaNodes = count;
    
    if (count > 1000) {
      this.emitAlert({
        level: 'warning',
        type: 'threshold',
        message: `High number of Konva nodes: ${count}`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Consider implementing viewport culling',
          'Use object pooling for frequently created/destroyed nodes',
          'Group related nodes for better management'
        ]
      });
    }
  }

  /**
   * Track texture memory usage
   */
  trackTextureMemory(memoryMB: number): void {
    this.canvasMemoryInfo.textureMemory = memoryMB;
    
    if (memoryMB > 50) {
      this.emitAlert({
        level: 'warning',
        type: 'threshold',
        message: `High texture memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Optimize image sizes and formats',
          'Implement texture compression',
          'Use texture atlasing for small images'
        ]
      });
    }
  }

  /**
   * Track cached elements
   */
  trackCachedElements(count: number): void {
    this.canvasMemoryInfo.cachedElements = count;
  }

  /**
   * Track event listeners
   */
  trackEventListeners(count: number): void {
    this.canvasMemoryInfo.eventListeners = count;
    
    if (count > 500) {
      this.emitAlert({
        level: 'warning',
        type: 'leak',
        message: `High number of event listeners: ${count}`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Check for event listener leaks',
          'Use event delegation where possible',
          'Ensure proper cleanup in useEffect hooks'
        ]
      });
    }
  }

  /**
   * Track React component instances
   */
  trackComponentInstances(count: number): void {
    this.canvasMemoryInfo.componentInstances = count;
  }

  /**
   * Update canvas-specific memory information
   */
  updateCanvasMemoryInfo(update: Partial<CanvasMemoryInfo>): void {
    this.canvasMemoryInfo = {
      ...this.canvasMemoryInfo,
      ...update
    };

    // Record canvas memory metrics
    PerformanceMonitor.recordMetric(
      'canvasMemory',
      this.canvasMemoryInfo.konvaNodes,
      'canvas',
      {
        textureMemoryMB: this.canvasMemoryInfo.textureMemory,
        cachedElements: this.canvasMemoryInfo.cachedElements,
        eventListeners: this.canvasMemoryInfo.eventListeners,
        componentInstances: this.canvasMemoryInfo.componentInstances
      }
    );

    // Check for potential canvas memory issues
    this.checkCanvasMemoryThresholds();
  }

  /**
   * Increment Konva node count
   */
  addKonvaNode(count: number = 1): void {
    this.updateCanvasMemoryInfo({
      konvaNodes: this.canvasMemoryInfo.konvaNodes + count
    });
  }

  /**
   * Decrement Konva node count
   */
  removeKonvaNode(count: number = 1): void {
    this.updateCanvasMemoryInfo({
      konvaNodes: Math.max(0, this.canvasMemoryInfo.konvaNodes - count)
    });
  }

  /**
   * Add texture memory usage (in MB)
   */
  addTextureMemory(sizeMB: number): void {
    this.updateCanvasMemoryInfo({
      textureMemory: this.canvasMemoryInfo.textureMemory + sizeMB
    });
  }

  /**
   * Remove texture memory usage (in MB)
   */
  removeTextureMemory(sizeMB: number): void {
    this.updateCanvasMemoryInfo({
      textureMemory: Math.max(0, this.canvasMemoryInfo.textureMemory - sizeMB)
    });
  }

  /**
   * Update cached elements count
   */
  setCachedElements(count: number): void {
    this.updateCanvasMemoryInfo({
      cachedElements: count
    });
  }

  /**
   * Update event listeners count
   */
  setEventListeners(count: number): void {
    this.updateCanvasMemoryInfo({
      eventListeners: count
    });
  }

  /**
   * Update component instances count
   */
  setComponentInstances(count: number): void {
    this.updateCanvasMemoryInfo({
      componentInstances: count
    });
  }

  /**
   * Get current canvas memory information
   */
  getCanvasMemoryInfo(): CanvasMemoryInfo {
    return { ...this.canvasMemoryInfo };
  }

  /**
   * Estimate memory usage of an image element
   */
  estimateImageMemory(width: number, height: number, format: string = 'RGBA'): number {
    // Estimate memory in MB based on dimensions and format
    let bytesPerPixel = 4; // RGBA default
    
    switch (format.toUpperCase()) {
      case 'RGB':
        bytesPerPixel = 3;
        break;
      case 'GRAYSCALE':
        bytesPerPixel = 1;
        break;
      case 'RGBA':
      default:
        bytesPerPixel = 4;
        break;
    }
    
    const totalBytes = width * height * bytesPerPixel;
    return totalBytes / 1024 / 1024; // Convert to MB
  }

  /**
   * Track memory usage of a specific canvas operation
   */
  trackCanvasOperation<T>(operationName: string, operation: () => T): T {
    const startMemory = this.getCurrentMemoryUsage();
    const startTime = performance.now();
    
    try {
      const result = operation();
      
      const endTime = performance.now();
      const endMemory = this.getCurrentMemoryUsage();
      
      // Calculate memory delta
      let memoryDelta = 0;
      if (startMemory && endMemory) {
        memoryDelta = (endMemory.usedJSHeapSize - startMemory.usedJSHeapSize) / 1024 / 1024;
      }
      
      // Record operation metrics
      PerformanceMonitor.recordMetric(
        `canvasOperation.${operationName}`,
        endTime - startTime,
        'canvas',
        {
          memoryDeltaMB: memoryDelta,
          operationType: 'canvas'
        }
      );
      
      return result;
    } catch (error) {
      // Record failed operation
      PerformanceMonitor.recordMetric(
        `canvasOperation.${operationName}.error`,
        performance.now() - startTime,
        'canvas',
        {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      throw error;
    }
  }

  /**
   * Check canvas memory thresholds and emit alerts
   */
  private checkCanvasMemoryThresholds(): void {
    const { konvaNodes, textureMemory, eventListeners, componentInstances } = this.canvasMemoryInfo;
    
    // Check Konva nodes threshold
    if (konvaNodes > 1000) {
      this.emitAlert({
        level: konvaNodes > 2000 ? 'critical' : 'warning',
        type: 'threshold',
        message: `High Konva node count: ${konvaNodes}`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Consider using object pooling for Konva nodes',
          'Implement viewport culling to hide off-screen elements',
          'Group related shapes into single Konva groups'
        ]
      });
    }
    
    // Check texture memory threshold
    if (textureMemory > 50) {
      this.emitAlert({
        level: textureMemory > 100 ? 'critical' : 'warning',
        type: 'threshold',
        message: `High texture memory usage: ${textureMemory.toFixed(1)}MB`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Optimize image sizes and formats',
          'Implement progressive image loading',
          'Use image compression for large textures'
        ]
      });
    }
    
    // Check event listeners threshold
    if (eventListeners > 500) {
      this.emitAlert({
        level: eventListeners > 1000 ? 'critical' : 'warning',
        type: 'threshold',
        message: `High event listener count: ${eventListeners}`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Use event delegation instead of individual listeners',
          'Ensure proper cleanup of event listeners',
          'Consider using passive event listeners where possible'
        ]
      });
    }
    
    // Check component instances threshold
    if (componentInstances > 300) {
      this.emitAlert({
        level: componentInstances > 600 ? 'critical' : 'warning',
        type: 'threshold',
        message: `High React component count: ${componentInstances}`,
        timestamp: performance.now(),
        memoryUsage: this.getCurrentMemoryUsage()?.usedJSHeapSize || 0,
        recommendations: [
          'Use React.memo for expensive components',
          'Implement component virtualization',
          'Consider using component pooling'
        ]
      });
    }
  }

  /**
   * Subscribe to memory alerts
   */
  subscribeToAlerts(callback: (alert: MemoryAlert) => void): () => void {
    this.alertSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.alertSubscribers.delete(callback);
    };
  }

  /**
   * Get all alert subscribers count
   */
  getAlertSubscriberCount(): number {
    return this.alertSubscribers.size;
  }

  /**
   * Emit memory alert
   */
  private emitAlert(alert: MemoryAlert): void {
    this.memoryAlerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.memoryAlerts.length > 100) {
      this.memoryAlerts = this.memoryAlerts.slice(-100);
    }
    
    // Notify subscribers
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Memory alert subscriber error:', error);
      }
    });
    
    // Log critical alerts
    if (alert.level === 'critical') {
      console.error(`🚨 Critical Memory Alert: ${alert.message}`);
    } else if (alert.level === 'warning') {
      console.warn(`⚠️ Memory Warning: ${alert.message}`);
    }
  }

  /**
   * Detect garbage collection events
   */
  private detectGarbageCollection(currentSnapshot: MemorySnapshot, previousSnapshot: MemorySnapshot): void {
    const memoryReduction = (previousSnapshot.usedJSHeapSize - currentSnapshot.usedJSHeapSize) / 1024 / 1024;
    
    if (memoryReduction > this.gcDetectionThreshold) {
      this.lastGCTime = performance.now();
      
      this.emitAlert({
        level: 'info',
        type: 'gc',
        message: `Garbage collection detected: ${memoryReduction.toFixed(1)}MB freed`,
        timestamp: performance.now(),
        memoryUsage: currentSnapshot.usedJSHeapSize,
        recommendations: [
          'Memory was successfully reclaimed',
          'Monitor for memory growth patterns after GC'
        ]
      });
    }
  }


  /**
   * Get memory alerts
   */
  getMemoryAlerts(timeWindowMs: number = 300000): MemoryAlert[] {
    const now = performance.now();
    return this.memoryAlerts.filter(alert =>
      (now - alert.timestamp) <= timeWindowMs
    );
  }

  /**
   * Suggest memory optimizations based on current state
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const currentMemory = this.getCurrentMemoryUsage();
    
    if (currentMemory && currentMemory.usedPercent > 60) {
      suggestions.push('Consider reducing the number of canvas elements');
      suggestions.push('Enable viewport culling to hide off-screen elements');
    }
    
    if (this.canvasMemoryInfo.konvaNodes > 500) {
      suggestions.push('Use object pooling for frequently created Konva nodes');
      suggestions.push('Group related shapes into single Konva groups');
    }
    
    if (this.canvasMemoryInfo.textureMemory > 30) {
      suggestions.push('Optimize image sizes and use appropriate formats (WebP, AVIF)');
      suggestions.push('Implement progressive image loading');
    }
    
    if (this.canvasMemoryInfo.eventListeners > 200) {
      suggestions.push('Use event delegation instead of individual listeners');
      suggestions.push('Ensure proper cleanup of event listeners');
    }
    
    const growthRate = this.getMemoryGrowthRate();
    if (growthRate > 0.5) {
      suggestions.push('Monitor for memory leaks in React components');
      suggestions.push('Check for proper cleanup in useEffect hooks');
    }
    
    return suggestions;
  }

  /**
   * Enhanced cleanup when component unmounts
   */
  destroy(): void {
    this.stopMonitoring();
    this.clear();
    this.alertSubscribers.clear();
    this.memoryAlerts = [];
  }
}

// Singleton instance
export const MemoryUsageMonitor = new MemoryUsageMonitorImpl();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    MemoryUsageMonitor.destroy();
  });
}