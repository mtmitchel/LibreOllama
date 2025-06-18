// src/utils/performance/RenderTimeTracker.ts
/**
 * Component render time tracking for React components
 * Provides detailed insights into component performance
 */

import { PerformanceMonitor } from './PerformanceMonitor';

export interface RenderProfile {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowestRender: number;
  fastestRender: number;
}

class RenderTimeTrackerImpl {
  private renderProfiles: Map<string, RenderProfile> = new Map();
  private activeRenders: Map<string, number> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && 
                     (window as any).__ENABLE_RENDER_TRACKING;
  }

  /**
   * Start tracking a component render
   */
  startRender(componentName: string, instanceId?: string): () => void {
    if (!this.isEnabled) return () => {};

    const trackingId = instanceId ? `${componentName}:${instanceId}` : componentName;
    const startTime = performance.now();
    
    this.activeRenders.set(trackingId, startTime);

    return () => this.endRender(trackingId, componentName);
  }

  /**
   * End tracking a component render
   */
  private endRender(trackingId: string, componentName: string): void {
    const startTime = this.activeRenders.get(trackingId);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.activeRenders.delete(trackingId);

    // Update render profile
    this.updateRenderProfile(componentName, renderTime);

    // Record metric in global performance monitor
    PerformanceMonitor.recordMetric(
      'componentRender',
      renderTime,
      'render',
      { componentName, trackingId }
    );
  }

  /**
   * Update render profile for a component
   */
  private updateRenderProfile(componentName: string, renderTime: number): void {
    let profile = this.renderProfiles.get(componentName);

    if (!profile) {
      profile = {
        componentName,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: renderTime,
        slowestRender: renderTime,
        fastestRender: renderTime
      };
      this.renderProfiles.set(componentName, profile);
    }

    profile.renderCount++;
    profile.totalRenderTime += renderTime;
    profile.averageRenderTime = profile.totalRenderTime / profile.renderCount;
    profile.lastRenderTime = renderTime;
    profile.slowestRender = Math.max(profile.slowestRender, renderTime);
    profile.fastestRender = Math.min(profile.fastestRender, renderTime);

    // Warn about slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get render profile for a component
   */
  getProfile(componentName: string): RenderProfile | undefined {
    return this.renderProfiles.get(componentName);
  }

  /**
   * Get all render profiles
   */
  getAllProfiles(): RenderProfile[] {
    return Array.from(this.renderProfiles.values());
  }

  /**
   * Get slowest rendering components
   */
  getSlowestComponents(count: number = 10): RenderProfile[] {
    return this.getAllProfiles()
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, count);
  }

  /**
   * Get most frequently rendering components
   */
  getMostFrequentComponents(count: number = 10): RenderProfile[] {
    return this.getAllProfiles()
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, count);
  }

  /**
   * Clear all profiles
   */
  clear(): void {
    this.renderProfiles.clear();
    this.activeRenders.clear();
  }

  /**
   * Enable or disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Generate a performance report
   */
  generateReport(): {
    totalComponents: number;
    totalRenders: number;
    averageRenderTime: number;
    slowestComponents: RenderProfile[];
    mostActiveComponents: RenderProfile[];
  } {
    const profiles = this.getAllProfiles();
    const totalRenders = profiles.reduce((sum, p) => sum + p.renderCount, 0);
    const totalRenderTime = profiles.reduce((sum, p) => sum + p.totalRenderTime, 0);

    return {
      totalComponents: profiles.length,
      totalRenders,
      averageRenderTime: totalRenders > 0 ? totalRenderTime / totalRenders : 0,
      slowestComponents: this.getSlowestComponents(5),
      mostActiveComponents: this.getMostFrequentComponents(5)
    };
  }
}

// Singleton instance
export const RenderTimeTracker = new RenderTimeTrackerImpl();

/**
 * React hook for tracking component render time
 */
export function useRenderTimeTracker(componentName: string, dependencies?: any[]) {
  if (typeof window === 'undefined') return; // SSR guard

  const React = require('react');
  
  React.useEffect(() => {
    const endRender = RenderTimeTracker.startRender(componentName, Math.random().toString(36));
    return endRender;
  }, dependencies);
}

/**
 * Higher-order component for automatic render tracking
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  const TrackedComponent = (props: P) => {
    const React = require('react');
    
    React.useEffect(() => {
      const endRender = RenderTimeTracker.startRender(displayName);
      return endRender;
    });

    return React.createElement(Component, props);
  };

  TrackedComponent.displayName = `withRenderTracking(${displayName})`;
  return TrackedComponent;
}

/**
 * Decorator for class components
 */
export function trackRenderTime(componentName?: string) {
  return function<T extends { new(...args: any[]): React.Component }>(constructor: T) {
    const displayName = componentName || constructor.name;
    
    class TrackedComponent extends constructor {
      override componentDidMount() {
        const endRender = RenderTimeTracker.startRender(displayName);
        setTimeout(endRender, 0);
        
        if (super.componentDidMount) {
          super.componentDidMount();
        }
      }

      override componentDidUpdate(prevProps?: any, prevState?: any, snapshot?: any) {
        const endRender = RenderTimeTracker.startRender(displayName);
        setTimeout(endRender, 0);
        
        if (super.componentDidUpdate) {
          super.componentDidUpdate(prevProps, prevState, snapshot);
        }
      }
    }

    // Type assertion to handle displayName assignment
    (TrackedComponent as any).displayName = `trackRenderTime(${displayName})`;
    return TrackedComponent as T;
  };
}