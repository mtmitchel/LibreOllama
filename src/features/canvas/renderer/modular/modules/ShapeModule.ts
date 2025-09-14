import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasElement } from '../types';
import { ShapesModule, RendererLayers } from '../../../services/modules/ShapesModule';

export class ShapeModule implements RendererModule {
  private ctx!: ModuleContext;
  private shapesHelper!: ShapesModule;
  private nodeMap: Map<string, Konva.Node> = new Map();
  private bound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const stage = this.ctx.konva.getStage();
    if (!stage || this.bound) return;

    this.bound = true;

    // Create ShapesModule helper instance
    const layers = this.ctx.konva.getLayers();
    const rendererLayers: RendererLayers = {
      background: layers.background!,
      main: layers.main!,
      preview: layers.preview!,
      overlay: layers.overlay!
    };

    // Get store reference for updating elements
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const updateElementCallback = (id: string, updates: any) => {
      try {
        store?.getState?.().updateElement?.(id, updates);
      } catch { /* ignore */ }
    };

    // Schedule draw callback
    const scheduleDraw = (layer: 'main' | 'overlay' | 'preview') => {
      try {
        const targetLayer = layers[layer];
        if (targetLayer) {
          targetLayer.batchDraw();
        }
      } catch { /* ignore */ }
    };

    // Refresh transformer callback (for selections)
    const refreshTransformer = (elId: string) => {
      try {
        // Trigger transformer refresh via selection system
        const currentSelection = store?.getState?.().selection;
        if (currentSelection?.has?.(elId)) {
          // Force transformer update by clearing and re-selecting
          store?.getState?.().clearSelection?.();
          requestAnimationFrame(() => {
            store?.getState?.().selectElement?.(elId, false);
          });
        }
      } catch { /* ignore */ }
    };

    // Create helper functions needed by ShapesModule
    const getCirclePadPx = (el?: any) => el?.padding ?? 16;
    const getBaselineOffsetPx = (family: string, sizePx: number, lineHeight: number) => {
      // Baseline offset calculation - simplified for now
      return sizePx * 0.1;
    };
    const getDebug = () => ({ outlineOverlay: false, log: false, zeroBaseline: false });

    // Initialize ShapesModule helper
    this.shapesHelper = new ShapesModule(
      this.nodeMap,
      rendererLayers,
      updateElementCallback,
      scheduleDraw,
      refreshTransformer,
      null, // currentEditingId
      undefined, // currentEditorWrapper
      undefined, // currentEditorPad
      stage,
      getCirclePadPx,
      getBaselineOffsetPx,
      getDebug
    );

    // Bind event handlers for shape text editing (double-click)
    stage.on('dblclick.modshape', (e: any) => {
      const target = e.target as Konva.Node;
      const group = this.resolveGroup(target);
      if (!group) return;

      const id = group.id?.();
      if (!id) return;

      const el = store?.getState?.().elements?.get(id);
      if (!el || !this.isShapeElement(el)) return;

      // Only handle if the shape has text or can have text
      if (el.text !== undefined || this.canHaveText(el)) {
        // Prevent event bubbling to avoid conflicts with other text editing systems
        e.cancelBubble = true;
        e.evt?.stopPropagation?.();
        e.evt?.stopImmediatePropagation?.();

        // Delegate to text editing system
        this.openTextEditor(id, el, group);
      }
    });
  }

  sync(snapshot: CanvasSnapshot): void {
    // ShapeModule sync called

    if (!this.shapesHelper) {
      console.error('[ShapeModule] shapesHelper not initialized!');
      return;
    }

    const layers = this.ctx.konva.getLayers();
    const mainLayer = layers.main;
    if (!mainLayer) {
      console.error('// ShapeModule: mainLayer not available!');
      return;
    }

    // ShapeModule processing elements...');

    // Process all elements, focusing on shape types
    snapshot.elements.forEach((element) => {
      if (!this.isShapeElement(element)) {
        // Debug: Log non-shape elements to see what we're skipping
        // Skip non-shape element
        return;
      }

      // Processing shape element

      const id = String(element.id);
      const existing = this.nodeMap.get(id) as Konva.Group;

      if (!existing) {
        // Create new shape
        let group: Konva.Group;

        switch (element.type) {
          case 'circle':
            group = this.shapesHelper.createCircle(element);
            break;
          case 'triangle':
            group = this.shapesHelper.createTriangle(element);
            break;
          case 'rectangle':
            group = this.shapesHelper.createRectangle(element);
            break;
          default:
            return; // Skip unknown shape types
        }

        // Add to layer and track
        mainLayer.add(group);
        this.nodeMap.set(id, group);

        // Set up drag handling
        this.setupDragHandling(group, element.id);

      } else {
        // Update existing shape
        switch (element.type) {
          case 'circle':
            this.shapesHelper.updateCircle(existing, element);
            break;
          case 'triangle':
            this.shapesHelper.updateTriangle(existing, element);
            break;
          case 'rectangle':
            this.shapesHelper.updateRectangle(existing, element);
            break;
        }
      }
    });

    // Clean up removed elements
    const elementIds = new Set(Array.from(snapshot.elements.keys()));
    for (const [nodeId, node] of this.nodeMap.entries()) {
      if (!elementIds.has(nodeId)) {
        try {
          node.destroy();
          this.nodeMap.delete(nodeId);
        } catch { /* ignore */ }
      }
    }

    // Schedule redraw
    mainLayer.batchDraw();
  }

  destroy(): void {
    // Clean up event handlers
    try {
      this.ctx?.konva?.getStage()?.off('.modshape');
    } catch { /* ignore */ }

    // Clean up all nodes
    for (const [id, node] of this.nodeMap.entries()) {
      try {
        node.destroy();
      } catch { /* ignore */ }
    }
    this.nodeMap.clear();

    // Clean up shapes helper
    if (this.shapesHelper) {
      // Cancel any ongoing radius tweens
      for (const [id, tween] of this.shapesHelper.radiusTweens.entries()) {
        try {
          tween.cancel();
        } catch { /* ignore */ }
      }
      this.shapesHelper.radiusTweens.clear();
    }

    this.bound = false;
  }

  private isShapeElement(element: CanvasElement): element is CanvasElement & { type: 'circle' | 'triangle' | 'rectangle' } {
    return element.type === 'circle' || element.type === 'triangle' || element.type === 'rectangle';
  }

  private canHaveText(element: CanvasElement): boolean {
    // All shape types can have text
    return this.isShapeElement(element);
  }

  private resolveGroup(target: Konva.Node): Konva.Group | null {
    if (!target) return null;
    if (target.getClassName?.() === 'Group') return target as Konva.Group;
    const group = target.findAncestor((n: Konva.Node) => n.getClassName?.() === 'Group', true) as Konva.Group | null;
    return group || null;
  }

  private setupDragHandling(group: Konva.Group, elementId: string): void {
    // Make group draggable
    group.draggable(true);

    // Handle drag end to update store
    group.on('dragend', () => {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      try {
        store?.getState?.().updateElement?.(String(elementId), {
          x: group.x(),
          y: group.y()
        });
      } catch { /* ignore */ }
    });
  }

  private openTextEditor(id: string, element: CanvasElement, group: Konva.Group): void {
    // For now, delegate to the existing text editing infrastructure
    // This could be enhanced to use a dedicated shape text editor
    const store = (window as any).__UNIFIED_CANVAS_STORE__;

    try {
      // Mark element as editing
      store?.getState?.().updateElement?.(id, { isEditing: true });

      // If there's a modular TextModule available, let it handle the text editing
      const modularTextEditing = (window as any).__MODULAR_TEXT_EDITING__;
      if (!modularTextEditing) {
        // Create a simple text editing experience
        this.createSimpleTextEditor(id, element, group);
      }
    } catch (e) {
      console.warn('[ShapeModule] Could not open text editor:', e);
    }
  }

  private createSimpleTextEditor(id: string, element: CanvasElement, group: Konva.Group): void {
    const stage = this.ctx.konva.getStage();
    if (!stage) return;

    const store = (window as any).__UNIFIED_CANVAS_STORE__;

    // Create a simple prompt-based text editor as fallback
    const currentText = (element as any).text || '';
    const newText = prompt('Enter text:', currentText);

    if (newText !== null) {
      // Update the element with new text
      try {
        store?.getState?.().updateElement?.(id, {
          text: newText,
          isEditing: false
        });
      } catch { /* ignore */ }
    } else {
      // Cancel editing
      try {
        store?.getState?.().updateElement?.(id, { isEditing: false });
      } catch { /* ignore */ }
    }
  }
}