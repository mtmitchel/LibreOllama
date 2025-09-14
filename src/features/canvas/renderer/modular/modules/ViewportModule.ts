import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasEvent, ViewportState } from '../../modular/types';

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ViewportConfig {
  minScale: number;
  maxScale: number;
  zoomFactor: number;
}

/**
 * ViewportModule handles all viewport transformations including zoom, coordinate conversions,
 * and synchronization with Konva stage. This module matches the exact behavior of the
 * monolithic CanvasRendererV2 viewport functionality.
 */
export class ViewportModule implements RendererModule {
  private ctx!: ModuleContext;
  private stage: Konva.Stage | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Configuration matching current monolithic implementation
  private config: ViewportConfig = {
    minScale: 0.1,
    maxScale: 4,
    zoomFactor: 1.2,
  };

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    this.stage = ctx.konva.getStage();

    if (this.stage) {
      this.setupEventHandlers();
      this.setupResizeObserver();
    }
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.stage) return;

    // Sync viewport state with Konva stage
    // This matches the useEffect in NonReactCanvasStage.tsx lines 235-241
    const { viewport } = snapshot;

    // Apply scale to stage for overall zoom
    this.stage.scale({ x: viewport.scale, y: viewport.scale });

    // CRITICAL FIX: Keep stage position at (0,0) for proper coordinate calculations
    // Apply viewport panning to content layers instead of stage to avoid coordinate offset issues
    this.stage.position({ x: 0, y: 0 });

    // Apply pan transformation to content layers
    const layers = this.ctx.konva.getLayers();
    if (layers.background) {
      layers.background.position({ x: viewport.x, y: viewport.y });
    }
    if (layers.main) {
      layers.main.position({ x: viewport.x, y: viewport.y });
    }
    if (layers.preview) {
      layers.preview.position({ x: viewport.x, y: viewport.y });
    }
    // Note: Overlay layer (transformers, UI) typically doesn't pan

    console.log('[ViewportModule] Stage positioned at (0,0), content layers panned to:', { x: viewport.x, y: viewport.y }, 'scale:', viewport.scale);

    this.stage.batchDraw();

    // Performance tracking (matches existing pattern)
    try {
      (window as any).CANVAS_PERF?.incBatchDraw?.('viewport-sync');
    } catch {
      // Ignore performance tracking errors
    }
  }

  onEvent(evt: CanvasEvent, snapshot: CanvasSnapshot): boolean {
    if (evt.type === 'wheel') {
      return this.handleWheelZoom(evt, snapshot);
    }
    return false;
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    this.stage = null;
  }

  // ===========================================
  // Core Viewport Operations
  // ===========================================

  /**
   * Pan viewport by delta amounts
   * Note: Current implementation doesn't use this, but provided for future pan support
   */
  pan(deltaX: number, deltaY: number): void {
    try {
      // Use the store's panViewport method for direct delta updates
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const actions = store?.getState?.();

      if (actions?.panViewport) {
        actions.panViewport(deltaX, deltaY);
      } else {
        // Fallback to setViewport method
        const snapshot = this.ctx.store.getSnapshot();
        const newViewport = {
          x: snapshot.viewport.x + deltaX,
          y: snapshot.viewport.y + deltaY,
        };
        this.updateViewport(newViewport);
      }
    } catch (error) {
      console.error('[ViewportModule] Failed to pan viewport:', error);
    }
  }

  /**
   * Zoom viewport to specific scale, optionally centered on a point
   * Matches the zoomViewport implementation in viewportModule.ts
   */
  zoom(scale: number, centerX?: number, centerY?: number): void {
    try {
      // Use the store's zoomViewport method for proper zoom with center point
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const actions = store?.getState?.();

      const clampedScale = this.clampScale(scale);

      if (actions?.zoomViewport) {
        actions.zoomViewport(clampedScale, centerX, centerY);
      } else {
        // Fallback to manual calculation and setViewport
        const snapshot = this.ctx.store.getSnapshot();
        const oldScale = snapshot.viewport.scale;

        let newViewport = {
          scale: clampedScale,
        } as any;

        // If center point is provided, adjust pan to zoom around that point
        if (centerX !== undefined && centerY !== undefined) {
          const scaleFactor = clampedScale / oldScale;
          newViewport.x = centerX - (centerX - snapshot.viewport.x) * scaleFactor;
          newViewport.y = centerY - (centerY - snapshot.viewport.y) * scaleFactor;
        }

        this.updateViewport(newViewport);
      }
    } catch (error) {
      console.error('[ViewportModule] Failed to zoom viewport:', error);
    }
  }

  /**
   * Set viewport to specific state
   */
  setViewport(viewport: Partial<ViewportState>): void {
    const snapshot = this.ctx.store.getSnapshot();
    const newViewport = { ...snapshot.viewport, ...viewport };

    // Clamp scale if provided
    if (viewport.scale !== undefined) {
      newViewport.scale = this.clampScale(viewport.scale);
    }

    this.updateViewport(newViewport);
  }

  // ===========================================
  // Coordinate Transformations
  // ===========================================

  /**
   * Convert screen coordinates to world coordinates
   * Inverse of worldToScreen
   */
  screenToWorld(screenPos: Point): Point {
    if (!this.stage) return screenPos;

    const snapshot = this.ctx.store.getSnapshot();
    const { viewport } = snapshot;

    return {
      x: (screenPos.x - viewport.x) / viewport.scale,
      y: (screenPos.y - viewport.y) / viewport.scale,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * Matches worldToStage + stage container offset logic
   */
  worldToScreen(worldPos: Point): Point {
    if (!this.stage) return worldPos;

    const snapshot = this.ctx.store.getSnapshot();
    const { viewport } = snapshot;

    return {
      x: worldPos.x * viewport.scale + viewport.x,
      y: worldPos.y * viewport.scale + viewport.y,
    };
  }

  /**
   * Convert screen coordinates to parent node's local space
   * Matches CanvasRendererV2.screenToParentLocal (lines 150-158)
   */
  screenToParentLocal(parent: Konva.Node, screenPos: Point): Point {
    if (!this.stage) return screenPos;

    // Get pointer position in stage coordinates
    const stagePos = this.stage.getPointerPosition();
    if (!stagePos) return screenPos;

    // Transform to parent's local space
    const transform = parent.getAbsoluteTransform().copy().invert();
    return transform.point(stagePos);
  }

  /**
   * Convert parent node's local coordinates to screen coordinates
   * Matches CanvasRendererV2.parentLocalToScreen (lines 160-163)
   */
  parentLocalToScreen(parent: Konva.Node, localPos: Point): Point {
    const transform = parent.getAbsoluteTransform().copy();
    return transform.point(localPos);
  }

  /**
   * Convert world rectangle to DOM CSS pixels (relative to page)
   * Matches worldRectToDOM in NonReactCanvasStage.tsx (lines 341-351)
   */
  worldRectToDOM(x: number, y: number, w: number, h: number): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    if (!this.stage) {
      return { left: x, top: y, width: w, height: h };
    }

    const topLeft = this.worldToStage({ x, y });
    const rect = this.stage.container().getBoundingClientRect();
    const scale = this.stage.scaleX(); // Assuming uniform scale

    return {
      left: rect.left + topLeft.x,
      top: rect.top + topLeft.y,
      width: w * scale,
      height: h * scale,
    };
  }

  // ===========================================
  // Viewport Queries
  // ===========================================

  /**
   * Get current viewport state
   */
  getViewport(): ViewportState {
    return this.ctx.store.getSnapshot().viewport;
  }

  /**
   * Get visible bounds in world coordinates
   */
  getVisibleBounds(): Bounds {
    const snapshot = this.ctx.store.getSnapshot();
    const { viewport } = snapshot;

    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: viewport.width || 0,
      y: viewport.height || 0,
    });

    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
    };
  }

  /**
   * Check if a world point is visible in current viewport
   */
  isPointVisible(worldPos: Point): boolean {
    const bounds = this.getVisibleBounds();
    return (
      worldPos.x >= bounds.left &&
      worldPos.x <= bounds.right &&
      worldPos.y >= bounds.top &&
      worldPos.y <= bounds.bottom
    );
  }

  // ===========================================
  // Stage Synchronization
  // ===========================================

  /**
   * Manually sync viewport to stage (called by RendererCore if needed)
   */
  syncToStage(stage: Konva.Stage): void {
    this.stage = stage;
    const snapshot = this.ctx.store.getSnapshot();
    this.sync(snapshot);
  }

  /**
   * Handle container resize
   * Matches ResizeObserver logic in NonReactCanvasStage.tsx (lines 189-216)
   */
  handleResize(width: number, height: number): void {
    if (!this.stage) return;

    // Skip if dimensions haven't actually changed
    const currentSize = this.stage.size();
    if (currentSize.width === width && currentSize.height === height) {
      return;
    }

    // Container resized

    // Update stage size
    this.stage.size({ width, height });

    // Update viewport dimensions in store
    this.updateViewport({ width, height });

    // Trigger redraw
    this.stage.batchDraw();
  }

  // ===========================================
  // Private Implementation
  // ===========================================

  private setupEventHandlers(): void {
    if (!this.stage) return;

    // Mouse wheel zoom (matches NonReactCanvasStage.tsx lines 176-186)
    this.stage.on('wheel', (evt) => {
      const e = evt.evt as WheelEvent;
      e.preventDefault();

      const delta = e.deltaY;
      const direction = delta > 0 ? -1 : 1;
      const oldScale = this.stage!.scaleX();
      const pointer = this.stage!.getPointerPosition();

      if (!pointer) return;

      const newScale = this.clampScale(
        direction > 0 ? oldScale * this.config.zoomFactor : oldScale / this.config.zoomFactor
      );

      this.zoom(newScale, pointer.x, pointer.y);
    });
  }

  private setupResizeObserver(): void {
    if (!this.stage) return;

    const container = this.stage.container();
    if (!container) return;

    // Resize observer with debouncing (matches NonReactCanvasStage.tsx lines 189-216)
    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === container) {
            // Use contentRect for accurate dimensions
            const w = Math.floor(entry.contentRect.width);
            const h = Math.floor(entry.contentRect.height);

            this.handleResize(w, h);
          }
        }
      }, 16); // Debounce at ~60fps
    });

    this.resizeObserver.observe(container);
  }

  private handleWheelZoom(_evt: CanvasEvent, _snapshot: CanvasSnapshot): boolean {
    if (!this.stage) return false;

    // For now, the current system doesn't route wheel events through the modular system
    // This is a placeholder for future event system integration
    // The actual wheel handling is done in setupEventHandlers()

    return false; // Event not handled via modular event system yet
  }

  private worldToStage(pt: Point): Point {
    if (!this.stage) return pt;

    // CRITICAL FIX: Manual coordinate transformation for layer-based panning system
    // Since stage is at (0,0) and layers are panned, we need to manually apply
    // the viewport transformation that matches worldToScreen() logic
    const snapshot = this.ctx.store.getSnapshot();
    const { viewport } = snapshot;

    return {
      x: pt.x * viewport.scale + viewport.x,
      y: pt.y * viewport.scale + viewport.y,
    };
  }

  private clampScale(scale: number): number {
    return Math.max(this.config.minScale, Math.min(this.config.maxScale, scale));
  }

  private updateViewport(viewport: Partial<ViewportState>): void {
    try {
      // Access the global store (same pattern as SelectionModule)
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const actions = store?.getState?.();

      if (actions?.setViewport) {
        // Use the store's setViewport method to update viewport state
        actions.setViewport(viewport);
      } else {
        console.warn('[ViewportModule] Store setViewport method not available');
      }
    } catch (error) {
      console.error('[ViewportModule] Failed to update viewport:', error);
    }
  }
}
