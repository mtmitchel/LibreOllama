import Konva from 'konva';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import { ElementCallbacks, ElementRendererFactory } from '../renderers/ElementRendererFactory';
import { VanillaElementRenderer } from '../renderers/VanillaElementRenderer';

export interface VanillaLayerRefs {
  background: Konva.Layer;
  main: Konva.Layer;
  connector: Konva.Layer;
  ui: Konva.Layer;
  tool: Konva.Layer;
}

export class VanillaLayerManager {
  private stage: Konva.Stage;
  private layers: VanillaLayerRefs | null = null;
  private elementRenderers: Map<ElementId, VanillaElementRenderer<CanvasElement>> = new Map();
  private callbacks: ElementCallbacks;

  constructor(stage: Konva.Stage, callbacks: ElementCallbacks) {
    this.stage = stage;
    this.callbacks = callbacks;
    this.layers = this.createLayers();
  }

  getLayers(): VanillaLayerRefs | null {
    return this.layers;
  }

  getStage(): Konva.Stage {
    return this.stage;
  }

  getMainLayer(): Konva.Layer | null {
    return this.layers?.main ?? null;
  }

  getUiLayer(): Konva.Layer | null {
    return this.layers?.ui ?? null;
  }

  getToolLayer(): Konva.Layer | null {
    return this.layers?.tool ?? null;
  }

  /**
   * Create and add layers to the stage in the correct order
   */
  private createLayers(): VanillaLayerRefs {
    const background = new Konva.Layer({ name: 'background-layer' });
    const main = new Konva.Layer({ name: 'main-layer' });
    const connector = new Konva.Layer({ name: 'connector-layer' });
    const ui = new Konva.Layer({ name: 'ui-layer' });
    const tool = new Konva.Layer({ name: 'tool-layer' });

    this.stage.add(background);
    this.stage.add(main);
    this.stage.add(connector);
    this.stage.add(ui);
    this.stage.add(tool);

    return { background, main, connector, ui, tool };
  }

  /**
   * Render a light grid background; call on init and on resize
   */
  drawBackgroundGrid(width: number, height: number, gridSize = 50, color = '#e0e0e0', opacity = 0.3): void {
    if (!this.layers) return;
    const { background } = this.layers;

    // Clear previous grid
    background.destroyChildren();

    const gridGroup = new Konva.Group();

    for (let x = 0; x < width; x += gridSize) {
      gridGroup.add(new Konva.Line({ points: [x, 0, x, height], stroke: color, strokeWidth: 1, opacity }));
    }
    for (let y = 0; y < height; y += gridSize) {
      gridGroup.add(new Konva.Line({ points: [0, y, width, y], stroke: color, strokeWidth: 1, opacity }));
    }

    background.add(gridGroup);
    background.draw();
  }

  /**
   * Reconcile current element set with renderers; create/update/destroy as needed
   */
  setElements(elements: Map<ElementId, CanvasElement>): void {
    if (!this.layers) return;
    const { main } = this.layers;

    // Determine desired ids
    const desiredIds = new Set<ElementId>();

    elements.forEach((element, id) => {
      desiredIds.add(id);
      const existing = this.elementRenderers.get(id);

      if (existing) {
        // Update existing renderer
        existing.update(element);
      } else {
        // Create new renderer if supported
        const renderer = ElementRendererFactory.createRenderer(element, {
          layer: main,
          stage: this.stage,
          callbacks: this.callbacks,
        });
        if (renderer) {
          renderer.render();
          this.elementRenderers.set(id, renderer);
        }
      }
    });

    // Remove stale renderers
    Array.from(this.elementRenderers.keys()).forEach((id) => {
      if (!desiredIds.has(id)) {
        const renderer = this.elementRenderers.get(id);
        if (renderer) {
          renderer.destroy();
        }
        this.elementRenderers.delete(id);
      }
    });

    // Batch draw after reconciliation
    main.batchDraw();
  }

  /**
   * Return element IDs whose client rect intersects the given rectangle
   */
  getElementsInRect(rect: { x: number; y: number; width: number; height: number }): ElementId[] {
    const results: ElementId[] = [];
    const main = this.getMainLayer();
    if (!main) return results;

    const target = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };

    this.elementRenderers.forEach((renderer, id) => {
      const node = renderer.getKonvaNode();
      if (!node) return;
      const box = node.getClientRect({ skipShadow: true, skipStroke: false });
      if (this.rectsIntersect(target, box)) {
        results.push(id);
      }
    });

    return results;
  }

  private rectsIntersect(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Clear all renderers and layers
   */
  destroy(): void {
    // Destroy renderers
    ElementRendererFactory.destroyRenderers(this.elementRenderers);

    // Destroy layers
    if (this.layers) {
      this.layers.tool.destroy();
      this.layers.ui.destroy();
      this.layers.connector.destroy();
      this.layers.main.destroy();
      this.layers.background.destroy();
      this.layers = null;
    }
  }
}
