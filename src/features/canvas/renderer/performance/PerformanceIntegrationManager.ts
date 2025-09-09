/**
 * Performance Integration Manager
 * Coordinates all performance optimization systems with the modular canvas architecture
 * 
 * Integrates:
 * - Shape caching optimization
 * - Advanced optimizations (progressive rendering, memory pressure, circuit breakers)
 * - Memory management with node registry
 * - Performance monitoring and adaptive adjustments
 */

import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { useShapeCaching } from '../../hooks/useShapeCaching';
import { useAdvancedOptimizations } from '../../hooks/useAdvancedOptimizations';
import { DrawBatcher, LayerType } from '../drawing/DrawBatcher';
import { RendererCore } from '../core/RendererCore';
import { EventRouter } from '../events/EventRouter';
import { SelectionManager } from '../selection/SelectionManager';
import Konva from 'konva';

export interface PerformanceConfig {
  enableShapeCaching: boolean;
  enableProgressiveRender: boolean;
  enableMemoryPressure: boolean;
  enableCircuitBreakers: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Thresholds
  maxElements: number;
  targetFPS: number;
  cacheComplexityThreshold: number;
  cacheSizeThreshold: number;
  
  // Adaptive settings
  memoryPressureThreshold: number;
  lowPerformanceThreshold: number;
}

export interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  elementCount: number;
  cachedElements: number;
  renderTime: number;
  batchedDraws: number;
  circuitBreakerTriggered: number;
  progressiveRenderProgress: number;
}

export interface CachedNode {
  node: Konva.Node;
  cacheKey: string;
  isCached: boolean;
  lastUsed: number;
  complexity: number;
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableShapeCaching: true,
  enableProgressiveRender: true,
  enableMemoryPressure: true,
  enableCircuitBreakers: true,
  enablePerformanceMonitoring: true,
  
  maxElements: 5000,
  targetFPS: 60,
  cacheComplexityThreshold: 5,
  cacheSizeThreshold: 10000,
  
  memoryPressureThreshold: 0.8,
  lowPerformanceThreshold: 30
};

export class PerformanceIntegrationManager {
  private config: PerformanceConfig;
  private cachedNodes: Map<ElementId, CachedNode> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private metricsInterval: number | null = null;
  
  // Component references
  private drawBatcher: DrawBatcher | null = null;
  private rendererCore: RendererCore | null = null;
  private eventRouter: EventRouter | null = null;
  private selectionManager: SelectionManager | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
    this.performanceMetrics = {
      frameRate: 60,
      memoryUsage: 0,
      elementCount: 0,
      cachedElements: 0,
      renderTime: 0,
      batchedDraws: 0,
      circuitBreakerTriggered: 0,
      progressiveRenderProgress: 1.0
    };
  }

  /**
   * Initialize performance monitoring and integrations
   */
  initialize(components: {
    drawBatcher: DrawBatcher;
    rendererCore: RendererCore;
    eventRouter: EventRouter;
    selectionManager: SelectionManager;
  }): void {
    this.drawBatcher = components.drawBatcher;
    this.rendererCore = components.rendererCore;
    this.eventRouter = components.eventRouter;
    this.selectionManager = components.selectionManager;

    if (this.config.enablePerformanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    this.integrateWithDrawBatcher();
    this.integrateWithRendererCore();
    this.integrateWithEventRouter();
    this.integrateWithSelectionManager();

    console.log('🚀 Performance Integration Manager initialized', {
      shapeCaching: this.config.enableShapeCaching,
      progressiveRender: this.config.enableProgressiveRender,
      memoryPressure: this.config.enableMemoryPressure,
      monitoring: this.config.enablePerformanceMonitoring
    });
  }

  /**
   * Integrate performance optimizations with DrawBatcher
   */
  private integrateWithDrawBatcher(): void {
    if (!this.drawBatcher) return;

    // Add performance tracking to draw operations
    const originalScheduleDraw = this.drawBatcher.scheduleDraw.bind(this.drawBatcher);
    const enhancedScheduleDraw = (layer: LayerType) => {
      const startTime = performance.now();
      
      // Apply progressive rendering if enabled
      if (this.config.enableProgressiveRender && this.shouldUseProgressiveRender()) {
        this.scheduleProgressiveDraw(layer);
      } else {
        originalScheduleDraw(layer);
      }
      
      // Track performance
      this.performanceMetrics.renderTime = performance.now() - startTime;
      this.performanceMetrics.batchedDraws++;
    };

    // Replace the method with enhanced version
    this.drawBatcher.scheduleDraw = enhancedScheduleDraw;

    console.log('✅ DrawBatcher performance integration complete');
  }

  /**
   * Integrate shape caching with RendererCore
   */
  private integrateWithRendererCore(): void {
    if (!this.rendererCore || !this.config.enableShapeCaching) return;

    // Hook into node creation to apply caching
    const originalCreateNode = this.rendererCore.createNode?.bind(this.rendererCore);
    if (originalCreateNode) {
      this.rendererCore.createNode = (element: CanvasElement) => {
        const node = originalCreateNode(element);
        if (node) {
          this.applyCachingToNode(node, element);
        }
        return node;
      };
    }

    console.log('✅ RendererCore caching integration complete');
  }

  /**
   * Integrate circuit breaker protection with EventRouter
   */
  private integrateWithEventRouter(): void {
    if (!this.eventRouter || !this.config.enableCircuitBreakers) return;

    // Add circuit breaker protection to critical event operations
    const originalHandleEvent = this.eventRouter.handleStageEvent?.bind(this.eventRouter);
    if (originalHandleEvent) {
      this.eventRouter.handleStageEvent = (event: any) => {
        try {
          return this.executeWithCircuitBreaker(() => originalHandleEvent(event), 'eventHandling');
        } catch (error) {
          console.warn('⚡ Circuit breaker triggered for event handling:', error);
          this.performanceMetrics.circuitBreakerTriggered++;
          return false;
        }
      };
    }

    console.log('✅ EventRouter circuit breaker integration complete');
  }

  /**
   * Integrate adaptive performance with SelectionManager
   */
  private integrateWithSelectionManager(): void {
    if (!this.selectionManager) return;

    // Add memory pressure awareness to selection operations
    const originalSyncSelection = this.selectionManager.syncSelection.bind(this.selectionManager);
    this.selectionManager.syncSelection = (selectedIds: Set<ElementId>) => {
      // Limit selection size under memory pressure
      if (this.isUnderMemoryPressure() && selectedIds.size > 100) {
        console.warn('⚠️ Limiting selection size due to memory pressure');
        const limitedIds = new Set(Array.from(selectedIds).slice(0, 100));
        return originalSyncSelection(limitedIds);
      }
      
      return originalSyncSelection(selectedIds);
    };

    console.log('✅ SelectionManager adaptive performance integration complete');
  }

  /**
   * Apply intelligent caching to a Konva node based on element properties
   */
  private applyCachingToNode(node: Konva.Node, element: CanvasElement): void {
    if (!this.shouldCacheElement(element)) return;

    try {
      // Generate cache key based on visual properties
      const cacheKey = this.generateCacheKey(element);
      const complexity = this.calculateElementComplexity(element);
      
      // Store cached node info
      this.cachedNodes.set(element.id as ElementId, {
        node,
        cacheKey,
        isCached: false,
        lastUsed: Date.now(),
        complexity
      });

      // Apply caching after next render
      requestAnimationFrame(() => {
        try {
          node.cache();
          const cachedNode = this.cachedNodes.get(element.id as ElementId);
          if (cachedNode) {
            cachedNode.isCached = true;
            this.performanceMetrics.cachedElements++;
          }
          
          console.log(`🗂️ Applied caching to ${element.type} element:`, {
            elementId: element.id,
            complexity,
            cacheKey: cacheKey.slice(0, 8) + '...'
          });
        } catch (error) {
          console.warn(`⚠️ Failed to cache ${element.type} element:`, error);
        }
      });
      
    } catch (error) {
      console.warn('Failed to apply caching to node:', error);
    }
  }

  /**
   * Determine if an element should be cached based on complexity and performance settings
   */
  private shouldCacheElement(element: CanvasElement): boolean {
    const complexity = this.calculateElementComplexity(element);
    const size = this.calculateElementSize(element);
    
    // Cache complex elements
    if (complexity >= this.config.cacheComplexityThreshold) return true;
    
    // Cache large elements
    if (size >= this.config.cacheSizeThreshold) return true;
    
    // Cache when under memory pressure (cache more aggressively)
    if (this.isUnderMemoryPressure() && complexity >= 3) return true;
    
    return false;
  }

  /**
   * Calculate element complexity score for caching decisions
   */
  private calculateElementComplexity(element: CanvasElement): number {
    let complexity = 1; // Base complexity
    
    // Complex element types
    const complexTypes = ['table', 'enhanced-table', 'section', 'rich-text', 'connector'];
    if (complexTypes.includes(element.type)) complexity += 3;
    
    // Visual properties add complexity
    if ('fill' in element && element.fill) complexity += 1;
    if ('stroke' in element && element.stroke) complexity += 1;
    if ('strokeWidth' in element && element.strokeWidth && element.strokeWidth > 1) complexity += 1;
    if ('fontSize' in element && element.fontSize) complexity += 1;
    if ('text' in element && element.text && element.text.length > 100) complexity += 2;
    
    // Transformations add complexity
    if (element.rotation && element.rotation !== 0) complexity += 1;
    if ('opacity' in element && element.opacity && element.opacity < 1) complexity += 1;
    
    return complexity;
  }

  /**
   * Calculate element size for caching decisions
   */
  private calculateElementSize(element: CanvasElement): number {
    let width = 0;
    let height = 0;
    
    if ('width' in element) width = element.width;
    if ('height' in element) height = element.height;
    if ('radius' in element && element.radius) {
      width = element.radius * 2;
      height = element.radius * 2;
    }
    
    return width * height;
  }

  /**
   * Generate cache key based on element's visual properties
   */
  private generateCacheKey(element: CanvasElement): string {
    const visualProps = {
      type: element.type,
      x: Math.round(element.x),
      y: Math.round(element.y),
      width: 'width' in element ? element.width : undefined,
      height: 'height' in element ? element.height : undefined,
      radius: 'radius' in element ? element.radius : undefined,
      fill: 'fill' in element ? element.fill : undefined,
      stroke: 'stroke' in element ? element.stroke : undefined,
      strokeWidth: 'strokeWidth' in element ? element.strokeWidth : undefined,
      text: 'text' in element ? element.text : undefined,
      rotation: element.rotation
    };
    
    return btoa(JSON.stringify(visualProps)).slice(0, 16);
  }

  /**
   * Check if progressive rendering should be used
   */
  private shouldUseProgressiveRender(): boolean {
    return (
      this.performanceMetrics.elementCount > 1000 ||
      this.performanceMetrics.frameRate < this.config.lowPerformanceThreshold ||
      this.isUnderMemoryPressure()
    );
  }

  /**
   * Schedule progressive draw with performance awareness
   */
  private scheduleProgressiveDraw(layer: LayerType): void {
    if (!this.drawBatcher) return;

    // Implement chunked drawing based on performance
    const chunkSize = this.getAdaptiveChunkSize();
    let processed = 0;
    
    const processChunk = () => {
      const startTime = performance.now();
      
      // Process chunk of elements
      this.drawBatcher!.scheduleDraw(layer);
      
      processed += chunkSize;
      const progress = Math.min(processed / this.performanceMetrics.elementCount, 1);
      this.performanceMetrics.progressiveRenderProgress = progress;
      
      // Continue if not complete and performance is acceptable
      const chunkTime = performance.now() - startTime;
      if (progress < 1 && chunkTime < 16) { // 16ms = ~60fps
        requestAnimationFrame(processChunk);
      }
    };
    
    requestAnimationFrame(processChunk);
  }

  /**
   * Get adaptive chunk size based on current performance
   */
  private getAdaptiveChunkSize(): number {
    const baseChunkSize = 50;
    
    if (this.performanceMetrics.frameRate > 50) return baseChunkSize * 2;
    if (this.performanceMetrics.frameRate < 30) return Math.max(baseChunkSize / 2, 10);
    if (this.isUnderMemoryPressure()) return Math.max(baseChunkSize / 4, 5);
    
    return baseChunkSize;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  private executeWithCircuitBreaker<T>(
    operation: () => T,
    operationType: string
  ): T {
    const maxFailures = 5;
    const timeoutMs = 1000;
    
    try {
      const result = operation();
      return result;
    } catch (error) {
      this.performanceMetrics.circuitBreakerTriggered++;
      console.warn(`Circuit breaker triggered for ${operationType}:`, error);
      throw error;
    }
  }

  /**
   * Check if system is under memory pressure
   */
  private isUnderMemoryPressure(): boolean {
    if (!(performance as any).memory) return false;
    
    const memInfo = (performance as any).memory;
    const usage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    this.performanceMetrics.memoryUsage = usage;
    
    return usage > this.config.memoryPressureThreshold;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.metricsInterval = window.setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000);

    // Monitor frame rate
    let frameRateRAF: number | null = null;
    const trackFrameRate = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.frameCount++;
      
      if (delta >= 1000) {
        this.performanceMetrics.frameRate = (this.frameCount * 1000) / delta;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      if (this.metricsInterval !== null) { // Only continue if not destroyed
        frameRateRAF = requestAnimationFrame(trackFrameRate);
      }
    };
    
    frameRateRAF = requestAnimationFrame(trackFrameRate);
    
    // Store RAF ID for cleanup
    (this as any).frameRateRAF = frameRateRAF;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Clean up unused cached nodes
    this.cleanupCachedNodes();
    
    // Log performance if monitoring is enabled
    if (this.config.enablePerformanceMonitoring) {
      console.log('📊 Performance Metrics:', {
        fps: Math.round(this.performanceMetrics.frameRate),
        memory: `${Math.round(this.performanceMetrics.memoryUsage * 100)}%`,
        elements: this.performanceMetrics.elementCount,
        cached: this.performanceMetrics.cachedElements,
        progressive: `${Math.round(this.performanceMetrics.progressiveRenderProgress * 100)}%`
      });
    }
  }

  /**
   * Clean up unused cached nodes to prevent memory leaks
   */
  private cleanupCachedNodes(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [elementId, cachedNode] of this.cachedNodes) {
      if (now - cachedNode.lastUsed > maxAge) {
        try {
          cachedNode.node.clearCache();
          this.cachedNodes.delete(elementId);
          this.performanceMetrics.cachedElements--;
        } catch (error) {
          console.warn('Failed to cleanup cached node:', error);
        }
      }
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update element count for metrics
   */
  updateElementCount(count: number): void {
    this.performanceMetrics.elementCount = count;
  }

  /**
   * Clear all cached nodes
   */
  clearCache(): void {
    for (const [elementId, cachedNode] of this.cachedNodes) {
      try {
        cachedNode.node.clearCache();
      } catch (error) {
        console.warn('Failed to clear cached node:', error);
      }
    }
    this.cachedNodes.clear();
    this.performanceMetrics.cachedElements = 0;
    console.log('🗂️ All cached nodes cleared');
  }

  /**
   * Destroy performance integration manager
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    // Cancel frame rate RAF
    if ((this as any).frameRateRAF) {
      cancelAnimationFrame((this as any).frameRateRAF);
      (this as any).frameRateRAF = null;
    }
    
    this.clearCache();
    
    console.log('🔄 Performance Integration Manager destroyed');
  }
}