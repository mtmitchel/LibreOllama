/**
 * Drawing Batcher - RAF Batching System
 * Handles efficient layer invalidation and batched drawing operations
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';

/**
 * Layer types supported by the drawing batcher
 */
export type LayerType = 'main' | 'overlay' | 'preview';

/**
 * Performance tracking interface
 */
interface PerformanceTracker {
  incBatchDraw?(layer: string): void;
}

/**
 * Drawing batcher configuration
 */
export interface DrawBatcherConfig {
  layers: {
    main?: Konva.Layer;
    overlay?: Konva.Layer;
    preview?: Konva.Layer;
  };
  performance?: PerformanceTracker;
  debug?: {
    log?: boolean;
  };
}

/**
 * RAF state tracking
 */
interface RAFState {
  rafId: number;
  dirtyLayers: Set<LayerType>;
  isScheduled: boolean;
}

/**
 * Drawing Batcher Class
 * Manages RequestAnimationFrame batching to avoid duplicate layer draws within same frame
 */
export class DrawBatcher {
  private config: DrawBatcherConfig;
  private rafState: RAFState;
  
  constructor(config: DrawBatcherConfig) {
    this.config = config;
    this.rafState = {
      rafId: 0,
      dirtyLayers: new Set(),
      isScheduled: false,
    };

    if (this.config.debug?.log) {
      console.info('[DrawBatcher] Drawing batcher initialized');
    }
  }

  /**
   * Schedule a layer for drawing in the next animation frame
   */
  scheduleDraw(layer: LayerType): void {
    // Mark layer as dirty
    this.rafState.dirtyLayers.add(layer);

    // If already scheduled, don't schedule again
    if (this.rafState.isScheduled) {
      if (this.config.debug?.log) {
        console.debug(`[DrawBatcher] Layer ${layer} marked dirty (already scheduled)`);
      }
      return;
    }

    // Schedule the batch draw
    this.rafState.isScheduled = true;
    this.rafState.rafId = requestAnimationFrame(() => {
      this.executeBatchDraw();
    });

    if (this.config.debug?.log) {
      console.debug(`[DrawBatcher] Scheduled batch draw for ${Array.from(this.rafState.dirtyLayers).join(', ')}`);
    }
  }

  /**
   * Execute batched drawing for all dirty layers
   */
  private executeBatchDraw(): void {
    const { dirtyLayers } = this.rafState;
    const { layers, performance } = this.config;
    
    if (this.config.debug?.log) {
      console.debug(`[DrawBatcher] Executing batch draw for layers: ${Array.from(dirtyLayers).join(', ')}`);
    }

    // Draw each dirty layer
    if (dirtyLayers.has('main') && layers.main) {
      try {
        layers.main.batchDraw();
        performance?.incBatchDraw?.('main-layer');
        
        if (this.config.debug?.log) {
          console.debug('[DrawBatcher] Drew main layer');
        }
      } catch (error) {
        console.error('[DrawBatcher] Error drawing main layer:', error);
      }
    }

    if (dirtyLayers.has('overlay') && layers.overlay) {
      try {
        layers.overlay.batchDraw();
        performance?.incBatchDraw?.('overlay-layer');
        
        if (this.config.debug?.log) {
          console.debug('[DrawBatcher] Drew overlay layer');
        }
      } catch (error) {
        console.error('[DrawBatcher] Error drawing overlay layer:', error);
      }
    }

    if (dirtyLayers.has('preview') && layers.preview) {
      try {
        layers.preview.batchDraw();
        performance?.incBatchDraw?.('preview-layer');
        
        if (this.config.debug?.log) {
          console.debug('[DrawBatcher] Drew preview layer');
        }
      } catch (error) {
        console.error('[DrawBatcher] Error drawing preview layer:', error);
      }
    }

    // Reset state
    this.resetRAFState();
  }

  /**
   * Force immediate draw of specific layer (bypasses batching)
   */
  forceDraw(layer: LayerType): void {
    const { layers, performance } = this.config;
    
    if (this.config.debug?.log) {
      console.debug(`[DrawBatcher] Force drawing ${layer} layer`);
    }

    try {
      switch (layer) {
        case 'main':
          if (layers.main) {
            layers.main.batchDraw();
            performance?.incBatchDraw?.('main-layer-force');
          }
          break;
        case 'overlay':
          if (layers.overlay) {
            layers.overlay.batchDraw();
            performance?.incBatchDraw?.('overlay-layer-force');
          }
          break;
        case 'preview':
          if (layers.preview) {
            layers.preview.batchDraw();
            performance?.incBatchDraw?.('preview-layer-force');
          }
          break;
      }
    } catch (error) {
      console.error(`[DrawBatcher] Error force drawing ${layer} layer:`, error);
    }
  }

  /**
   * Force immediate draw of all layers
   */
  forceDrawAll(): void {
    const { layers } = this.config;

    if (this.config.debug?.log) {
      console.debug('[DrawBatcher] Force drawing all layers');
    }

    // Cancel any pending RAF
    if (this.rafState.isScheduled) {
      this.cancelScheduledDraw();
    }

    // Draw all available layers immediately
    if (layers.main) this.forceDraw('main');
    if (layers.overlay) this.forceDraw('overlay');  
    if (layers.preview) this.forceDraw('preview');
  }

  /**
   * Cancel any scheduled drawing
   */
  cancelScheduledDraw(): void {
    if (this.rafState.isScheduled && this.rafState.rafId) {
      cancelAnimationFrame(this.rafState.rafId);
      this.resetRAFState();
      
      if (this.config.debug?.log) {
        console.debug('[DrawBatcher] Cancelled scheduled draw');
      }
    }
  }

  /**
   * Check if a layer is marked as dirty
   */
  isLayerDirty(layer: LayerType): boolean {
    return this.rafState.dirtyLayers.has(layer);
  }

  /**
   * Check if any layers are dirty
   */
  hasAnyDirtyLayers(): boolean {
    return this.rafState.dirtyLayers.size > 0;
  }

  /**
   * Check if drawing is currently scheduled
   */
  isDrawScheduled(): boolean {
    return this.rafState.isScheduled;
  }

  /**
   * Get list of currently dirty layers
   */
  getDirtyLayers(): LayerType[] {
    return Array.from(this.rafState.dirtyLayers);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DrawBatcherConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debug?.log) {
      console.debug('[DrawBatcher] Configuration updated');
    }
  }

  /**
   * Clear dirty state for specific layer
   */
  clearLayerDirtyState(layer: LayerType): void {
    this.rafState.dirtyLayers.delete(layer);
    
    if (this.config.debug?.log) {
      console.debug(`[DrawBatcher] Cleared dirty state for ${layer} layer`);
    }
  }

  /**
   * Mark all layers as dirty
   */
  invalidateAll(): void {
    this.rafState.dirtyLayers.add('main');
    this.rafState.dirtyLayers.add('overlay');
    this.rafState.dirtyLayers.add('preview');
    
    if (!this.rafState.isScheduled) {
      this.scheduleDraw('main'); // This will schedule for all dirty layers
    }
    
    if (this.config.debug?.log) {
      console.debug('[DrawBatcher] All layers invalidated');
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    dirtyLayerCount: number;
    isScheduled: boolean;
    currentRAFId: number;
  } {
    return {
      dirtyLayerCount: this.rafState.dirtyLayers.size,
      isScheduled: this.rafState.isScheduled,
      currentRAFId: this.rafState.rafId,
    };
  }

  /**
   * Reset RAF state
   */
  private resetRAFState(): void {
    this.rafState.rafId = 0;
    this.rafState.dirtyLayers.clear();
    this.rafState.isScheduled = false;
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    // Cancel any pending draws
    this.cancelScheduledDraw();
    
    // Clear all state
    this.resetRAFState();
    
    if (this.config.debug?.log) {
      console.info('[DrawBatcher] Drawing batcher destroyed');
    }
  }
}

/**
 * Utility function to create a drawing batcher with common configuration
 */
export function createDrawBatcher(
  layers: DrawBatcherConfig['layers'],
  options?: {
    enablePerformanceTracking?: boolean;
    debug?: boolean;
  }
): DrawBatcher {
  const config: DrawBatcherConfig = {
    layers,
    performance: options?.enablePerformanceTracking ? 
      (window as any).CANVAS_PERF : undefined,
    debug: { log: options?.debug || false },
  };

  return new DrawBatcher(config);
}