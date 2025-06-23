// src/utils/performance/MetricsCollector.ts
/**
 * Centralized performance metrics collection and reporting
 * Aggregates data from all performance monitoring systems
 */

import { PerformanceMonitor, PerformanceMetric } from './PerformanceMonitor';
import { RenderTimeTracker } from './RenderTimeTracker';
import { MemoryUsageMonitor } from './MemoryUsageMonitor';
import { CanvasProfiler } from './CanvasProfiler';

export interface ComprehensivePerformanceReport {
  timestamp: number;
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    healthScore: number; // 0-100
    criticalIssues: string[];
    recommendations: string[];
  };
  rendering: {
    averageRenderTime: number;
    slowestComponents: Array<{ name: string; time: number }>;
    renderCount: number;
    frameDroppingIssues: boolean;
  };
  memory: {
    currentUsageMB: number;
    peakUsageMB: number;
    growthRateMBPerMin: number;
    memoryLeakDetected: boolean;
    leakConfidence: number;
  };
  canvas: {
    averageOperationTime: number;
    slowestOperations: Array<{ type: string; duration: number }>;
    elementTypePerformance: Record<string, number>;
    interactionLatency: number;
  };
  textEditing: {
    averageEditTime: number;
    inputLatency: number;
    stateConsistencyIssues: boolean;
  };
}

export interface PerformanceAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'memory' | 'rendering' | 'interaction' | 'text-editing';
  message: string;
  recommendation: string;
  timestamp: number;
}

class MetricsCollectorImpl {
  private alerts: PerformanceAlert[] = [];
  private reportingInterval: number | null = null;
  private isEnabled: boolean = true;
  private subscribers: Set<(report: ComprehensivePerformanceReport) => void> = new Set();

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && 
                     (window as any).__ENABLE_METRICS_COLLECTION;

    if (this.isEnabled) {
      this.startPeriodicReporting();
    }
  }

  /**
   * Generate a comprehensive performance report
   */
  generateComprehensiveReport(): ComprehensivePerformanceReport {
    const renderReport = RenderTimeTracker.generateReport();
    const memoryReport = MemoryUsageMonitor.generateReport();
    const canvasReport = CanvasProfiler.generateReport();

    // Calculate overall health score
    const healthMetrics = this.calculateHealthMetrics(renderReport, memoryReport, canvasReport);
    
    const report: ComprehensivePerformanceReport = {
      timestamp: performance.now(),
      summary: {
        overallHealth: healthMetrics.overallHealth,
        healthScore: healthMetrics.healthScore,
        criticalIssues: healthMetrics.criticalIssues,
        recommendations: [
          ...renderReport.slowestComponents.length > 0 ? ['Optimize slow rendering components'] : [],
          ...memoryReport.leakDetection.isLeak ? ['Address potential memory leaks'] : [],
          ...canvasReport.recommendations,
          ...memoryReport.recommendations
        ]
      },
      rendering: {
        averageRenderTime: renderReport.averageRenderTime,
        slowestComponents: renderReport.slowestComponents.map(comp => ({
          name: comp.componentName,
          time: comp.averageRenderTime
        })).slice(0, 5),
        renderCount: renderReport.totalRenders,
        frameDroppingIssues: renderReport.averageRenderTime > 16 // More than one frame at 60fps
      },
      memory: {
        currentUsageMB: memoryReport.summary.currentUsageMB,
        peakUsageMB: memoryReport.summary.peakUsageMB,
        growthRateMBPerMin: memoryReport.summary.growthRateMBPerMin,
        memoryLeakDetected: memoryReport.leakDetection.isLeak,
        leakConfidence: memoryReport.leakDetection.confidence
      },
      canvas: {
        averageOperationTime: canvasReport.averageRenderTime,
        slowestOperations: canvasReport.slowestOperations.map(op => ({
          type: op.type,
          duration: op.duration
        })).slice(0, 5),
        elementTypePerformance: Object.fromEntries(
          Object.entries(canvasReport.elementCounts).map(([type, count]) => [
            type,
            canvasReport.averageRenderTime / Math.max(count, 1)
          ])
        ),
        interactionLatency: canvasReport.averageInteractionTime
      },
      textEditing: {
        averageEditTime: PerformanceMonitor.getAverageMetric('text-edit'),
        inputLatency: PerformanceMonitor.getAverageMetric('input-latency'),
        stateConsistencyIssues: this.detectTextEditingIssues()
      }
    };

    // Generate alerts based on the report
    this.generateAlerts(report);

    return report;
  }

  /**
   * Calculate overall health metrics
   */
  private calculateHealthMetrics(renderReport: any, memoryReport: any, canvasReport: any): {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    healthScore: number;
    criticalIssues: string[];
  } {
    let healthScore = 100;
    const criticalIssues: string[] = [];

    // Rendering health (25% weight)
    if (renderReport.averageRenderTime > 32) {
      healthScore -= 25;
      criticalIssues.push('Severe rendering performance issues');
    } else if (renderReport.averageRenderTime > 16) {
      healthScore -= 15;
      criticalIssues.push('Rendering performance degradation');
    }

    // Memory health (25% weight)
    if (memoryReport.leakDetection.isLeak && memoryReport.leakDetection.confidence > 0.7) {
      healthScore -= 25;
      criticalIssues.push('High confidence memory leak detected');
    } else if (memoryReport.summary.currentUsageMB > 200) {
      healthScore -= 15;
      criticalIssues.push('High memory usage');
    }

    // Canvas performance health (25% weight)
    if (canvasReport.averageRenderTime > 20) {
      healthScore -= 20;
      criticalIssues.push('Canvas operations are slow');
    }
    if (canvasReport.averageInteractionTime > 150) {
      healthScore -= 10;
      criticalIssues.push('User interactions are sluggish');
    }

    // Text editing health (25% weight)
    const textEditTime = PerformanceMonitor.getAverageMetric('text-edit');
    if (textEditTime > 100) {
      healthScore -= 25;
      criticalIssues.push('Text editing performance is poor');
    }

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (healthScore >= 90) overallHealth = 'excellent';
    else if (healthScore >= 70) overallHealth = 'good';
    else if (healthScore >= 50) overallHealth = 'fair';
    else overallHealth = 'poor';

    return {
      overallHealth,
      healthScore: Math.max(0, healthScore),
      criticalIssues
    };
  }

  /**
   * Detect text editing specific issues
   */
  private detectTextEditingIssues(): boolean {
    const textEditMetrics = PerformanceMonitor.getMetrics('render').filter(m => 
      m.name.includes('text') || m.name.includes('edit')
    );

    // Check for inconsistent text editing performance
    if (textEditMetrics.length < 5) return false;

    const times = textEditMetrics.map(m => m.value);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    // High variance indicates inconsistent performance
    return standardDeviation > average * 0.5;
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(report: ComprehensivePerformanceReport): void {
    const newAlerts: PerformanceAlert[] = [];

    // Memory alerts
    if (report.memory.memoryLeakDetected && report.memory.leakConfidence > 0.6) {
      newAlerts.push({
        severity: 'critical',
        type: 'memory',
        message: `Memory leak detected with ${(report.memory.leakConfidence * 100).toFixed(0)}% confidence`,
        recommendation: 'Review component cleanup and event listener removal',
        timestamp: performance.now()
      });
    }

    // Rendering alerts
    if (report.rendering.frameDroppingIssues) {
      newAlerts.push({
        severity: 'high',
        type: 'rendering',
        message: `Average render time ${report.rendering.averageRenderTime.toFixed(2)}ms exceeds 60 FPS threshold`,
        recommendation: 'Enable viewport culling and optimize render methods',
        timestamp: performance.now()
      });
    }

    // Interaction alerts
    if (report.canvas.interactionLatency > 200) {
      newAlerts.push({
        severity: 'medium',
        type: 'interaction',
        message: `High interaction latency: ${report.canvas.interactionLatency.toFixed(2)}ms`,
        recommendation: 'Debounce user inputs and optimize event handlers',
        timestamp: performance.now()
      });
    }

    // Text editing alerts
    if (report.textEditing.stateConsistencyIssues) {
      newAlerts.push({
        severity: 'high',
        type: 'text-editing',
        message: 'Text editing state consistency issues detected',
        recommendation: 'Review text editing state management and synchronization',
        timestamp: performance.now()
      });
    }

    this.alerts.push(...newAlerts);
    
    // Limit alert history
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts immediately
    newAlerts.filter(alert => alert.severity === 'critical').forEach(alert => {
      console.error(`🚨 Critical Performance Alert: ${alert.message}`);
    });
  }

  /**
   * Subscribe to performance reports
   */
  subscribe(callback: (report: ComprehensivePerformanceReport) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(intervalMs: number = 30000): void {
    if (this.reportingInterval) return;

    this.reportingInterval = window.setInterval(() => {
      const report = this.generateComprehensiveReport();
      this.subscribers.forEach(callback => {
        try {
          callback(report);
        } catch (error) {
          console.warn('Performance report subscriber error:', error);
        }
      });
    }, intervalMs);
  }
  /**
   * Stop periodic reporting
   */
  stopPeriodicReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }  /**
   * Cleanup method to prevent memory leaks
   */
  public dispose(): void {
    this.stopPeriodicReporting();
    this.subscribers.clear();
    this.alerts = [];
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(timeWindowMs: number = 300000): PerformanceAlert[] {
    const now = performance.now();
    return this.alerts.filter(alert => (now - alert.timestamp) <= timeWindowMs);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Export performance data for external analysis
   */
  exportPerformanceData(): {
    report: ComprehensivePerformanceReport;
    rawMetrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
  } {
    return {
      report: this.generateComprehensiveReport(),
      rawMetrics: PerformanceMonitor.getMetrics(),
      alerts: this.getRecentAlerts()
    };
  }

  /**
   * Enable or disable metrics collection
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.startPeriodicReporting();
    } else {
      this.stopPeriodicReporting();
      this.clearAlerts();
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.stopPeriodicReporting();
    this.subscribers.clear();
    this.alerts = [];
  }
}

// Singleton instance
export const MetricsCollector = new MetricsCollectorImpl();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    MetricsCollector.destroy();
  });
}