// src/features/canvas/core/ElementRegistry.ts
import Konva from 'konva';
import { openTextEditorOverlay } from './TextEditorOverlay';
import {
  CanvasElement,
  ElementId,
  isRectangleElement,
  isCircleElement,
  isStickyNoteElement,
  isTextElement,
  isImageElement,
  isConnectorElement,
  isPenElement,
  isTriangleElement,
  isTableElement,
} from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
// duplicate import removed

import { MemoryManager } from './MemoryManager';

export class ElementRegistry {
  private nodeMap = new Map<ElementId, Konva.Node>();
  private layer: Konva.Layer;
 private memory: MemoryManager;

  constructor(layer: Konva.Layer, memory?: MemoryManager) {
    this.layer = layer;
    this.memory = memory ?? new MemoryManager({ warnThreshold: 2000, criticalThreshold: 5000 });
  }

  private attachCommonHandlers(node: Konva.Node, element: CanvasElement): void {
    // Drag handling → write back to store
    if ((node as any).draggable() !== undefined) {
      (node as any).draggable(true);
    }
    node.on('dragend', (e: any) => {
      const store = useUnifiedCanvasStore.getState();
      store.updateElement(element.id as ElementId, {
        x: (e.target as any).x(),
        y: (e.target as any).y(),
        updatedAt: Date.now(),
      } as any);
    });
  }

  create(element: CanvasElement): void {
    let node: Konva.Node | null = null;

    if (isTextElement(element)) {
      // Use the dimensions passed from TextTool for immediate accurate sizing
      const initialWidth = (element as any).width || 100;
      const initialHeight = (element as any).height || 30;
      
      // Create group with text and border
      const group = new Konva.Group({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: initialWidth,
        height: initialHeight,
        listening: false, // Prevent immediate transformer attachment
        draggable: false, // No dragging during creation state
      });

      // 1) Invisible hit-area to ensure robust clicks anywhere in group bounds
      const hitArea = new Konva.Rect({
        name: 'hit-area',
        x: 0,
        y: 0,
        width: initialWidth,
        height: initialHeight,
        fill: 'transparent',
        listening: true,
        hitStrokeWidth: 0,
      });

      // Background rect
      const rect = new Konva.Rect({
        name: 'background-rect',
        x: 0,
        y: 0,
        width: initialWidth,
        height: initialHeight,
        fill: 'white',
        stroke: '#4A90E2',
        strokeWidth: 1,
        listening: false, // Prevent immediate selection
      });
      
      // Simple text measurement
      async function createSingleLineTextNode() {
        const fontSize = element.fontSize ?? 24;
        const fontFamily = element.fontFamily ?? 'Inter, system-ui, Arial';
        const text = (element.text || '');
        
        // 1. Ensure font is loaded
        const primaryFamily = (fontFamily.split(',')[0] || 'Inter').trim().replace(/^"|"$/g, '');
        const fontSpec = `${fontSize}px ${primaryFamily}`;
        try {
          await document.fonts.load(fontSpec);
          await (document as any).fonts.ready;
        } catch {}
        
        // 2. Measure text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize * 1.2;
        
        // 3. Create Konva text
        const textNode = new Konva.Text({
          x: 0,
          y: 0,
          text: text,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fill: element.fill ?? '#111827',
          padding: 0,
          lineHeight: 1.2,
          wrap: 'none',
          width: textWidth + 2, // Small buffer
          align: 'left',
          verticalAlign: 'middle',
          listening: false,
        });
        
        return { textNode, width: textWidth, height: Math.ceil(textHeight) };
      }
      
      // Create text node with definitive single-line guarantee
      createSingleLineTextNode().then(({ textNode, width, height: measuredHeightPx }) => {
        // Add hit-area first as the bottom layer for reliable click detection
        group.add(hitArea);
        // Add rect above hit-area
        group.add(rect);
        // Add text on top
        group.add(textNode);
        
        // Initial height fallback; will refine on next frame using Konva's computed height
        let actualTextHeight = measuredHeightPx;
        const preciseWidth = width; // from measurement phase
        
        // Update rect to match overlay padding
        const padX = 4;
        const padY = 2;
        rect.x(-padX);
        rect.y(-padY);
        rect.width(preciseWidth + padX * 2);
        rect.height(actualTextHeight + padY * 2);
        
        // Update hit-area to match rect dimensions for reliable clicking
        hitArea.x(-padX);
        hitArea.y(-padY);
        hitArea.width(preciseWidth + padX * 2);
        hitArea.height(actualTextHeight + padY * 2);
        
        // Update group size
        const finalWidth = preciseWidth + padX * 2;
        const finalHeight = actualTextHeight + padY * 2;
        group.width(finalWidth);
        group.height(finalHeight);
        
        // Dimensions synced with overlay
        
        // Force redraw
        group.getLayer()?.batchDraw();
        
        // Refine height on next frame to match Konva's computed metrics exactly
        requestAnimationFrame(() => {
          const h = Math.ceil(textNode.height());
          if (h && h !== actualTextHeight) {
            actualTextHeight = h;
            rect.height(actualTextHeight + padY * 2);
            hitArea.height(actualTextHeight + padY * 2);
            group.height(actualTextHeight + padY * 2);
            // Height refined based on actual text rendering
            group.getLayer()?.batchDraw();
          }
        });
        
        // Single-line text guaranteed with explicit width
      });
      
      node = group;

      // Enable interaction after text editing is complete
      const enableSelection = () => {
        group.listening(true);
        group.draggable(true);
        const tn = group.findOne('Text') as Konva.Text | null;
        if (tn) tn.listening(true);
        const rc = (group.findOne('[name="background-rect"]') as Konva.Rect | null) || (group.findOne('Rect') as Konva.Rect | null);
        if (rc) rc.listening(true);
        
        // Single click to select (after creation is complete)
        group.on('click', () => {
          const store = useUnifiedCanvasStore.getState();
          store.selectElement(element.id as any);
        });
        
        // Double-click to edit
        group.on('dblclick', () => {
          const stage = group.getStage();
          if (!stage) return;
          const tn = group.findOne('Text') as Konva.Text | null;
          if (!tn) return;
          openTextEditorOverlay(stage, tn, element.id as any, {
            initialText: (element as any).text || '',
            fontSize: (element as any).fontSize,
            fontFamily: (element as any).fontFamily,
            align: 'left',
          });
        });
      };
      
      // Store the enableSelection function for later use
      (group as any)._enableSelection = enableSelection;
    } else if (isRectangleElement(element)) {
      node = new Konva.Rect({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: element.fill ?? '#ffffff',
        stroke: element.stroke ?? '#111827',
        strokeWidth: element.strokeWidth ?? 1,
        cornerRadius: element.cornerRadius ?? 6,
        listening: true,
      });
    } else if (isCircleElement(element)) {
      node = new Konva.Circle({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        radius: element.radius,
        fill: element.fill ?? '#ffffff',
        stroke: element.stroke ?? '#111827',
        strokeWidth: element.strokeWidth ?? 1,
        listening: true,
      });
    } else if (isStickyNoteElement(element)) {
      node = new Konva.Rect({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: element.backgroundColor ?? '#FEF3C7',
        cornerRadius: 8,
        listening: true,
      });
    } else if (isImageElement(element)) {
      const imageNode = new Konva.Image({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        opacity: element.opacity ?? 1,
        listening: true,
      });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageNode.image(img);
        this.layer.batchDraw();
      };
      img.src = element.imageUrl;
      node = imageNode;
    } else if (isConnectorElement(element)) {
      const line = new Konva.Line({
        id: element.id as unknown as string,
        points: element.points ?? [element.startPoint.x, element.startPoint.y, element.endPoint.x, element.endPoint.y],
        stroke: element.stroke ?? '#111827',
        strokeWidth: element.strokeWidth ?? 2,
        lineCap: 'round',
        lineJoin: 'round',
        listening: true,
      });
      node = line;
    } else if (isPenElement(element)) {
      const line = new Konva.Line({
        id: element.id as unknown as string,
        points: element.points,
        stroke: element.stroke ?? '#111827',
        strokeWidth: element.strokeWidth ?? 2,
        tension: element.tension ?? 0.4,
        lineCap: 'round',
        lineJoin: 'round',
        listening: true,
      });
      node = line;
    } else if ((element as any).type === 'marker') {
      const style = (element as any).style || {};
      const line = new Konva.Line({
        id: element.id as unknown as string,
        points: (element as any).points,
        stroke: style.color || '#111827',
        strokeWidth: style.width || 4,
        tension: style.smoothness ?? 0.4,
        lineCap: 'round',
        lineJoin: 'round',
        opacity: typeof style.opacity === 'number' ? style.opacity : 1,
        listening: true,
      });
      node = line;
    } else if ((element as any).type === 'highlighter') {
      const style = (element as any).style || {};
      const line = new Konva.Line({
        id: element.id as unknown as string,
        points: (element as any).points,
        stroke: style.color || '#FFFF00',
        strokeWidth: style.width || 12,
        tension: style.smoothness ?? 0.4,
        lineCap: 'round',
        lineJoin: 'round',
        opacity: typeof style.opacity === 'number' ? style.opacity : 0.4,
        globalCompositeOperation: (style.blendMode as any) || 'multiply',
        listening: true,
      });
      node = line;
    } else if (isTriangleElement(element)) {
      const tri = new Konva.Line({
        id: element.id as unknown as string,
        points: element.points,
        closed: true,
        fill: (element as any).fill ?? '#ffffff',
        stroke: (element as any).stroke ?? '#111827',
        strokeWidth: (element as any).strokeWidth ?? 1,
        listening: true,
      });
      node = tri;
    } else if (isTableElement(element)) {
      node = new Konva.Rect({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        fill: '#FFFFFF',
        stroke: '#D1D5DB',
        strokeWidth: 1,
        listening: true,
      });
    } else {
      // Fallback
      node = new Konva.Rect({
        id: element.id as unknown as string,
        x: element.x,
        y: element.y,
        width: (element as any).width ?? 120,
        height: (element as any).height ?? 80,
        fill: '#E5E7EB',
        listening: true,
      });
    }

    this.attachCommonHandlers(node, element);
    this.nodeMap.set(element.id, node);
    this.layer.add(node);
    // Register with MemoryManager for cleanup and listener disposal
    try {
      this.memory.registerNode(element.id as any, node, { nodeType: element.type, temporary: false });
    } catch {}
    this.layer.batchDraw();
  }

  update(elementId: ElementId, updates: Partial<CanvasElement>): void {
    const node = this.nodeMap.get(elementId);
    if (!node) return;

    // Specialized handling for text elements that render as a Group(Text + Rect)
    const isGroup = (node as any).getClassName && (node as any).getClassName() === 'Group';
    if (isGroup) {
      const group = node as Konva.Group;
      const textNode = group.findOne('Text') as Konva.Text | null;
      const rect = (group.findOne('[name="background-rect"]') as Konva.Rect | null) || (group.findOne('Rect') as Konva.Rect | null);
      if (textNode && rect && ('text' in (updates as any) || 'fontSize' in (updates as any) || 'fontFamily' in (updates as any) || 'fill' in (updates as any))) {
        const newText = ((updates as any).text ?? textNode.text()) as string;
        const fontSize = ((updates as any).fontSize ?? textNode.fontSize()) as number;
        const fontFamily = ((updates as any).fontFamily ?? textNode.fontFamily()) as string;
        const fill = ((updates as any).fill ?? (textNode.fill?.() as string) ?? '#111827') as string;
        textNode.text(newText);
        textNode.fontSize(fontSize);
        textNode.fontFamily(fontFamily);
        textNode.fill(fill);
        textNode.wrap('none');

        // Ensure font is loaded before measuring for accurate width
        try {
          const primaryFamily = (fontFamily.split(',')[0] || 'Inter').trim().replace(/^"|"$/g, '');
          const fontSpec = `${fontSize}px ${primaryFamily}`;
          (document as any).fonts && document.fonts.load(fontSpec);
        } catch {}

        // Measure width using canvas 2D context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = `${fontSize}px ${fontFamily}`;
          const metrics = ctx.measureText(newText || '');
          const textWidth = Math.ceil(metrics.width);
          const textHeight = Math.ceil(fontSize * 1.2);
          const padX = 4;
          const padY = 2;
          // Update text explicit width to avoid wrapping
          textNode.width(textWidth + 2);
          // Update rect and group sizes
          rect.x(-padX);
          rect.y(-padY);
          rect.width(textWidth + padX * 2);
          rect.height(textHeight + padY * 2);
          // Update hit-area to match rect dimensions
          const hitArea = group.findOne('[name="hit-area"]') as Konva.Rect | null;
          if (hitArea) {
            hitArea.x(-padX);
            hitArea.y(-padY);
            hitArea.width(textWidth + padX * 2);
            hitArea.height(textHeight + padY * 2);
          }
          group.width(textWidth + padX * 2);
          group.height(textHeight + padY * 2);
        }

        this.layer.batchDraw();
        return;
      }

      // If width/height are provided directly, reflect them onto rect/hit-area/group too
      if (rect && (('width' in (updates as any)) || ('height' in (updates as any)))) {
        const padX = 4;
        const padY = 2;
        const newGroupWidth = Math.max(1, ((updates as any).width as number) || group.width());
        const newGroupHeight = Math.max(1, ((updates as any).height as number) || group.height());

        // Update rect and hit area to match new group dimensions
        rect.x(-padX);
        rect.y(-padY);
        rect.width(newGroupWidth);
        rect.height(newGroupHeight);
        const hitArea = group.findOne('[name="hit-area"]') as Konva.Rect | null;
        if (hitArea) {
          hitArea.x(-padX);
          hitArea.y(-padY);
          hitArea.width(newGroupWidth);
          hitArea.height(newGroupHeight);
        }
        group.width(newGroupWidth);
        group.height(newGroupHeight);
        // Keep text width consistent if available
        if (textNode) {
          try { textNode.width(Math.max(1, newGroupWidth - padX * 2)); } catch {}
        }
        this.layer.batchDraw();
        return;
      }
    }

    // Default: apply attributes directly
    node.setAttrs(updates as any);
    this.layer.batchDraw();
  }

  delete(elementId: ElementId): void {
    const node = this.nodeMap.get(elementId);
    if (!node) return;
    try { this.memory.destroyNode(elementId as any); } catch { node.destroy(); }
    this.nodeMap.delete(elementId);
    this.layer.batchDraw();
  }

  get(elementId: ElementId): Konva.Node | undefined {
    return this.nodeMap.get(elementId);
  }
}
