import Konva from 'konva';
import { CanvasElement, ElementId, isRectangleElement } from '../types/enhanced.types';

export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

export class CanvasRendererV2 {
  private spatial = ((): any => {
    try {
      const { createSpatialIndex } = require('../utils/spatial-index');
      return createSpatialIndex();
    } catch {
      return { insert() {}, update() {}, remove() {}, clear() {}, query: () => ([] as string[]), nearest: () => ([] as string[]) };
    }
  })();
  private updateElementCallback?: (id: string, updates: any) => void;
  private stage: Konva.Stage | null = null;
  private layers: RendererLayers | null = null;
  private nodeMap = new Map<string, Konva.Node>();
  private transformer: Konva.Transformer | null = null;
  private contextMenuEl: HTMLDivElement | null = null;
  // Table interaction overlay state (add/delete row/column controls)
  private tableOverlay: {
    tableId: string;
    group: Konva.Group;
    handles: {
      addCol?: Konva.Group;
      addRow?: Konva.Group;
      delCol?: Konva.Group;
      delRow?: Konva.Group;
      hitTargets: Konva.Shape[];
    };
  } | null = null;
  // Track anchor + pre-rects for precise commit positioning
  private lastActiveAnchorName: string = '';
  private preTransformRects: Map<string, { left: number; right: number; top: number; bottom: number }> = new Map();
  
  // RAF batching system for efficient drawing
  private raf = 0;
  private dirtyMain = false;
  private dirtyOverlay = false;
  private dirtyPreview = false;
  
  // Drag state tracking
  private dragLayer: Konva.Layer | null = null;

  // Canonical coordinate transformations (blueprint requirement)
  // Convert screen coords to parent layer's local space (not stage space!)
  private screenToParentLocal(parent: Konva.Node, screenPos: { x: number; y: number }): { x: number; y: number } {
    if (!this.stage) return screenPos;
    // Get pointer position in stage coordinates
    const stagePos = this.stage.getPointerPosition();
    if (!stagePos) return screenPos;
    // Transform to parent's local space
    const t = parent.getAbsoluteTransform().copy().invert();
    return t.point(stagePos);
  }

  private parentLocalToScreen(parent: Konva.Node, localPos: { x: number; y: number }): { x: number; y: number } {
    const t = parent.getAbsoluteTransform().copy();
    return t.point(localPos);
  }

  // RAF batching system to avoid double batchDraw (blueprint requirement)
  private scheduleDraw(layer: 'main' | 'overlay' | 'preview') {
    if (layer === 'main') this.dirtyMain = true;
    else if (layer === 'overlay') this.dirtyOverlay = true;
    else if (layer === 'preview') this.dirtyPreview = true;
    
    if (this.raf) return; // Already scheduled
    
    this.raf = requestAnimationFrame(() => {
      if (this.dirtyMain && this.layers?.main) {
        this.layers.main.batchDraw();
        try { (window as any).CANVAS_PERF?.incBatchDraw?.('main-layer'); } catch {}
      }
      if (this.dirtyPreview && this.layers?.preview) {
        this.layers.preview.batchDraw();
        try { (window as any).CANVAS_PERF?.incBatchDraw?.('preview-layer'); } catch {}
      }
      if (this.dirtyOverlay && this.layers?.overlay) {
        this.layers.overlay.batchDraw();
        try { (window as any).CANVAS_PERF?.incBatchDraw?.('overlay-layer'); } catch {}
      }
      
      this.dirtyMain = this.dirtyOverlay = this.dirtyPreview = false;
      this.raf = 0;
    });
  }

  // Utility: build a group with a hit-area rect sized to width/height
  private createGroupWithHitArea(id: string, width: number, height: number, draggable: boolean = true): Konva.Group {
    const group = new Konva.Group({ id, listening: true, draggable });
    const hitArea = new Konva.Rect({
      x: 0, y: 0, width, height,
      // Important: tiny alpha so it participates in hit graph (opacity must remain > 0)
      fill: 'rgba(0,0,0,0.001)',
      stroke: undefined,
      strokeWidth: 0,
      listening: true,
      hitStrokeWidth: 0,
      name: 'hit-area',
      opacity: 1
    });
    group.add(hitArea);
    return group;
  }

  private ensureHitAreaSize(group: Konva.Group, width: number, height: number) {
    
    // First, clean up any duplicate hit-areas (there should only be one)
    const allHitAreas = group.find('.hit-area');
    if (allHitAreas.length > 1) {
      for (let i = 1; i < allHitAreas.length; i++) {
        allHitAreas[i].destroy();
      }
    }
    
    // Find hit-area by name attribute (not class selector)
    const hit = group.findOne((node) => node.name() === 'hit-area') as Konva.Rect | undefined;
    
    if (hit) {
      // Ensure hit area is positioned at origin and sized correctly
      hit.position({ x: 0, y: 0 });
      hit.width(width);
      hit.height(height);
      // keep tiny alpha so Konva hit graph detects it
      hit.fill('rgba(0,0,0,0.001)');
      hit.stroke(undefined); // ensure no stroke
      hit.strokeWidth(0);
      hit.opacity(1);
      // Move hit area to back so it doesn't cover visual elements
      hit.moveToBottom();
    } else {
      const newHit = new Konva.Rect({ 
        x: 0, 
        y: 0, 
        width, 
        height, 
        fill: 'rgba(0,0,0,0.001)', // tiny alpha for hit detection
        stroke: undefined, // explicitly no stroke
        strokeWidth: 0,
        listening: true, 
        hitStrokeWidth: 0, 
        name: 'hit-area',
        opacity: 1
      });
      group.add(newHit);
      newHit.moveToBottom();
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
      stroke: el.stroke || 'transparent',
      strokeWidth: el.strokeWidth ?? 0,
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
        // Clip group and content to its rect bounds so overflow doesn't paint past background
        try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
        try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
        this.ensureHitAreaSize(group, w, h);

        // Report height change to the store so element can be updated
        if (this.updateElementCallback) {
          this.updateElementCallback(id, { height: h });
        }
      }
    }

    return group;
  }

  // Text
  private createText(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);

    const group = this.createGroupWithHitArea(id, w, h);
    group.name('text');
    // TEST 4: Snap to integer positions
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });

    const text = new Konva.Text({
      x: 0, y: 0,
      text: el.text || '',
      fontSize: el.fontSize || 14,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fill: el.textColor || '#111827',
      width: w,
      height: h,
      listening: false,
      name: 'text',
      stroke: undefined,
      strokeWidth: 0,
      perfectDrawEnabled: false,
      visible: !!(el.text && el.text.trim())
    });
    (text as any).wrap('word');
    (text as any).align((el as any).align || 'left');
    if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

    group.add(text);
    return group;
  }

  private updateRectangle(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 1);
    let h = Math.max(1, el.height || 1);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    this.ensureHitAreaSize(group, w, h);

    const rect = group.findOne<Konva.Rect>('Rect.bg');
    if (rect) {
      rect.width(w);
      rect.height(h);
      rect.fill(el.fill || '#ffffff');
      rect.stroke(el.stroke || 'transparent');
      rect.strokeWidth(el.strokeWidth ?? 0);
      rect.cornerRadius((el as any).cornerRadius ?? 0);
    }

    if (el.text) {
      const pad = (el as any).padding ?? 12;
      const content = group.findOne<Konva.Group>('Group.content');
      const text = content?.findOne<Konva.Text>('Text.label');
      
      if (content && text) {
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

        // Auto-height logic
        const desiredHeight = Math.max(h, Math.ceil(text.height()) + pad * 2);
        const maxH = (el as any).maxHeight ? Math.max(1, (el as any).maxHeight) : undefined;
        const clamped = maxH ? Math.min(desiredHeight, maxH) : desiredHeight;
        
        if (clamped !== h) {
          h = clamped;
          rect?.height(h);
          try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
          try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
          this.ensureHitAreaSize(group, w, h);

          if (this.updateElementCallback) {
            this.updateElementCallback(String(el.id), { height: h });
          }
        }

        try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
      }
    }
  }

  private updateText(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    this.ensureHitAreaSize(group, w, h);

    const text = group.findOne<Konva.Text>('Text.text');
    if (text) {
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      text.width(w);
      // React Image Editor behavior: set height from element and let measured rect drive true bounds
      text.height(h);
      (text as any).wrap('word');
      (text as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);
    }
  }

  // --- Table overlay helpers ---
  private ensureTableOverlay(): { overlayGroup: Konva.Group; handles: NonNullable<CanvasRendererV2['tableOverlay']>['handles'] } | null {
    if (!this.layers?.overlay) return null;
    // Reuse existing overlay group if present
    let overlayGroup = this.layers.overlay.findOne<Konva.Group>('.table-overlay');
    if (!overlayGroup) {
      overlayGroup = new Konva.Group({ name: 'table-overlay', listening: true });
      this.layers.overlay.add(overlayGroup);
    }
    // Handles container (we recreate lightweight shapes on demand)
    const handles = { hitTargets: [] as Konva.Shape[] } as any;
    return { overlayGroup, handles };
  }

  private clearTableOverlay() {
    if (!this.layers?.overlay) return;
    const overlayGroup = this.layers.overlay.findOne<Konva.Group>('.table-overlay');
    if (overlayGroup) {
      try { overlayGroup.destroyChildren(); } catch {}
      this.layers.overlay.batchDraw();
    }
    this.tableOverlay = null;
  }

  private drawPlusHandle(parent: Konva.Group, center: { x: number; y: number }, onClick: () => void): Konva.Group {
    const g = new Konva.Group({ x: center.x, y: center.y, listening: true });
    // Larger invisible hit target for easier clicking
    const hit = new Konva.Rect({ x: -12, y: -12, width: 24, height: 24, fill: 'rgba(0,0,0,0.001)', listening: true, name: 'hit' });
    const circle = new Konva.Circle({ x: 0, y: 0, radius: 8, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 1, listening: false });
    const v = new Konva.Line({ points: [0, -5, 0, 5], stroke: '#2563eb', strokeWidth: 2, listening: false });
    const h = new Konva.Line({ points: [-5, 0, 5, 0], stroke: '#2563eb', strokeWidth: 2, listening: false });
    g.add(hit, circle, v, h);
    g.on('mousedown', (e) => { e.cancelBubble = true; onClick(); });
    parent.add(g);
    return g;
  }

  private drawDeleteHandle(parent: Konva.Group, center: { x: number; y: number }, onClick: () => void): Konva.Group {
    const g = new Konva.Group({ x: center.x, y: center.y, listening: true });
    const hit = new Konva.Rect({ x: -12, y: -12, width: 24, height: 24, fill: 'rgba(0,0,0,0.001)', listening: true, name: 'hit' });
    const circle = new Konva.Circle({ x: 0, y: 0, radius: 8, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 1, listening: false });
    const d1 = new Konva.Line({ points: [-4, -4, 4, 4], stroke: '#b91c1c', strokeWidth: 2, listening: false });
    const d2 = new Konva.Line({ points: [-4, 4, 4, -4], stroke: '#b91c1c', strokeWidth: 2, listening: false });
    g.add(hit, circle, d1, d2);
    g.on('mousedown', (e) => { e.cancelBubble = true; onClick(); });
    parent.add(g);
    return g;
  }

  private updateTableOverlayForPointer(tableGroup: Konva.Group, tableEl: any) {
    if (!this.stage || !this.layers?.overlay) return;
    const pointer = this.stage.getPointerPosition();
    if (!pointer) { this.clearTableOverlay(); return; }

    const tInv = tableGroup.getAbsoluteTransform().copy().invert();
    const local = tInv.point(pointer);

    const rows = Math.max(1, tableEl.rows || (tableEl.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, tableEl.cols || (tableEl.enhancedTableData?.columns?.length || 1));
    const w = Math.max(1, tableEl.width || 1);
    const h = Math.max(1, tableEl.height || 1);
    const cellW = Math.max(1, Math.floor(w / cols));
    const cellH = Math.max(1, Math.floor(h / rows));

    // Only show overlay when hovering near or over the table bounds
    const margin = 16; // allow some slack outside bounds
    if (local.x < -margin || local.y < -margin || local.x > w + margin || local.y > h + margin) {
      this.clearTableOverlay();
      return;
    }

    // Prepare overlay group/handles
    const ensured = this.ensureTableOverlay();
    if (!ensured) return;
    const { overlayGroup } = ensured;
    try { overlayGroup.destroyChildren(); } catch {}

    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const addCol = (index: number) => store?.getState()?.addTableColumn?.(tableEl.id, index);
    const addRow = (index: number) => store?.getState()?.addTableRow?.(tableEl.id, index);
    const delCol = (index: number) => store?.getState()?.removeTableColumn?.(tableEl.id, index);
    const delRow = (index: number) => store?.getState()?.removeTableRow?.(tableEl.id, index);

    // Determine nearest vertical border for add column
    const threshold = 6;
    const rawColIndex = local.x / cellW;
    const nearestBorderCol = Math.round(rawColIndex);
    const borderX = Math.max(0, Math.min(cols, nearestBorderCol)) * cellW;
    const distToBorderX = Math.abs(local.x - borderX);

    // Determine nearest horizontal border for add row
    const rawRowIndex = local.y / cellH;
    const nearestBorderRow = Math.round(rawRowIndex);
    const borderY = Math.max(0, Math.min(rows, nearestBorderRow)) * cellH;
    const distToBorderY = Math.abs(local.y - borderY);

    // Compute positions in overlay layer's local space (avoid double stage transform)
    const toOverlay = (pt: { x: number; y: number }) => {
      const abs = tableGroup.getAbsoluteTransform().point(pt);
      const invOverlay = (this.layers!.overlay as Konva.Layer).getAbsoluteTransform().copy().invert();
      return invOverlay.point(abs);
    };

    // Add Column: show when close to vertical border (including edges)
    if (distToBorderX <= threshold || local.x < threshold || local.x > w - threshold) {
      const insertIndex = Math.max(0, Math.min(cols, nearestBorderCol));
      const pos = toOverlay({ x: borderX, y: -10 });
      this.drawPlusHandle(overlayGroup, pos, () => addCol(insertIndex));
    }

    // Add Row: show when close to horizontal border (including edges)
    if (distToBorderY <= threshold || local.y < threshold || local.y > h - threshold) {
      const insertIndex = Math.max(0, Math.min(rows, nearestBorderRow));
      const pos = toOverlay({ x: -10, y: borderY });
      this.drawPlusHandle(overlayGroup, pos, () => addRow(insertIndex));
    }

    // Delete Column: when hovering inside a column
    if (local.x >= 0 && local.x <= w && local.y >= -margin && local.y <= h + margin) {
      const colIndex = Math.max(0, Math.min(cols - 1, Math.floor(local.x / cellW)));
      const colCenterX = colIndex * cellW + cellW / 2;
      const pos = toOverlay({ x: colCenterX, y: -24 });
      this.drawDeleteHandle(overlayGroup, pos, () => delCol(colIndex));
    }

    // Delete Row: when hovering inside a row
    if (local.y >= 0 && local.y <= h && local.x >= -margin && local.x <= w + margin) {
      const rowIndex = Math.max(0, Math.min(rows - 1, Math.floor(local.y / cellH)));
      const rowCenterY = rowIndex * cellH + cellH / 2;
      const pos = toOverlay({ x: -24, y: rowCenterY });
      this.drawDeleteHandle(overlayGroup, pos, () => delRow(rowIndex));
    }

    this.layers.overlay.batchDraw();
  }

  private closeContextMenu() {
    if (this.contextMenuEl) {
      try { document.body.removeChild(this.contextMenuEl); } catch {}
      this.contextMenuEl = null;
    }
    // Remove global listeners
    const off = (window as any).__CANVAS_CTXMENU_OFF__ as (() => void) | undefined;
    if (off) {
      try { off(); } catch {}
      (window as any).__CANVAS_CTXMENU_OFF__ = undefined;
    }
  }

  private showTableContextMenu(tableGroup: Konva.Group, tableEl: any, evt: Konva.KonvaEventObject<PointerEvent | MouseEvent>) {
    evt.evt.preventDefault();
    this.closeContextMenu();
    if (!this.stage) return;

    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const rows = Math.max(1, tableEl.rows || (tableEl.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, tableEl.cols || (tableEl.enhancedTableData?.columns?.length || 1));
    const w = Math.max(1, tableEl.width || 1);
    const h = Math.max(1, tableEl.height || 1);
    const cellW = Math.max(1, Math.floor(w / cols));
    const cellH = Math.max(1, Math.floor(h / rows));

    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;
    const local = tableGroup.getAbsoluteTransform().copy().invert().point(pointer);
    const colIndex = Math.max(0, Math.min(cols - 1, Math.floor(local.x / cellW)));
    const rowIndex = Math.max(0, Math.min(rows - 1, Math.floor(local.y / cellH)));

    const rect = this.stage.container().getBoundingClientRect();
    const clientLeft = rect.left + pointer.x;
    const clientTop = rect.top + pointer.y;

    const menu = document.createElement('div');
    this.contextMenuEl = menu;
    Object.assign(menu.style, {
      position: 'fixed',
      left: `${clientLeft}px`,
      top: `${clientTop}px`,
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '6px',
      zIndex: '10000',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#111827',
      userSelect: 'none',
    } as CSSStyleDeclaration);

    const mk = (label: string, action: () => void) => {
      const item = document.createElement('div');
      item.textContent = label;
      Object.assign(item.style, {
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
      } as CSSStyleDeclaration);
      item.onmouseenter = () => { item.style.background = '#f3f4f6'; };
      item.onmouseleave = () => { item.style.background = 'transparent'; };
      item.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
      item.onclick = () => { action(); this.closeContextMenu(); };
      menu.appendChild(item);
      return item;
    };

    // Actions
    const addCol = (index: number) => store?.getState()?.addTableColumn?.(tableEl.id, index);
    const addRow = (index: number) => store?.getState()?.addTableRow?.(tableEl.id, index);
    const delCol = (index: number) => store?.getState()?.removeTableColumn?.(tableEl.id, index);
    const delRow = (index: number) => store?.getState()?.removeTableRow?.(tableEl.id, index);

    mk('Add column left', () => addCol(colIndex));
    mk('Add column right', () => addCol(colIndex + 1));
    mk('Add row above', () => addRow(rowIndex));
    mk('Add row below', () => addRow(rowIndex + 1));
    mk('Delete column', () => delCol(colIndex));
    mk('Delete row', () => delRow(rowIndex));

    document.body.appendChild(menu);

    const onOutside = (e: MouseEvent | PointerEvent | KeyboardEvent) => {
      // Close on any click outside or Escape
      if ((e as KeyboardEvent).key === 'Escape') { this.closeContextMenu(); return; }
      if (e instanceof KeyboardEvent) return;
      const t = e.target as Node | null;
      if (!t || (this.contextMenuEl && !this.contextMenuEl.contains(t))) {
        this.closeContextMenu();
      }
    };
    window.addEventListener('mousedown', onOutside, true);
    window.addEventListener('pointerdown', onOutside, true);
    window.addEventListener('keydown', onOutside, true);
    (window as any).__CANVAS_CTXMENU_OFF__ = () => {
      window.removeEventListener('mousedown', onOutside, true);
      window.removeEventListener('pointerdown', onOutside, true);
      window.removeEventListener('keydown', onOutside, true);
    };
  }

  // Table (imperative Konva rendering)
  private createTable(el: any): Konva.Group {
    const id = String(el.id);
    const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));

    // Compute width/height
    let w = Math.max(1, el.width || (cols * (el.cellWidth || 120)));
    let h = Math.max(1, el.height || (rows * (el.cellHeight || 36)));

    const group = this.createGroupWithHitArea(id, w, h, true);
    group.name('table');
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Frame
    const frame = new Konva.Rect({
      x: 0, y: 0, width: w, height: h,
      fill: (el as any).fill || '#ffffff',
      stroke: (el as any).borderColor || '#d1d5db',
      strokeWidth: (el as any).borderWidth ?? 1,
      listening: false,
      name: 'frame',
      perfectDrawEnabled: false,
      strokeScaleEnabled: false,
    });
    group.add(frame);

    // Background rows group
    const bgrows = new Konva.Group({ name: 'bgrows', listening: false });
    group.add(bgrows);

    // Grid group (lines)
    const grid = new Konva.Group({ name: 'grid', listening: false });
    group.add(grid);

    // Cells group (texts)
    const cells = new Konva.Group({ name: 'cells', listening: false });
    group.add(cells);

    // Draw content
    this.layoutTable(group, el);

    // Tag metadata used by overlay logic
    try { group.setAttr('__rows', rows); group.setAttr('__cols', cols); group.setAttr('__tableId', id); } catch {}

    // Right-click context menu for table actions
    group.on('contextmenu.table', (e) => this.showTableContextMenu(group, el, e as any));
    group.on('mouseleave.table', () => this.clearTableOverlay());

    return group;
  }

  private updateTable(group: Konva.Group, el: any) {
    // Update frame position/size
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });

    const frame = group.findOne<Konva.Rect>('.frame');
    if (frame) {
      frame.position({ x: 0, y: 0 });
      frame.width(w);
      frame.height(h);
      frame.stroke((el as any).borderColor || '#d1d5db');
      frame.strokeWidth((el as any).borderWidth ?? 1);
      (frame as any).strokeScaleEnabled(false);
    }

    // Re-layout grid and cells
    this.layoutTable(group, el);

    // Update hit area
    this.ensureHitAreaSize(group, w, h);
    this.scheduleDraw('main');
    // Ensure any open overlay/menu remains consistent with updated layout
    this.clearTableOverlay();
  }

  private layoutTable(group: Konva.Group, el: any) {
    const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    // Align grid exactly to frame by deriving cell sizes from element size
    const cellW = Math.max(1, Math.floor(w / cols));
    const cellH = Math.max(1, Math.floor(h / rows));
    const innerW = w;
    const innerH = h;

    // Adjust frame if computed inner size exceeds current size (keep simple: clamp to element size)
    const gridGroup = group.findOne<Konva.Group>('.grid');
    const cellsGroup = group.findOne<Konva.Group>('.cells');
    let bgRowsGroup = group.findOne<Konva.Group>('.bgrows');
    if (!bgRowsGroup) {
      bgRowsGroup = new Konva.Group({ name: 'bgrows', listening: false });
      group.add(bgRowsGroup);
      bgRowsGroup.moveToBottom();
    }
    if (!gridGroup || !cellsGroup) return;

    // Clear existing children
    try { (bgRowsGroup as Konva.Group).destroyChildren(); } catch {}
    try { gridGroup.destroyChildren(); } catch {}
    try { cellsGroup.destroyChildren(); } catch {}

    const stroke = (el as any).borderColor || '#9ca3af';
    const strokeWidth = (el as any).borderWidth ?? 1;

    // Row backgrounds (header + alternate rows)
    const styling = (el as any).enhancedTableData?.styling || {};
    const headerBg = styling.headerBackgroundColor || '#f3f4f6';
    const altBg = styling.alternateRowColor || '#f9fafb';
    for (let r = 0; r < rows; r++) {
      const y = r * cellH;
      const fill = r === 0 ? headerBg : (r % 2 === 1 ? altBg : 'transparent');
      if (fill && fill !== 'transparent') {
        (bgRowsGroup as Konva.Group).add(new Konva.Rect({ x: 0, y, width: innerW, height: cellH, fill, listening: false }));
      }
    }

    // Draw vertical lines
    for (let c = 1; c < cols; c++) {
      const x = Math.round(c * cellW);
      gridGroup.add(new Konva.Line({ points: [x, 0, x, innerH], stroke, strokeWidth, listening: false }));
    }
    // Draw horizontal lines
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * cellH);
      gridGroup.add(new Konva.Line({ points: [0, y, innerW, y], stroke, strokeWidth, listening: false }));
    }

    // Fill cells with text (basic)
    const pad = (el as any).cellPadding ?? 8;
    const data = (el as any).enhancedTableData?.cells || (el as any).tableData?.cells || (el as any).tableData || [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const content = Array.isArray(data) && data[r] && data[r][c] ? (data[r][c].content ?? data[r][c].text ?? '') : '';
        const tx = new Konva.Text({
          x: c * cellW + pad,
          y: r * cellH + pad,
          width: Math.max(1, cellW - pad * 2),
          height: Math.max(1, cellH - pad * 2),
          text: String(content),
          fontSize: (el as any).fontSize || 13,
          fontFamily: (el as any).fontFamily || 'Inter, system-ui, sans-serif',
          fill: (el as any).textColor || '#111827',
          listening: false,
          name: `cell-text-${r}-${c}`,
          perfectDrawEnabled: false,
        });
        (tx as any).wrap('word');
        (tx as any).align('left');
        (tx as any).lineHeight(1.25);
        cellsGroup.add(tx);
      }
    }

    // Ensure hit area reflects current size
    this.ensureHitAreaSize(group, Math.max(w, innerW), Math.max(h, innerH));
    this.scheduleDraw('main');
  }

  // Sticky Note
  private createStickyNote(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    // Use the standard group creation utility to ensure a reliable hit area.
    const group = this.createGroupWithHitArea(id, w, h, true);
    group.name('sticky-note');
    // TEST 4: Snap to integer positions
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });
    // Optional: Try to set group size (no-op on standard Groups, kept for compatibility)
    // Real bounds come from frame dimensions + ensureHitAreaSize via createGroupWithHitArea
    try { (group as any).width?.(w); (group as any).height?.(h); } catch {}
    // Record layout base for transform normalization
    try { group.setAttr('__layoutW', w); group.setAttr('__layoutH', h); } catch {}

    // Background
    const bg = new Konva.Rect({
      x: 0, y: 0, width: w, height: h,
      fill: el.backgroundColor || el.fill || '#fef08a', // sticky note yellow
      stroke: (el as any).stroke || 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0,
      listening: false, // Visuals should not be interactive; the hit area handles it.
      name: 'frame',
      // TEST 4: Disable subpixel rendering
      perfectDrawEnabled: false,
      strokeScaleEnabled: false
    });
    group.add(bg);

    // Text - always create text node even if empty to enable editing
    const pad = 12;
    const text = new Konva.Text({
      x: pad, y: pad,
      width: w - pad * 2,
      height: h - pad * 2,
      text: el.text || '',
      fontSize: el.fontSize || 14,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fill: el.textColor || '#451a03', // dark brown for contrast
      listening: false,
      name: 'text',
      // TEST 4: Disable subpixel rendering
      perfectDrawEnabled: false
    });
    (text as any).wrap('word');
    (text as any).align('left');
    if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);
    else (text as any).lineHeight(1.25);
    if ((el as any).letterSpacing !== undefined) (text as any).letterSpacing((el as any).letterSpacing);

    group.add(text);

    return group;
  }

  private updateStickyNote(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    // Optional: Try to set group size (no-op on standard Groups, kept for compatibility)
    // Real bounds come from frame.width/height + ensureHitAreaSize
    try { (group as any).width?.(w); (group as any).height?.(h); } catch {}
    try { group.setAttr('__layoutW', w); group.setAttr('__layoutH', h); } catch {}
    this.ensureHitAreaSize(group, w, h);

    // Update background per style
    const bg = group.findOne<Konva.Rect>('.frame');
    if (bg) {
      bg.position({ x: 0, y: 0 });
      bg.width(w);
      bg.height(h);
      bg.fill(el.backgroundColor || el.fill || '#fef08a');
      if ((el as any).style?.stroke) {
        bg.stroke((el as any).style.stroke.color);
        bg.strokeWidth((el as any).style.stroke.width);
        (bg as any).strokeScaleEnabled(false);
      } else {
        bg.stroke((el as any).stroke || 'transparent');
        bg.strokeWidth(0);
        (bg as any).strokeScaleEnabled(false);
      }
      try { (bg as any).shadowForHitEnabled?.(false); } catch {}
      try { (bg as any).shadowForStrokeEnabled?.(false); } catch {}
    }

    // Update text from store size and padding
    const text = group.findOne<Konva.Text>('.text');
    if (text) {
      const pad = (el as any).style?.padding ?? 12;
      text.position({ x: pad, y: pad });
      text.width(Math.max(1, w - pad * 2));
      text.height(Math.max(1, h - pad * 2));
      text.text(el.text || '');
      text.fontSize((el as any).style?.fontSize ?? (el.fontSize || 14));
      text.fontFamily((el as any).style?.fontFamily ?? (el.fontFamily || 'Inter, system-ui, sans-serif'));
      (text as any).lineHeight((el as any).style?.lineHeight ?? 1.25);
      text.fill((el as any).style?.textFill ?? (el.textColor || '#451a03'));
      (text as any).wrap('word');
      (text as any).align('left');
    }
  }

  private getElementNodeFromEvent(target: Konva.Node): Konva.Node | null {
    let current: Konva.Node | null = target;
    while (current) {
      const id = current.id();
      // Check if the node is a main element node managed by the renderer
      if (id && this.nodeMap.has(id)) {
        return current;
      }
      // Stop traversal if we reach the layer, as elements are direct children
      if (current.getParent() instanceof Konva.Layer) {
        return id ? current : null;
      }
      current = current.getParent();
    }
    return null;
  }

  // Flexible init supporting (stage), (stage, callback) or (stage, layers, { onUpdateElement })
  init(
    stage: Konva.Stage,
    layersOrCb?: RendererLayers | ((id: string, updates: any) => void) | null,
    options?: { onUpdateElement?: (id: string, updates: any) => void }
  ) {
    this.stage = stage;

    // Determine updateElement callback
    if (typeof layersOrCb === 'function') {
      this.updateElementCallback = layersOrCb as (id: string, updates: any) => void;
    } else if (options?.onUpdateElement) {
      this.updateElementCallback = options.onUpdateElement;
    } else {
      this.updateElementCallback = undefined;
    }

    // Resolve layers
    if (layersOrCb && typeof layersOrCb === 'object' && 'main' in layersOrCb) {
      // Use provided layers
      this.layers = layersOrCb as RendererLayers;
    } else {
      // Find layers by name; support both '.preview-layer' and '.preview-fast-layer'
      const background = stage.findOne<Konva.Layer>('.background-layer');
      const main = stage.findOne<Konva.Layer>('.main-layer');
      const preview = stage.findOne<Konva.Layer>('.preview-layer') || stage.findOne<Konva.Layer>('.preview-fast-layer');
      const overlay = stage.findOne<Konva.Layer>('.overlay-layer');

      if (!background || !main || !overlay) {
        console.warn('[CanvasRendererV2] Missing required layers; creating fallbacks');
      }

      this.layers = {
        background: background || new Konva.Layer({ listening: false, name: 'background-layer' }),
        main: main || new Konva.Layer({ listening: true, name: 'main-layer' }),
        preview: (preview as Konva.Layer) || main || new Konva.Layer({ listening: false, name: 'preview-fast-layer' }), // Fast layer shouldn't listen
        overlay: overlay || new Konva.Layer({ listening: true, name: 'overlay-layer' }),
      };
      
      // Ensure main layer has hit graph enabled for proper event handling
      if (this.layers.main) {
        (this.layers.main as any).hitGraphEnabled(true);
      }

      // If we created any fallback layers, add them to the stage
      if (!background) stage.add(this.layers.background);
      if (!main) stage.add(this.layers.main);
      if (!preview) stage.add(this.layers.preview);
      if (!overlay) stage.add(this.layers.overlay);
    }

    // Initialize transformer
    this.transformer = new Konva.Transformer({
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      // Default: no aspect lock; per-type rules applied in syncSelection
      keepRatio: false,
      rotateEnabled: true,
      borderEnabled: true,
      borderStroke: '#3B82F6',
      borderStrokeWidth: 1,
      anchorFill: '#3B82F6',
      anchorStroke: '#ffffff',
      anchorStrokeWidth: 2,
      anchorSize: 8,
      ignoreStroke: true,
      listening: true,
      name: 'transformer'
    });
    // Prefer anchors on top in z-order if supported
    try { (this.transformer as any).shouldOverdraw?.(true); } catch {}
    // Enforce minimum box via boundBoxFunc
    const MIN_W = 60;
    const MIN_H = 40;
    this.transformer.boundBoxFunc((oldBox, newBox) => {
      const w = Math.max(newBox.width, MIN_W);
      const h = Math.max(newBox.height, MIN_H);
      return { ...newBox, width: w, height: h };
    });
    // Attach transformer to OVERLAY layer and keep it on top of overlay children
    this.layers.overlay.add(this.transformer);
    try { this.transformer.moveToTop(); } catch {}


    // Capture anchor and pre-rects at transform start for precise commit positioning
    this.transformer.on('transformstart.renderer', () => {
      try {
        const active = (this.transformer?.getActiveAnchor?.()?.getName?.() as string) || ((this.transformer as any)?._movingAnchorName as string) || '';
        this.lastActiveAnchorName = active;
      } catch {
        this.lastActiveAnchorName = '';
      }
      this.preTransformRects.clear();
      const nodes = this.transformer?.nodes() || [];
      nodes.forEach((node) => {
        const r = (node as any).getClientRect?.({ skipTransform: false, skipStroke: true, skipShadow: true }) || { x: node.x(), y: node.y(), width: (node as any).width?.() || 0, height: (node as any).height?.() || 0 };
        this.preTransformRects.set(node.id?.() || '', { left: r.x, right: r.x + r.width, top: r.y, bottom: r.y + r.height });
      });
    });

    // Commit on transform end: convert scale -> size, normalize nodes, update store
    // Transform normalization: convert scale -> size, reset scale to 1, update store, re-layout immediately
    this.transformer.on('transformend.renderer', () => {
      const nodes = this.transformer?.nodes() || [];
      nodes.forEach((node) => {
        const id = node.id?.();
        if (!id) return;

        // If a specialized resize handler (e.g., text) already committed
        // its own normalization and store update, skip the generic path.
        if ((node as any).getAttr && (node as any).getAttr('__skipGenericResize')) {
          try { (node as any).setAttr('__skipGenericResize', undefined); } catch {}
          return; // Skip all generic processing for this element
        }

        // 1) Read scale applied by the transformer
        const sX = node.scaleX() || 1;
        const sY = node.scaleY() || 1;

        console.log(`[RESIZE DEBUG] Node ${id} - Scale: ${sX}x${sY}`);

        // Text-specific handling (aligned with react-image-editor):
        // convert scale -> width/height on text and reset scale to 1
        try {
          const group = node as Konva.Group;
          if (group.name() === 'text') {
            const textNode =
              group.findOne<Konva.Text>('Text.text') ||
              group.findOne<Konva.Text>('Text') ||
              group.findOne<Konva.Text>('.text');
            if (textNode) {
              // Scale width and font to match visual preview, then normalize scale.
              const MIN_W = 20;
              const MIN_H = 10;
              const baseW = (typeof (textNode as any).width === 'function') ? (textNode as any).width() : ((textNode as any).attrs?.width || 0);
              const baseH = (typeof (textNode as any).height === 'function') ? (textNode as any).height() : ((textNode as any).attrs?.height || 0);
              const baseFont = (textNode as any).fontSize ? (textNode as any).fontSize() : 14;

              const targetW = Math.max(MIN_W, Math.abs((baseW || 0) * sX));
              const targetFont = Math.max(8, Math.min(512, Math.abs(baseFont * sY)));

              // Reset group scale; apply font + width
              (node as any).scale({ x: 1, y: 1 });
              if ((textNode as any).x && textNode.x() !== 0) textNode.x(0);
              if ((textNode as any).y && textNode.y() !== 0) textNode.y(0);
              if ((textNode as any).fontSize) (textNode as any).fontSize(targetFont);
              (textNode as any).width(targetW);
              if (typeof (textNode as any).height === 'function') (textNode as any).height(Math.max(MIN_H, Math.abs((baseH || 0) * sY)));

              // Measure actual height without transform
              try { (textNode as any)._clearCache?.(); } catch {}
              const rect2 = (textNode as any).getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
              const finalH = Math.max(MIN_H, rect2 && typeof rect2.height === 'number' ? rect2.height : (baseH || MIN_H));

              // Ensure hit area matches
              this.ensureHitAreaSize(group, targetW, finalH);

              // Persist
              this.updateElementCallback?.(id, {
                width: targetW,
                height: finalH,
                fontSize: targetFont,
                x: group.x(),
                y: group.y(),
                scaleX: 1,
                scaleY: 1,
              });

              return; // Skip generic processing
            }
          }
        } catch {}

        // Table-specific handling: scale frame and re-layout grid immediately (font scales with vertical factor)
        try {
          const group = node as Konva.Group;
          if (group.name() === 'table') {
            const frame = group.findOne<Konva.Rect>('.frame');
            if (frame) {
              const baseW = frame.width();
              const baseH = frame.height();
              const targetW = Math.max(60, Math.abs(baseW * sX));
              const targetH = Math.max(40, Math.abs(baseH * sY));
              // Scale font like sticky notes (lock-step with vertical scale)
              let baseFont = 13;
              try {
                const store = (window as any).__UNIFIED_CANVAS_STORE__;
                const el = store?.getState()?.elements?.get(id);
                if (el && el.fontSize) baseFont = el.fontSize;
              } catch {}
              const targetFont = Math.max(8, Math.min(512, Math.abs(baseFont * sY)));

              // Normalize
              (group as any).scale({ x: 1, y: 1 });
              frame.position({ x: 0, y: 0 });
              frame.width(targetW);
              frame.height(targetH);

              // Re-layout immediately using stored rows/cols/cells
              try {
                const store = (window as any).__UNIFIED_CANVAS_STORE__;
                const el = store?.getState()?.elements?.get(id);
                const nextEl = el ? { ...el, width: targetW, height: targetH, fontSize: targetFont } : { id, width: targetW, height: targetH, fontSize: targetFont };
                this.layoutTable(group, nextEl);
              } catch {}

              // Update hit area and persist
              this.ensureHitAreaSize(group, targetW, targetH);
              this.updateElementCallback?.(id, {
                width: targetW,
                height: targetH,
                fontSize: targetFont,
                x: group.x(),
                y: group.y(),
                scaleX: 1,
                scaleY: 1,
              });

              return; // Skip generic path
            }
          }
        } catch {}

        // Sticky note-specific handling: scale frame + scale inner text font in lock-step
        try {
          const group = node as Konva.Group;
          if (group.name() === 'sticky-note') {
            const frame = group.findOne<Konva.Rect>('.frame');
            const textNode = group.findOne<Konva.Text>('.text');
            if (frame && textNode) {
              const MIN_W = 60;
              const MIN_H = 40;
              const baseW = frame.width();
              const baseH = frame.height();
              const baseFont = textNode.fontSize() || 14;

              const targetW = Math.max(MIN_W, Math.abs(baseW * sX));
              const targetH = Math.max(MIN_H, Math.abs(baseH * sY));
              const targetFont = Math.max(8, Math.min(512, Math.abs(baseFont * sY)));

              // Normalize scale then apply geometry
              (group as any).scale({ x: 1, y: 1 });
              frame.position({ x: 0, y: 0 });
              frame.width(targetW);
              frame.height(targetH);

              // Respect padding from store (default 12)
              let pad = 12;
              try {
                const store = (window as any).__UNIFIED_CANVAS_STORE__;
                const el = store?.getState()?.elements?.get(id);
                if (el && typeof el.padding === 'number') pad = el.padding;
                if (el?.style?.padding != null) pad = el.style.padding;
              } catch {}

              textNode.position({ x: pad, y: pad });
              textNode.width(Math.max(1, targetW - pad * 2));
              textNode.height(Math.max(1, targetH - pad * 2));
              textNode.fontSize(targetFont);

              // Hit-area must match new frame
              this.ensureHitAreaSize(group, targetW, targetH);

              // Persist to store
              this.updateElementCallback?.(id, {
                width: targetW,
                height: targetH,
                fontSize: targetFont,
                x: group.x(),
                y: group.y(),
                scaleX: 1,
                scaleY: 1,
              });

              return; // Skip generic path
            }
          }
        } catch {}

        // 2) Measure the node WITHOUT its transform to avoid double scaling
        //    (Konva will include scale in getClientRect() unless skipTransform:true)
        const baseBox = (node as any).getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
        console.log(`[RESIZE DEBUG] Base box (no transform): w=${baseBox.width}, h=${baseBox.height}`);
        
        const nextW = Math.max(60, Math.round(baseBox.width * sX));
        const nextH = Math.max(40, Math.round(baseBox.height * sY));
        console.log(`[RESIZE DEBUG] Target size: ${nextW}x${nextH}`);

        // 3) Commit normalized geometry into the node tree
        node.scale({ x: 1, y: 1 }); // neutralize scale

        const group = node as Konva.Group;
        // Update ALL rectangles in the group to ensure consistency
        // This includes frame, bg, and any other visual rectangles
        const allRects = group.find('Rect');
        console.log(`[RESIZE DEBUG] Found ${allRects.length} rectangles in group`);
        
        allRects.forEach((rect) => {
          const rectNode = rect as Konva.Rect;
          const rectName = rectNode.name();
          console.log(`[RESIZE DEBUG] Rect name: "${rectName}", current size: ${rectNode.width()}x${rectNode.height()}`);
          
          // Skip the hit-area rect, we'll handle that separately
          if (rectName === 'hit-area') {
            console.log(`[RESIZE DEBUG] Skipping hit-area rect for now`);
            return;
          }
          
          // Update any visual frame/background rectangles
          if (rectName === 'frame' || rectName === 'bg' || 
              rectNode.hasName('frame') || rectNode.hasName('bg')) {
            console.log(`[RESIZE DEBUG] Updating ${rectName} to ${nextW}x${nextH}`);
            rectNode.position({ x: 0, y: 0 });
            rectNode.width(nextW);
            rectNode.height(nextH);
          }
        });

        // Keep text in sync with padding
        const text =
          group.findOne<Konva.Text>('Text.text') ||
          group.findOne<Konva.Text>('Text.label') ||
          group.findOne<Konva.Text>('Text') ||
          group.findOne<Konva.Text>('.text');

        if (text) {
          let pad = 12;
          try {
            const store = (window as any).__UNIFIED_CANVAS_STORE__;
            const el = store?.getState()?.elements?.get(id);
            if (el && typeof el.padding === 'number') pad = el.padding;
            if (el?.style?.padding != null) pad = el.style.padding;
          } catch {}
          text.position({ x: pad, y: pad });
          
          // CRITICAL: Check if this is a text element that handles its own resize
          // Only force width/height for non-text elements (sticky notes, etc.)
          const isTextElement = group.name() === 'text';
          if (!isTextElement) {
            // Only sticky notes and other non-text elements get forced dimensions
            (text as any).width(Math.max(1, nextW - 2 * pad));
            (text as any).height(Math.max(1, nextH - 2 * pad));
          }
          // Text elements keep their fontSize-calculated dimensions
        }

        // Hit area MUST match the new logical size - but NOT for text elements (they handle their own)
        const isTextElement = group.name() === 'text';
        if (!isTextElement) {
          try { 
            this.ensureHitAreaSize(group, nextW, nextH); 
            // Force the group's cached bounds to update
            group.clearCache();
            (group as any)._clearSelfAndDescendantCache?.('bounds');
          } catch {}
        }

        // 4) Commit to store immutably (store is the single source of truth)
        this.updateElementCallback?.(id, {
          width: nextW,
          height: nextH,
          x: Math.round(group.x()),
          y: Math.round(group.y()),
        });
      });
      
      // CRITICAL: After all nodes are updated, detach and reattach transformer
      // This forces it to recalculate bounds based on the new dimensions
      const currentNodes = this.transformer.nodes();
      if (currentNodes.length > 0) {
        this.transformer.nodes([]);
        this.transformer.nodes(currentNodes);
        this.transformer.forceUpdate();
      }
      
      // Schedule redraws
      this.scheduleDraw('main');
      this.scheduleDraw('overlay');
      // Clear pre-transform cache after commit
      this.preTransformRects.clear();
      this.lastActiveAnchorName = '';
    });
    
    // Create singleton overlay group for connector UI (hidden by default)
    this.connectorOverlayGroup = new Konva.Group({
      name: 'connector-overlay-group',
      listening: false,  // Critical: must not block events to main layer
      visible: false     // Hidden when no connectors selected
    });
    this.layers.overlay.add(this.connectorOverlayGroup);
    
    // Set up drag layer (use preview layer as drag layer per blueprint)
    this.dragLayer = this.layers.preview;
    
    // Initialize RAF tracking
    this.raf = 0;
    this.dirtyMain = false;
    this.dirtyOverlay = false;
    this.dirtyPreview = false;

    // --- CENTRALIZED EVENT HANDLING (per blueprint) ---
    this.stage.off('.renderer'); // Clear previous renderer listeners

    // Mousedown for selection and deselection
    this.stage.on('mousedown.renderer', (e: any) => {
      // Ignore clicks on transformer and its anchors
      const cls = e.target?.getClassName?.();
      const parentCls = e.target?.getParent?.()?.getClassName?.();
      if (cls === 'Transformer' || parentCls === 'Transformer') {
        return; // allow transformer to handle its own interactions
      }

      const node = this.getElementNodeFromEvent(e.target);
      console.log(`[DEBUG] Mousedown on: ${node ? node.name() + '(' + node.id() + ')' : e.target.getClassName()}`);
      if (node && node.id()) {
        // Clicked on a specific element, handle selection.
        e.cancelBubble = true;
        const multi = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        console.log(`[DEBUG] ==> Selecting element: ${node.id()}`);
        if ((window as any).__UNIFIED_CANVAS_STORE__) {
          (window as any).__UNIFIED_CANVAS_STORE__.getState().selectElement(node.id(), multi);
        }
      } else {
        // Clicked on the background (stage or layer), handle deselection.
        console.log(`[DEBUG] ==> Deselecting all elements.`);
        if ((window as any).__UNIFIED_CANVAS_STORE__) {
          (window as any).__UNIFIED_CANVAS_STORE__.getState().selectElement(null);
        }
      }
    });

    // Drag start: detach transformer to prevent state conflicts.
    this.stage.on('dragstart.renderer', (e: any) => {
        const node = this.getElementNodeFromEvent(e.target);
        if (node && this.transformer) {
            console.log(`[DEBUG] Drag START on: ${node.id()}. Detaching transformer.`);
            this.transformer.nodes([]);
            this.scheduleDraw('overlay');
        }
    });

    // Drag end for committing position changes
    this.stage.on('dragend.renderer', (e: any) => {
      const node = this.getElementNodeFromEvent(e.target);
      if (!node || !node.id()) return;

      // Do not handle connector or handle drags here
      if (node.getAttr('kind') === 'edge' || node.name() === 'edge-handle') {
        return;
      }
      
      console.log(`[DEBUG] Drag END on: ${node.id()}. Committing position:`, { x: node.x(), y: node.y() });
      // Commit position to the store
      if (this.updateElementCallback) {
        this.updateElementCallback(node.id(), { x: node.x(), y: node.y() });
      }

      // Re-sync selection to re-attach the transformer
      if ((window as any).__UNIFIED_CANVAS_STORE__) {
        const selectedIds = (window as any).__UNIFIED_CANVAS_STORE__.getState().selectedElementIds || new Set();
        this.syncSelection(selectedIds);
      }
    });

    // Drag move: update table overlay controls position for selected table
    this.stage.on('dragmove.renderer', (e: any) => {
      const node = this.getElementNodeFromEvent(e.target);
      if (!node || !node.id()) return;
      if (node.name() === 'table' && this.tableControlsTargetId === node.id()) {
        try { this.renderTableControls(node.id()); } catch {}
      }
    });
    
    // Double-click for text/cell editing
    this.stage.on('dblclick.renderer', (e: any) => {
      console.info('[RendererV2] dblclick received', { target: e.target?.name?.(), id: e.target?.id?.(), className: e.target?.getClassName?.() });
      const node = this.getElementNodeFromEvent(e.target);
      if (!node || !node.id()) return;

      const isTextLike = node.name() === 'sticky-note' || node.name() === 'text';
      if (isTextLike) {
        e.cancelBubble = true;
        this.openTextareaEditor(node.id(), node);
        return;
      }

      // Table cell editing
      if (node.name() === 'table') {
        e.cancelBubble = true;
        try {
          const elId = node.id();
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const el = store?.getState()?.elements?.get(elId);
          if (!el) return;

          const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
          const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));
          const w = Math.max(1, el.width || 1);
          const h = Math.max(1, el.height || 1);
          const cellW = Math.max(1, Math.floor(w / cols));
          const cellH = Math.max(1, Math.floor(h / rows));
          const pad = el.cellPadding ?? 8;

          // pointer in table local coords
          const stagePos = this.stage!.getPointerPosition(); if (!stagePos) return;
          const local = (node as any).getAbsoluteTransform().copy().invert().point(stagePos);
          const c = Math.min(cols - 1, Math.max(0, Math.floor(local.x / cellW)));
          const r = Math.min(rows - 1, Math.max(0, Math.floor(local.y / cellH)));

          this.openTableCellEditor(elId, node as Konva.Group, r, c, { cellW, cellH, pad });
        } catch {}
      }
    });

    // Mousemove for hover effects on connectors
    this.stage.on('mousemove.renderer', (e: any) => {
      const node = this.getElementNodeFromEvent(e.target);
      
      if (this.lastHoveredNode === node) return;

      // Unhover previous node
      if (this.lastHoveredNode && this.lastHoveredNode.getAttr('kind') === 'edge') {
        const storeEl = (window as any).__UNIFIED_CANVAS_STORE__?.getState().elements.get(this.lastHoveredNode.id());
        if (storeEl) {
            this.lastHoveredNode.strokeWidth(storeEl.strokeWidth || 2);
            this.scheduleDraw('main');
        }
      }

      // Hover new node
      if (node && node.getAttr('kind') === 'edge') {
        const storeEl = (window as any).__UNIFIED_CANVAS_STORE__?.getState().elements.get(node.id());
        if (storeEl) {
            (node as Konva.Line).strokeWidth((storeEl.strokeWidth || 2) + 1);
            this.scheduleDraw('main');
            this.lastHoveredNode = node;
        }
      } else {
        this.lastHoveredNode = null;
      }
    });
    
    // Force initial draw of all layers to ensure hit detection works
    this.layers?.background?.draw();
    this.layers?.main?.draw();
    this.layers?.preview?.draw();
    this.layers?.overlay?.draw();
  }

  // Open textarea editor for text-like elements
  // Optional flag: rotate textarea to match element rotation? (false recommended)
  private rotateTextareaWhileEditing = false;

  // Lazily created once; mounted above the <canvas> in the same stacking context
  private ensureOverlayRoot(): HTMLDivElement | null {
    if (!this.stage) return null;
    const container = this.stage.container();
    const id = '__canvas_overlay_root__';
    let root = container.parentElement?.querySelector<HTMLDivElement>('#' + id);
    if (!root) {
      root = document.createElement('div');
      root.id = id;
      Object.assign(root.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none', // overlay UI controls can flip this to 'auto' locally
        zIndex: '2',           // above Konva container (which defaults to zIndex: 0/1)
      });
      // Position root relative to the container’s offset parent
      container.parentElement?.appendChild(root);
      // Ensure the container’s parent is positioned
      const parent = container.parentElement as HTMLElement;
      const cs = getComputedStyle(parent);
      if (cs.position === 'static') parent.style.position = 'relative';
    }
    return root;
  }

  private openTextareaEditor(elId: string, node: Konva.Node) {
    console.info('[RendererV2] openTextareaEditor called', { elId, nodeName: node?.name?.(), nodeId: node?.id?.() });
    // Close previous editor if any
    this.closeCurrentEditor();

    

    if (!this.stage) return;

    // Pull latest element snapshot (read-only)
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    if (!store) return;
    const el = store.getState().elements.get(elId);
    if (!el) return;

    // Bail if element is obviously off-viewport (cheap guard)
    const viewRect = this.stage.getClientRect({ skipTransform: false });
    const elRect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();
    if (elRect.x > viewRect.x + viewRect.width ||
        elRect.x + elRect.width < viewRect.x ||
        elRect.y > viewRect.y + viewRect.height ||
        elRect.y + elRect.height < viewRect.y) {
      // Optionally: recentre/scroll then reopen; for now, just return.
      // this.centerOn(elId); return;
    }

    const overlayRoot = this.ensureOverlayRoot();
    if (!overlayRoot) { console.warn('[RendererV2] no overlayRoot found'); return; }

    // DOM positioning math
    // Use getClientRect for accurate bounds of the Konva node, then translate to viewport px
    const absRect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();

    // Stage container offset in the page (accounts for sidebars, padding, transforms)
    const containerRect = this.stage.container().getBoundingClientRect();

    // Position is relative to the viewport
    const leftPx = containerRect.left + absRect.x;
    const topPx  = containerRect.top + absRect.y;
    const widthPx  = Math.max(4, absRect.width);
    const heightPx = Math.max(4, absRect.height);

    // Sticky paddings (match your visual text insets)
    // Use sticky note padding when applicable; plain text has no internal padding
    const isSticky = (el as any).type === 'sticky-note';
    const padWorld = isSticky ? ((el as any).padding ?? 12) : 0;
    // Convert world padding to DOM px based on stage scale
    const absScale = this.stage.getAbsoluteScale?.();
    const stageScale = absScale && typeof absScale.x === 'number' ? absScale.x : 1;
    const padPx = padWorld * stageScale;
    const contentLeft = leftPx + padPx;
    const contentTop  = topPx + padPx;
    const contentWidth = Math.max(4, widthPx - padPx * 2);
    const contentHeight = Math.max(4, heightPx - padPx * 2);

    // Rotation (absolute)
    const absRot = (node as any).getAbsoluteRotation?.() ?? 0;

    // Create textarea
    const ta = document.createElement('textarea');
    ta.value = el.text ?? '';

    // Allow interaction inside the overlay
    ta.style.pointerEvents = 'auto';

    // Compute current stage scale for font sizing parity (stageScale already computed above)
    const lh = (el as any).lineHeight ?? 1.25;
    const ff = (el as any).fontFamily || 'Inter, system-ui, sans-serif';
    const fs = Math.max(1, (el as any).fontSize || 14) * stageScale;
    const ls = (el as any).letterSpacing ?? 0;

    // TEST 3: Start with invisible textarea and hidden caret
    Object.assign(ta.style, {
      position: 'fixed', // Use fixed positioning relative to the viewport
      left: '-9999px',  // Start off-screen
      top: '-9999px',   // Start off-screen
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      fontSize: `${fs}px`,
      fontFamily: ff,
      lineHeight: String(lh),
      letterSpacing: `${ls}px`,
      color: el.type === 'sticky-note' ? (el.textColor || '#451a03') : (el.textColor || '#111827'),
      background: 'transparent',          // let sticky's fill show through
      border: 'none',                     // no extra border; selection shown via Konva overlay
      padding: '0',
      margin: '0',
      boxSizing: 'content-box',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: isSticky ? 'pre-wrap' : 'pre',
      wordBreak: isSticky ? 'break-word' : 'normal',
      transformOrigin: '0 0',
      // Rotation: opt-in (off by default for better caret behavior)
      transform: this.rotateTextareaWhileEditing ? `rotate(${absRot}deg)` : 'none',
      // Keep it above everything in the overlay
      zIndex: '1000',
      opacity: '0',           // Start invisible
      caretColor: 'transparent' // Hide caret initially
    });

    // Keep table controls aligned during zoom/pan via wheel
    this.stage.on('wheel.renderer', () => {
      if (this.tableControlsTargetId) {
        try { this.renderTableControls(this.tableControlsTargetId); } catch {}
      }
    });

    // Insert into document to avoid overlay root intercepting outside clicks
    document.body.appendChild(ta);
    
    // Position and show textarea after one frame
    requestAnimationFrame(() => {
      ta.style.left = `${contentLeft}px`;
      ta.style.top = `${contentTop}px`;
      ta.style.opacity = '1';
      ta.style.caretColor = ''; // Restore caret color
    });
    console.info('[RendererV2] textarea appended to body and focusing');
    this.currentEditor = ta as any; // track for later cleanup
    ta.focus();
    ta.select();

    // Hide transformer while editing
    const prevTransformerVisible = this.transformer?.visible() ?? true;
    try { this.transformer?.visible(false); this.scheduleDraw('overlay'); } catch {}

    // For plain text, hide the Konva text node while editing (match react-image-editor)
    let prevTextVisible: boolean | undefined;
    if (!isSticky) {
      try {
        const group = node as Konva.Group;
        const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
        if (textNode) {
          prevTextVisible = textNode.visible();
          textNode.visible(false);
          this.scheduleDraw('main');
        }
      } catch {}
    }

    // Measurement logic
    const measureSticky = () => {
      // Grow textarea height to content (within a reasonable max, e.g., 2x initial)
      const minHpx = contentHeight; // px
      ta.style.height = 'auto';
      const scrollHpx = Math.ceil(ta.scrollHeight);
      const guardPx = Math.max(1, Math.round(((el as any).fontSize || 14) * 0.15 * stageScale));
      const nextHpx = Math.max(minHpx, scrollHpx + guardPx);
      ta.style.height = `${nextHpx}px`;

      const finalElementHeightWorld = (nextHpx + padPx * 2) / stageScale;

      try {
        const group = node as Konva.Group;
        const frame = group.findOne<Konva.Rect>('.frame') || group.findOne<Konva.Rect>('.bg');
        const textNode = group.findOne<Konva.Text>('.text') || group.findOne<Konva.Text>('.label') || group.findOne<Konva.Text>('Text');
        if (frame) frame.height(finalElementHeightWorld);
        if (textNode) {
          try {
            const padW = padWorld;
            textNode.text(ta.value);
            textNode.width(Math.max(1, ((frame as any)?.width?.() || (el as any).width || 1) - 2 * padW));
            if ((el as any).lineHeight) (textNode as any).lineHeight((el as any).lineHeight);
            if ((el as any).letterSpacing !== undefined) (textNode as any).letterSpacing((el as any).letterSpacing);
          } catch {}
          textNode.height(finalElementHeightWorld - padWorld * 2);
        }
        this.ensureHitAreaSize(group, (frame as any)?.width?.() || (el as any).width || 1, finalElementHeightWorld);
        this.scheduleDraw('main');
        this.transformer?.forceUpdate?.();
        this.scheduleDraw('overlay');
      } catch {}

      this.updateElementCallback?.(elId, { height: finalElementHeightWorld });
    };

    // React Image Editor-style width calc for plain text
    const computePlainWidthPx = (value: string) => {
      const lines = value.split('\n');
      const longest = lines.sort((a, b) => b.length - a.length)[0] || '';
      const chars = longest.split('');
      let acc = 0;
      for (const ch of chars) {
        const code = ch.charCodeAt(0);
        // ASCII printable range 32..126 uses 3/5 width of font size
        acc += (code >= 32 && code <= 126) ? (fs * 3) / 5 : fs;
      }
      return acc;
    };

    const measurePlain = () => {
      // Update width based on content
      const wpx = computePlainWidthPx(ta.value);
      ta.style.width = `${Math.max(1, Math.ceil(wpx))}px`;
      // Height uses number of lines * fontSize * 1.2 (RIE)
      const lines = ta.value.split('\n').length;
      const nextHpx = Math.max(1, Math.ceil(lines * ((el as any).fontSize || 14) * 1.2 * stageScale));
      ta.style.height = `${nextHpx + 3}px`;

      // Update Konva text live for feedback
      try {
        const group = node as Konva.Group;
        const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
        if (textNode) {
          textNode.text(ta.value);
          const worldW = Math.max(1, Math.ceil(wpx) / stageScale);
          (textNode as any).width(worldW);
          this.ensureHitAreaSize(group, worldW, Math.max(10, nextHpx / stageScale));
          this.scheduleDraw('main');
          this.transformer?.forceUpdate?.();
          this.scheduleDraw('overlay');
        }
      } catch {}
    };

    // Bind input handler by type
    if (isSticky) {
      ta.addEventListener('input', measureSticky);
    } else {
      ta.addEventListener('input', measurePlain);
    }

    // --- Commit / Cancel ---
    const commit = () => {
      cleanup();
      const nextText = ta.value;
      // Persist text + exit editing
      if (isSticky) {
        this.updateElementCallback?.(elId, { text: nextText, isEditing: false });
      } else {
        // Plain text: set width/height based on textarea bounds and reset any scale
        const rect = ta.getBoundingClientRect();
        const stageScale = this.stage?.getAbsoluteScale?.().x || 1;
        const nextW = Math.max(20, Math.round(rect.width / stageScale));
        const lines = nextText.split('\n').length;
        const nextH = Math.max(10, Math.round(lines * ((el as any).fontSize || 14) * 1.2));
        this.updateElementCallback?.(elId, { text: nextText, width: nextW, height: nextH, isEditing: false });
      }
    };
    const cancel = () => {
      cleanup();
      // Exit editing, discard changes
      this.updateElementCallback?.(elId, { isEditing: false });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      console.info('[RendererV2] textarea keydown', e.key);
      // Enter to commit; Shift+Enter makes a newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commit();
        return;
      }
      // Cmd/Ctrl+Enter also commit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        commit();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };

    const onBlur = () => {
      console.info('[RendererV2] textarea blur -> commit');
      // Commit on blur for predictable UX
      commit();
    };

    ta.addEventListener('keydown', onKeyDown);
    ta.addEventListener('mousedown', (evt) => { evt.stopPropagation(); evt.stopImmediatePropagation?.(); }, { capture: true } as any);
    ta.addEventListener('pointerdown', (evt) => { evt.stopPropagation(); evt.stopImmediatePropagation?.(); }, { capture: true } as any);
    ta.addEventListener('wheel', (evt) => { evt.stopPropagation(); evt.preventDefault(); }, { passive: false } as any);
    ta.addEventListener('blur', onBlur);

    // Commit on click outside (capture) without blocking Konva handlers
    const onDocMouseDown = (e: MouseEvent) => {
      if (e.target === ta) return;
      // Defer commit so Konva selection/click can process first
      setTimeout(() => {
        if (document.activeElement === ta) ta.blur();
      }, 0);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);

    // Initial measure so editor matches current content
    if (isSticky) {
      measureSticky();
    } else {
      measurePlain();
    }

    // Store selection state (optional visual tweak)
    this.updateElementCallback?.(elId, { isEditing: true });

    // Keep editor in sync if the canvas pans/zooms during editing
    const onStageTransform = () => {
      const rect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();
      const containerRect = this.stage!.container().getBoundingClientRect();
      const absScale = this.stage!.getAbsoluteScale?.();
      const stageScale = absScale && typeof absScale.x === 'number' ? absScale.x : 1;
      const padPx = padWorld * stageScale;
      const l = containerRect.left + rect.x + (isSticky ? padPx : 0);
      const t = containerRect.top + rect.y + (isSticky ? padPx : 0);
      const w = isSticky ? Math.max(4, rect.width - padPx * 2) : Math.max(4, rect.width);
      // Height is controlled by autosize; don’t override here
      if (this.rotateTextareaWhileEditing) {
        const r = (node as any).getAbsoluteRotation?.() ?? 0;
        ta.style.transform = `rotate(${r}deg)`;
      }
      ta.style.left = `${l}px`;
      ta.style.top = `${t}px`;
      ta.style.width = `${w}px`;
      if (isSticky) measureSticky(); else measurePlain();
    };

    // Subscribe to stage changes (zoom/pan)
    // NB: Konva doesn't have a generic transform event on stage; listen to dragmove, wheel (your zoom handler), and scale/position changes you control.
    const onWheel = () => onStageTransform();
    const onDragMove = () => onStageTransform();
    this.stage.container().addEventListener('wheel', onWheel, { passive: true });
    // If you use stage.on('dragmove', ...) to pan, also hook there:
    this.stage.on('dragmove.editor', onDragMove);

    const cleanup = () => {
      console.info('[RendererV2] cleanup editor');
      ta.removeEventListener('keydown', onKeyDown);
      if (isSticky) ta.removeEventListener('input', measureSticky); else ta.removeEventListener('input', measurePlain);
      ta.removeEventListener('blur', onBlur);
      this.stage.container().removeEventListener('wheel', onWheel);

      document.removeEventListener('mousedown', onDocMouseDown, true);
      this.stage?.off('dragmove.editor', onDragMove as any);

      ta.remove();
      if (this.currentEditor === ta) this.currentEditor = undefined;
      try { this.transformer?.visible(prevTransformerVisible); this.scheduleDraw('overlay'); } catch {}
      // Restore text node visibility for plain text
      if (!isSticky) {
        try {
          const group = node as Konva.Group;
          const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
          if (textNode && prevTextVisible !== undefined) {
            textNode.visible(prevTextVisible);
            this.scheduleDraw('main');
          }
        } catch {}
      }
    };

    // Expose a closers so other flows (e.g., ESC from renderer-level, switching tools) can close it
    (this as any)._closeEditor = cleanup;
  }

  // Helper used at the top of openTextareaEditor:
  private closeCurrentEditor() {
    if (this.currentEditor) {
      // If we’ve stored a closer, call it; else just remove the node
      const closer = (this as any)._closeEditor as (() => void) | undefined;
      if (closer) closer();
      else {
        this.currentEditor.remove();
        this.currentEditor = undefined;
      }
    }
  }

  destroy() {
    // Clean up any open editor
    if (this.currentEditor) {
      this.currentEditor.remove();
      this.currentEditor = undefined;
    }
    
    // Remove event handlers
    if (this.stage) {
      this.stage.off('dragstart.renderer');
      this.stage.off('dragend.renderer');
      this.stage.off('.inlineEdit');
    }
    
    this.nodeMap.clear();
    this.stage = null;
    this.layers = null;
    this.transformer = null;
  }

  /** Create or update nodes for elements, remove stale nodes, and batch draw */
  syncElements(input: Map<ElementId, CanvasElement> | CanvasElement[] | any) {
    if (!this.layers) return;
    const main = this.layers.main;
    console.log(`[DEBUG] Syncing ${Array.isArray(input) ? input.length : input.size} elements...`);

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


      if ((el as any).points && Array.isArray((el as any).points) && ((el as any).type === 'pen' || (el as any).type === 'marker' || (el as any).type === 'highlighter')) {
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

      if (el.type === 'table') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group' && node.name() === 'table') {
          this.updateTable(node as Konva.Group, el as any);
        } else {
          const group = this.createTable(el as any);
          this.layers!.main.add(group);
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
          // TEST 1: Hide overlay layer for one frame during creation
          this.layers.overlay.visible(false);
          main.add(group);
          this.nodeMap.set(id, group);
          requestAnimationFrame(() => {
            this.layers.overlay.visible(true);
            this.layers.overlay.batchDraw();
          });
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
          // TEST 1: Hide overlay layer for one frame during creation
          this.layers.overlay.visible(false);
          main.add(group);
          this.nodeMap.set(id, group);
          requestAnimationFrame(() => {
            this.layers.overlay.visible(true);
            this.layers.overlay.batchDraw();
          });

          // Auto-open editor for newly created sticky notes
          if ((el as any).newlyCreated) {
            this.openTextareaEditor(id, group);
            if (this.updateElementCallback) {
              // Unset the flag and set isEditing to true
              this.updateElementCallback(id, { newlyCreated: undefined, isEditing: true });
            }
          }
        }
        return;
      }

      // Edge/Connector elements: support both types during migration
      if ((el as any).type === 'edge' || (el as any).type === 'connector') {
        const node = this.nodeMap.get(id) as Konva.Line | Konva.Arrow | undefined;
        const connectorEl = el as any; // ConnectorElement type
        
        // Check if we need to recreate the node (type changed from line to arrow or vice versa)
        const isArrow = connectorEl.subType === 'arrow' || connectorEl.connectorType === 'arrow';
        const needsRecreate = node && (
          (isArrow && node.getClassName() === 'Line') ||
          (!isArrow && node.getClassName() === 'Arrow')
        );
        
        if (needsRecreate) {
          // Remove old node and create new one with correct type
          node!.destroy();
          this.nodeMap.delete(id);
          const connectorNode = this.createConnector(connectorEl);
          main.add(connectorNode);
          this.nodeMap.set(id, connectorNode);
        } else if (node && (node.getClassName() === 'Line' || node.getClassName() === 'Arrow')) {
          this.updateConnector(node, connectorEl);
        } else {
          const connectorNode = this.createConnector(connectorEl);
          main.add(connectorNode);
          this.nodeMap.set(id, connectorNode);
        }
        return;
      }

      // TODO: circles, sections, tables
    });

    // Update spatial index (simple: insert/update all visible)
    try {
      list.forEach((el) => {
        const id = String((el as any).id);
        if ((el as any).x !== undefined && (el as any).y !== undefined && (el as any).width !== undefined && (el as any).height !== undefined) {
          this.spatial.update(id, { x: (el as any).x, y: (el as any).y, width: Math.max(1,(el as any).width), height: Math.max(1,(el as any).height) });
        }
      });
    } catch {}

    // Remove stale nodes
    Array.from(this.nodeMap.entries()).forEach(([id, node]) => {
      if (!alive.has(id)) {
        try { node.destroy(); } catch {}
        this.nodeMap.delete(id);
      }
    });

    this.scheduleDraw('main');
  }

  private updateLine(line: Konva.Line, el: CanvasElement) {
    // Lines are standalone shapes, ensure they have no parent group wrapping
    line.position({ x: 0, y: 0 });
    line.points((el as any).points || []);
    line.stroke((el as any).color || '#000000');

    // Apply stroke style based on type
    let style = { color: '#000000', width: 2, opacity: 1, blendMode: 'source-over' } as any;
    
    if (el.type === 'pen') {
      style = { color: (el as any).style?.color || (el as any).color || '#000000', width: (el as any).style?.width || (el as any).strokeWidth || 2, opacity: (el as any).style?.opacity ?? 1, blendMode: (el as any).style?.blendMode || 'source-over' };
    } else if (el.type === 'marker') {
      style = { color: (el as any).style?.color || (el as any).color || '#000000', width: (el as any).style?.width || (el as any).strokeWidth || 8, opacity: (el as any).style?.opacity ?? 0.7, blendMode: (el as any).style?.blendMode || 'multiply' };
    } else if (el.type === 'highlighter') {
      style = { color: (el as any).style?.color || (el as any).color || '#f7e36d', width: (el as any).style?.width || (el as any).strokeWidth || 12, opacity: (el as any).style?.opacity ?? 0.5, blendMode: (el as any).style?.blendMode || 'multiply' };
    }

    if (line) {
      line.stroke(style.color || '#000000');
      line.strokeWidth(style.width || 12);
      line.opacity(style.opacity ?? 0.5);
      line.globalCompositeOperation(style.blendMode || 'multiply');
      line.lineCap('round');
      line.lineJoin('round');
    }
  }

  // Connector creation and update methods (following EdgeNode React component logic)
  private createConnector(el: any): Konva.Line | Konva.Arrow {
    const points = Array.isArray(el.points) && el.points.length >= 4
      ? [...el.points]
      : (el.startPoint && el.endPoint ? [el.startPoint.x, el.startPoint.y, el.endPoint.x, el.endPoint.y] : [] as number[]);
    if (points.length < 4) {
      // Fallback: empty, will be updated on next sync after routing
      // Ensure minimal shape to avoid Konva errors
      points.push(0,0,0,0);
    }
    
    let connectorNode: Konva.Line | Konva.Arrow;
    
    // Support both subType (ConnectorElement) and connectorType (edge)
    const isArrow = el.subType === 'arrow' || el.connectorType === 'arrow';
    
    if (isArrow) {
      connectorNode = new Konva.Arrow({
        points,
        stroke: el.stroke || '#374151',
        strokeWidth: el.strokeWidth || 2,
        hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
        lineCap: 'round',
        lineJoin: 'round',
        pointerLength: 12, // Make arrow head more visible
        pointerWidth: 10,  // Make arrow head more visible
        fill: el.stroke || '#374151', // Arrow head fill color
        listening: true,
        strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
        perfectDrawEnabled: false,
        id: el.id
      });
    } else {
      connectorNode = new Konva.Line({
        points,
        stroke: el.stroke || '#374151',
        strokeWidth: el.strokeWidth || 2,
        hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
        lineCap: 'round',
        lineJoin: 'round',
        listening: true,
        strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
        perfectDrawEnabled: false,
        id: el.id
      });
    }
    
    // Mark as edge node for proper identification
    connectorNode.setAttr('kind', 'edge');
    
    
    
    return connectorNode;
  }

  private updateConnector(node: Konva.Line | Konva.Arrow, el: any): void {
    const points = Array.isArray(el.points) && el.points.length >= 4
      ? [...el.points]
      : (el.startPoint && el.endPoint ? [el.startPoint.x, el.startPoint.y, el.endPoint.x, el.endPoint.y] : node.points());
    
    // Always ensure position is at 0,0
    node.position({ x: 0, y: 0 });
    node.points(points);
    node.stroke(el.stroke || '#374151');
    node.strokeWidth(el.strokeWidth || 2);
    node.hitStrokeWidth(Math.max(20, (el.strokeWidth || 2) * 3));
    
    // Update arrow-specific properties if it's an arrow
    const isArrow = el.subType === 'arrow' || el.connectorType === 'arrow';
    if (node.getClassName() === 'Arrow' && isArrow) {
      const arrowNode = node as Konva.Arrow;
      arrowNode.pointerLength(12);
      arrowNode.pointerWidth(10);
      arrowNode.fill(el.stroke || '#374151'); // Ensure arrow head has fill color
    }
  }

  // Track overlay group for reuse
  private connectorOverlayGroup: Konva.Group | null = null;
  private tableControlsGroup: Konva.Group | null = null;
  private tableControlsTargetId: string | null = null;
  
  // Track current text editor
  private currentEditor?: HTMLTextAreaElement;
  
  /** Refresh transformer for a specific element (used when dimensions change) */
  refreshTransformer(elementId?: string) {
    if (!this.transformer || !this.layers) return;
    
    // If a specific element was provided, check if it's selected
    if (elementId) {
      const selectedIds = (window as any).__UNIFIED_CANVAS_STORE__?.getState().selectedElementIds || new Set();
      if (!selectedIds.has(elementId)) {
        // Element is not selected, no need to refresh transformer
        return;
      }
    }
    
    // Force transformer update to reflect new dimensions
    try {
      this.transformer.forceUpdate();
      this.scheduleDraw('overlay');
      
      // If the transformer is attached to nodes, re-sync the selection to pick up size changes
      const currentNodes = this.transformer.nodes();
      if (currentNodes.length > 0) {
        const selectedIds = (window as any).__UNIFIED_CANVAS_STORE__?.getState().selectedElementIds || new Set();
        // Re-sync to update transformer bounds
        setTimeout(() => this.syncSelection(selectedIds), 0);
      }
    } catch (e) {
      console.warn('[CanvasRendererV2] Failed to refresh transformer:', e);
    }
  }

  /** Attach Transformer to current selection */
  syncSelection(selectedIds: Set<ElementId>) {

    if (!this.layers || !this.transformer) return;
    
    console.log(`[DEBUG] Syncing selection for IDs:`, Array.from(selectedIds));

    const nodes: Konva.Node[] = [];
    const connectorIds: string[] = [];
    
    // ALWAYS clear ALL existing connector overlay UI first
    this.clearConnectorOverlay();
    
    selectedIds.forEach((sid) => {
      const node = this.nodeMap.get(String(sid));
      if (node) {
        // Handle connectors specially with EdgeHandles logic
        if ((node.getClassName() === 'Line' || node.getClassName() === 'Arrow') && node.id()) {
          connectorIds.push(String(sid));
          return; // Don't add to transformer
        }
        
        // Attach transformer to the main group for all elements.
        nodes.push(node);
      }
    });
    
    // Handle standard elements with transformer
    if (nodes.length > 0) {
      console.log(`[DEBUG] ==> Attaching transformer to ${nodes.length} nodes.`);
      // TEST 2: Disable transformer visuals during attach
      this.transformer.borderEnabled(false);
      this.transformer.enabledAnchors([]);
      this.transformer.anchorSize(0);
      this.transformer.nodes(nodes);
      this.transformer.visible(false); // Start invisible
      
      // Re-enable visuals after first RAF once element is settled
      requestAnimationFrame(() => {
        this.transformer.visible(true);
        this.transformer.borderEnabled(true);

        // If selection is a single text element, constrain proportions (keep ratio) and use corner anchors only
        const single = nodes.length === 1 ? nodes[0] : null;
        const isSingleText = !!single && single.name() === 'text';
        const isSingleSticky = !!single && single.name() === 'sticky-note';
        const isSingleTable = !!single && single.name() === 'table';
        if (isSingleText) {
          // Text: enable edges + corners; keep ratio to match preview; allow rotation
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors([
            'top-left','top-center','top-right',
            'middle-left','middle-right',
            'bottom-left','bottom-center','bottom-right',
          ]);
          
          // Add boundBoxFunc to prevent tiny sizes and correct x when clamping left-edge resizes
          this.transformer.boundBoxFunc((oldBox, newBox) => {
            const minWidth = 20;
            const minHeight = 10;

            const activeName = (this.transformer.getActiveAnchor?.()?.getName?.() as string) || ((this.transformer as any)._movingAnchorName as string) || '';

            let w = Math.max(minWidth, Math.abs(newBox.width));
            const h = Math.max(minHeight, Math.abs(newBox.height));

            // If clamping width while dragging from the left, shift x so right edge stays fixed
            let x = newBox.x;
            if (w !== newBox.width && activeName.includes('left')) {
              x += newBox.width - w;
            }

            return { ...newBox, x, width: w, height: h };
          });
        } else if (isSingleSticky) {
          // Sticky note: uniform scaling on corners feels natural; allow rotation; 8 anchors
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors([
            'top-left','top-center','top-right',
            'middle-left','middle-right',
            'bottom-left','bottom-center','bottom-right',
          ]);
        } else if (isSingleTable) {
          // Table: lock proportions, restrict to corner anchors for clarity
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right']);
        } else {
          this.transformer.keepRatio(false);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right','top-center','bottom-center','middle-left','middle-right']);
        }
        this.transformer.anchorSize(8);

        // No per-frame text handlers: allow natural Konva scaling during drag
        // Commit at transformend (special-cased) to convert scale -> width/height

        this.layers.overlay.batchDraw();

        // Minimalist table controls when a single table is selected
        if (isSingleSticky || (single && single.name() === 'table')) {
          const tableNode = single as Konva.Node;
          try { this.renderTableControls(tableNode.id()); } catch {}
        } else {
          this.clearTableOverlay();
        }
      });

      // Configure transformer padding from stroke width (keeps frame visually flush)
      try {
        const g = nodes[0] as Konva.Group;
        const rect = g.findOne<Konva.Rect>('Rect.frame') || g.findOne<Konva.Rect>('Rect.bg');
        const strokeW = rect && typeof rect.strokeWidth === 'function' ? rect.strokeWidth() : 0;
        (this.transformer as any).padding?.(strokeW || 0);
      } catch {}

      // Keep transformer above overlay children
      try { this.transformer.moveToTop(); } catch {}
    } else {
      console.log(`[DEBUG] ==> Detaching transformer.`);
      this.transformer.nodes([]);
      this.transformer.visible(false);
    }
    
    if (connectorIds.length > 0) {
      this.renderConnectorHandles(connectorIds);
    }
    
    // Ensure overlay anchors are redrawn
    this.layers?.overlay?.batchDraw?.();
    this.scheduleDraw('overlay');
  }
  
  // Clear all connector overlay UI (highlight + handles)
  private clearConnectorOverlay() {
    if (!this.layers?.overlay) return;
    
    console.log('[CanvasRenderer] Clearing connector overlay');
    
    // Keep the overlay group as singleton, just hide it and clear children
    if (this.connectorOverlayGroup) {
      console.log('[CanvasRenderer] Hiding and clearing overlay group');
      this.connectorOverlayGroup.visible(false); // Hide when no connectors selected
      this.connectorOverlayGroup.destroyChildren(); // Clear all children
    }
    
    // Clean up any orphaned nodes outside the group
    const existingHighlights = this.layers.overlay.find('.edge-highlight');
    existingHighlights.forEach(node => {
      if (node.parent !== this.connectorOverlayGroup) {
        node.destroy();
      }
    });
    
    const existingHandles = this.layers.overlay.find('.edge-handle');
    existingHandles.forEach(node => {
      if (node.parent !== this.connectorOverlayGroup) {
        node.destroy();
      }
    });
    
    // Force immediate redraw to ensure cleanup is visible
    this.layers.overlay.batchDraw();
  }

  // EdgeHandles rendering logic for selected connectors
  private renderConnectorHandles(connectorIds: string[]) {
    // If there is an active edge draft and it matches selection, prefer draft points for overlay

    if (!this.layers) return;
    
    console.log(`[CanvasRenderer] Rendering handles for ${connectorIds.length} connectors`);
    
    // Clear children but keep the singleton group
    if (this.connectorOverlayGroup) {
      this.connectorOverlayGroup.destroyChildren();
      // Show overlay group when connectors are selected
      this.connectorOverlayGroup.visible(connectorIds.length > 0);
    }
    
    // Read draft from store once
    let draft: any = null;
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      draft = store?.getState()?.draft || null;
    } catch {}

    connectorIds.forEach((id) => {
      const connectorNode = this.nodeMap.get(id) as Konva.Line | Konva.Arrow | undefined;
      if (!connectorNode) return;
      
      // Store-first: use committed geometry from store for overlay (draft-first if matching)
      let points: number[] | null = null;
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        let el = store?.getState()?.elements?.get(id);
        if (!el) {
          el = store?.getState()?.edges?.get?.(id);
        }
        if (el && (el.type === 'connector' || el.type === 'edge')) { // support both during transition
          if (Array.isArray(el.points) && el.points.length >= 4) {
            points = [...el.points];
          } else if (el.startPoint && el.endPoint) {
            points = [el.startPoint.x, el.startPoint.y, el.endPoint.x, el.endPoint.y];
          }
        }
      } catch {}
      // If a draft exists for this id, prefer draft points
      if (!points || points.length < 4) {
        if (draft && (draft.edgeId === id || (draft.from && draft.toWorld))) {
          // Minimal draft support: if from element and current pointer available, draw temporary straight
          try {
            const store = (window as any).__UNIFIED_CANVAS_STORE__;
            const elems = store?.getState()?.elements;
            const srcEl = elems?.get(draft.from.elementId);
            if (srcEl && draft.toWorld) {
              points = [draft.toWorld.x, draft.toWorld.y, draft.toWorld.x + 1, draft.toWorld.y + 1];
            }
          } catch {}
        }
      }
      if (!points || points.length < 4) return;
      
      const startPoint = { x: points[0], y: points[1] };
      const endPoint = { x: points[2], y: points[3] };
      const strokeWidth = connectorNode.strokeWidth();
      
      // Selection highlight (blue glow behind the connector)
      const highlight = new Konva.Line({
        points,
        stroke: 'rgba(59,130,246,0.35)', // Blue glow semi-transparent
        strokeWidth: strokeWidth + 6,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false, // Critical: must not steal events (blueprint requirement)
        strokeScaleEnabled: false, // Consistent width under zoom
        name: 'edge-highlight'
      });
      this.connectorOverlayGroup.add(highlight);
      
      // Source handle (draggable circle at start point)
      const sourceHandle = this.createConnectorHandle(startPoint, id, 'start');
      this.connectorOverlayGroup.add(sourceHandle);
      
      // Target handle (draggable circle at end point) 
      const targetHandle = this.createConnectorHandle(endPoint, id, 'end');
      this.connectorOverlayGroup.add(targetHandle);
    });
  }

  // Create draggable connector handle with proper event handling
  private createConnectorHandle(position: { x: number; y: number }, connectorId: string, endpoint: 'start' | 'end'): Konva.Circle {
    const handle = new Konva.Circle({
      x: position.x,
      y: position.y,
      radius: 8,
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2,
      opacity: 0.95,
      shadowColor: 'black',
      shadowBlur: 4,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.25,
      listening: true,
      draggable: true,
      name: 'edge-handle'
    });
    
    // Handle interactions (following EdgeHandles React component logic)
    handle.on('mouseenter', (e) => {
      e.target.scale({ x: 1.2, y: 1.2 });
      const stage = e.target.getStage();
      if (stage?.container()) {
        stage.container().style.cursor = 'grab';
      }
    });
    
    handle.on('mouseleave', (e) => {
      e.target.scale({ x: 1, y: 1 });
      const stage = e.target.getStage();
      if (stage?.container()) {
        stage.container().style.cursor = '';
      }
    });
    
    handle.on('dragstart', (e) => {
      e.cancelBubble = true;
      
      // Do NOT clear overlay or destroy handles; keep this handle alive during drag
      // Take a history snapshot
      if ((window as any).__UNIFIED_CANVAS_STORE__) {
        (window as any).__UNIFIED_CANVAS_STORE__.getState().saveSnapshot();
      }
      
      // Begin endpoint drag in store
      if ((window as any).__UNIFIED_CANVAS_STORE__) {
        (window as any).__UNIFIED_CANVAS_STORE__.getState().beginEndpointDrag(connectorId, endpoint);
      }
    });
    
    handle.on('dragmove', (e) => {
      e.cancelBubble = true;
      
      // Get current drag position in overlay layer coordinates
      const dragPos = e.target.getAbsolutePosition();
      const overlay = this.layers?.overlay;
      if (!overlay) return;
      const localPos = overlay.getAbsoluteTransform().copy().invert().point(dragPos);
      
      // Update store with new position (preview)
      if ((window as any).__UNIFIED_CANVAS_STORE__) {
        (window as any).__UNIFIED_CANVAS_STORE__.getState().updateEndpointDrag(localPos);
      }
      
      // Preview-only visual updates
      const connectorNode = this.nodeMap.get(connectorId) as Konva.Line | Konva.Arrow | undefined;
      if (connectorNode) {
        const currentPoints = connectorNode.points();
        if (currentPoints.length >= 4) {
          let previewPoints: number[];
          if (endpoint === 'start') {
            previewPoints = [localPos.x, localPos.y, currentPoints[2], currentPoints[3]];
          } else {
            previewPoints = [currentPoints[0], currentPoints[1], localPos.x, localPos.y];
          }
          connectorNode.points([...previewPoints]);
          this.scheduleDraw('main');
          this.scheduleDraw('overlay');
        }
      }
      
      // Move the handle itself to the new position (within overlay layer)
      e.target.position(localPos);
      this.scheduleDraw('overlay');
    });
    
    handle.on('dragend', (e) => {
      e.cancelBubble = true;
      
      // Commit to store first
      if ((window as any).__UNIFIED_CANVAS_STORE__) {
        (window as any).__UNIFIED_CANVAS_STORE__.getState().commitEndpointDrag();
      }
      
      // Re-sync selection overlay at the new position
      const selectedIds = (window as any).__UNIFIED_CANVAS_STORE__?.getState().selectedElementIds || new Set();
      this.syncSelection(selectedIds);
    });
    
    return handle;
  }

  /**
   * Attach text resize handlers with proper scale handling and handle detection
   */
  private attachTextResizeHandlers(groupNode: Konva.Group, textNode: Konva.Text, transformer: Konva.Transformer, elId: string) {
    // Baseline captured at gesture start
    let base = {
      fontSize: textNode.fontSize(),
      width: Math.max(1, textNode.width() || 1),
      height: Math.max(1, textNode.height() || 1),
      x: groupNode.x(),
    };

    // Track active anchor for edge correction
    let activeAnchorName: string = '';
    const DESCENDER_GUARD = 0.12; // small guard to prevent clipping
    let hitRect: Konva.Rect | null = null;
    let visualsFrozen = false;

    const onTransformStart = () => {
      // Capture clean baseline values
      base = {
        fontSize: textNode.fontSize(),
        width: Math.max(1, textNode.width() || 1),
        height: Math.max(1, textNode.height() || 1),
        x: groupNode.x(),
      };

      // Determine which anchor is active (fallback to internal for tests)
      try {
        activeAnchorName = (transformer.getActiveAnchor()?.getName?.() as string) || ((transformer as any)._movingAnchorName as string) || '';
      } catch {
        activeAnchorName = ((transformer as any)._movingAnchorName as string) || '';
      }

      // Cache the invisible hit-area rect only; we treat it as the outer frame
      hitRect = groupNode.findOne<Konva.Rect>('Rect.hit-area') || null;

      // Freeze transformer border to reduce flicker (keep anchors visible)
      try {
        transformer.borderEnabled(false);
        visualsFrozen = true;
      } catch {}

      // Set skip flag for generic handler
      try { groupNode.setAttr('__skipGenericResize', true); } catch {}
    };

    // Pre-cache rectangles for maximum performance
    let cachedRects: Konva.Rect[] = [];
    let lastScale = { x: 1, y: 1 };

    const onTransform = () => {
      // Read scale values (fastest possible)
      const sx = groupNode.scaleX();
      const sy = groupNode.scaleY();

      // Bail early if no meaningful change (reduce flickering)
      if (!sx || !sy || (sx === 1 && sy === 1)) return;
      if (Math.abs(sx - lastScale.x) < 0.01 && Math.abs(sy - lastScale.y) < 0.01) return;

      lastScale.x = sx;
      lastScale.y = sy;

      // Determine active anchor in case it changed mid-gesture
      let anchor = activeAnchorName;
      try {
        anchor = (transformer.getActiveAnchor?.()?.getName?.() as string) || anchor;
      } catch {}

      // Compute new width/font based on anchor semantics
      // Anchor-aware resize
      const clampWidth = (v: number) => (v < 20 ? 20 : v);
      const clampFont = (v: number) => (v < 8 ? 8 : v > 512 ? 512 : v);

      let nextFont = base.fontSize;
      let nextWidth = base.width;

      const isH = anchor.includes('left') || anchor.includes('right');
      const isV = anchor.includes('top') || anchor.includes('bottom');

      if (isH && !isV) {
        // Horizontal edge: width only
        nextWidth = clampWidth(base.width * sx);
        nextFont = base.fontSize;
      } else if (isV && !isH) {
        // Vertical edge: font only
        nextFont = clampFont(base.fontSize * sy);
        nextWidth = base.width;
      } else {
        // Corner: scale font proportionally, width by sx
        const s = Math.sqrt(sx * sy);
        nextFont = clampFont(base.fontSize * s);
        nextWidth = clampWidth(base.width * sx);
      }

      // Apply to text node (minimal calls)
      if (textNode.fontSize() !== nextFont) textNode.fontSize(nextFont);
      if (textNode.width() !== nextWidth) textNode.width(nextWidth);
      // Force text at (0,0) inside group to avoid padding-induced misalignment
      if (textNode.x() !== 0) textNode.x(0);
      if (textNode.y() !== 0) textNode.y(0);

      // Keep the opposite edge stable when dragging from left anchors
      if (anchor.includes('left')) {
        const dx = base.width - nextWidth;
        groupNode.x(base.x + dx);
      }

      // Measure actual rendered height to avoid trailing whitespace
      let renderedTextH = nextFont * 1.2; // fallback
      try {
        textNode._clearCache?.();
        const rect = textNode.getClientRect({ skipTransform: true });
        if (rect && rect.height) {
          renderedTextH = Math.ceil(rect.height + nextFont * DESCENDER_GUARD);
        }
      } catch {}
      // Do NOT update frame/hit rect during live drag to avoid flicker.
      // Only preview via layer redraw; commit at transformend.

      // Reset scale (single call)
      groupNode.scale({ x: 1, y: 1 });

      // Schedule draws via renderer's scheduler to coalesce frames
      try {
        this.scheduleDraw('main');
        this.scheduleDraw('overlay');
      } catch {
        requestAnimationFrame(() => { try { groupNode.getLayer()?.batchDraw?.(); } catch {} });
      }
    };

    const onTransformEnd = () => {
      // Get final values; measure height to avoid whitespace
      const finalFrameWidth = Math.max(1, textNode.width() || 1);
      const finalFont = textNode.fontSize();
      let finalHeight = Math.ceil(finalFont * 1.2);
      try {
        textNode._clearCache?.();
        const rect = textNode.getClientRect({ skipTransform: true });
        if (rect && rect.height) finalHeight = Math.ceil(rect.height + finalFont * DESCENDER_GUARD);
      } catch {}
      const finalFrameHeight = Math.max(1, finalHeight);

      // Update hit-area only (outer frame proxy)
      if (!hitRect) {
        hitRect = groupNode.findOne<Konva.Rect>('Rect.hit-area') || null;
      }
      if (hitRect) {
        hitRect.width(finalFrameWidth);
        hitRect.height(finalFrameHeight);
        hitRect.x(0);
        hitRect.y(0);
      }

      // Ensure hit area matches (fallback)
      try { this.ensureHitAreaSize(groupNode, finalFrameWidth, finalFrameHeight); } catch {}

      // Single transformer update (no immediate batchDraw to reduce flickering)
      transformer.forceUpdate();

      // Delayed draw to let transformer settle
      requestAnimationFrame(() => {
        groupNode.getStage()?.batchDraw();
      });

      // Persist final values (async to avoid blocking)
      setTimeout(() => {
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const attrs = {
            fontSize: finalFont,
            width: finalFrameWidth,
            height: finalFrameHeight,
            x: groupNode.x(),
            scaleX: 1,
            scaleY: 1,
          };
          if (store?.getState?.().commitTextResize) {
            store.getState().commitTextResize(elId as any, attrs);
          } else if (store?.getState?.().updateElement) {
            store.getState().updateElement(elId as any, attrs);
          }
        } catch {}
      }, 0);

      // Restore transformer border
      if (visualsFrozen) {
        try { transformer.borderEnabled(true); } catch {}
      }
    };

    // Clear and attach handlers
    groupNode.off('.textscale');
    groupNode.on('transformstart.textscale', onTransformStart);
    groupNode.on('transform.textscale', onTransform);
    groupNode.on('transformend.textscale', onTransformEnd);
  }

  // Open editor for a specific table cell (r,c)
  private openTableCellEditor(elId: string, node: Konva.Group, row: number, col: number, dims: { cellW: number; cellH: number; pad: number }) {
    // Close previous editor if any
    this.closeCurrentEditor();
    if (!this.stage) return;

    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    if (!store) return;
    const el = store.getState().elements.get(elId);
    if (!el) return;

    const containerRect = this.stage.container().getBoundingClientRect();
    const tableRect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();

    const leftPx = containerRect.left + tableRect.x + col * dims.cellW + dims.pad;
    const topPx  = containerRect.top + tableRect.y + row * dims.cellH + dims.pad;
    const widthPx  = Math.max(4, dims.cellW - 2 * dims.pad);
    const stageScale = this.stage.getAbsoluteScale?.().x || 1;
    const fsPx = (el.fontSize || 13) * stageScale;
    const heightPx = Math.max(4, Math.ceil(fsPx + 2));

    const ta = document.createElement('textarea');
    const currentCells = el.enhancedTableData?.cells || [];
    let currentText = '';
    try { currentText = currentCells[row]?.[col]?.content ?? currentCells[row]?.[col]?.text ?? ''; } catch {}
    ta.value = currentText;
    Object.assign(ta.style, {
      position: 'fixed', left: `${leftPx}px`, top: `${topPx}px`,
      width: `${widthPx}px`, height: `${heightPx}px`,
      fontSize: `${fsPx}px`,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      lineHeight: '1',
      whiteSpace: 'pre',
      wordBreak: 'normal',
      color: el.textColor || '#111827',
      background: 'rgba(255,255,255,0.98)',
      border: '1px solid #3B82F6',
      borderRadius: '4px',
      outline: 'none', resize: 'none', overflow: 'hidden',
      zIndex: '1000',
    } as CSSStyleDeclaration);
    document.body.appendChild(ta);
    this.currentEditor = ta as any;
    ta.focus();

    const commit = () => {
      const next = ta.value;
      // Build new cells matrix with updated content
      const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
      const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));
      const cells = el.enhancedTableData?.cells || [];
      const out: any[][] = [];
      for (let r = 0; r < rows; r++) {
        out[r] = [];
        for (let c = 0; c < cols; c++) {
          if (r === row && c === col) out[r][c] = { content: next };
          else out[r][c] = (cells[r] && cells[r][c]) ? { ...cells[r][c] } : { content: '' };
        }
      }
      this.updateElementCallback?.(elId, { enhancedTableData: { ...(el.enhancedTableData || {}), cells: out } });
      cleanup();
    };
    const cancel = () => cleanup();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); return; }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    };
    ta.addEventListener('keydown', onKeyDown);
    const onBlur = () => commit();
    ta.addEventListener('blur', onBlur);

    const cleanup = () => {
      ta.removeEventListener('keydown', onKeyDown);
      ta.removeEventListener('blur', onBlur);
      ta.remove();
      if (this.currentEditor === ta) this.currentEditor = undefined;
    };
  }

  // Render minimalist add/remove row/col controls for table
  private renderTableControls(elId: string) {
    if (!this.layers?.overlay) return;
    const node = this.nodeMap.get(elId) as Konva.Group | undefined;
    if (!node || node.name() !== 'table') return;

    // Create (or reuse) controls group
    if (!this.tableControlsGroup) {
      this.tableControlsGroup = new Konva.Group({ name: 'table-controls', listening: true, visible: true });
      this.layers.overlay.add(this.tableControlsGroup);
    } else {
      this.tableControlsGroup.visible(true);
      this.tableControlsGroup.destroyChildren();
    }
    this.tableControlsTargetId = elId;

    // Position controls around the table's absolute rect
    const rect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();

    const makeBtn = (x: number, y: number, label: string, onClick: () => void) => {
      const g = new Konva.Group({ x, y, listening: true });
      const bg = new Konva.Rect({ width: 18, height: 18, fill: '#111827', cornerRadius: 4, opacity: 0.85 });
      const txt = new Konva.Text({ x: 5, y: -1, text: label, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif', fill: '#ffffff', listening: false });
      g.add(bg); g.add(txt);
      g.on('mouseenter', () => {
        try {
          const stage = this.stage;
          if (stage) {
            const cont = stage.container();
            if (cont) cont.style.cursor = 'pointer';
          }
        } catch {}
      });
      g.on('mouseleave', () => {
        try {
          const stage = this.stage;
          if (stage) {
            const cont = stage.container();
            if (cont) cont.style.cursor = '';
          }
        } catch {}
      });
      g.on('click', (e) => { e.cancelBubble = true; onClick(); });
      this.tableControlsGroup!.add(g);
    };

    // Read current element (rows/cols) from store
    let el: any = null;
    try { el = (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId); } catch {}
    const rows = Math.max(1, el?.rows || 1), cols = Math.max(1, el?.cols || 1);

    // Divider hover zones (stage coordinates) – contextual +/× controls
    const EDGE = 6; // px hover thickness
    const colW = rect.width / cols;
    const rowH = rect.height / rows;

    // Handlers
    const updateStore = (updates: any) => this.updateElementCallback?.(elId, updates);
    const cloneCells = (cells: any[][], newRows: number, newCols: number) => {
      const out: any[][] = [];
      for (let r = 0; r < newRows; r++) {
        out[r] = [];
        for (let c = 0; c < newCols; c++) {
          out[r][c] = (cells && cells[r] && cells[r][c]) ? { ...cells[r][c] } : { content: '' };
        }
      }
      return out;
    };

    const addRow = () => {
      const current = (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
      const newRows = (current?.rows || rows) + 1;
      const newCols = current?.cols || cols;
      const cells = current?.enhancedTableData?.cells || [];
      const nextCells = cloneCells(cells, newRows, newCols);
      updateStore({ rows: newRows, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } });
      try { this.layoutTable(node, { ...current, rows: newRows, cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } }); } catch {}
      this.scheduleDraw('main');
      this.renderTableControls(elId);
    };
    const delRow = () => {
      const current = (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
      const newRows = Math.max(1, (current?.rows || rows) - 1);
      const newCols = current?.cols || cols;
      const cells = current?.enhancedTableData?.cells || [];
      const nextCells = cloneCells(cells, newRows, newCols);
      updateStore({ rows: newRows, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } });
      try { this.layoutTable(node, { ...current, rows: newRows, cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } }); } catch {}
      this.scheduleDraw('main');
      this.renderTableControls(elId);
    };
    const addCol = () => {
      const current = (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
      const newRows = current?.rows || rows;
      const newCols = (current?.cols || cols) + 1;
      const cells = current?.enhancedTableData?.cells || [];
      const nextCells = cloneCells(cells, newRows, newCols);
      updateStore({ cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } });
      try { this.layoutTable(node, { ...current, rows: newRows, cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } }); } catch {}
      this.scheduleDraw('main');
      this.renderTableControls(elId);
    };
    const delCol = () => {
      const current = (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
      const newRows = current?.rows || rows;
      const newCols = Math.max(1, (current?.cols || cols) - 1);
      const cells = current?.enhancedTableData?.cells || [];
      const nextCells = cloneCells(cells, newRows, newCols);
      updateStore({ cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } });
      try { this.layoutTable(node, { ...current, rows: newRows, cols: newCols, enhancedTableData: { ...(current?.enhancedTableData || {}), cells: nextCells } }); } catch {}
      this.scheduleDraw('main');
      this.renderTableControls(elId);
    };

    const hoverShow = (zone: Konva.Rect, label: string, x: number, y: number, onClick: () => void) => {
      let btn: Konva.Group | null = null;
      const onEnter = () => {
        if (btn) return;
        const g = new Konva.Group({ x, y, listening: true });
        const bg = new Konva.Rect({ width: 18, height: 18, fill: '#111827', cornerRadius: 4, opacity: 0.9 });
        const tx = new Konva.Text({ x: 5, y: -1, text: label, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif', fill: '#ffffff', listening: false });
        g.add(bg); g.add(tx);
        // Inverse-scale so controls stay ~18px regardless of zoom
        try {
          const s = this.stage?.getAbsoluteScale?.().x || 1;
          g.scale({ x: 1 / s, y: 1 / s });
        } catch {}
        g.on('mouseenter', () => {
          try {
            const stage = this.stage;
            if (stage) {
              const cont = stage.container();
              if (cont) cont.style.cursor = 'pointer';
            }
          } catch {}
        });
        g.on('mouseleave', () => {
          try {
            const stage = this.stage;
            if (stage) {
              const cont = stage.container();
              if (cont) cont.style.cursor = '';
            }
          } catch {}
        });
        g.on('click', (e) => { e.cancelBubble = true; onClick(); });
        this.tableControlsGroup!.add(g);
        btn = g;
        this.layers?.overlay?.batchDraw?.();
      };
      const onLeave = () => {
        if (btn) { try { btn.destroy(); } catch {} btn = null; this.layers?.overlay?.batchDraw?.(); }
      };
      zone.on('mouseenter', onEnter);
      zone.on('mouseleave', onLeave);
    };

    // Helpers to update store with index-aware ops
    const getEl = () => (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
    const setEl = (updates: any) => this.updateElementCallback?.(elId, updates);
    const cloneCellsAt = (cells: any[][], newRows: number, newCols: number, insertRowAt?: number, insertColAt?: number) => {
      const out: any[][] = [];
      for (let r = 0; r < newRows; r++) {
        const srcR = insertRowAt !== undefined && r > insertRowAt ? r - 1 : r;
        out[r] = [];
        for (let c = 0; c < newCols; c++) {
          const srcC = insertColAt !== undefined && c > insertColAt ? c - 1 : c;
          const src = (cells && cells[srcR] && cells[srcR][srcC]) ? { ...cells[srcR][srcC] } : { content: '' };
          out[r][c] = src;
        }
      }
      return out;
    };
    const addColAt = (idx: number) => {
      const current = getEl(); if (!current) return;
      const rowsN = current.rows || rows; const colsN = (current.cols || cols) + 1;
      const cells = current.enhancedTableData?.cells || [];
      const nextCells: any[][] = [];
      for (let r = 0; r < rowsN; r++) {
        const rowArr: any[] = [];
        for (let c = 0; c < colsN; c++) {
          if (c === idx) rowArr[c] = { content: '' };
          else {
            const srcC = c > idx ? c - 1 : c;
            rowArr[c] = (cells[r] && cells[r][srcC]) ? { ...cells[r][srcC] } : { content: '' };
          }
        }
        nextCells[r] = rowArr;
      }
      setEl({ cols: colsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.layoutTable(node, { ...current, cols: colsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.scheduleDraw('main'); this.renderTableControls(elId);
    };
    const delColAt = (idx: number) => {
      const current = getEl(); if (!current) return;
      const rowsN = current.rows || rows; const colsN = Math.max(1, (current.cols || cols) - 1);
      const cells = current.enhancedTableData?.cells || [];
      const nextCells: any[][] = [];
      for (let r = 0; r < rowsN; r++) {
        const rowArr: any[] = [];
        for (let c = 0; c < colsN; c++) {
          const srcC = c >= idx ? c + 1 : c;
          rowArr[c] = (cells[r] && cells[r][srcC]) ? { ...cells[r][srcC] } : { content: '' };
        }
        nextCells[r] = rowArr;
      }
      setEl({ cols: colsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.layoutTable(node, { ...current, cols: colsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.scheduleDraw('main'); this.renderTableControls(elId);
    };
    const addRowAt = (idx: number) => {
      const current = getEl(); if (!current) return;
      const rowsN = (current.rows || rows) + 1; const colsN = current.cols || cols;
      const cells = current.enhancedTableData?.cells || [];
      const nextCells: any[][] = [];
      for (let r = 0; r < rowsN; r++) {
        if (r === idx) nextCells[r] = Array.from({ length: colsN }, () => ({ content: '' }));
        else {
          const srcR = r > idx ? r - 1 : r;
          nextCells[r] = [];
          for (let c = 0; c < colsN; c++) {
            nextCells[r][c] = (cells[srcR] && cells[srcR][c]) ? { ...cells[srcR][c] } : { content: '' };
          }
        }
      }
      setEl({ rows: rowsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.layoutTable(node, { ...current, rows: rowsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.scheduleDraw('main'); this.renderTableControls(elId);
    };
    const delRowAt = (idx: number) => {
      const current = getEl(); if (!current) return;
      const rowsN = Math.max(1, (current.rows || rows) - 1); const colsN = current.cols || cols;
      const cells = current.enhancedTableData?.cells || [];
      const nextCells: any[][] = [];
      for (let r = 0; r < rowsN; r++) {
        const srcR = r >= idx ? r + 1 : r;
        nextCells[r] = [];
        for (let c = 0; c < colsN; c++) {
          nextCells[r][c] = (cells[srcR] && cells[srcR][c]) ? { ...cells[srcR][c] } : { content: '' };
        }
      }
      setEl({ rows: rowsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.layoutTable(node, { ...current, rows: rowsN, enhancedTableData: { ...(current.enhancedTableData || {}), cells: nextCells } });
      this.scheduleDraw('main'); this.renderTableControls(elId);
    };

    // Column add zones between cols (including extremes 0..cols)
    for (let c = 0; c <= cols; c++) {
      const x = rect.x + Math.round(c * colW);
      const zone = new Konva.Rect({ x: x - EDGE / 2, y: rect.y - EDGE, width: EDGE, height: rect.height + EDGE * 2, opacity: 0, listening: true, name: `hover-col-${c}` });
      const btnX = x - 9; const btnY = rect.y - 22; // above top border
      hoverShow(zone, '+', btnX, btnY, () => addColAt(c));
      this.tableControlsGroup!.add(zone);
    }

    // Column delete zones in header row area (per column)
    if (cols > 1) {
      for (let c = 0; c < cols; c++) {
        const x = rect.x + c * colW;
        const zone = new Konva.Rect({ x, y: rect.y, width: colW, height: Math.max(20, Math.min(40, rowH)), opacity: 0, listening: true, name: `del-col-${c}` });
        const btnX = x + colW / 2 - 6; const btnY = rect.y - 22; // centered above
        hoverShow(zone, '×', btnX, btnY, () => delColAt(c));
        this.tableControlsGroup!.add(zone);
      }
    }

    // Row add zones between rows (including extremes 0..rows)
    for (let r = 0; r <= rows; r++) {
      const y = rect.y + Math.round(r * rowH);
      const zone = new Konva.Rect({ x: rect.x - EDGE, y: y - EDGE / 2, width: rect.width + EDGE * 2, height: EDGE, opacity: 0, listening: true, name: `hover-row-${r}` });
      const btnX = rect.x - 22; const btnY = y - 9; // to the left
      hoverShow(zone, '+', btnX, btnY, () => addRowAt(r));
      this.tableControlsGroup!.add(zone);
    }

    // Row delete zones at left gutter (per row)
    if (rows > 1) {
      for (let r = 0; r < rows; r++) {
        const y = rect.y + r * rowH;
        const zone = new Konva.Rect({ x: rect.x - Math.max(20, Math.min(40, colW / 3)), y, width: Math.max(20, Math.min(40, colW / 3)), height: rowH, opacity: 0, listening: true, name: `del-row-${r}` });
        const btnX = rect.x - 22; const btnY = y + rowH / 2 - 9; // centered on row
        hoverShow(zone, '×', btnX, btnY, () => delRowAt(r));
        this.tableControlsGroup!.add(zone);
      }
    }

    this.layers?.overlay?.batchDraw?.();
  }

  // Clear table overlay controls
  private clearTableOverlay() {
    if (!this.layers?.overlay) return;
    if (this.tableControlsGroup) {
      try { this.tableControlsGroup.destroyChildren(); this.tableControlsGroup.visible(false); } catch {}
    }
    this.tableControlsTargetId = null;
    this.layers.overlay.batchDraw();
  }
}

export default CanvasRendererV2;
