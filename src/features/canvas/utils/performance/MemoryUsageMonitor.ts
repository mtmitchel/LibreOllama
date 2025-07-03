// src/utils/performance/MemoryUsageMonitor.ts
/**
 * Simplified Memory usage monitoring for LibreOllama Canvas
 * PERFORMANCE OPTIMIZATION: Reduced monitoring frequency and complexity
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
  growthRate: number;
  recommendations: string[];
}

class MemoryUsageMonitorImpl {
  private snapshots: MemorySnapshot[] = [];
  private isEnabled: boolean = false; // CHANGED: Default to disabled
  private monitoringInterval: number | null = null;
  private readonly maxSnapshots = 20; // REDUCED: From 100 to 20
  private readonly monitoringIntervalMs = 30000; // INCREASED: From 10s to 30s

  constructor() {
    // Only enable in development and only if explicitly requested
    this.isEnabled = process.env.NODE_ENV === 'development' && 
                     typeof window !== 'undefined' && 
                     (window as any).__ENABLE_MEMORY_MONITORING === true;

    if (this.isEnabled && this.canMonitorMemory()) {
      this.startMonitoring();
    }
  }

  private canMonitorMemory(): boolean {
    return typeof window !== 'undefined' && 
           'performance' in window && 
           'memory' in (performance as any);
  }

  takeSnapshot(): MemorySnapshot | null {
    if (!this.canMonitorMemory() || !this.isEnabled) return null;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: performance.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Only record if usage is concerning (>70%)
    if (snapshot.usedPercent > 70) {
      PerformanceMonitor.recordMetric(
        'memoryUsage',
        snapshot.usedJSHeapSize / 1024 / 1024,
        'memory',
        { usedPercent: snapshot.usedPercent }
      );
    }

    return snapshot;
  }

  startMonitoring(): void {
    if (!this.isEnabled || this.monitoringInterval) return;

    this.monitoringInterval = window.setInterval(() => {
      this.takeSnapshot();
    }, this.monitoringIntervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getCurrentMemoryUsage(): MemorySnapshot | null {
    return this.takeSnapshot();
  }

  getMemoryGrowthRate(timeWindowMs: number = 300000): number {
    const recentSnapshots = this.snapshots.filter(snapshot => 
      (performance.now() - snapshot.timestamp) <= timeWindowMs
    );
    
    if (recentSnapshots.length < 2) return 0;

    const first = recentSnapshots[0];
    const last = recentSnapshots[recentSnapshots.length - 1];
    
    if (!first || !last) return 0;
    
    const timeDiffMinutes = (last.timestamp - first.timestamp) / 60000;
    const memoryDiffMB = (last.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024;
    
    return timeDiffMinutes > 0 ? memoryDiffMB / timeDiffMinutes : 0;
  }

  detectMemoryLeaks(): MemoryLeakDetection {
    const growthRate = this.getMemoryGrowthRate();
    const currentSnapshot = this.getCurrentMemoryUsage();
    
    let isLeak = false;
    let confidence = 0;
    const recommendations: string[] = [];

    // Simple leak detection
    if (growthRate > 2) { // More than 2MB per minute growth
      isLeak = true;
      confidence = 0.8;
      recommendations.push('Memory is growing rapidly');
    }

    if (currentSnapshot && currentSnapshot.usedPercent > 85) {
      isLeak = true;
      confidence = Math.max(confidence, 0.7);
      recommendations.push('Memory usage is very high');
    }

    return { isLeak, confidence, growthRate, recommendations };
  }

  clear(): void {
    this.snapshots = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled && this.canMonitorMemory()) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
      this.clear();
    }
  }

  // Simplified canvas tracking methods - no-ops to prevent errors
  trackKonvaNodes(_count: number): void {}
  trackTextureMemory(_memoryMB: number): void {}
  trackCachedElements(_count: number): void {}
  trackEventListeners(_count: number): void {}
  trackComponentInstances(_count: number): void {}
  updateCanvasMemoryInfo(_update: any): void {}
  addKonvaNode(_count: number = 1): void {}
  removeKonvaNode(_count: number = 1): void {}
  addTextureMemory(_sizeMB: number): void {}
  removeTextureMemory(_sizeMB: number): void {}
  
  destroy(): void {
    this.stopMonitoring();
    this.clear();
  }

  // Added to satisfy MetricsCollector expectations
  generateReport() {
    const current = this.getCurrentMemoryUsage();
    return {
      snapshot: current,
      leak: this.detectMemoryLeaks(),
    };
  }
}

// Singleton instance
export const MemoryUsageMonitor = new MemoryUsageMonitorImpl();