import Konva from 'konva';
import { CanvasElement, ElementId, isRectangleElement } from '../types/enhanced.types';

export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

export class CanvasRendererV2 {
  private updateElementCallback?: (id: string, updates: any) => void;
  private stage: Konva.Stage | null = null;
  private layers: RendererLayers | null = null;
  private nodeMap = new Map<string, Konva.Node>();
  private transformer: Konva.Transformer | null = null;

  // Utility: build a group with a hit-area rect sized to width/height
  private createGroupWithHitArea(id: string, width: number, height: number): Konva.Group {
    const group = new Konva.Group({ id, listening: true, draggable: false });
    const hitArea = new Konva.Rect({
      x: 0, y: 0, width, height,
      fill: 'rgba(0,0,0,0.001)', // participate in hit graph
      listening: true,
      hitStrokeWidth: 0,
      name: 'hit-area'
    });
    group.add(hitArea);
    return group;
  }

  private ensureHitAreaSize(group: Konva.Group, width: number, height: number) {
    const hit = group.findOne<Konva.Rect>('Rect.hit-area');
    if (hit) {
      hit.width(width);
      hit.height(height);
    } else {
      const newHit = new Konva.Rect({ x:0, y:0, width, height, fill: 'rgba(0,0,0,0.001)', listening: true, hitStrokeWidth: 0, name: 'hit-area' });
      group.add(newHit);
    }
  }

  // Rectangle
  private createRectangle(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 1);
    let h = Math.max(1, el.height || 1);
    const group = this.createGroupWithHitArea(id, w, h);
    group.name('rectangle');
    group.position({ x: el.x || 0, y: el.y || 0 });

    const rect = new Konva.Rect({
      x: 0, y: 0, width: w, height: h,
      fill: el.fill || '#ffffff',
      stroke: el.stroke || '#111827',
      strokeWidth: el.strokeWidth ?? 1,
      cornerRadius: (el as any).cornerRadius ?? 0,
      listening: false,
      perfectDrawEnabled: false,
      name: 'bg'
    });
    group.add(rect);

    if (el.text) {
      const pad = (el as any).padding ?? 12;
      // Create a content group that clips inner text area to avoid overflow affecting bounds
      let content = group.findOne<Konva.Group>('Group.content');
      if (!content) {
        content = new Konva.Group({ name: 'content', listening: false });
        group.add(content);
      }
      try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}

      let text = content.findOne<Konva.Text>('Text.label');
      if (!text) {
        text = new Konva.Text({ name: 'label', listening: false });
        content.add(text);
      }
      text.x(pad);
      text.y(pad);
      text.width(Math.max(1, w - pad * 2));
      text.text(el.text);
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      (text as any).wrap('word');
      (text as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

      // Adjust rect height to fit text if needed
      const desiredHeight = Math.max(h, Math.ceil(text.height()) + pad * 2);
      // Clamp to maxHeight if provided
      const maxH = (el as any).maxHeight ? Math.max(1, (el as any).maxHeight) : undefined;
      const clamped = maxH ? Math.min(desiredHeight, maxH) : desiredHeight;
      if (clamped !== h) {
        h = clamped;
        rect.height(h);
        // Clip group and content to its rect bounds so overflow doesn’t paint past background
        try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
        try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
        this.ensureHitAreaSize(group, w, h);
        // Inform store so element descriptor stays in sync
        this.updateElementCallback?.(id, { height: h });
      }
    }
    return group;
  }

  private updateRectangle(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });
    this.ensureHitAreaSize(group, w, h);

    // Update background rect
    const rect = group.findOne<Konva.Rect>('Rect.bg');
    if (rect) {
      const prevW = rect.width();
      const prevH = rect.height();
      rect.width(w);
      rect.height(h);
      rect.fill(el.fill || '#ffffff');
      rect.stroke(el.stroke || '#111827');
      rect.strokeWidth(el.strokeWidth ?? 1);
      if ((el as any).cornerRadius != null) rect.cornerRadius((el as any).cornerRadius);
      // If geometry changed, clear cache and force redraw
      if (prevW !== w || prevH !== h) {
        try { rect.clearCache(); } catch {}
        const layer = group.getLayer();
        try { layer?.batchDraw(); } catch {}
        try { this.transformer?.forceUpdate?.(); } catch {}
      }
    }

    // Update label to respect padding / align / lineHeight
    const pad = (el as any).padding ?? 12;
    let label = group.findOne<Konva.Text>('Text.label');
    if (el.text) {
      if (!label) {
        label = new Konva.Text({ name: 'label', listening: false });
        group.add(label);
      }
      label.x(pad);
      label.y(pad);
      label.width(Math.max(1, w - pad * 2));
      label.text(el.text);
      label.fontSize(el.fontSize || 14);
      label.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      label.fill(el.textColor || '#111827');
      (label as any).wrap('word');
      (label as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (label as any).lineHeight((el as any).lineHeight);
    } else if (label) {
      label.destroy();
    }

    // Always clip group to current bounds to avoid overflow bleed
    try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
  }

  // Text
  private createText(el: any): Konva.Group {
    const id = String(el.id);
    const textNode = new Konva.Text({
      x: 0, y: 0,
      text: el.text || '',
      fontSize: el.fontSize || 16,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fill: el.fill || '#111827',
      listening: false,
      name: 'text',
      wrap: 'word',
      align: 'left'
    } as any);
    // Measure with wrapping: if width provided, use it to compute height
    if (el.width) textNode.width(el.width);
    const measuredWidth = el.width || Math.ceil(textNode.width());
    const measuredHeight = el.height || Math.ceil(textNode.height());

    const group = this.createGroupWithHitArea(id, Math.max(1, measuredWidth), Math.max(1, measuredHeight));
    group.name('text');
    group.position({ x: el.x || 0, y: el.y || 0 });
    group.add(textNode);

    // Ensure text respects provided width/height
    if (el.width) textNode.width(el.width);
    if (el.height) textNode.height(el.height);

    return group;
  }

  private updateText(group: Konva.Group, el: any) {
    // Check if this element is being resized and use shadow dimensions
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const state = store?.getState();
    const isResizing = state?.resizingId === el.id;
    const shadow = state?.resizeShadow?.id === el.id ? state.resizeShadow : null;
    
    if (isResizing) {
      console.log('[RENDERER] Element is resizing, using shadow dimensions', el.id, shadow);
    }
    
    // Use shadow dimensions if resizing, otherwise use element dimensions
    const width = isResizing && shadow ? shadow.width : el.width;
    const height = isResizing && shadow ? shadow.height : el.height;
    const fontSize = isResizing && shadow?.fontSize ? shadow.fontSize : (el.fontSize || 16);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    
    // IMPORTANT: Always neutralize scale on group and frame
    group.scaleX(1);
    group.scaleY(1);
    
    const text = group.findOne<Konva.Text>('Text.text');
    const hitArea = group.findOne<Konva.Rect>('.hit-area');
    
    if (text) {
      text.text(el.text || '');
      text.fontSize(fontSize);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.fill || '#111827');
      (text as any).wrap('word');
      (text as any).align(el.align || 'left');
      if (el.lineHeight) (text as any).lineHeight(el.lineHeight);
      
      // Don't constrain text width during resize - let it render naturally
      if (!isResizing && width) {
        text.width(width);
      } else {
        text.width(undefined);
      }
      
      if (height) text.height(height);
      
      // Use shadowed or element dimensions for hit area
      const w = width || Math.ceil(text.width());
      const h = height || Math.ceil(text.height());
      
      this.ensureHitAreaSize(group, Math.max(1, w), Math.max(1, h));
      
      // Ensure hit area has no scale
      if (hitArea) {
        hitArea.scaleX(1);
        hitArea.scaleY(1);
      }
      
      // Don't update store during resize (protection flags prevent snap-back)
      if (!isResizing) {
        // If measured/clamped height differs, update store to keep transformer in sync
        if (!el.height || h !== el.height) {
          this.updateElementCallback?.(String(el.id), { height: h });
        }
      }
      
      // Ensure transformer grips update in the same frame after geometry change
      try { this.transformer?.forceUpdate?.(); } catch {}
    }
  }

  private createStickyNote(el: any): Konva.Group {
    const id = String(el.id);
    const PADDING = 12;
    const MIN_W = 120;
    const MIN_H = 80;
    const LINE_HEIGHT = 1.25;

    const group = new Konva.Group({ id, listening: true, draggable: true, name: 'sticky-note' });
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Calculate proper dimensions based on content
    const textWidth = Math.max(MIN_W, el.width || 220);
    const textHeight = Math.max(MIN_H, el.height || 140);
    
    // Ensure background is exactly the size needed for content + padding
    const bg = new Konva.Rect({
      x: 0, y: 0, width: textWidth, height: textHeight,
      cornerRadius: 10, fill: el.backgroundColor || '#A8DAFF', shadowForStrokeEnabled: false, name: 'bg'
    });

    const ktext = new Konva.Text({
      x: PADDING, y: PADDING,
      width: textWidth - 2 * PADDING,
      text: el.text || '',
      fontFamily: 'Inter, system-ui, Arial',
      fontSize: 16, lineHeight: LINE_HEIGHT,
      wrap: 'word', align: 'left', listening: false, name: 'text'
    });

    // Invisible transform frame (canonical size) - same as background
    const frame = new Konva.Rect({
      x: 0, y: 0, width: textWidth, height: textHeight,
      strokeEnabled: false, fillEnabled: false, name: 'frame'
    });

    frame.on('transform', () => {
        const newW = Math.max(MIN_W, frame.width() * frame.scaleX());
        const newH = Math.max(MIN_H, frame.height() * frame.scaleY());
        
        frame.width(newW);
        frame.height(newH);
        frame.scale({ x: 1, y: 1 });
        
        bg.width(newW);
        bg.height(newH);
        ktext.width(newW - 2 * PADDING);
        ktext.position({ x: PADDING, y: PADDING });
        
        const layer = frame.getLayer();
        if (layer) {
            layer.batchDraw();
        }
    });

    frame.on('transformend', () => {
        this.updateElementCallback?.(id, {
            width: frame.width(),
            height: frame.height(),
            x: group.x(),
            y: group.y()
        });
    });

    group.add(bg, ktext, frame);
    return group;
  }

  private updateStickyNote(group: Konva.Group, el: any) {
    const PADDING = 12;
    const MIN_W = 120;
    const MIN_H = 80;

    const { width, height, text, backgroundColor } = el;
    const bg = group.findOne<Konva.Rect>('.bg');
    const frame = group.findOne<Konva.Rect>('.frame');
    const ktext = group.findOne<Konva.Text>('.text');
    const layer = group.getLayer();

    if (!bg || !frame || !ktext || !layer) return;

    group.position({ x: el.x || 0, y: el.y || 0 });

         // 1) Commit width
     bg.width(width);
     frame.width(width);
     ktext.width(width - 2 * PADDING);
     ktext.position({ x: PADDING, y: PADDING });

    // 2) Update text/content + color
    if (ktext.text() !== text) ktext.text(text);
    if (bg.fill() !== backgroundColor) bg.fill(backgroundColor);

    // 3) Compute needed height from rendered text
    const neededH = Math.max(MIN_H, Math.ceil(ktext.getClientRect({ skipStroke: true, skipShadow: true }).height + PADDING * 2));

    // 4) Commit height (and neutralize any scale)
    const finalH = Math.max(neededH, height);
    if (frame.scaleX() !== 1 || frame.scaleY() !== 1) {
      frame.width(frame.width() * frame.scaleX());
      frame.height(frame.height() * frame.scaleY());
      frame.scale({ x: 1, y: 1 });
    }
    bg.height(finalH);
    frame.height(finalH);

    // 5) Draw once
    layer.batchDraw();

    // 6) Update store only if height has changed
    if (finalH !== el.height) {
        this.updateElementCallback?.(el.id, { height: finalH });
    }
  }


  init(stage: Konva.Stage, layers: RendererLayers, opts?: { onUpdateElement?: (id: string, updates: any) => void }) {
    this.stage = stage;
    this.layers = layers;

    // Wire callbacks
    this.updateElementCallback = opts?.onUpdateElement;

    // Create a single Transformer in the overlay layer
    if (!this.transformer) {
      this.transformer = new Konva.Transformer({
        rotateEnabled: false,
        anchorStroke: '#3b82f6',
        anchorFill: '#ffffff',
        anchorSize: 8,
        borderStroke: '#3b82f6',
        ignoreStroke: true,
        keepRatio: false,
        visible: false,
      });
      this.transformer.listening(true);
             this.layers.overlay.add(this.transformer);
       this.layers.overlay.batchDraw();
       
       // Make transformer globally accessible for other components
       (window as any).__CANVAS_TRANSFORMER__ = this.transformer;
       
       try { (window as any).CANVAS_PERF?.incBatchDraw?.('overlay-layer'); } catch {}

      // Resize commit on transform end
      this.transformer.on('transformend', () => {
        const nodes = this.transformer?.nodes() || [];
        nodes.forEach((node) => {
          const id = (node as any).id?.();
          if (!id) return;
          if (node instanceof Konva.Group) {
            const rect = node.findOne<Konva.Rect>('Rect.bg');
            const sx = node.scaleX() || 1;
            const sy = node.scaleY() || 1;
            const w = Math.max(1, (rect ? rect.width() : (node as any).width?.() || 0) * sx);
            const h = Math.max(1, (rect ? rect.height() : (node as any).height?.() || 0) * sy);
            // Reset scale and apply new size to rect for visual consistency
            node.scale({ x: 1, y: 1 });
            if (rect) { rect.width(w); rect.height(h); }
            // Commit to store
            this.updateElementCallback?.(id, { x: node.x(), y: node.y(), width: w, height: h });
          } else if (node instanceof Konva.Line) {
            // Commit drag position only for lines
            this.updateElementCallback?.(id, { x: (node as any).x?.(), y: (node as any).y?.() });
          }
        });
        this.layers?.main.batchDraw();
        this.layers?.overlay.batchDraw();
      });
    }

    // Drag end commit for any node
    this.stage?.on('dragend.renderer', (e: any) => {
      const target = e.target as Konva.Node;
      const id = (target as any)?.id?.();
      if (!id) return;
      this.updateElementCallback?.(id, { x: target.x(), y: target.y() });
    });
  }

  destroy() {
    try {
      this.transformer?.destroy();
    } catch {}
    this.transformer = null;
    Array.from(this.nodeMap.values()).forEach((node) => {
      try { node.destroy(); } catch {}
    });
    this.nodeMap.clear();
    this.stage = null;
    this.layers = null;
  }

  /** Create or update nodes for elements, remove stale nodes, and batch draw */
  syncElements(input: Map<ElementId, CanvasElement> | CanvasElement[] | any) {
    if (!this.layers) return;
    const main = this.layers.main;

    const alive = new Set<string>();

    // Normalize to a simple list of CanvasElement
    let list: CanvasElement[] = [] as any;
    try {
      if (input instanceof Map) {
        input.forEach((el: CanvasElement) => list.push(el));
      } else if (Array.isArray(input)) {
        list = input as CanvasElement[];
      } else if (Array.isArray(input?.elements)) {
        list = input.elements as CanvasElement[];
      } else if (Array.isArray(input?.state?.elements)) {
        const entries = input.state.elements;
        if (Array.isArray(entries) && entries.length && Array.isArray(entries[0]) && entries[0].length === 2) {
          list = entries.map((e: any) => e[1]);
        }
      }
    } catch (e) {
      console.warn('[CanvasRendererV2] Failed to normalize elements for rendering', e);
      list = [] as any;
    }

    list.forEach((el) => {
      const id = String(el.id);
      alive.add(id);

      if ((el as any).points && Array.isArray((el as any).points) && (el.type === 'pen' || el.type === 'marker' || el.type === 'highlighter')) {
        // Stroke-like types
        const existing = this.nodeMap.get(id) as Konva.Line | undefined;
        if (existing && existing.getClassName() === 'Line') {
          this.updateLine(existing as Konva.Line, el);
        } else {
          const line = new Konva.Line();
          line.id(id);
          line.name(el.type);
          line.listening(true);
          line.perfectDrawEnabled(false);
          this.updateLine(line, el);
          main.add(line);
          this.nodeMap.set(id, line);
        }
        return;
      }

      if (el.type === 'rectangle') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group') {
          this.updateRectangle(node as Konva.Group, el as any);
        } else {
          const group = this.createRectangle(el as any);
          main.add(group);
          this.nodeMap.set(id, group);
        }
        return;
      }

      if (el.type === 'text' || el.type === 'rich-text') {
        if ((el as any).isEditing) {
          // While editing, do not render the text on canvas to avoid duplicates
          // Create an empty group with hit-area only
          const node = this.nodeMap.get(id) as Konva.Group | undefined;
          if (node && node.getClassName() === 'Group') {
            // Keep hit-area but hide text node if present
            const t = (node as Konva.Group).findOne<Konva.Text>('Text.text');
            if (t) t.visible(false);
            this.ensureHitAreaSize(node as Konva.Group, Math.max(1, el.width || 1), Math.max(1, el.height || 1));
          } else {
            const group = this.createGroupWithHitArea(id, Math.max(1, el.width || 1), Math.max(1, el.height || 1));
            group.name('text');
            group.position({ x: el.x || 0, y: el.y || 0 });
            this.nodeMap.set(id, group);
            main.add(group);
          }
          return;
        }
        // Normalize: allow both 'text' type and 'rich-text' to render as Text for now

        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group') {
          this.updateText(node as Konva.Group, el as any);
        } else {
          const group = this.createText(el as any);
          main.add(group);
          this.nodeMap.set(id, group);
        }
        return;
      }

      if (el.type === 'sticky-note' || (el as any).type === 'sticky-note-legacy') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.name() === 'sticky-note') {
          this.updateStickyNote(node, el);
          const ktext = node.findOne<Konva.Text>('.text');
          if (ktext) {
            ktext.visible(!(el as any).isEditing);
          }
        } else {
          const group = this.createStickyNote(el);
          main.add(group);
          this.nodeMap.set(id, group);
        }
        return;
      }



      // TODO: circles, sections, tables
    });

    // Remove stale nodes
    Array.from(this.nodeMap.entries()).forEach(([id, node]) => {
      if (!alive.has(id)) {
        try { node.destroy(); } catch {}
        this.nodeMap.delete(id);
      }
    });

    main.batchDraw();
    try { (window as any).CANVAS_PERF?.incBatchDraw?.('main-layer'); } catch {}
  }

  private updateLine(line: Konva.Line, el: CanvasElement) {
    // Lines are standalone shapes, ensure they have no parent group wrapping
    // and are fully interactive for selection/transformer.
    line.listening(true);
    line.draggable(false);

    const anyEl: any = el as any;
    if (el.type === 'pen') {
      line.setAttrs({
        points: anyEl.points,
        stroke: anyEl.stroke || '#000',
        strokeWidth: anyEl.strokeWidth || 2,
        lineCap: 'round',
        lineJoin: 'round',
        opacity: 1,
      });
    } else if (el.type === 'marker') {
      const style = anyEl.style || {};
      line.setAttrs({
        points: anyEl.points,
        stroke: style.color || '#000',
        strokeWidth: style.width || 4,
        opacity: style.opacity ?? 0.9,
      });
      if (typeof style.smoothness === 'number') line.tension(style.smoothness);
      line.lineCap(style.lineCap || 'round');
      line.lineJoin(style.lineJoin || 'round');
    } else if (el.type === 'highlighter') {
      const style = anyEl.style || {};
      line.setAttrs({
        points: anyEl.points,
        stroke: style.color || '#f7e36d',
        strokeWidth: style.width || 12,
        opacity: style.opacity ?? 0.5,
        globalCompositeOperation: style.blendMode || 'multiply',
      } as any);
      line.lineCap('round');
      line.lineJoin('round');
    }
  }

  /** Attach Transformer to current selection */
  syncSelection(selectedIds: Set<ElementId>) {
    if (!this.layers || !this.transformer) return;
    const nodes: Konva.Node[] = [];
    selectedIds.forEach((sid) => {
      const node = this.nodeMap.get(String(sid));
      if (node) {
        if (node.name() === 'sticky-note') {
            const frame = (node as Konva.Group).findOne('.frame');
            if (frame) {
                nodes.push(frame);
            }
        } else {
            nodes.push(node);
        }
      }
    });
    if (nodes.length) {
      // Ensure nodes are draggable for selection/transform unless drawing tools manage drag
      nodes.forEach((n) => {
        if (n instanceof Konva.Group) {
          (n as Konva.Group).draggable(true);
        } else if (n instanceof Konva.Line) {
          (n as Konva.Line).draggable(true);
        }
      });
      
      this.transformer.nodes(nodes);
      this.transformer.visible(true);
    } else {
      this.transformer.nodes([]);
      this.transformer.visible(false);
    }
    this.layers.overlay.batchDraw();
    try { (window as any).CANVAS_PERF?.incBatchDraw?.('overlay-layer'); } catch {}
  }
}

export default CanvasRendererV2;
