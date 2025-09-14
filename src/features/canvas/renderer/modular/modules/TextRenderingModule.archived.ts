import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasElement } from '../types';
import { TextElement } from '../../../types/enhanced.types';


export class TextRenderingModule implements RendererModule {
  private ctx!: ModuleContext;
  
  private nodeMap: Map<string, Konva.Node> = new Map();
  private bound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const stage = this.ctx.konva.getStage();
    if (!stage || this.bound) return;

    this.bound = true;
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.ctx) return;

    const mainLayer = this.ctx.konva.getLayers().main;
    if (!mainLayer) return;

    const textElements = Array.from(snapshot.elements.values()).filter(el => this.isTextElement(el));

    textElements.forEach((element) => {
      const id = String(element.id);
      let group = this.nodeMap.get(id) as Konva.Group;

      if (!group) {
        group = new Konva.Group({
          id,
          name: 'text',
          x: element.x,
          y: element.y,
          rotation: element.rotation ?? 0,
          draggable: true,
          // Ensure the group has a defined size if element has it, for better hit detection and rendering
          width: element.width || undefined,
          height: element.height || undefined,
        });

        const text = new Konva.Text({
          name: 'text', // Add name so old TextModule can find it with .text selector
          text: element.text || '',
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || 'Inter, system-ui, sans-serif',
          fill: element.fill || '#111827',
          align: element.textAlign || 'left',
          lineHeight: element.lineHeight || 1.2,
          padding: element.padding || 10,
          // Use element's width/height if available, otherwise Konva will auto-calculate
          width: element.width || undefined,
          height: element.height || undefined,
          verticalAlign: 'middle', // Center text vertically by default
        });

        // The hit area should match the text's actual rendered size, or element's explicit size
        // Set initial hitArea size; it might need to be updated after text renders to get accurate dimensions
        const hitAreaWidth = element.width || text.width();
        const hitAreaHeight = element.height || text.height();

        const hitArea = new Konva.Rect({
          name: 'hit-area',
          width: hitAreaWidth,
          height: hitAreaHeight,
          fill: 'transparent', // Make hit area transparent
          listening: true, // Ensure hit area is listening for events
        });

        group.add(hitArea);
        group.add(text);
        mainLayer.add(group);
        this.nodeMap.set(id, group);
        this.setupDragHandling(group, element.id as string);

        // Temporary logging to debug dimensions and visibility
        console.log(`[TextRenderingModule] Created text group ${id}:`, group.getAttrs());
        console.log(`[TextRenderingModule] Created Konva.Text node ${id}:`, text.getAttrs());
        console.log(`[TextRenderingModule] Created hitArea rect ${id}:`, hitArea.getAttrs());
        console.log(`[TextRenderingModule] Element data:`, element);

      } else {
        group.position({ x: element.x, y: element.y });
        group.rotation(element.rotation || 0);
        // Update group dimensions if element dimensions change
        group.width(element.width || undefined);
        group.height(element.height || undefined);

        const text = group.findOne('Text') as Konva.Text;
        if (text) {
          text.text(element.text || '');
          text.fontSize(element.fontSize || 16);
          text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
          text.fill(element.fill || '#111827');
          text.align(element.textAlign || 'left');
          text.lineHeight(element.lineHeight || 1.2);
          text.padding(element.padding || 10);
          // Update text dimensions if element dimensions change
          text.width(element.width || undefined);
          text.height(element.height || undefined);
          text.verticalAlign('middle');

          // Update hitArea size after text properties are updated
          const hitArea = group.findOne('.hit-area') as Konva.Rect;
          if (hitArea) {
            hitArea.width(element.width || text.width());
            hitArea.height(element.height || text.height());
          }
        }
      }
    });

    const elementIds = new Set(textElements.map(el => String(el.id)));
    for (const [nodeId, node] of this.nodeMap.entries()) {
      if (!elementIds.has(nodeId)) {
        node.destroy();
        this.nodeMap.delete(nodeId);
      }
    }

    mainLayer.batchDraw();
  }

  destroy(): void {
    // TextRenderingModule destroyed

    // Clean up all nodes
    for (const [id, node] of this.nodeMap.entries()) {
      try {
        node.destroy();
      } catch { /* ignore */ }
    }
    this.nodeMap.clear();

    this.bound = false;
  }

  private isTextElement(element: CanvasElement): element is TextElement {
    return element.type === 'text';
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
}