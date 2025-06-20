/**
 * Konva-Specific Performance Optimizations
 * Implements production-ready Konva best practices
 */

import React from 'react';
import Konva from 'konva';
import type { CanvasElement } from '../../types/enhanced.types';

export interface KonvaOptimizationConfig {
  enableLayerCaching: boolean;
  enableEventDelegation: boolean;
  enableHitGraphOpt: boolean;
  enablePixelRatio: boolean;
  maxRenderTime: number; // milliseconds
  throttleTransforms: boolean;
  enableMemoryManagement: boolean;
}

export class KonvaOptimizer {
  private stage: Konva.Stage | null = null;
  private config: KonvaOptimizationConfig;
  private transformTimeout: number | null = null;
  private hitGraphCache = new Map<string, boolean>();

  constructor(config: Partial<KonvaOptimizationConfig> = {}) {
    this.config = {
      enableLayerCaching: true,
      enableEventDelegation: true,
      enableHitGraphOpt: true,
      enablePixelRatio: true,
      maxRenderTime: 16, // Target 60 FPS
      throttleTransforms: true,
      enableMemoryManagement: true,
      ...config
    };
  }

  /**
   * Initialize optimizer with stage reference
   */
  initialize(stage: Konva.Stage): void {
    this.stage = stage;
    this.setupStageOptimizations();
    this.setupEventOptimizations();
    this.setupMemoryManagement();
  }

  /**
   * Setup stage-level optimizations
   */
  private setupStageOptimizations(): void {
    if (!this.stage) return;

    // Enable pixel ratio for crisp rendering on high-DPI displays
    if (this.config.enablePixelRatio) {
      const pixelRatio = window.devicePixelRatio || 1;
      this.stage.setAttrs({
        pixelRatio: Math.min(pixelRatio, 2) // Cap at 2x for performance
      });
    }

    // Optimize drawing method
    this.stage.listening(true);
    
    // Set stage to optimize for transform changes
    if (this.config.throttleTransforms) {
      this.setupTransformThrottling();
    }
  }

  /**
   * Setup event-related optimizations
   */
  private setupEventOptimizations(): void {
    if (!this.stage) return;

    // Use event delegation for better performance with many elements
    if (this.config.enableEventDelegation) {
      this.stage.on('click', this.handleDelegatedClick.bind(this));
      this.stage.on('mouseover', this.handleDelegatedMouseOver.bind(this));
      this.stage.on('mouseout', this.handleDelegatedMouseOut.bind(this));
    }

    // Optimize hit detection
    if (this.config.enableHitGraphOpt) {
      this.setupHitGraphOptimization();
    }
  }  /**
   * Setup transform throttling to prevent excessive redraws
   */
  private setupTransformThrottling(): void {
    if (!this.stage) return;

    const stage = this.stage;
    const originalBatchDraw = stage.batchDraw.bind(stage);
    let isDrawing = false;

    // Override batchDraw with throttling
    (stage as any).batchDraw = () => {
      if (isDrawing) return;
      
      isDrawing = true;
      requestAnimationFrame(() => {
        originalBatchDraw();
        isDrawing = false;
      });
    };
  }

  /**
   * Optimize layer rendering with caching
   */
  optimizeLayer(layer: Konva.Layer, elements: CanvasElement[]): void {
    if (!this.config.enableLayerCaching) return;

    // Enable caching for layers with many static elements
    if (elements.length > 50) {
      const staticElements = elements.filter(el => !this.isElementDynamic(el));
      if (staticElements.length > elements.length * 0.7) {
        layer.cache();
        layer.getCanvas().setPixelRatio(1); // Use lower resolution for cache
      }
    }

    // Optimize layer listening
    const hasDynamicElements = elements.some(el => this.isElementDynamic(el));
    if (!hasDynamicElements) {
      layer.listening(false);
    }
  }

  /**
   * Check if element is dynamic (frequently changing)
   */
  private isElementDynamic(element: CanvasElement): boolean {
    // Consider elements dynamic if they have animations, frequent updates, etc.
    return element.type === 'pen' || // Pen strokes are dynamic during drawing
           element.type === 'connector' || // Connectors change with element movement
           Boolean((element as any).isAnimating); // Custom animation flag
  }
  /**
   * Optimize individual nodes
   */
  optimizeNode(node: Konva.Node, element: CanvasElement): void {
    // Set perfectDrawEnabled for shapes that don't need perfect rendering
    if (element.type === 'pen' || element.type === 'rectangle') {
      (node as any).perfectDrawEnabled?.(false);
    }

    // Optimize shadow rendering
    if ((node as any).shadowEnabled && (node as any).shadowEnabled()) {
      // Disable shadows for small elements
      const bounds = node.getClientRect();
      if (bounds.width < 20 || bounds.height < 20) {
        (node as any).shadowEnabled(false);
      }
    }

    // Cache complex shapes
    if (this.shouldCacheNode(element)) {
      node.cache();
    }
  }

  /**
   * Determine if a node should be cached
   */
  private shouldCacheNode(element: CanvasElement): boolean {
    // Cache complex shapes or those with filters
    return element.type === 'star' ||
           element.type === 'triangle' ||
           Boolean((element as any).filters?.length);
  }

  /**
   * Setup hit graph optimization
   */
  private setupHitGraphOptimization(): void {
    if (!this.stage) return;

    // Cache hit detection results for static elements
    const originalGetIntersection = this.stage.getIntersection.bind(this.stage);
    
    this.stage.getIntersection = (pos: Konva.Vector2d) => {
      const cacheKey = `${Math.round(pos.x)},${Math.round(pos.y)}`;
      
      // For static content, cache hit results briefly
      if (this.hitGraphCache.has(cacheKey)) {
        const result = this.hitGraphCache.get(cacheKey);
        return result ? originalGetIntersection(pos) : null;
      }

      const result = originalGetIntersection(pos);
      this.hitGraphCache.set(cacheKey, Boolean(result));
      
      // Clear cache after short delay
      setTimeout(() => {
        this.hitGraphCache.delete(cacheKey);
      }, 100);

      return result;
    };
  }

  /**
   * Delegated event handlers for performance
   */
  private handleDelegatedClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    const target = e.target;
    if (target === this.stage) return;

    // Handle click based on node type
    const elementType = target.getAttr('elementType');
    if (elementType) {
      this.dispatchElementEvent('click', target, e);
    }
  }

  private handleDelegatedMouseOver(e: Konva.KonvaEventObject<MouseEvent>): void {
    const target = e.target;
    if (target === this.stage) return;

    // Optimize hover effects
    if (target.getAttr('hoverable')) {
      this.applyHoverEffect(target, true);
    }
  }

  private handleDelegatedMouseOut(e: Konva.KonvaEventObject<MouseEvent>): void {
    const target = e.target;
    if (target === this.stage) return;

    if (target.getAttr('hoverable')) {
      this.applyHoverEffect(target, false);
    }
  }

  /**
   * Dispatch custom element events
   */
  private dispatchElementEvent(
    eventType: string, 
    node: Konva.Node, 
    originalEvent: Konva.KonvaEventObject<any>
  ): void {
    const elementId = node.getAttr('elementId');
    if (elementId) {
      // Emit custom event that components can listen to
      const customEvent = new CustomEvent(`canvas-element-${eventType}`, {
        detail: { elementId, node, originalEvent }
      });
      document.dispatchEvent(customEvent);
    }
  }

  /**
   * Apply optimized hover effects
   */
  private applyHoverEffect(node: Konva.Node, isHover: boolean): void {
    // Use efficient property changes for hover
    const originalOpacity = node.getAttr('originalOpacity') || node.opacity();
    
    if (isHover) {
      node.setAttr('originalOpacity', originalOpacity);
      node.opacity(Math.min(originalOpacity + 0.1, 1));
    } else {
      node.opacity(originalOpacity);
    }

    // Use efficient redraw
    node.getLayer()?.batchDraw();
  }

  /**
   * Memory management for cleanup
   */
  private setupMemoryManagement(): void {
    if (!this.config.enableMemoryManagement || !this.stage) return;

    // Periodic cleanup of unused resources
    const cleanupInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, 30000); // Every 30 seconds

    // Cleanup on stage destroy
    this.stage.on('destroy', () => {
      clearInterval(cleanupInterval);
      this.cleanup();
    });
  }

  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup(): void {
    // Clear hit graph cache
    this.hitGraphCache.clear();

    // Clear any transform timeouts
    if (this.transformTimeout) {
      clearTimeout(this.transformTimeout);
      this.transformTimeout = null;
    }

    // Force garbage collection if available (dev only)
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stage = null;
    this.hitGraphCache.clear();
    
    if (this.transformTimeout) {
      clearTimeout(this.transformTimeout);
      this.transformTimeout = null;
    }
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): {
    cacheHitRate: number;
    averageRenderTime: number;
    memoryUsage: number;
  } {
    return {
      cacheHitRate: this.hitGraphCache.size > 0 ? 
        Array.from(this.hitGraphCache.values()).filter(Boolean).length / this.hitGraphCache.size : 0,
      averageRenderTime: 16, // Would need actual measurement
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };
  }
}

/**
 * Global Konva optimizer instance
 */
export const konvaOptimizer = new KonvaOptimizer();

/**
 * Hook for using Konva optimizations in React components
 */
export function useKonvaOptimization(stage: Konva.Stage | null) {
  React.useEffect(() => {
    if (stage) {
      konvaOptimizer.initialize(stage);
    }

    return () => {
      konvaOptimizer.cleanup();
    };
  }, [stage]);

  return konvaOptimizer;
}
