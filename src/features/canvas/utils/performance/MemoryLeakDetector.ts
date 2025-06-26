// src/features/canvas/utils/performance/MemoryLeakDetector.ts
/**
 * MemoryLeakDetector - Tracks component lifecycle and resource allocation
 * Part of LibreOllama Canvas Performance Monitoring System
 */

import { useEffect, useRef } from 'react';
import { logger } from '../../../../lib/logger';

export interface TrackedResource {
  id: string;
  type: 'component' | 'event-listener' | 'timer' | 'subscription';
  name: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface LeakReport {
  totalResources: number;
  leakedResources: TrackedResource[];
  componentCounts: Record<string, number>;
  summary: string;
}

/**
 * MemoryLeakDetector - Static class for tracking resource allocation and cleanup
 */
export class MemoryLeakDetector {
  private static resources = new Map<string, TrackedResource>();
  private static enabled = process.env.NODE_ENV === 'development';
  private static nextId = 0;

  /**
   * Track an event listener
   */
  static trackEventListener(target: string, type: string, handler: string): string {
    if (!this.enabled) return '';
    
    const id = `event-${++this.nextId}`;
    const resource: TrackedResource = {
      id,
      type: 'event-listener',
      name: `${target}:${type}`,
      timestamp: Date.now(),
      metadata: { target, type, handler }
    };
    
    this.resources.set(id, resource);
    logger.debug(`[MemoryLeakDetector] Tracked event listener: ${resource.name}`, { id });
    
    return id;
  }

  /**
   * Track a component mount
   */
  static trackComponent(componentName: string): string {
    if (!this.enabled) return '';
    
    const id = `component-${++this.nextId}`;
    const resource: TrackedResource = {
      id,
      type: 'component',
      name: componentName,
      timestamp: Date.now()
    };
    
    this.resources.set(id, resource);
    logger.debug(`[MemoryLeakDetector] Tracked component: ${componentName}`, { id });
    
    return id;
  }

  /**
   * Untrack a resource by ID
   */
  static untrackResource(id: string): void {
    if (!this.enabled || !id) return;
    
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.delete(id);
      logger.debug(`[MemoryLeakDetector] Untracked resource: ${resource.name}`, { id });
    }
  }

  /**
   * Log current status to console
   */
  static logStatus(): void {
    if (!this.enabled) {
      console.log('[MemoryLeakDetector] Disabled in production');
      return;
    }

    const totalResources = this.resources.size;
    const componentCounts: Record<string, number> = {};
    
    for (const resource of this.resources.values()) {
      const key = resource.type === 'component' ? resource.name : resource.type;
      componentCounts[key] = (componentCounts[key] || 0) + 1;
    }

    console.group('[MemoryLeakDetector] Status Report');
    console.log(`Total tracked resources: ${totalResources}`);
    console.log('Resource breakdown:', componentCounts);
    
    if (totalResources > 0) {
      console.log('Active resources:', Array.from(this.resources.values()));
    }
    
    console.groupEnd();
  }

  /**
   * Generate detailed leak report
   */
  static generateReport(): LeakReport {
    const totalResources = this.resources.size;
    const leakedResources = Array.from(this.resources.values());
    const componentCounts: Record<string, number> = {};
    
    for (const resource of leakedResources) {
      const key = resource.type === 'component' ? resource.name : resource.type;
      componentCounts[key] = (componentCounts[key] || 0) + 1;
    }

    const summary = totalResources === 0 
      ? 'No active resources - all clean!' 
      : `${totalResources} active resources tracked`;

    return {
      totalResources,
      leakedResources,
      componentCounts,
      summary
    };
  }

  /**
   * Clear all tracked resources (for testing)
   */
  static clear(): void {
    this.resources.clear();
    logger.debug('[MemoryLeakDetector] Cleared all tracked resources');
  }

  /**
   * Get current resource count
   */
  static getResourceCount(): number {
    return this.resources.size;
  }
}

/**
 * Hook for tracking component lifecycle
 */
export function useMemoryLeakDetector(componentName: string) {
  const trackingIdRef = useRef<string>('');

  const trackMount = () => {
    if (trackingIdRef.current) {
      // Already tracking, don't create duplicate
      return;
    }
    trackingIdRef.current = MemoryLeakDetector.trackComponent(componentName);
  };

  const trackUnmount = () => {
    if (trackingIdRef.current) {
      MemoryLeakDetector.untrackResource(trackingIdRef.current);
      trackingIdRef.current = '';
    }
  };

  useEffect(() => {
    trackMount();
    return trackUnmount;
  }, [componentName]);

  return {
    trackMount,
    trackUnmount
  };
}

// Global debugging helpers for console use
if (typeof window !== 'undefined') {
  (window as any).MemoryLeakDetector = MemoryLeakDetector;
}
