import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasElement } from '../types';
import { ShapesModule } from '../../../services/modules/ShapesModule';

/**
 * StickyNoteModule handles sticky note element rendering and interaction.
 * This module follows the modular renderer pattern and uses the ShapesModule
 * foundation for creating rectangles with sticky note specific styling.
 */
export class StickyNoteModule implements RendererModule {
  private ctx!: ModuleContext;
  private shapesHelper!: ShapesModule;
  private nodeMap = new Map<string, Konva.Node>();
  private bound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    if (this.bound) return;
    this.bound = true;

    // Initialize ShapesModule helper for rectangle creation
    const layers = this.ctx.konva.getLayers();
    this.shapesHelper = new ShapesModule(
      this.nodeMap,
      {
        background: layers.background!,
        main: layers.main!,
        preview: layers.preview!,
        overlay: layers.overlay!
      },
      (id: string, updates: any) => this.updateElementCallback(id, updates),
      (layer: 'main' | 'overlay' | 'preview') => this.scheduleDraw(layer),
      (elId: string) => this.refreshTransformer(elId),
      null, // currentEditingId
      undefined, // currentEditorWrapper
      undefined, // currentEditorPad
      this.ctx.konva.getStage(),
      () => 12, // getCirclePadPx - not used for sticky notes but required
      () => 0, // getBaselineOffsetPx - not used for sticky notes but required
      () => ({}) // getDebug - not used for sticky notes but required
    );

    // Bind event handlers for sticky note creation and editing
    this.bindEvents();
  }

  sync(snapshot: CanvasSnapshot): void {
    const mainLayer = this.ctx.konva.getLayers().main;
    if (!mainLayer) return;

    // Process all sticky-note elements in the snapshot
    snapshot.elements.forEach((element, id) => {
      if (element.type === 'sticky-note') {
        const existingNode = this.nodeMap.get(id) as Konva.Group;

        if (existingNode) {
          // Update existing sticky note
          this.updateStickyNote(existingNode, element);
        } else {
          // Create new sticky note
          const group = this.createStickyNote(element);
          this.nodeMap.set(id, group);
          mainLayer.add(group);
        }
      }
    });

    // Remove sticky notes that no longer exist in the snapshot
    const nodesToRemove: string[] = [];
    this.nodeMap.forEach((node, id) => {
      if (!snapshot.elements.has(id)) {
        node.destroy();
        nodesToRemove.push(id);
      }
    });
    nodesToRemove.forEach(id => this.nodeMap.delete(id));

    // Redraw main layer if changes were made
    mainLayer.batchDraw();
  }

  destroy(): void {
    try {
      this.ctx?.konva?.getStage()?.off('.stickynote');
    } catch { /* ignore */ }

    // Clean up all nodes
    this.nodeMap.forEach(node => {
      node.destroy();
    });
    this.nodeMap.clear();

    this.bound = false;
  }

  private bindEvents(): void {
    const stage = this.ctx.konva.getStage();
    if (!stage) return;

    // Handle double-click for sticky note editing
    stage.on('dblclick.stickynote', (e: any) => {
      const target = e.target as Konva.Node;
      const group = this.resolveGroup(target);
      if (!group || group.name() !== 'sticky-note') return;

      const id = group.id?.();
      if (!id) return;

      // Get element from unified store (similar to TextModule pattern)
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const el = store?.getState?.().elements?.get(id);
      if (!el || el.type !== 'sticky-note') return;

      // Prevent event propagation
      e.cancelBubble = true;
      e.evt?.stopPropagation?.();
      e.evt?.stopImmediatePropagation?.();

      // Mark that modular StickyNoteModule is handling this
      (window as any).__MODULAR_STICKY_EDITING__ = true;

      // Delegate to text editing system (sticky notes are text-editable)
      this.openTextEditor(id, el);
    });
  }

  private createStickyNote(el: CanvasElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 200); // Default sticky note width
    const h = Math.max(1, el.height || 150); // Default sticky note height

    // Create group with hit area using ShapesModule utility
    const group = this.shapesHelper.createGroupWithHitArea(id, w, h, true);
    group.name('sticky-note');
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });

    // Record layout base for transform normalization (matching CanvasRendererV2)
    try {
      group.setAttr('__layoutW', w);
      group.setAttr('__layoutH', h);
    } catch {}

    // Create background rectangle with sticky note styling
    const bg = new Konva.Rect({
    });
    group.add(bg);

    // Create text node with sticky note specific styling
    const pad = 12; // Sticky note padding
    const text = new Konva.Text({
    });

    // Configure text wrapping and alignment
    (text as any).wrap('word');
    (text as any).align('left');
    (text as any).lineHeight((el as any).lineHeight || 1.25);

    if ((el as any).letterSpacing !== undefined) {
      (text as any).letterSpacing((el as any).letterSpacing);
    }

    group.add(text);

    return group;
  }

  private updateStickyNote(group: Konva.Group, el: CanvasElement): void {
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    // Update group position
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Update layout attributes
    try {
      group.setAttr('__layoutW', w);
      group.setAttr('__layoutH', h);
    } catch {}

    // Ensure hit area size matches
    this.shapesHelper.ensureHitAreaSize(group, w, h);

    // Update background rectangle
    const bg = group.findOne<Konva.Rect>('.frame');
    if (bg) {
      bg.position({ x: 0, y: 0 });
      bg.width(w);
      bg.height(h);
      bg.fill((el as any).backgroundColor || el.fill || '#fef08a');

      // Handle stroke styling
      if ((el as any).style?.stroke) {
        bg.stroke((el as any).style.stroke.color);
        bg.strokeWidth((el as any).style.stroke.width);
        (bg as any).strokeScaleEnabled(false);
      } else {
        bg.stroke((el as any).stroke || 'transparent');
        bg.strokeWidth(0);
        (bg as any).strokeScaleEnabled(false);
      }

      // Disable shadow for hit detection
      try {
        (bg as any).shadowForHitEnabled?.(false);
        (bg as any).shadowForStrokeEnabled?.(false);
      } catch {}
    }

    // Update text content and styling
    const text = group.findOne<Konva.Text>('.text');
    if (text) {
      const pad = (el as any).style?.padding ?? 12;
      text.position({ x: pad, y: pad });
      text.width(Math.max(1, w - pad * 2));
      text.height(Math.max(1, h - pad * 2));
      text.text((el as any).text || '');
      text.fontSize((el as any).fontSize || 14);
      text.fontFamily((el as any).fontFamily || 'Inter, system-ui, sans-serif');
      text.fill((el as any).textColor || '#451a03');

      // Update text formatting
      (text as any).wrap('word');
      (text as any).align((el as any).textAlign || 'left');
      (text as any).lineHeight((el as any).lineHeight || 1.25);

      if ((el as any).letterSpacing !== undefined) {
        (text as any).letterSpacing((el as any).letterSpacing);
      }

      // Hide text if editing
      try {
        text.visible(!((el as any).isEditing));
      } catch {}
    }
  }

  private resolveGroup(target: Konva.Node): Konva.Group | null {
    if (!target) return null;
    if (target.getClassName?.() === 'Group') return target as Konva.Group;
    const g = target.findAncestor((n: Konva.Node) => n.getClassName?.() === 'Group', true) as Konva.Group | null;
    return g || null;
  }

  private openTextEditor(elId: string, el: any): void {
    // Delegate text editing to the text editor system
    // This allows sticky notes to reuse the existing text editing infrastructure
    console.info('[StickyNoteModule] Opening text editor for sticky note:', elId);

    // Mark element as editing
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    try {
      store?.getState?.().updateElement?.(elId, { isEditing: true });
    } catch { /* ignore */ }

    // The TextModule or similar text editing system will handle the actual editing
    // since sticky notes are essentially rectangles with editable text
  }

  // Helper methods for ShapesModule integration
  private updateElementCallback = (id: string, updates: any): void => {
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    try {
      store?.getState?.().updateElement?.(id, updates);
    } catch { /* ignore */ }
  };

  private scheduleDraw = (layer: 'main' | 'overlay' | 'preview'): void => {
    const layers = this.ctx.konva.getLayers();
    switch (layer) {
      case 'main':
        layers.main?.batchDraw();
        break;
      case 'overlay':
        layers.overlay?.batchDraw();
        break;
      case 'preview':
        layers.preview?.batchDraw();
        break;
    }
  };

  private refreshTransformer = (elId: string): void => {
    // Trigger transformer refresh if needed
    const overlayLayer = this.ctx.konva.getLayers().overlay;
    const transformer = overlayLayer?.findOne('Transformer') as Konva.Transformer;
    if (transformer) {
      const nodes = transformer.nodes();
      const targetNode = nodes.find(n => n.id() === elId);
      if (targetNode) {
        transformer.forceUpdate();
        overlayLayer?.batchDraw();
      }
    }
  };
}