/**
 * Performance monitoring utility for debugging CPU spikes
 * Use this to identify performance bottlenecks in your Tauri app
 */

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Performance monitoring started');

    // Monitor long tasks (potential CPU spikes)
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.log('Long task observer not supported');
      }

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).value > 0.1) {
            console.warn(`⚠️ Layout shift detected: ${(entry as any).value}`, entry);
          }
        }
      });
      
      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.log('Layout shift observer not supported');
      }
    }

    // Monitor memory usage every 10 seconds
    setInterval(() => {
      this.logMemoryUsage();
    }, 10000);
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('🔍 Performance monitoring stopped');
  }

  /**
   * Measure component render time
   */
  measureComponent(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    renderFn();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      memoryUsage: this.getMemoryUsage() - startMemory,
      timestamp: Date.now()
    };
    
    this.metrics.push(metric);
    
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`⚠️ Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Log current memory usage
   */
  private logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    console.log(`💾 Memory usage: ${(memory / 1024 / 1024).toFixed(2)} MB`);
    
    if (memory > 100 * 1024 * 1024) { // More than 100MB
      console.warn('⚠️ High memory usage detected!');
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = {
      totalComponents: this.metrics.length,
      averageRenderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
      slowestComponent: this.metrics.reduce((slowest, current) => 
        current.renderTime > slowest.renderTime ? current : slowest, this.metrics[0]),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(report, null, 2);
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureRender: (renderFn: () => void) => {
      monitor.measureComponent(componentName, renderFn);
    },
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    getReport: () => monitor.generateReport()
  };
}

/**
 * Utility function to detect CPU spikes
 */
export function detectCPUSpike(): Promise<boolean> {
  return new Promise((resolve) => {
    const start = performance.now();
    
    // Use requestIdleCallback to detect if main thread is busy
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const elapsed = performance.now() - start;
        resolve(elapsed > 100); // Consider it a spike if idle callback takes > 100ms
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        const elapsed = performance.now() - start;
        resolve(elapsed > 50);
      }, 0);
    }
  });
}

/**
 * Debounce function to prevent excessive function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}