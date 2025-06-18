/**
 * Event Performance Monitoring
 * Phase 4.4 of Canvas Master Plan
 * 
 * Monitors event handler performance to ensure sub-16ms response times
 */

interface EventMetrics {
  eventName: string;
  averageTime: number;
  maxTime: number;
  callCount: number;
  lastCallTime: number;
}

class EventPerformanceMonitor {
  private metrics = new Map<string, EventMetrics>();
  private performanceThreshold = 16; // 16ms for 60fps

  recordEventTiming(eventName: string, duration: number) {
    const existing = this.metrics.get(eventName);
    
    if (existing) {
      existing.callCount++;
      existing.averageTime = (existing.averageTime * (existing.callCount - 1) + duration) / existing.callCount;
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.lastCallTime = performance.now();
    } else {
      this.metrics.set(eventName, {
        eventName,
        averageTime: duration,
        maxTime: duration,
        callCount: 1,
        lastCallTime: performance.now()
      });
    }

    // Warn if exceeding performance threshold
    if (duration > this.performanceThreshold) {
      console.warn(`[EVENT PERFORMANCE] ${eventName} took ${duration.toFixed(2)}ms (target: <${this.performanceThreshold}ms)`);
    }
  }

  getMetrics(): EventMetrics[] {
    return Array.from(this.metrics.values());
  }

  getSlowEvents(): EventMetrics[] {
    return this.getMetrics().filter(metric => 
      metric.averageTime > this.performanceThreshold || 
      metric.maxTime > this.performanceThreshold * 2
    );
  }

  resetMetrics() {
    this.metrics.clear();
  }

  setPerformanceThreshold(threshold: number) {
    this.performanceThreshold = threshold;
  }
}

export const eventPerformanceMonitor = new EventPerformanceMonitor();

/**
 * Decorator to automatically monitor event handler performance
 */
export function monitorEventPerformance<T extends (...args: any[]) => void>(
  eventName: string,
  handler: T
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    handler(...args);
    const end = performance.now();
    
    eventPerformanceMonitor.recordEventTiming(eventName, end - start);
  }) as T;
}

/**
 * Hook for components to monitor their event performance
 */
export function useEventPerformanceMonitoring() {
  return {
    monitor: eventPerformanceMonitor,
    getMetrics: () => eventPerformanceMonitor.getMetrics(),
    getSlowEvents: () => eventPerformanceMonitor.getSlowEvents(),
    resetMetrics: () => eventPerformanceMonitor.resetMetrics()
  };
}
