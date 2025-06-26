// Memory and Performance Monitoring - Phase 5
import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../../../lib/logger';

/**
 * CanvasMemoryProfiler - Comprehensive memory monitoring for canvas operations
 * Detects memory leaks, tracks growth patterns, and provides optimization insights
 */
export class CanvasMemoryProfiler {
  private baseline: number = 0;
  private measurements: MemoryMeasurement[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private _isMonitoring: boolean = false;

  constructor(private options: MemoryProfilerOptions = {}) {
    this.options = {
      measurementInterval: 5000, // 5 seconds
      maxMeasurements: 100,
      leakThreshold: 50 * 1024 * 1024, // 50MB
      warningThreshold: 25 * 1024 * 1024, // 25MB
      ...options
    };
  }

  /**
   * Start profiling memory usage
   */
  startProfiling(): void {
    if (!this.isMemoryApiAvailable()) {
      console.warn('Memory API not available in this browser');
      return;
    }    this.baseline = this.getCurrentMemoryUsage();
    this._isMonitoring = true;
    
    logger.log(`Memory profiling started. Baseline: ${this.formatBytes(this.baseline)}`);
    
    // Start periodic measurements
    this.intervalId = setInterval(() => {
      this.takeMeasurement();
    }, this.options.measurementInterval);
  }

  /**
   * Stop profiling and generate report
   */
  stopProfiling(): MemoryReport {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this._isMonitoring = false;
    
    const report = this.generateReport();
    logger.log('Memory profiling stopped:', report);
    
    return report;
  }

  /**
   * Take a single memory measurement
   */
  takeMeasurement(label?: string): MemoryMeasurement {
    if (!this.isMemoryApiAvailable()) {
      throw new Error('Memory API not available');
    }

    const memory = (performance as any).memory;    const measurement: MemoryMeasurement = {
      timestamp: Date.now(),
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      growthFromBaseline: memory.usedJSHeapSize - this.baseline,
      ...(label && { label })
    };

    this.measurements.push(measurement);
    
    // Keep measurements within limit
    if (this.measurements.length > this.options.maxMeasurements!) {
      this.measurements.shift();
    }

    // Check for warnings
    this.checkMemoryWarnings(measurement);

    return measurement;
  }

  /**
   * Check for memory growth patterns and warnings
   */
  private checkMemoryWarnings(measurement: MemoryMeasurement): void {
    const growth = measurement.growthFromBaseline;
    
    if (growth > this.options.leakThreshold!) {
      console.error(`🚨 Memory leak detected: ${this.formatBytes(growth)} growth from baseline`);
      this.generateLeakReport();
    } else if (growth > this.options.warningThreshold!) {
      console.warn(`⚠️ High memory usage: ${this.formatBytes(growth)} growth from baseline`);
    }
  }
  /**
   * Generate comprehensive memory report
   */
  private generateReport(): MemoryReport {
    if (this.measurements.length === 0) {
      return {
        duration: 0,
        totalMeasurements: 0,
        averageUsage: 0,
        peakUsage: 0,
        growthFromBaseline: 0,
        memoryLeakDetected: false,
        recommendations: ['No measurements taken']
      };
    }

    const firstMeasurement = this.measurements[0]!;
    const lastMeasurement = this.measurements[this.measurements.length - 1]!;
    const duration = lastMeasurement.timestamp - firstMeasurement.timestamp;
    
    const usages = this.measurements.map(m => m.used);
    const averageUsage = usages.reduce((a, b) => a + b, 0) / usages.length;
    const peakUsage = Math.max(...usages);
    const growthFromBaseline = lastMeasurement.growthFromBaseline;
    
    const growthRate = this.calculateGrowthRate();
    const memoryLeakDetected = growthRate > 1024 * 1024; // 1MB per minute

    return {
      duration,
      totalMeasurements: this.measurements.length,
      averageUsage,
      peakUsage,
      growthFromBaseline,
      growthRate,
      memoryLeakDetected,
      recommendations: this.generateRecommendations(growthRate, peakUsage)
    };
  }
  /**
   * Calculate memory growth rate per minute
   */
  private calculateGrowthRate(): number {
    if (this.measurements.length < 2) return 0;
    
    const firstMeasurement = this.measurements[0]!;
    const lastMeasurement = this.measurements[this.measurements.length - 1]!;
    
    const timeDiffMs = lastMeasurement.timestamp - firstMeasurement.timestamp;
    const memoryDiff = lastMeasurement.used - firstMeasurement.used;
    
    // Convert to bytes per minute
    return (memoryDiff / timeDiffMs) * 60000;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(growthRate: number, peakUsage: number): string[] {
    const recommendations: string[] = [];
    
    if (growthRate > 1024 * 1024) {
      recommendations.push('Memory leak detected - review event listeners and object references');
    }
    
    if (growthRate > 512 * 1024) {
      recommendations.push('High memory growth - implement object pooling for frequently created objects');
    }
    
    if (peakUsage > 100 * 1024 * 1024) {
      recommendations.push('High peak usage - implement viewport culling and lazy loading');
    }
    
    if (peakUsage > 50 * 1024 * 1024) {
      recommendations.push('Consider implementing element virtualization for large canvases');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Memory usage is within acceptable limits');
    }
    
    return recommendations;
  }

  /**
   * Generate detailed leak analysis report
   */
  private generateLeakReport(): void {
    const recentMeasurements = this.measurements.slice(-10);
    const growth = recentMeasurements.map(m => m.growthFromBaseline);
    
    console.group('🔍 Memory Leak Analysis');    logger.log('Recent growth pattern:', growth.map(g => this.formatBytes(g)));
    logger.log('Recommendations:');
    logger.log('• Check for unreleased Konva nodes');
    logger.log('• Verify event listeners are properly removed');
    logger.log('• Review canvas element caching strategy');
    logger.log('• Check for circular references in element data');
    console.groupEnd();
  }

  /**
   * Check if browser supports memory API
   */
  private isMemoryApiAvailable(): boolean {
    return !!(performance as any).memory;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (!this.isMemoryApiAvailable()) return 0;
    return (performance as any).memory.usedJSHeapSize;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get current memory status
   */
  getMemoryStatus(): MemoryStatus {
    if (!this.isMemoryApiAvailable()) {
      return {
        isSupported: false,
        current: 0,
        baseline: this.baseline,
        growth: 0,
        status: 'unknown'
      };
    }

    const current = this.getCurrentMemoryUsage();
    const growth = current - this.baseline;
    
    let status: 'good' | 'warning' | 'critical' | 'unknown' = 'good';
    
    if (growth > this.options.leakThreshold!) {
      status = 'critical';
    } else if (growth > this.options.warningThreshold!) {
      status = 'warning';
    }

    return {
      isSupported: true,
      current,
      baseline: this.baseline,
      growth,
      status
    };
  }
}

/**
 * React Hook for Memory Monitoring
 */
export const useMemoryMonitor = (options?: MemoryProfilerOptions) => {
  const profilerRef = useRef<CanvasMemoryProfiler | null>(null);
  const [status, setStatus] = useState<MemoryStatus>({
    isSupported: false,
    current: 0,
    baseline: 0,
    growth: 0,
    status: 'unknown'
  });

  useEffect(() => {
    profilerRef.current = new CanvasMemoryProfiler(options);
    return () => {
      if (profilerRef.current) {
        profilerRef.current.stopProfiling();
      }
    };
  }, [options]);

  const startMonitoring = useCallback(() => {
    if (profilerRef.current) {
      profilerRef.current.startProfiling();
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (profilerRef.current) {
      return profilerRef.current.stopProfiling();
    }
    return null;
  }, []);

  const getStatus = useCallback(() => {
    if (profilerRef.current) {
      const newStatus = profilerRef.current.getMemoryStatus();
      setStatus(newStatus);
      return newStatus;
    }
    return status;
  }, [status]);

  const measureNow = useCallback((label?: string) => {
    if (profilerRef.current) {
      return profilerRef.current.takeMeasurement(label);
    }
    return null;
  }, []);

  return {
    startMonitoring,
    stopMonitoring,
    getStatus,
    measureNow,
    status
  };
};

// Type definitions
interface MemoryProfilerOptions {
  measurementInterval?: number;
  maxMeasurements?: number;
  leakThreshold?: number;
  warningThreshold?: number;
}

interface MemoryMeasurement {
  timestamp: number;
  used: number;
  total: number;
  limit: number;
  growthFromBaseline: number;
  label?: string;
}

interface MemoryReport {
  duration: number;
  totalMeasurements: number;
  averageUsage: number;
  peakUsage: number;
  growthFromBaseline: number;
  growthRate?: number;
  memoryLeakDetected: boolean;
  recommendations: string[];
}

interface MemoryStatus {
  isSupported: boolean;
  current: number;
  baseline: number;
  growth: number;
  status: 'good' | 'warning' | 'critical' | 'unknown';
}

// React import for hooks
import { useState } from 'react';
