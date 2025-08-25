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
import { StickyPreview } from './StickyPreview';

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
        // Use tiny alpha fill so Konva hit canvas consistently registers clicks
        fill: 'rgba(0,0,0,0.001)',
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
        // Add rect/text first and place hit-area on top for maximum click reliability
        group.add(rect);
        group.add(textNode);
        group.add(hitArea);
        
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
        
        // Dimensions synced with overlay and ensure hit-area stays on top
        try { hitArea.moveToTop(); } catch {}
        
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
        group.on('click', (evt: any) => {
          // Suppress immediate re-select after programmatic deselect on dragend
          try {
            const st = group.getStage();
            const until = (st as any)?._suppressSelectUntil as number | undefined;
            if (until && performance.now() < until) {
              return;
            }
          } catch {}
          const store = useUnifiedCanvasStore.getState();
          const mult = evt?.evt && (evt.evt.ctrlKey || evt.evt.metaKey);
          store.selectElement(element.id as any, !!mult);
        });

        // Visual cursor feedback
        group.on('mouseenter', () => {
          try {
            const st = group.getStage();
            if (st) { st.container().style.cursor = 'move'; }
          } catch {}
        });
        group.on('mouseleave', () => {
          try {
            const st = group.getStage();
            if (st) { st.container().style.cursor = 'default'; }
          } catch {}
        });
        
        // Double-click to edit
        group.on('dblclick', (evt: any) => {
          const stage = group.getStage();
          if (!stage) return;
          const tn = group.findOne('Text') as Konva.Text | null;
          if (!tn) return;
          // Prevent double-click from leaving transformer in inconsistent state
          try { stage.fire('contentClick', {}, true); } catch {}
          openTextEditorOverlay(stage, tn, element.id as any, {
            initialText: (tn.text?.() as string) || '',
            fontSize: (tn.fontSize?.() as number) || (element as any).fontSize,
            fontFamily: (tn.fontFamily?.() as string) || (element as any).fontFamily,
            align: 'left',
          });
        });
      };
      
      // Store the enableSelection function for later use
      (group as any)._enableSelection = enableSelection;
    } else if (isStickyNoteElement(element)) {
      const group = new Konva.Group({
        id: element.id as any,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        listening: true,
        draggable: true,
      });
      // Do not use clip on sticky notes to avoid getClientRect mismatches with transformer
      const rect = new Konva.Rect({
        id: element.id as any,
        x: 0,
        y: 0,
        width: element.width,
        height: element.height,
        fill: element.backgroundColor ?? '#FEF3C7',
        cornerRadius: 8,
        strokeEnabled: false,
        hitStrokeWidth: 0,
        listening: true,
      });
      const pad = 10;
      const tn = new Konva.Text({
        x: pad,
        y: pad,
        width: Math.max(1, element.width - pad * 2),
        height: Math.max(1, element.height - 16),
        text: element.text || '',
        fontSize: element.fontSize ?? 16,
        fontFamily: element.fontFamily ?? 'Inter, system-ui, Arial',
        fill: element.textColor ?? '#111827',
        listening: false,
      });
      group.add(rect);
      group.add(tn);
      node = group;

      // Selection preview disabled: we only use pre-creation hover preview
      try {
        group.off('.sticky-preview');
      } catch {}

      // Ensure selection always occurs on click/tap regardless of target child
      group.on('click.select', () => {
        try { useUnifiedCanvasStore.getState().selectElement(element.id as any, false); } catch {}
      });
      group.on('tap.select', () => {
        try { useUnifiedCanvasStore.getState().selectElement(element.id as any, false); } catch {}
      });

      // Ensure padding is preserved after drags/transforms (prevent right-edge overflow)
      const reflowText = () => {
        try {
          // Use fixed padding of 10 (same as creation) for consistency
          const padInner = 10;
          const innerW = Math.max(1, group.width() - padInner * 2);
          tn.width(innerW);
          tn.wrap('word');
          tn.clearCache();
          rect.clearCache();
          group.clearCache();
          group.getLayer()?.batchDraw();
        } catch {}
      };
      group.on('dragend.reflow', reflowText);
      group.on('transformend.reflow', reflowText);
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
        strokeEnabled: false,
        hitStrokeWidth: 0,
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

  update(elementId: ElementId, elementOrUpdates: CanvasElement | Partial<CanvasElement>): void {
    const node = this.nodeMap.get(elementId);
    if (!node) return;

    // Handle both full element updates and partial updates
    const updates = elementOrUpdates as any;
    
    console.log('🔄 [ElementRegistry] Update called for:', elementId, 'with data:', updates);

    // Specialized handling for text elements that render as a Group(Text + Rect)
    const isGroup = (node as any).getClassName && (node as any).getClassName() === 'Group';
    if (isGroup) {
      const group = node as Konva.Group;
      const textNode = group.findOne('Text') as Konva.Text | null;
      const rect = (group.findOne('[name="background-rect"]') as Konva.Rect | null) || (group.findOne('Rect') as Konva.Rect | null);
      
      // Handle backgroundColor updates for sticky notes
      if ('backgroundColor' in updates && rect) {
        let isStickyGroup = false;
        try {
          const storeNow = useUnifiedCanvasStore.getState();
          const el = storeNow.elements.get(elementId as any);
          isStickyGroup = !!(el && (el as any).type === 'sticky-note');
        } catch {}
        
        if (isStickyGroup) {
          const newBackgroundColor = updates.backgroundColor as string;
          rect.fill(newBackgroundColor);
          console.log('🎨 [ElementRegistry] Updated sticky note background color to:', newBackgroundColor);
          this.layer.batchDraw();
          // Don't return here - let other updates proceed too
        }
      }
      
      if (textNode && ('text' in (updates as any) || 'fontSize' in (updates as any) || 'fontFamily' in (updates as any) || 'fill' in (updates as any))) {
        // Distinguish between text boxes and sticky notes to apply correct wrapping behavior
        let isStickyGroup = false;
        try {
          const storeNow = useUnifiedCanvasStore.getState();
          const el = storeNow.elements.get(elementId as any);
          isStickyGroup = !!(el && (el as any).type === 'sticky-note');
        } catch {}

        if (isStickyGroup) {
          // For sticky notes: keep fixed group width, wrap text within inner bounds
          const newText = ((updates as any).text ?? textNode.text()) as string;
          const fontSize = ((updates as any).fontSize ?? textNode.fontSize()) as number;
          const fontFamily = ((updates as any).fontFamily ?? textNode.fontFamily()) as string;
          const fill = ((updates as any).fill ?? (textNode.fill?.() as string) ?? '#111827') as string;
          textNode.text(newText);
          textNode.fontSize(fontSize);
          textNode.fontFamily(fontFamily);
          textNode.fill(fill);
          textNode.wrap('word');
          // inner width = group width minus fixed padding (consistent with creation)
          const padX = 10;
          const innerWidth = Math.max(1, group.width() - padX * 2);
          textNode.width(innerWidth);
          

          
          // Do NOT expand group width for sticky notes
          this.layer.batchDraw();
          return;
        }

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

        // Ensure node remains interactive after updates
        try {
          group.listening(true);
          group.draggable(true);
          if (textNode) (textNode as any).listening?.(true);
          if (rect) (rect as any).listening?.(true);
          const hit = group.findOne('[name="hit-area"]') as Konva.Rect | null;
          if (hit) (hit as any).listening?.(true);
        } catch {}
        this.layer.batchDraw();
        return;
      }

      // If width/height are provided directly, reflect them onto rect/hit-area/group too
      if (rect && (('width' in (updates as any)) || ('height' in (updates as any)))) {
        // For sticky notes, there is no negative padding; rect anchors the group.
        let isStickyGroup = false;
        try {
          const storeNow = useUnifiedCanvasStore.getState();
          const el = storeNow.elements.get(elementId as any);
          isStickyGroup = !!(el && (el as any).type === 'sticky-note');
        } catch {}
        const padX = isStickyGroup ? 0 : 4;
        const padY = isStickyGroup ? 0 : 2;
        const newGroupWidth = Math.max(1, ((updates as any).width as number) || group.width());
        const newGroupHeight = Math.max(1, ((updates as any).height as number) || group.height());

        // Update rect and hit area to match new group dimensions
        rect.x(isStickyGroup ? 0 : -padX);
        rect.y(isStickyGroup ? 0 : -padY);
        rect.width(newGroupWidth);
        rect.height(newGroupHeight);
        const hitArea = group.findOne('[name="hit-area"]') as Konva.Rect | null;
        if (hitArea) {
          hitArea.x(isStickyGroup ? 0 : -padX);
          hitArea.y(isStickyGroup ? 0 : -padY);
          hitArea.width(newGroupWidth);
          hitArea.height(newGroupHeight);
        }
        group.width(newGroupWidth);
        group.height(newGroupHeight);
        // No clip mask to ensure transformer bounds match visual rect
        // Keep text width consistent if available (respect creation padding if sticky)
        if (textNode) {
          const padInner = isStickyGroup ? Math.max(0, (textNode.x?.() as number) || 0) : padX;
          try { textNode.width(Math.max(1, newGroupWidth - padInner * 2)); } catch {}
        }
        // Keep group interactive after dimension updates
        try {
          group.listening(true);
          group.draggable(true);
          if (textNode) (textNode as any).listening?.(true);
          const hit = group.findOne('[name="hit-area"]') as Konva.Rect | null;
          if (hit) (hit as any).listening?.(true);
        } catch {}
        this.layer.batchDraw();
        return;
      }
    }

    // Default: apply attributes directly
    node.setAttrs(updates as any);
    // If this is a group, reaffirm interactivity (guards against accidental disable)
    try {
      if ((node as any).getClassName && (node as any).getClassName() === 'Group') {
        const grp = node as Konva.Group;
        grp.listening(true);
        grp.draggable(true);
        const tn = grp.findOne('Text') as Konva.Text | null;
        const rc = (grp.findOne('[name="background-rect"]') as Konva.Rect | null) || (grp.findOne('Rect') as Konva.Rect | null);
        if (tn) (tn as any).listening?.(true);
        if (rc) (rc as any).listening?.(true);
        const hit = grp.findOne('[name="hit-area"]') as Konva.Rect | null;
        if (hit) (hit as any).listening?.(true);
      }
    } catch {}
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
