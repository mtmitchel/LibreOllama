import Konva from 'konva';

export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

export interface CoreRendererConfig {
  container: HTMLDivElement;
  onContextMenu?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * Core renderer module responsible for stage initialization and lifecycle management
 * Follows the blueprint from CANVAS_IMPLEMENTATION.md
 */
export class CoreRenderer {
  private stage: Konva.Stage | null = null;
  private layers: RendererLayers | null = null;
  private dragLayer: Konva.Layer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  // RAF tracking for batched drawing
  private raf = 0;
  private dirtyMain = false;
  private dirtyOverlay = false;
  private dirtyPreview = false;

  constructor() {
    // Enable Konva text rendering fixes for Tauri/WebKit environments
    if (typeof Konva !== 'undefined') {
      (Konva as any)._fixTextRendering = true;
    }
    
    // Set pixel ratio to 1 for consistent rendering
    Konva.pixelRatio = 1;
  }

  /**
   * Initialize the stage and layers
   */
  init(config: CoreRendererConfig): { stage: Konva.Stage; layers: RendererLayers } {
    const { container, onContextMenu } = config;

    // Create stage
    this.stage = new Konva.Stage({
      container,
      width: container.offsetWidth,
      height: container.offsetHeight
    });

    // Create layers in order per blueprint
    const background = new Konva.Layer({ name: 'background-layer' });
    const main = new Konva.Layer({ name: 'main-layer' });
    const preview = new Konva.Layer({ name: 'preview-layer', listening: false }); // GPU accelerated for images
    const overlay = new Konva.Layer({ name: 'overlay-layer' });

    // Set layer properties per blueprint
    background.listening(false); // Non-listening for static grid/decor
    overlay.listening(false);    // Non-listening by default, handles become listening when visible

    // Add layers to stage in correct order
    this.stage.add(background);
    this.stage.add(main);
    this.stage.add(preview);
    this.stage.add(overlay);

    // Create drag layer (for drag preview)
    this.dragLayer = new Konva.Layer({ name: 'drag-layer', visible: false });
    this.stage.add(this.dragLayer);

    this.layers = { background, main, preview, overlay };

    // Attach resize observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this.stage && width > 0 && height > 0) {
          this.stage.width(width);
          this.stage.height(height);
        }
      }
    });
    this.resizeObserver.observe(container);

    // Context menu handling
    if (onContextMenu) {
      this.stage.on('contextmenu', onContextMenu);
    }

    return { stage: this.stage, layers: this.layers };
  }

  /**
   * Get stage and layers (throws if not initialized)
   */
  getStageAndLayers(): { stage: Konva.Stage; layers: RendererLayers } {
    if (!this.stage || !this.layers) {
      throw new Error('Renderer not initialized');
    }
    return { stage: this.stage, layers: this.layers };
  }

  /**
   * Get drag layer for drag preview operations
   */
  getDragLayer(): Konva.Layer | null {
    return this.dragLayer;
  }

  /**
   * Schedule a batched draw for a specific layer
   * Implements one RAF per frame, one batchDraw per dirty layer
   */
  scheduleDraw(layer: 'main' | 'overlay' | 'preview') {
    if (!this.layers) return;

    switch (layer) {
      case 'main':
        this.dirtyMain = true;
        break;
      case 'overlay':
        this.dirtyOverlay = true;
        break;
      case 'preview':
        this.dirtyPreview = true;
        break;
    }

    if (this.raf) return;

    this.raf = requestAnimationFrame(() => {
      if (this.layers) {
        if (this.dirtyMain) {
          this.layers.main.batchDraw();
          this.dirtyMain = false;
        }
        if (this.dirtyOverlay) {
          this.layers.overlay.batchDraw();
          this.dirtyOverlay = false;
        }
        if (this.dirtyPreview) {
          this.layers.preview.batchDraw();
          this.dirtyPreview = false;
        }
      }
      this.raf = 0;
    });
  }

  /**
   * Apply viewport transform
   */
  applyViewport(viewport: { x: number; y: number; scale: number }) {
    if (!this.stage) return;
    
    this.stage.scale({ x: viewport.scale, y: viewport.scale });
    this.stage.position({ x: viewport.x, y: viewport.y });
    this.stage.batchDraw();
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } | null {
    if (!this.stage) return null;
    
    const transform = this.stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(screenPos);
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } | null {
    if (!this.stage) return null;
    
    const transform = this.stage.getAbsoluteTransform();
    return transform.point(worldPos);
  }

  /**
   * Get consistent stage scale
   */
  getStageScale(): number {
    if (!this.stage) return 1;
    const scale = this.stage.scaleX();
    return Math.abs(scale) < 0.01 ? 0.01 : scale;
  }

  /**
   * Clean up and destroy
   */
  destroy() {
    // Cancel RAF
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }

    // Remove resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Destroy stage
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }

    this.layers = null;
    this.dragLayer = null;
  }
}