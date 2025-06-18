// src/utils/performance/CanvasProfiler.ts
/**
 * Canvas-specific performance profiling for Konva operations
 * Tracks canvas rendering, element operations, and interaction performance
 */

import { PerformanceMonitor } from './PerformanceMonitor';

export interface CanvasOperation {
  type: 'render' | 'transform' | 'interaction' | 'text-edit' | 'element-create' | 'element-update' | 'element-delete';
  elementType?: string;
  elementCount?: number;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CanvasPerformanceReport {
  operations: CanvasOperation[];
  averageRenderTime: number;
  averageInteractionTime: number;
  slowestOperations: CanvasOperation[];
  elementCounts: Record<string, number>;
  recommendations: string[];
}

class CanvasProfilerImpl {
  private operations: CanvasOperation[] = [];
  private isEnabled: boolean = true;
  private maxOperations: number = 500;
  private activeOperations: Map<string, { startTime: number; type: CanvasOperation['type']; metadata?: any }> = new Map();

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && 
                     (window as any).__ENABLE_CANVAS_PROFILING;
  }

  /**
   * Start profiling a canvas operation
   */
  startOperation(
    operationId: string,
    type: CanvasOperation['type'],
    elementType?: string,
    metadata?: Record<string, any>
  ): () => void {
    if (!this.isEnabled) return () => {};

    this.activeOperations.set(operationId, {
      startTime: performance.now(),
      type,
      metadata: { elementType, ...metadata }
    });

    return () => this.endOperation(operationId);
  }

  /**
   * End profiling a canvas operation
   */
  private endOperation(operationId: string): void {
    const activeOp = this.activeOperations.get(operationId);
    if (!activeOp) return;

    const duration = performance.now() - activeOp.startTime;
    this.activeOperations.delete(operationId);

    const operation: CanvasOperation = {
      type: activeOp.type,
      elementType: activeOp.metadata?.elementType,
      elementCount: activeOp.metadata?.elementCount,
      duration,
      timestamp: performance.now(),
      metadata: activeOp.metadata
    };

    this.operations.push(operation);

    // Maintain operation history size
    if (this.operations.length > this.maxOperations) {
      this.operations = this.operations.slice(-this.maxOperations);
    }

    // Record in global performance monitor
    PerformanceMonitor.recordMetric(
      `canvas_${operation.type}`,
      duration,
      'canvas',
      {
        elementType: operation.elementType,
        elementCount: operation.elementCount,
        ...operation.metadata
      }
    );

    // Check for performance issues
    this.checkPerformanceThresholds(operation);
  }

  /**
   * Profile a canvas function
   */
  profileFunction<T extends (...args: any[]) => any>(
    fn: T,
    type: CanvasOperation['type'],
    elementType?: string,
    metadata?: Record<string, any>
  ): T {
    if (!this.isEnabled) return fn;

    return ((...args: Parameters<T>) => {
      const operationId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const endOperation = this.startOperation(operationId, type, elementType, metadata);

      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.finally(() => endOperation());
        }
        
        endOperation();
        return result;
      } catch (error) {
        endOperation();
        throw error;
      }
    }) as T;
  }

  /**
   * Profile element rendering
   */
  profileElementRender(elementType: string, elementCount: number = 1): () => void {
    return this.startOperation(
      `render_${elementType}_${Date.now()}`,
      'render',
      elementType,
      { elementCount }
    );
  }

  /**
   * Profile text editing operations
   */
  profileTextEdit(operationType: 'start' | 'update' | 'end'): () => void {
    return this.startOperation(
      `text_edit_${operationType}_${Date.now()}`,
      'text-edit',
      'text',
      { operationType }
    );
  }

  /**
   * Profile user interactions
   */
  profileInteraction(interactionType: 'click' | 'drag' | 'keyboard' | 'touch'): () => void {
    return this.startOperation(
      `interaction_${interactionType}_${Date.now()}`,
      'interaction',
      undefined,
      { interactionType }
    );
  }

  /**
   * Get operations by type
   */
  getOperations(type?: CanvasOperation['type']): CanvasOperation[] {
    if (!type) return [...this.operations];
    return this.operations.filter(op => op.type === type);
  }

  /**
   * Get recent operations
   */
  getRecentOperations(timeWindowMs: number = 10000): CanvasOperation[] {
    const now = performance.now();
    return this.operations.filter(op => (now - op.timestamp) <= timeWindowMs);
  }

  /**
   * Get average operation time by type
   */
  getAverageOperationTime(type: CanvasOperation['type']): number {
    const operations = this.getOperations(type);
    if (operations.length === 0) return 0;

    const totalTime = operations.reduce((sum, op) => sum + op.duration, 0);
    return totalTime / operations.length;
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(count: number = 10): CanvasOperation[] {
    return [...this.operations]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  /**
   * Get element type statistics
   */
  getElementTypeStats(): Record<string, { count: number; avgTime: number; totalTime: number }> {
    const stats: Record<string, { operations: CanvasOperation[]; count: number; totalTime: number }> = {};

    this.operations.forEach(op => {
      if (op.elementType) {
        if (!stats[op.elementType]) {
          stats[op.elementType] = { operations: [], count: 0, totalTime: 0 };
        }
        const elementStats = stats[op.elementType]!;
        elementStats.operations.push(op);
        elementStats.count++;
        elementStats.totalTime += op.duration;
      }
    });

    const result: Record<string, { count: number; avgTime: number; totalTime: number }> = {};
    Object.entries(stats).forEach(([elementType, data]) => {
      result[elementType] = {
        count: data.count,
        avgTime: data.totalTime / data.count,
        totalTime: data.totalTime
      };
    });

    return result;
  }

  /**
   * Check performance thresholds and warn
   */
  private checkPerformanceThresholds(operation: CanvasOperation): void {
    const thresholds = {
      render: 16, // Should complete within one frame (60 FPS)
      interaction: 100, // Should feel responsive
      'text-edit': 50, // Text editing should be snappy
      transform: 16, // Transforms should be smooth
      'element-create': 10, // Element creation should be fast
      'element-update': 5, // Updates should be very fast
      'element-delete': 5 // Deletions should be very fast
    };

    const threshold = thresholds[operation.type];
    if (threshold && operation.duration > threshold) {
      console.warn(
        `🎨 Canvas performance warning: ${operation.type} operation took ${operation.duration.toFixed(2)}ms` +
        `${operation.elementType ? ` (${operation.elementType})` : ''}` +
        ` (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): CanvasPerformanceReport {
    const elementStats = this.getElementTypeStats();
    const slowestOperations = this.getSlowestOperations(5);
    const recommendations: string[] = [];

    // Generate recommendations based on performance data
    const avgRenderTime = this.getAverageOperationTime('render');
    const avgInteractionTime = this.getAverageOperationTime('interaction');

    if (avgRenderTime > 20) {
      recommendations.push('Render times are high - consider optimizing element rendering');
      recommendations.push('Enable viewport culling to reduce off-screen rendering');
    }

    if (avgInteractionTime > 150) {
      recommendations.push('Interaction times are high - consider debouncing user inputs');
      recommendations.push('Optimize event handlers and reduce DOM manipulation');
    }

    if (this.operations.length > this.maxOperations * 0.9) {
      recommendations.push('High operation volume - consider increasing profiling limits');
    }

    // Check for problematic element types
    Object.entries(elementStats).forEach(([elementType, stats]) => {
      if (stats.avgTime > 25) {
        recommendations.push(`${elementType} elements are slow to render - consider optimization`);
      }
    });

    return {
      operations: this.getRecentOperations(),
      averageRenderTime: avgRenderTime,
      averageInteractionTime: avgInteractionTime,
      slowestOperations,
      elementCounts: Object.fromEntries(
        Object.entries(elementStats).map(([type, stats]) => [type, stats.count])
      ),
      recommendations
    };
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.operations = [];
    this.activeOperations.clear();
  }

  /**
   * Enable or disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Get current active operations count
   */
  getActiveOperationsCount(): number {
    return this.activeOperations.size;
  }

  /**
   * Force end all active operations (cleanup)
   */
  forceEndAllOperations(): void {
    const activeIds = Array.from(this.activeOperations.keys());
    activeIds.forEach(id => this.endOperation(id));
  }
}

// Singleton instance
export const CanvasProfiler = new CanvasProfilerImpl();

// Convenience functions
export const profileCanvasFunction = CanvasProfiler.profileFunction.bind(CanvasProfiler);
export const profileElementRender = CanvasProfiler.profileElementRender.bind(CanvasProfiler);
export const profileTextEdit = CanvasProfiler.profileTextEdit.bind(CanvasProfiler);
export const profileInteraction = CanvasProfiler.profileInteraction.bind(CanvasProfiler);

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    CanvasProfiler.forceEndAllOperations();
  });
}