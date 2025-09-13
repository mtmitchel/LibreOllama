/**
 * Layer Manager Module
 * Creates and manages the 4-layer pipeline: background, main, preview, overlay
 */

import Konva from 'konva';
import type { LayerName, RendererLayers } from './types';

export interface LayerConfig {
  enableGrid?: boolean;
  gridSize?: number;
  gridColor?: string;
  gridOpacity?: number;
  backgroundColor?: string;
}

export class LayerManager {
  private layers: RendererLayers | null = null;
  private stage: Konva.Stage | null = null;
  private config: LayerConfig;
  private gridGroup: Konva.Group | null = null;
  private dirtyLayers = new Set<LayerName>();
  private rafId: number = 0;

  constructor(config: LayerConfig = {}) {
    this.config = {
      enableGrid: true,
      gridSize: 20,
      gridColor: '#e0e0e0',
      gridOpacity: 0.5,
      backgroundColor: '#f8f8f8',
      ...config
    };
  }

  /**
   * Initialize layers with a Konva stage
   */
  init(stage: Konva.Stage): RendererLayers {
    this.stage = stage;

    // Create the 4 layers
    this.layers = {
      background: this.createBackgroundLayer(),
      main: this.createMainLayer(),
      preview: this.createPreviewLayer(),
      overlay: this.createOverlayLayer()
    };

    // Add layers to stage in order
    stage.add(this.layers.background);
    stage.add(this.layers.main);
    stage.add(this.layers.preview);
    stage.add(this.layers.overlay);

    // Draw initial state
    this.drawBackground();
    stage.batchDraw();

    return this.layers;
  }

  /**
   * Get a specific layer
   */
  get(name: LayerName): Konva.Layer | null {
    return this.layers ? this.layers[name] : null;
  }

  /**
   * Get all layers
   */
  getAll(): RendererLayers | null {
    return this.layers;
  }

  /**
   * Create background layer with grid
   */
  private createBackgroundLayer(): Konva.Layer {
    const layer = new Konva.Layer({
      name: 'background',
      listening: false  // No interaction
    });

    return layer;
  }

  /**
   * Create main content layer
   */
  private createMainLayer(): Konva.Layer {
    const layer = new Konva.Layer({
      name: 'main',
      clearBeforeDraw: true
    });

    return layer;
  }

  /**
   * Create fast preview layer for in-progress operations
   */
  private createPreviewLayer(): Konva.Layer {
    const layer = new Konva.Layer({
      name: 'preview',
      clearBeforeDraw: true
    });

    // Preview layer is typically semi-transparent
    layer.opacity(0.7);

    return layer;
  }

  /**
   * Create overlay layer for transformer and DOM bounds
   */
  private createOverlayLayer(): Konva.Layer {
    const layer = new Konva.Layer({
      name: 'overlay',
      clearBeforeDraw: true
    });

    return layer;
  }

  /**
   * Draw background grid
   */
  private drawBackground(): void {
    if (!this.layers || !this.stage) return;

    const backgroundLayer = this.layers.background;
    backgroundLayer.destroyChildren();

    // Background rectangle
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: this.config.backgroundColor
    });
    backgroundLayer.add(bg);

    // Grid
    if (this.config.enableGrid) {
      this.gridGroup = new Konva.Group({
        opacity: this.config.gridOpacity
      });

      const gridSize = this.config.gridSize!;
      const width = this.stage.width();
      const height = this.stage.height();

      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        const line = new Konva.Line({
          points: [x, 0, x, height],
          stroke: this.config.gridColor,
          strokeWidth: 1
        });
        this.gridGroup.add(line);
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        const line = new Konva.Line({
          points: [0, y, width, y],
          stroke: this.config.gridColor,
          strokeWidth: 1
        });
        this.gridGroup.add(line);
      }

      backgroundLayer.add(this.gridGroup);
    }

    backgroundLayer.batchDraw();
  }

  /**
   * Update grid for stage resize or zoom
   */
  updateGrid(stageWidth?: number, stageHeight?: number): void {
    if (!this.stage || !this.layers) return;

    const width = stageWidth || this.stage.width();
    const height = stageHeight || this.stage.height();

    // Update stage size if provided
    if (stageWidth || stageHeight) {
      this.stage.width(width);
      this.stage.height(height);
    }

    // Redraw background
    this.drawBackground();
  }

  /**
   * Mark a layer as dirty for batched drawing
   */
  markDirty(layer: LayerName): void {
    this.dirtyLayers.add(layer);
    this.scheduleBatchDraw();
  }

  /**
   * Schedule batch draw with RAF
   */
  private scheduleBatchDraw(): void {
    if (this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.processBatchDraw();
    });
  }

  /**
   * Process batch draw for dirty layers
   */
  private processBatchDraw(): void {
    if (!this.layers) return;

    this.dirtyLayers.forEach(layerName => {
      const layer = this.layers![layerName];
      if (layer) {
        layer.batchDraw();
      }
    });

    this.dirtyLayers.clear();
  }

  /**
   * Batch draw specific layers
   */
  batchDraw(layers?: LayerName[]): void {
    if (!this.layers) return;

    if (layers) {
      layers.forEach(name => {
        const layer = this.layers![name];
        if (layer) layer.batchDraw();
      });
    } else {
      // Draw all layers
      Object.values(this.layers).forEach(layer => layer.batchDraw());
    }
  }

  /**
   * Clear a specific layer
   */
  clear(layer: LayerName): void {
    const targetLayer = this.get(layer);
    if (targetLayer) {
      targetLayer.destroyChildren();
      targetLayer.batchDraw();
    }
  }

  /**
   * Clear preview layer (common operation)
   */
  clearPreview(): void {
    this.clear('preview');
  }

  /**
   * Clear overlay layer (common operation)
   */
  clearOverlay(): void {
    const overlayLayer = this.get('overlay');
    if (overlayLayer) {
      // Preserve transformer if it exists
      const transformer = overlayLayer.findOne('Transformer');
      overlayLayer.destroyChildren();
      if (transformer) {
        overlayLayer.add(transformer as Konva.Group); // Cast to Konva.Group
      }
      overlayLayer.batchDraw();
    }
  }

  /**
   * Set layer visibility
   */
  setLayerVisible(layer: LayerName, visible: boolean): void {
    const targetLayer = this.get(layer);
    if (targetLayer) {
      targetLayer.visible(visible);
      targetLayer.batchDraw();
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layer: LayerName, opacity: number): void {
    const targetLayer = this.get(layer);
    if (targetLayer) {
      targetLayer.opacity(opacity);
      targetLayer.batchDraw();
    }
  }

  /**
   * Move nodes between layers
   */
  moveToLayer(nodes: Konva.Node | Konva.Node[], targetLayer: LayerName): void {
    const layer = this.get(targetLayer);
    if (!layer) return;

    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
    nodeArray.forEach(node => {
      node.moveTo(layer);
    });

    layer.batchDraw();
  }

  /**
   * Listen to stage events
   */
  listenTo(event: string, handler: (e: any) => void): void {
    if (this.stage) {
      this.stage.on(event, handler);
    }
  }

  /**
   * Stop listening to stage events
   */
  stopListening(event?: string): void {
    if (this.stage) {
      if (event) {
        this.stage.off(event);
      } else {
        this.stage.off();
      }
    }
  }

  /**
   * Get stage transform
   */
  getStageTransform(): any {
    return this.stage?.getAbsoluteTransform();
  }

  /**
   * Get stage scale
   */
  getStageScale(): { x: number; y: number } {
    if (!this.stage) return { x: 1, y: 1 };
    const scale = this.stage.getAbsoluteScale();
    return { x: scale.x, y: scale.y };
  }

  /**
   * Convert screen to world coordinates
   */
  screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
    if (!this.stage) return screenPos;
    const transform = this.stage.getAbsoluteTransform().copy().invert();
    return transform.point(screenPos);
  }

  /**
   * Convert world to screen coordinates
   */
  worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
    if (!this.stage) return worldPos;
    const transform = this.stage.getAbsoluteTransform();
    return transform.point(worldPos);
  }

  /**
   * Dispose of layer manager
   */
  dispose(): void {
    cancelAnimationFrame(this.rafId);
    
    if (this.layers) {
      Object.values(this.layers).forEach(layer => {
        layer.destroy();
      });
      this.layers = null;
    }

    this.stage = null;
    this.gridGroup = null;
    this.dirtyLayers.clear();
  }
}