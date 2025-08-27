/**
 * Production Performance Monitoring
 * Based on insights from performance testing that revealed 200ms -> 300ms adjustment needs
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  elementCount?: number;
  userAgent: string;
}

class ProductionPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  private readonly PERFORMANCE_THRESHOLDS = {
    // Based on test findings - production should meet stricter standards
    elementAddition: 250, // Test revealed 300ms, aim for 250ms in production
    batchUpdate: 50,      // Batch operations should be fast
    rendering: 16,        // One frame at 60fps
    apiRequest: 5000,     // 5 second timeout for API calls
  };

  /**
   * Track performance for canvas operations
   */
  trackCanvasOperation<T>(
    operation: string,
    fn: () => T,
    elementCount?: number
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        operation: `canvas_${operation}`,
        duration,
        timestamp: Date.now(),
        elementCount,
        userAgent: navigator.userAgent
      });
      
      // Warn if performance is degrading
      if (operation === 'element_addition' && duration > this.PERFORMANCE_THRESHOLDS.elementAddition) {
        console.warn(`🐌 [PERF] Canvas element addition took ${duration.toFixed(2)}ms (threshold: ${this.PERFORMANCE_THRESHOLDS.elementAddition}ms)`);
        this.reportPerformanceIssue('canvas_slow_element_addition', { duration, elementCount });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        operation: `canvas_${operation}_error`,
        duration,
        timestamp: Date.now(),
        elementCount,
        userAgent: navigator.userAgent
      });
      throw error;
    }
  }

  /**
   * Track Gmail API performance
   */
  async trackGmailOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    accountId?: string
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        operation: `gmail_${operation}`,
        duration,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      
      // Track slow API calls
      if (duration > this.PERFORMANCE_THRESHOLDS.apiRequest) {
        console.warn(`🐌 [PERF] Gmail ${operation} took ${duration.toFixed(2)}ms`);
        this.reportPerformanceIssue('gmail_slow_api', { operation, duration, accountId });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        operation: `gmail_${operation}_error`,
        duration,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    const stats = {
      totalOperations: recentMetrics.length,
      averageDuration: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length || 0,
      slowOperations: recentMetrics.filter(m => m.duration > 100).length,
      canvasOperations: recentMetrics.filter(m => m.operation.startsWith('canvas_')).length,
      gmailOperations: recentMetrics.filter(m => m.operation.startsWith('gmail_')).length,
    };
    
    return stats;
  }

  /**
   * Report performance issues to monitoring service
   */
  private async reportPerformanceIssue(type: string, data: Record<string, unknown>) {
    try {
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Replace with actual monitoring service
        console.log('📊 [PERF] Performance issue reported:', { type, data });
        
        // Could integrate with services like:
        // - Sentry performance monitoring
        // - DataDog RUM
        // - Custom analytics endpoint
      }
    } catch (error) {
      console.error('Failed to report performance issue:', error);
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }
}

// Singleton instance
export const performanceMonitor = new ProductionPerformanceMonitor();

// Convenience functions
export const trackCanvasPerformance = <T>(
  operation: string,
  fn: () => T,
  elementCount?: number
): T => performanceMonitor.trackCanvasOperation(operation, fn, elementCount);

export const trackGmailPerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  accountId?: string
): Promise<T> => performanceMonitor.trackGmailOperation(operation, fn, accountId); 