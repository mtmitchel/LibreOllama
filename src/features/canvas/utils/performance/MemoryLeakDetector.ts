/**
 * Memory Leak Detection Utility
 * Tracks potential memory leak sources in the canvas application
 */

import { logger } from '@/lib/logger';

interface TrackedResource {
  id: string;
  type: 'component' | 'event-listener' | 'store-subscription' | 'konva-node' | 'timer';
  description: string;
  createdAt: number;
  stackTrace?: string;
}

interface LeakReport {
  totalResources: number;
  resourcesByType: Record<string, number>;
  oldestResources: TrackedResource[];
  suspiciousPatterns: string[];
}

class MemoryLeakDetectorImpl {
  private resources = new Map<string, TrackedResource>();
  private resourceCountHistory: Array<{ timestamp: number; count: number }> = [];
  private componentMountCounts = new Map<string, { mounts: number; unmounts: number }>();
  private readonly maxHistorySize = 100;
  private readonly resourceAgeThreshold = 300000; // 5 minutes
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Track a new resource creation
   */
  trackResource(id: string, type: TrackedResource['type'], description: string): void {
    if (!this.isEnabled) return;

    const resource: TrackedResource = {
      id,
      type,
      description,
      createdAt: Date.now(),
      stackTrace: this.captureStackTrace()
    };

    this.resources.set(id, resource);
    this.updateResourceHistory();

    logger.log(`🔍 [MemoryLeakDetector] Resource tracked: ${type} - ${description}`);
  }

  /**
   * Untrack a resource when it's cleaned up
   */
  untrackResource(id: string): void {
    if (!this.isEnabled) return;

    const resource = this.resources.get(id);
    if (resource) {
      this.resources.delete(id);
      logger.log(`✅ [MemoryLeakDetector] Resource cleaned: ${resource.type} - ${resource.description}`);
    }
    this.updateResourceHistory();
  }

  /**
   * Track component lifecycle
   */
  trackComponentMount(componentName: string): void {
    if (!this.isEnabled) return;

    const stats = this.componentMountCounts.get(componentName) || { mounts: 0, unmounts: 0 };
    stats.mounts++;
    this.componentMountCounts.set(componentName, stats);

    // Track as a resource
    const id = `component_${componentName}_${Date.now()}`;
    this.trackResource(id, 'component', `Component: ${componentName}`);
  }

  /**
   * Track component unmount
   */
  trackComponentUnmount(componentName: string): void {
    if (!this.isEnabled) return;

    const stats = this.componentMountCounts.get(componentName) || { mounts: 0, unmounts: 0 };
    stats.unmounts++;
    this.componentMountCounts.set(componentName, stats);

    // Check for mount/unmount imbalance
    if (stats.mounts - stats.unmounts > 10) {
      logger.warn(`⚠️ [MemoryLeakDetector] Component mount/unmount imbalance: ${componentName}`, {
        mounts: stats.mounts,
        unmounts: stats.unmounts,
        difference: stats.mounts - stats.unmounts
      });
    }
  }

  /**
   * Track event listener registration
   */
  trackEventListener(element: string, eventType: string, handlerName: string): string {
    if (!this.isEnabled) return '';

    const id = `listener_${element}_${eventType}_${Date.now()}`;
    this.trackResource(id, 'event-listener', `${element}.${eventType} -> ${handlerName}`);
    return id;
  }

  /**
   * Track store subscription
   */
  trackStoreSubscription(storeName: string, subscriberName: string): string {
    if (!this.isEnabled) return '';

    const id = `subscription_${storeName}_${Date.now()}`;
    this.trackResource(id, 'store-subscription', `${storeName} -> ${subscriberName}`);
    return id;
  }

  /**
   * Track Konva node creation
   */
  trackKonvaNode(nodeType: string, nodeId: string): void {
    if (!this.isEnabled) return;

    const id = `konva_${nodeId}`;
    this.trackResource(id, 'konva-node', `Konva ${nodeType}: ${nodeId}`);
  }

  /**
   * Untrack Konva node
   */
  untrackKonvaNode(nodeId: string): void {
    if (!this.isEnabled) return;

    this.untrackResource(`konva_${nodeId}`);
  }

  /**
   * Track timer/interval creation
   */
  trackTimer(type: 'timeout' | 'interval', duration: number, description: string): string {
    if (!this.isEnabled) return '';

    const id = `timer_${type}_${Date.now()}`;
    this.trackResource(id, 'timer', `${type} (${duration}ms): ${description}`);
    return id;
  }

  /**
   * Generate leak detection report
   */
  generateReport(): LeakReport {
    const now = Date.now();
    const resourcesByType: Record<string, number> = {};
    const oldResources: TrackedResource[] = [];
    const suspiciousPatterns: string[] = [];

    // Count resources by type and find old ones
    this.resources.forEach((resource) => {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;

      if (now - resource.createdAt > this.resourceAgeThreshold) {
        oldResources.push(resource);
      }
    });

    // Check for suspicious patterns
    if (resourcesByType['event-listener'] > 100) {
      suspiciousPatterns.push(`High event listener count: ${resourcesByType['event-listener']}`);
    }

    if (resourcesByType['konva-node'] > 500) {
      suspiciousPatterns.push(`High Konva node count: ${resourcesByType['konva-node']}`);
    }

    if (resourcesByType['store-subscription'] > 50) {
      suspiciousPatterns.push(`High store subscription count: ${resourcesByType['store-subscription']}`);
    }

    // Check for component imbalances
    this.componentMountCounts.forEach((stats, componentName) => {
      const imbalance = stats.mounts - stats.unmounts;
      if (imbalance > 5) {
        suspiciousPatterns.push(`Component ${componentName} has ${imbalance} more mounts than unmounts`);
      }
    });

    // Check resource growth trend
    if (this.resourceCountHistory.length >= 10) {
      const recentHistory = this.resourceCountHistory.slice(-10);
      const isGrowing = recentHistory.every((item, idx) => 
        idx === 0 || item.count >= recentHistory[idx - 1].count
      );

      if (isGrowing) {
        suspiciousPatterns.push('Resource count is consistently growing without cleanup');
      }
    }

    return {
      totalResources: this.resources.size,
      resourcesByType,
      oldestResources: oldResources.slice(0, 10), // Top 10 oldest
      suspiciousPatterns
    };
  }

  /**
   * Log current memory leak status
   */
  logStatus(): void {
    if (!this.isEnabled) return;

    const report = this.generateReport();
    
    console.group('🔍 Memory Leak Detection Report');
    console.log('Total tracked resources:', report.totalResources);
    console.log('Resources by type:', report.resourcesByType);
    
    if (report.suspiciousPatterns.length > 0) {
      console.warn('⚠️ Suspicious patterns detected:');
      report.suspiciousPatterns.forEach(pattern => console.warn(`  - ${pattern}`));
    }

    if (report.oldestResources.length > 0) {
      console.warn('🕐 Old resources (potential leaks):');
      report.oldestResources.forEach(resource => {
        const age = Math.floor((Date.now() - resource.createdAt) / 1000);
        console.warn(`  - ${resource.description} (${age}s old)`);
      });
    }

    console.log('Component mount/unmount stats:');
    this.componentMountCounts.forEach((stats, name) => {
      if (stats.mounts !== stats.unmounts) {
        console.warn(`  - ${name}: ${stats.mounts} mounts, ${stats.unmounts} unmounts`);
      }
    });

    console.groupEnd();
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.resources.clear();
    this.resourceCountHistory = [];
    this.componentMountCounts.clear();
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStackTrace(): string {
    const obj = {} as any;
    Error.captureStackTrace(obj, this.captureStackTrace);
    return obj.stack || '';
  }

  /**
   * Update resource count history
   */
  private updateResourceHistory(): void {
    this.resourceCountHistory.push({
      timestamp: Date.now(),
      count: this.resources.size
    });

    if (this.resourceCountHistory.length > this.maxHistorySize) {
      this.resourceCountHistory = this.resourceCountHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get resource count by type
   */
  getResourceCount(type?: TrackedResource['type']): number {
    if (!type) {
      return this.resources.size;
    }

    let count = 0;
    this.resources.forEach(resource => {
      if (resource.type === type) {
        count++;
      }
    });
    return count;
  }

  /**
   * Create a React hook for tracking component lifecycle
   */
  createComponentTracker(componentName: string) {
    return {
      trackMount: () => this.trackComponentMount(componentName),
      trackUnmount: () => this.trackComponentUnmount(componentName)
    };
  }
}

// Singleton instance
export const MemoryLeakDetector = new MemoryLeakDetectorImpl();

// Convenience hook for React components
export function useMemoryLeakDetector(componentName: string) {
  if (process.env.NODE_ENV !== 'development') {
    return {
      trackMount: () => {},
      trackUnmount: () => {}
    };
  }

  const tracker = MemoryLeakDetector.createComponentTracker(componentName);
  
  // Use effect will be called by the component using this hook
  return tracker;
}

// Auto-log status in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Log status every 30 seconds
  setInterval(() => {
    MemoryLeakDetector.logStatus();
  }, 30000);
}
