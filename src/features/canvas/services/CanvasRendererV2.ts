import Konva from 'konva';
import { CanvasElement, ElementId, isRectangleElement } from '../types/enhanced.types';
import { ShapesModule, RendererLayers as ShapesModuleLayers } from './modules/ShapesModule'; // Import ShapesModule
import { requiredRadiusForText } from '../utils/circleAutoGrow'; // Still needed for auto-grow logic in openTextareaEditor
import { getEllipticalTextBounds } from '../renderer/geometry'; // Import from geometry

export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

export class CanvasRendererV2 {
  private shiftPressed: boolean = false;
  private autoFitDuringTyping: boolean = false; // off by default (FigJam-style)
  private editorClipEnabled: boolean = true;    // enabled by default for simplified FigJam-style
  private shapesModule: ShapesModule | null = null; // New ShapesModule instance
  
  // TAURI-SPECIFIC TEXT RENDERING FIX
  static {
    // Enable Konva text rendering fixes for Tauri/WebKit environments
    if (typeof Konva !== 'undefined') {
      (Konva as any)._fixTextRendering = true;
      console.log('[CanvasRendererV2] Enabled Konva text rendering fix for Tauri');
    }
    
    // Ensure fonts are loaded before rendering
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        console.log('[CanvasRendererV2] All fonts loaded and ready');
      }).catch((err) => {
        console.warn('[CanvasRendererV2] Font loading error:', err);
      });
    }
  }
  
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
  
  // Performance optimization: Debounced text updates
  private textUpdateQueue = new Map<string, any>();
  private batchUpdateTimer: number = 0;
  private updateDebounceTimer: number = 0;
  
  // Memory management: Track active tweens for cleanup
  private activeTweens = new Set<Konva.Tween>();
  
  // Accessibility: Track focused element
  private focusedElementId: string | null = null;
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
  private lastHoveredNode: Konva.Node | null = null;
  private groupDrag: any = null;
  
  // Drag state tracking
  private dragLayer: Konva.Layer | null = null;

  // Editor tracking for same-frame DOM overlay sync while editing
  private currentEditor?: HTMLTextAreaElement | HTMLDivElement;
  private currentEditorWrapper?: HTMLDivElement;
  private currentEditorPad?: HTMLDivElement;
  private currentEditingId: string | null = null;
  // private radiusTweens: Map<string, { cancel: () => void }> = new Map(); // Moved to ShapesModule

  // Cache for baseline offset per font signature
  private baselineCache: Map<string, number> = new Map();

  // Visual contract: fixed on-screen padding for circle text (in CSS px)
  private getCirclePadPx(el?: any): number {
    // Allow explicit pixel override via element.paddingPx; otherwise default 16px
    const px = (el && typeof el.paddingPx === 'number') ? el.paddingPx : 16;
    return Math.max(0, px);
  }

  // Lightweight debug gate controlled via window.__CANVAS_TEXT_PARITY_DEBUG__
  private getDebug(): { outlineOverlay?: boolean; log?: boolean; zeroBaseline?: boolean } {
    try { return (window as any).__CANVAS_TEXT_PARITY_DEBUG__ || {}; } catch { return {}; }
  }

  // Compute DOM vs Canvas baseline difference in px and cache it
  private getBaselineOffsetPx(family: string, sizePx: number, lineHeight: number): number {
    const key = `${family}__${Math.round(sizePx)}__${lineHeight}`;
    const cached = this.baselineCache.get(key);
    if (cached !== undefined) return cached;
    try {
      const span = document.createElement('span');
      span.textContent = 'Hgjpq';
      span.style.fontFamily = family;
      span.style.fontSize = `${sizePx}px`;
      span.style.lineHeight = String(lineHeight);
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'pre';
      document.body.appendChild(span);
      const domH = span.getBoundingClientRect().height || sizePx * lineHeight;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let canvasH = sizePx * lineHeight;
      if (ctx) {
        ctx.font = `${sizePx}px ${family}`;
        const m = ctx.measureText(span.textContent || 'Hgjpq');
        const ascend = (m as any).actualBoundingBoxAscent || 0;
        const descend = (m as any).actualBoundingBoxDescent || 0;
        if (ascend || descend) canvasH = ascend + descend;
      }
      document.body.removeChild(span);
      const baselinePx = Math.round((domH - canvasH) / 2);
      this.baselineCache.set(key, baselinePx);
      return baselinePx;
    } catch {
      return 0;
    }
  }

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

  // Performance: Debounced text input handling
  private handleTextInput(elementId: string, newText: string) {
    // Queue updates instead of immediate processing
    this.textUpdateQueue.set(elementId, newText);
    
    // Debounce batch updates for 60fps performance
    clearTimeout(this.batchUpdateTimer);
    this.batchUpdateTimer = window.setTimeout(() => {
      this.processBatchTextUpdates();
    }, 16); // ~60fps
  }
  
  private processBatchTextUpdates() {
    if (this.textUpdateQueue.size === 0) return;
    
    this.textUpdateQueue.forEach((text, elementId) => {
      const node = this.nodeMap.get(elementId);
      if (node && node.getClassName() === 'Group') {
        const element = { id: elementId, text, isEditing: true };
        // this.updateTextWhileEditing(node as Konva.Group, element); // Moved to TextModule
      }
    });
    
    // Single batch draw for all updates
    if (this.layers?.main) {
      this.layers.main.batchDraw();
    }
    
    this.textUpdateQueue.clear();
  }

  // Text
  private createText(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);

    const group = this.shapesModule!.createGroupWithHitArea(id, w, h);
    group.name('text');
    // TEST 4: Snap to integer positions
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });

    const text = new Konva.Text({
      x: 0, y: 0,
      text: el.text || '',
      fontSize: el.fontSize || 14,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fontStyle: (el as any).fontStyle || 'normal',
      fill: el.textColor || '#111827',
      listening: false,
      name: 'text',
      stroke: undefined,
      strokeWidth: 0,
      perfectDrawEnabled: false,
      visible: !!(el.text && el.text.trim())
    });
    // Plain text should not wrap automatically; keep as a single line by default
    (text as any).wrap('none');
    (text as any).align((el as any).align || 'left');
    if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

    group.add(text);
    // Ensure hit-area is comfortably clickable, even for empty/short text
    try {
      const measuredH = Math.ceil(text.height());
      const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
      const targetH = Math.max(minClickableH, measuredH || 0);
      const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
      const targetW = Math.max(minClickableW, w || 1);
      this.shapesModule!.ensureHitAreaSize(group, targetW, targetH);
    } catch {}
    return group;
  }

  private updateText(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });

    const text = group.findOne<Konva.Text>('Text.text');
    if (text) {
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      try { (text as any).fontStyle((el as any).fontStyle || 'normal'); } catch {}
      text.fill(el.textColor || '#111827');
      // For single-line plain text, let Konva calculate natural width to avoid clipping
      try { (text as any).width(undefined); } catch {}
      // Keep plain text single-line by default
      (text as any).wrap('none');
      (text as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

      // Ensure hit-area is comfortably clickable (min height & width guards) and spans the actual text width
      try {
        // Use Konva's text measurement for width/height
        let measuredW = 0;
        try { measuredW = Math.ceil((text as any).getTextWidth?.() || 0); } catch { measuredW = Math.ceil(text.width()); }
        // Ensure on-screen width at least fits the content when no wrapping
        try { (text as any).width(Math.max(w, measuredW)); } catch {}
        const measuredH = Math.ceil(text.height());
        const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
        const targetH = Math.max(minClickableH, measuredH || 0);
        const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
        const targetW = Math.max(minClickableW, measuredW || w || 1);
        this.shapesModule!.ensureHitAreaSize(group, targetW, targetH);
      } catch {}
    } else {
      // Fallback: at least ensure hit-area matches element width
      const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
      const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
      const targetW = Math.max(minClickableW, w || 1);
      this.shapesModule!.ensureHitAreaSize(group, targetW, Math.max(minClickableH, Math.max(1, el.height || 1)));
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


  // Provide plus (+) handle for add actions in table overlay
  private drawPlusHandle(parent: Konva.Group, center: { x: number; y: number }, onClick: () => void): Konva.Group {
    const g = new Konva.Group({ x: center.x, y: center.y, listening: true });
    const hit = new Konva.Rect({ x: -12, y: -12, width: 24, height: 24, fill: 'rgba(0,0,0,0.001)', listening: true, name: 'hit' });
    const circle = new Konva.Circle({ x: 0, y: 0, radius: 8, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 1, listening: false });
    const v = new Konva.Line({ points: [0, -5, 0, 5], stroke: '#2563eb', strokeWidth: 2, listening: false });
    const h = new Konva.Line({ points: [-5, 0, 5, 0], stroke: '#2563eb', strokeWidth: 2, listening: false });
    g.add(hit, circle, v, h);
    g.on('mousedown', (e) => { e.cancelBubble = true; onClick(); });
    parent.add(g);
    return g;
  }

  // duplicate clearTableOverlay removed (see bottom implementation)


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
    const cols = Math.max(1, el.enhancedTableData?.columns?.length || 1);

    // Compute width/height
    let w = Math.max(1, el.width || (cols * (el.cellWidth || 120)));
    let h = Math.max(1, el.height || (rows * (el.cellHeight || 36)));

    const group = this.shapesModule!.createGroupWithHitArea(id, w, h, true);
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
    this.shapesModule!.ensureHitAreaSize(group, w, h);
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
    const pad = (el as any).cellPadding ?? 0;
    const data = (el as any).enhancedTableData?.cells || (el as any).tableData?.cells || (el as any).tableData || [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const content = Array.isArray(data) && data[r] && data[r][c] ? (data[r][c].content ?? data[r][c].text ?? '') : '';
        const tx = new Konva.Text({
          x: c * cellW,
          y: r * cellH,
          width: Math.max(1, cellW),
          height: Math.max(1, cellH),
          text: String(content),
          fontSize: (el as any).fontSize || 13,
          fontFamily: (el as any).fontFamily || 'Inter, system-ui, sans-serif',
          fill: (el as any).textColor || '#111827',
          listening: false,
          name: `cell-text-${r}-${c}`,
          perfectDrawEnabled: false,
        });
        (tx as any).wrap('word');
        (tx as any).align('center'); // Center text horizontally
        (tx as any).verticalAlign('middle'); // Center text vertically
        (tx as any).lineHeight(1.25);
        cellsGroup.add(tx);
      }
    }

    // Ensure hit area reflects current size
    this.shapesModule!.ensureHitAreaSize(group, Math.max(w, innerW), Math.max(h, innerH));
    this.scheduleDraw('main');
  }

  // Image
  private createImage(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);
    
    const group = this.shapesModule!.createGroupWithHitArea(id, w, h);
    group.name('image');
    group.position({ x: el.x || 0, y: el.y || 0 });
    
    // Create the image node
    const imageNode = new Konva.Image({ listening: false, name: 'image-content' } as any);
    imageNode.position({ x: 0, y: 0 });
    imageNode.width(w);
    imageNode.height(h);
    
    // Load the image
    if (el.imageUrl) {
      const imgElement = new Image();
      imgElement.onload = () => {
        imageNode.image(imgElement);
        group.getLayer()?.batchDraw();
      };
      imgElement.src = el.imageUrl;
    }
    
    group.add(imageNode);
    return group;
  }

  private updateImage(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    this.shapesModule!.ensureHitAreaSize(group, w, h);
    
    const imageNode = group.findOne<Konva.Image>('.image-content');
    if (imageNode) {
      imageNode.width(w);
      imageNode.height(h);
      
      // Update image source if changed
      if (el.imageUrl && (!imageNode.image() || (imageNode.image() as HTMLImageElement).src !== el.imageUrl)) {
        const imgElement = new Image();
        imgElement.onload = () => {
          imageNode.image(imgElement);
          group.getLayer()?.batchDraw();
        };
        imgElement.src = el.imageUrl;
      }
    }
  }

  // Sticky Note
  private createStickyNote(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    // Use the standard group creation utility to ensure a reliable hit area.
    const group = this.shapesModule!.createGroupWithHitArea(id, w, h, true);
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
    this.shapesModule!.ensureHitAreaSize(group, w, h);

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

    // Initialize ShapesModule
    this.shapesModule = new ShapesModule(
      this.nodeMap,
      this.layers as ShapesModuleLayers,
      this.updateElementCallback,
      this.scheduleDraw.bind(this),
      this.refreshTransformer.bind(this),
      this.currentEditingId,
      this.currentEditorWrapper,
      this.currentEditorPad,
      this.stage,
      this.getCirclePadPx.bind(this),
      this.getBaselineOffsetPx.bind(this),
      this.getDebug.bind(this)
    );

    // Shift-constrain & Capture anchor and pre-rects at transform start for precise commit positioning
    this.transformer.on('transformstart.renderer', () => {
      try {
        const aa = this.transformer?.getActiveAnchor?.();
        const anchorName = (aa && (typeof (aa as any).name === 'function' ? (aa as any).name() : (aa as any).getName?.())) || ((this.transformer as any)?._movingAnchorName as string) || '';
        this.lastActiveAnchorName = anchorName || '';
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
              this.shapesModule!.ensureHitAreaSize(group, targetW, finalH);

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
              this.shapesModule!.ensureHitAreaSize(group, targetW, targetH);
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

        // Image-specific handling: scale image node dimensions and reset scale
        try {
          const group = node as Konva.Group;
          if (group.name() === 'image') {
            const imageNode = group.findOne<Konva.Image>('.image-content');
            if (imageNode) {
              const baseW = imageNode.width();
              const baseH = imageNode.height();
              const targetW = Math.max(10, Math.abs(baseW * sX));
              const targetH = Math.max(10, Math.abs(baseH * sY));

              // Normalize scale and apply new dimensions
              group.scale({ x: 1, y: 1 });
              imageNode.width(targetW);
              imageNode.height(targetH);

              // Update hit area and persist
              this.shapesModule!.ensureHitAreaSize(group, targetW, targetH);
              this.updateElementCallback?.(id, {
                width: targetW,
                height: targetH,
                x: group.x(),
                y: group.y(),
                scaleX: 1,
                scaleY: 1,
              });

              // Force transformer update
              this.transformer?.forceUpdate?.();
              this.scheduleDraw('main');
              this.scheduleDraw('overlay');

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
              this.shapesModule!.ensureHitAreaSize(group, targetW, targetH);

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

        // Special case: circles/ellipses update radii + hit area
        try {
          const group0 = node as Konva.Group;
          const isCircleGroup = group0.name() === 'circle' || group0.name() === 'circle-text';
          if (isCircleGroup) {
            const radiusX = Math.round(nextW / 2);
            const radiusY = Math.round(nextH / 2);
            const ellipseShape = group0.findOne('Ellipse.shape') as Konva.Ellipse | null;
            const circleShape = group0.findOne('Circle.shape') as Konva.Circle | null;
            
            if (ellipseShape) {
              // Keep shape centered at origin; only radii change
              ellipseShape.position({ x: 0, y: 0 });
              ellipseShape.radiusX(radiusX);
              ellipseShape.radiusY(radiusY);
            } else if (circleShape) {
              // Convert circle to ellipse if resizing to non-square
              if (Math.abs(radiusX - radiusY) > 2) {
                const newEllipse = new Konva.Ellipse({
                  x: 0,
                  y: 0,
                  radiusX: radiusX,
                  radiusY: radiusY,
                  fill: circleShape.fill(),
                  stroke: circleShape.stroke(),
                  strokeWidth: circleShape.strokeWidth(),
                  name: 'shape',
                  listening: false
                });
                circleShape.destroy();
                group0.add(newEllipse);
              } else {
                // Keep as circle if square
                const r = Math.max(radiusX, radiusY);
                circleShape.position({ x: 0, y: 0 });
                circleShape.radius(r);
              }
            }
            
            // Hit-area: keep center-origin for circle/ellipse
            try {
              const hit = group0.findOne<Konva.Rect>('Rect.hit-area');
              if (hit) hit.setAttrs({ x: -radiusX, y: -radiusY, width: 2 * radiusX, height: 2 * radiusY });
            } catch {}
            // Neutralize scale
            node.scale({ x: 1, y: 1 });
            // Commit to store with width/height + radii
            this.updateElementCallback?.(id, {
              width: nextW,
              height: nextH,
              radiusX: radiusX,
              radiusY: radiusY,
              ...(Math.abs(radiusX - radiusY) < 1 ? { radius: Math.max(radiusX, radiusY) } : {}),
              // Do not modify x,y so the center remains fixed (centeredScaling)
            });
            return; // Skip generic rect handling for circles
          }
        } catch {}

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
            this.shapesModule!.ensureHitAreaSize(group, nextW, nextH); 
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
      const currentNodes = this.transformer?.nodes?.() || [];
      if (currentNodes.length > 0 && this.transformer) {
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
    // Track Shift key state for constrain-on-hold behavior
    const onKeyDown = (ev: KeyboardEvent) => { if (ev.key === 'Shift') { this.shiftPressed = true; if (this.transformer && this.transformer.nodes().length === 1) { const n = this.transformer.nodes()[0]; if (n?.name?.() === 'circle') { this.transformer.keepRatio(true); this.layers?.overlay?.batchDraw(); } } } };
    const onKeyUp = (ev: KeyboardEvent) => { if (ev.key === 'Shift') { this.shiftPressed = false; if (this.transformer && this.transformer.nodes().length === 1) { const n = this.transformer.nodes()[0]; if (n?.name?.() === 'circle') { this.transformer.keepRatio(true); this.layers?.overlay?.batchDraw(); } } } };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this.stage.on('mousedown.renderer', (e: any) => {
      // Ignore clicks on transformer anchors, but allow dragging the selected node when clicking transformer body
      const cls = e.target?.getClassName?.();
      const parentCls = e.target?.getParent?.()?.getClassName?.();
      if (cls === 'Transformer' || parentCls === 'Transformer') {
        // Let transformer/anchors handle resize/rotate. Do not force-start drag here
        return;
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
        // If this is a double-click on a text-like element, open the editor immediately
        try {
          const clickCount = (e.evt as any)?.detail;
          const isDouble = typeof clickCount === 'number' && clickCount >= 2;
          const isTextLike = node.name() === 'sticky-note' || node.name() === 'text' || node.name() === 'rectangle' || node.name() === 'circle' || node.name() === 'triangle' || node.name() === 'circle-text';
          if (!multi && isDouble && isTextLike) {
            this.openTextareaEditor(node.id(), node);
          }
        } catch {}
        // Allow natural drag start via Konva's dragDistance threshold; do not force startDrag()
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
        // Initialize group-drag preview if element has a groupId
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const el = store?.getState()?.elements?.get(node?.id?.());
          const groupId = el?.groupId;
          if (node && groupId) {
            const members: string[] = [];
            const base = new Map<string, { x: number; y: number }>();
            store.getState().elements.forEach((val: any, key: string) => {
              if (val?.groupId === groupId) members.push(key);
            });
            members.forEach((mid) => {
              const mnode = this.nodeMap.get(mid) as Konva.Node | undefined;
              if (mnode) base.set(mid, { x: mnode.x(), y: mnode.y() });
            });
            this.groupDrag = { groupId, base, members } as any;
          } else {
            (this as any).groupDrag = null;
          }
        } catch { (this as any).groupDrag = null; }
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

      // If we were group-dragging, commit sibling positions too
      let savedGd: { base: Map<string,{x:number;y:number}>; members: string[] } | null = null;
      try {
        const gd = (this as any).groupDrag as { base: Map<string,{x:number;y:number}>; members: string[] } | null;
        savedGd = gd;
        if (gd) {
          const base = gd.base.get(node.id());
          if (base) {
            const dx = node.x() - base.x;
            const dy = node.y() - base.y;
            gd.members.forEach((mid) => {
              if (mid === node.id()) return;
              const mbase = gd.base.get(mid);
              if (mbase) this.updateElementCallback?.(mid, { x: mbase.x + dx, y: mbase.y + dy });
            });
          }
        }
      } catch {}
      (this as any).groupDrag = null;

      // Force immediate edge reflow so branches don't snap back
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (store) {
          const movedIds: string[] = [];
          if (savedGd) movedIds.push(...savedGd.members);
          if (movedIds.length === 0) movedIds.push(node.id());
          const api = store.getState();
          movedIds.forEach((id: string) => api.reflowEdgesForElement?.(id as any));
          api.computeAndCommitDirtyEdges?.();
        }
      } catch {}

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
      // Group-drag preview for mindmap-like groups
      try {
        const gd = (this as any).groupDrag as { base: Map<string,{x:number;y:number}>; members: string[] } | null;
        if (gd) {
          const base = gd.base.get(node.id());
          if (base) {
            const dx = node.x() - base.x;
            const dy = node.y() - base.y;
            gd.members.forEach((mid) => {
              if (mid === node.id()) return;
              const mnode = this.nodeMap.get(mid) as Konva.Node | undefined;
              const mbase = gd.base.get(mid);
              if (mnode && mbase) mnode.position({ x: mbase.x + dx, y: mbase.y + dy });
            });
            this.previewReflowEdgesForMovedNodes(new Set(gd.members));
            this.scheduleDraw('main');
          }
        }
      } catch {}
    });
    
    // Double-click for text/cell editing
    this.stage.on('dblclick.renderer', (e: any) => {
      console.info('[RendererV2] dblclick received', { target: e.target?.name?.(), id: e.target?.id?.(), className: e.target?.getClassName?.() });

      // Resolve the element node, with a fallback when the Transformer intercepts the event
      let node = this.getElementNodeFromEvent(e.target);
      if ((!node || !node.id()) && (e.target?.getClassName?.() === 'Transformer' || e.target?.getParent?.()?.getClassName?.() === 'Transformer')) {
        // If transformer is clicked, prefer the single selected node (expected flow for edit-on-dblclick)
        const selected = this.transformer?.nodes() || [];
        if (selected.length === 1) {
          node = selected[0];
        }
      }

      if (!node || !node.id()) return;

      const isTextLike = node.name() === 'sticky-note' || node.name() === 'text' || node.name() === 'rectangle' || node.name() === 'circle' || node.name() === 'triangle' || node.name() === 'circle-text';
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
            (this.lastHoveredNode as any as Konva.Line).strokeWidth(storeEl.strokeWidth || 2);
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

    // Mark element as editing in the store so syncElements skips canvas text rendering
    try {
      if ((el as any).type === 'text' || (el as any).type === 'rich-text') {
        this.updateElementCallback?.(elId, { isEditing: true });
      }
    } catch {}

    // Stage container offset in the page (accounts for sidebars, padding, transforms)
    const containerRect = this.stage.container().getBoundingClientRect();

    // DOM positioning math
    // Prefer measuring the intrinsic text bounds from the Konva.Text node itself for consistency
    let leftPx = 0, topPx = 0, widthPx = 0, heightPx = 0;
    const group = node as Konva.Group;
    const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
    if (textNode && !(el as any).type?.includes('sticky') && !(['rectangle','circle','triangle','circle-text'].includes(String((el as any).type)))) {
      const rect = textNode.getSelfRect();
      const absPos = textNode.getAbsolutePosition();
      const absScale = textNode.getAbsoluteScale();
      const sx = typeof absScale?.x === 'number' ? absScale.x : 1;
      const sy = typeof absScale?.y === 'number' ? absScale.y : 1;
      const xStage = absPos.x + rect.x * sx;
      const yStage = absPos.y + rect.y * sy;
      leftPx = containerRect.left + xStage;
      topPx = containerRect.top + yStage;
      widthPx = Math.max(4, rect.width * sx);
      heightPx = Math.max(4, rect.height * sy);
    } else {
      // Fallback to group rect for shapes/sticky and when text node isn't found
      const absRect = (node as any).getClientRect?.({ skipTransform: false, skipShadow: true, skipStroke: true }) ?? node.getClientRect();
      leftPx = containerRect.left + absRect.x;
      topPx  = containerRect.top + absRect.y;
      widthPx  = Math.max(4, absRect.width);
      heightPx = Math.max(4, absRect.height);
    }

    // Sticky paddings (match your visual text insets)
    // Use sticky note padding when applicable; plain text has no internal padding
    const isSticky = (el as any).type === 'sticky-note';
    const isShapeLike = (el as any).type === 'rectangle' || (el as any).type === 'circle' || (el as any).type === 'triangle' || (el as any).type === 'circle-text';
    const isRect = (el as any).type === 'rectangle';
    const isCircle = (el as any).type === 'circle' || (el as any).type === 'circle-text';
    const isTriangle = (el as any).type === 'triangle';

    const padWorld = (isSticky || isShapeLike)
      ? (typeof (el as any).padding === 'number'
          ? Math.max(0, (el as any).padding)
          : (() => { const r = Math.max(0, (el as any).radius || (el as any).radiusX || 0); return r <= 60 ? 4 : Math.max(4, Math.round((r / 60) * 4)); })())
      : 0;
    const absScale = this.stage.getAbsoluteScale?.();
    const stageScale = absScale && typeof absScale.x === 'number' ? absScale.x : 1;
    let padPx = padWorld * stageScale;

    let contentLeft = leftPx + padPx;
    let contentTop = topPx + padPx;
    let contentWidth = widthPx - padPx * 2;
    let contentHeight = heightPx - padPx * 2;

    // Create wrapper and editor before positioning logic
    const editWrapper = document.createElement('div');
    // Ensure wrapper participates in hit testing only while editing
    // and cannot accidentally block the canvas after cleanup
    editWrapper.style.pointerEvents = 'auto';
    const padDiv = document.createElement('div');
    const ta: HTMLTextAreaElement | HTMLDivElement = (isCircle
      ? (() => { const d = document.createElement('div'); d.setAttribute('contenteditable', 'true'); d.setAttribute('role','textbox'); d.setAttribute('aria-multiline','true'); return d; })()
      : document.createElement('textarea')) as any;
    // Mark as active text editing to avoid global shortcut interference
    (ta as HTMLElement).setAttribute('data-role', 'canvas-text-editor');
    (ta as HTMLElement).setAttribute('data-text-editing', 'true');
    // For plain text, force single-line behavior in the editor
    if (!isSticky && !isShapeLike && !isCircle && !isTriangle && !isRect) {
      try { (ta as HTMLTextAreaElement).setAttribute('wrap', 'off'); } catch {}
    }
    
    // Attach editor to wrapper via pad container
    editWrapper.appendChild(padDiv);
    padDiv.appendChild(ta as HTMLElement);
    // Track editing ID and wrapper for live geometry updates
    this.currentEditingId = elId;
    this.currentEditorWrapper = editWrapper;

    if (isCircle) {
      // Use renderer-owned overlay square sized to the inscribed square of (r - pad - stroke/2)
      const absT = (node as Konva.Group).getAbsoluteTransform();
      const p0 = absT.point({ x: 0, y: 0 });
      const px = absT.point({ x: 1, y: 0 });
      const py = absT.point({ x: 0, y: 1 });
      const sx = Math.abs(px.x - p0.x);
      const sy = Math.abs(py.y - p0.y);
      const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));

      const worldRadiusX = (el as any).radiusX ?? (el as any).radius ?? 0;
      const worldRadiusY = (el as any).radiusY ?? (el as any).radius ?? 0;
      const pad = Math.max(0, (el as any).padding ?? 12);
      const strokeWidth = (el as any).strokeWidth ?? 1;

      // For robust caret behavior across browsers, keep DOM overlay rectangular while editing
      editWrapper.style.clipPath = 'none';
      editWrapper.style.borderRadius = '0';
      editWrapper.style.overflow = 'hidden';

      // Inscribed SQUARE for circles/ellipses: use visible radius (subtract stroke only)
      const minR = Math.max(1, Math.min(worldRadiusX, worldRadiusY) - strokeWidth / 2);
      const sideWorld = Math.SQRT2 * minR;
      const sidePx = Math.max(60, sideWorld * sLim);
      const center = absT.point({ x: 0, y: 0 });
      const dpr = (window.devicePixelRatio || 1);
      const roundPx = (v: number) => Math.round(v * dpr) / dpr;
      const ceilPx = (v: number) => Math.ceil(v * dpr) / dpr;
      contentLeft = containerRect.left + center.x; // center-anchored
      contentTop = containerRect.top + center.y;  // center-anchored
      contentWidth = sidePx;
      contentHeight = sidePx;
      // Snap center and size for crisp overlay alignment
      contentLeft = roundPx(contentLeft);
      contentTop = roundPx(contentTop);
      contentWidth = ceilPx(contentWidth);
      contentHeight = ceilPx(contentHeight);
      if (this.getDebug().outlineOverlay) {
        editWrapper.style.outline = '1px solid red';
      }
      // Fixed pad in screen px per visual contract
      padPx = this.getCirclePadPx(el);
    } else if (isTriangle) {
        const triangleTextOffsetWorld = Math.max(padWorld, (el.height || 0) * 0.55);
        const triangleOffsetPx = triangleTextOffsetWorld * stageScale;
        const topWidthPx = Math.max(4, widthPx * (triangleTextOffsetWorld / Math.max(1, (el.height || 1))));
        contentLeft = leftPx + Math.max(0, Math.floor((widthPx - topWidthPx) / 2)) + padPx;
        contentTop = topPx + triangleOffsetPx;
        contentWidth = Math.max(4, topWidthPx - padPx * 2);
        contentHeight = Math.max(4, heightPx - triangleTextOffsetWorld - padPx);
    }

    // Rotation (absolute)
    const absRot = (node as any).getAbsoluteRotation?.() ?? 0;

    // Ensure we have a valid text color - guard against problematic values
    const safeTextColor = (() => {
      const color = el.textColor;
      // If custom textColor is provided, validate it
      if (color && typeof color === 'string' && color.length > 0) {
        // Basic validation - must start with # or be a named color
        if (color.startsWith('#') || /^[a-zA-Z]+$/.test(color)) {
          return color;
        }
      }
      // Default fallback colors
      return el.type === 'sticky-note' ? '#451a03' : '#111827';
    })();

    if (isCircle) {
      (ta as HTMLDivElement).innerText = el.text ?? '';
      (ta as HTMLElement).setAttribute('spellcheck', 'false');
      (ta as HTMLElement).setAttribute('autocorrect', 'off');
      (ta as HTMLElement).setAttribute('autocomplete', 'off');
      (ta as HTMLElement).setAttribute('autocapitalize', 'off');
    } else {
      (ta as HTMLTextAreaElement).value = el.text ?? '';
      (ta as HTMLTextAreaElement).setAttribute('spellcheck', 'false');
      (ta as HTMLTextAreaElement).setAttribute('autocorrect', 'off');
      (ta as HTMLTextAreaElement).setAttribute('autocomplete', 'off');
      (ta as HTMLTextAreaElement).setAttribute('autocapitalize', 'off');
    }

    // Allow interaction inside the overlay
    ta.style.pointerEvents = 'auto';

    // Compute current stage scale for font sizing parity (stageScale already computed above)
    const lh = (el as any).lineHeight ?? 1.3;
    const ff = (el as any).fontFamily || 'Inter, system-ui, sans-serif';
    const fs = Math.max(1, (el as any).fontSize || 14) * stageScale;
    const ls = (el as any).letterSpacing ?? 0;

    // Apply positioning and transform styles to the wrapper
    // Anchor strategy:
    // - Circles use center-anchored overlay (translate(-50%, -50%))
    // - Sticky notes and other shapes use top-left anchoring (no translate)
    // - Plain text uses top-left anchoring
    const isPlainText = !(isSticky || isShapeLike || isTriangle || isCircle || isRect);
    const useCenterAnchoring = !!isCircle; // only circles are center-anchored
    const transformStyle = useCenterAnchoring
      ? (this.rotateTextareaWhileEditing ? `translate(-50%, -50%) rotate(${absRot}deg)` : 'translate(-50%, -50%)')
      : 'none';
    const transformOriginStyle = useCenterAnchoring ? '50% 50%' : '0 0';
    Object.assign(editWrapper.style, {
      position: 'fixed',
      left: `${contentLeft}px`,
      top: `${contentTop}px`,
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      transform: transformStyle,
      transformOrigin: transformOriginStyle,
      zIndex: '2147483647',
      pointerEvents: 'auto',
      opacity: '1',
      display: 'block',
      visibility: 'visible',
    });

    // Pad container fills overlay and carries all padding (no padding on editor itself)
    Object.assign(padDiv.style, {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'block',
      paddingTop: `${Math.max(0, Math.round(padPx))}px`,
      paddingBottom: `${Math.max(0, Math.round(padPx))}px`,
      paddingLeft: `${Math.max(0, Math.round(padPx))}px`,
      paddingRight: `${Math.max(0, Math.round(padPx))}px`,
    } as CSSStyleDeclaration);

    // Apply text and appearance styles to the textarea itself
    Object.assign((ta as HTMLElement).style, {
      width: '100%',
      height: '100%',
      fontSize: `${fs}px`,
      fontFamily: ff,
      lineHeight: String(lh), // unitless to match Konva
      letterSpacing: `${ls}px`,
      fontKerning: 'normal',
      fontVariantLigatures: 'normal',
      fontFeatureSettings: '"kern" 1, "liga" 1',
      color: safeTextColor,
      background: isPlainText ? 'white' : 'transparent',
      border: isPlainText ? '1px solid #3B82F6' : 'none',
      borderRadius: isPlainText ? '4px' : '0',
      padding: '0', // all padding lives on padDiv for consistent measurement
      margin: '0',
      boxSizing: 'content-box',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: (isSticky || isShapeLike) ? 'pre-wrap' : 'pre',
      wordBreak: (isSticky || isShapeLike) ? 'break-word' : 'normal',
      caretColor: '#3B82F6',
      minHeight: `${Math.max(4, Math.ceil(fs * lh) + 2)}px`,
      zIndex: '2147483647'
    });
    // Force visibility with !important flags after initial assignment
    try {
      ((ta as HTMLElement).style as any).setProperty('color', safeTextColor, 'important');
      ((ta as HTMLElement).style as any).setProperty('-webkit-text-fill-color', safeTextColor, 'important');
      ((ta as HTMLElement).style as any).setProperty('opacity', '1', 'important');
      ((ta as HTMLElement).style as any).setProperty('visibility', 'visible', 'important');
      ((ta as HTMLElement).style as any).setProperty('mix-blend-mode', 'normal', 'important');
      ((ta as HTMLElement).style as any).setProperty('filter', 'none', 'important');
      ((ta as HTMLElement).style as any).setProperty('text-shadow', 'none', 'important');
      ((ta as HTMLElement).style as any).setProperty('caret-color', '#3B82F6', 'important');
    } catch {}
    // Help some browsers accept programmatic focus reliably
    try { (ta as HTMLElement).setAttribute('autofocus', 'true'); } catch {}
    try { (ta as any).tabIndex = 0; } catch {}

    // Improve readability while editing shapes - cleaner, less clunky appearance
    if (isShapeLike) {
      const shapeFill = (el as any).fill || (el as any).backgroundColor || '#ffffff';
      ta.style.background = shapeFill;
      ta.style.border = 'none';
      ta.style.borderRadius = '8px';
      // Force text visibility with strong overrides in case of global CSS
      try { (ta.style as any).setProperty('color', safeTextColor, 'important'); } catch { ta.style.color = safeTextColor; }
      try { (ta.style as any).setProperty('-webkit-text-fill-color', safeTextColor, 'important'); } catch { (ta.style as any).webkitTextFillColor = safeTextColor; }
      try { (ta.style as any).setProperty('opacity', '1', 'important'); } catch {}
      try { (ta.style as any).setProperty('visibility', 'visible', 'important'); } catch {}
      try { (ta.style as any).setProperty('mix-blend-mode', 'normal', 'important'); } catch {}
      try { (ta.style as any).setProperty('filter', 'none', 'important'); } catch {}
      try { (ta.style as any).setProperty('text-shadow', 'none', 'important'); } catch {}
      ta.style.textAlign = isRect ? 'left' : 'center';
      (ta.style as any).overflowWrap = 'break-word';
      ta.style.wordBreak = 'break-word';
      (ta.style as any).mixBlendMode = 'normal';
      (ta.style as any).appearance = 'none';
      ta.style.textShadow = 'none';
      // Clean appearance without system styling
      (ta.style as any).webkitAppearance = 'none';
      (ta.style as any).mozAppearance = 'none';
      ta.style.outline = 'none';
      ta.style.boxShadow = 'none';
      try {
        (ta.style as any).setProperty('box-shadow', 'none', 'important');
        (ta.style as any).setProperty('border', 'none', 'important');
        (ta.style as any).setProperty('outline', 'none', 'important');
      } catch {}
      // Remove transition to prevent flashing during resize
      ta.style.transition = 'none';
      // Force text color in high contrast mode
      (ta.style as any).forcedColorAdjust = 'none';
      // Match shape background for parity
      ta.style.backgroundColor = shapeFill;
      
      // Shape-specific styling improvements
      if (isCircle) {
        const s = (ta as HTMLElement).style;
        // Match display-time text alignment and left indent
      const leftIndentPx = Math.max(4, Math.round(((el as any).padding ?? 12) * 0.5)) * stageScale;
      s.textAlign = 'left';
      s.background = 'transparent';
      // no padding on the editor itself; padDiv carries it
      s.boxShadow = 'none';
      s.border = 'none';
      s.overflow = 'hidden'; // no scrollbars while typing
      s.resize = 'none';
      s.lineHeight = String(lh);
      s.display = 'block';
      s.whiteSpace = 'pre-wrap';
      (s as any).wordBreak = 'break-word';
      (s as any).overflowWrap = 'break-word';
      s.borderRadius = '0';
    }
      if (isTriangle) {
        ta.style.textAlign = 'center';
        ta.style.paddingTop = '2px';
        // Keep rectangle overlay; avoid clipPath to reduce aliasing artifacts
        ta.style.border = 'none';
        ta.style.boxShadow = 'none';
      }
      
      // Rectangle-specific fixes for Edge text visibility issues
      if (isRect) {
        // Ensure proper text rendering for left-aligned text in Edge
        ta.style.textRendering = 'optimizeLegibility';
        (ta.style as any).webkitFontSmoothing = 'antialiased';
        (ta.style as any).mozOsxFontSmoothing = 'grayscale';
        // Additional contrast fix for Edge
        ta.style.textDecoration = 'none';
        ta.style.textIndent = '0px';
        // Force explicit font properties to prevent Edge defaults
        ta.style.fontWeight = 'normal';
        ta.style.fontStyle = 'normal';
        ta.style.fontVariant = 'normal';
      }
    }

    // Keep table controls aligned during zoom/pan via wheel
    this.stage.on('wheel.renderer', () => {
      if (this.tableControlsTargetId) {
        try { this.renderTableControls(this.tableControlsTargetId); } catch {}
      }
    });

    // Insert into document to avoid overlay root intercepting outside clicks
    document.body.appendChild(editWrapper);
    
    // Force immediate repaint to establish proper compositing layers
    editWrapper.style.display = 'none';
    editWrapper.offsetHeight; // Force reflow
    editWrapper.style.display = 'block';
    // Track current editor references for live same-frame sync
    this.currentEditingId = elId;
    this.currentEditorWrapper = editWrapper;
    this.currentEditorPad = padDiv;

    // Focus textarea when clicking anywhere inside the wrapper
    const focusTextarea = (evt: Event) => {
      try {
        if (document.activeElement !== ta) {
          if (ta instanceof HTMLTextAreaElement) {
            (ta as HTMLTextAreaElement).focus({ preventScroll: true });
            const len = (ta as HTMLTextAreaElement).value?.length ?? 0;
            (ta as HTMLTextAreaElement).setSelectionRange(len, len);
          } else {
            (ta as HTMLDivElement).focus({ preventScroll: true });
          }
        }
      } catch {}
    };
    editWrapper.addEventListener('mousedown', (e) => { focusTextarea(e); }, true);
    editWrapper.addEventListener('pointerdown', (e) => { focusTextarea(e); }, true);
    
    // Focus textarea immediately for instant typing capability
    this.currentEditor = ta as any; // track for later cleanup
    
    // Debug: Log final computed styles
    console.log('[DEBUG] Textarea setup complete:', {
      wrapperStyles: {
        opacity: editWrapper.style.opacity,
        visibility: editWrapper.style.visibility,
        position: editWrapper.style.position,
        left: editWrapper.style.left,
        top: editWrapper.style.top
      },
      textareaStyles: {
        color: ta.style.color,
        webkitTextFillColor: (ta.style as any).webkitTextFillColor,
        opacity: ta.style.opacity,
        visibility: ta.style.visibility,
        background: ta.style.background
      },
      computedTextareaStyles: {
        color: window.getComputedStyle(ta).color,
        webkitTextFillColor: window.getComputedStyle(ta).webkitTextFillColor,
        opacity: window.getComputedStyle(ta).opacity,
        visibility: window.getComputedStyle(ta).visibility
      }
    });
    
    // Try immediate focus first
    try {
      if (ta instanceof HTMLTextAreaElement) {
        (ta as HTMLTextAreaElement).focus({ preventScroll: true });
        const len = (ta as HTMLTextAreaElement).value?.length ?? 0;
        (ta as HTMLTextAreaElement).setSelectionRange(len, len);
      } else {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ta as Node);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    } catch {}
    
    // Also schedule focus attempts to ensure it works
    const tryFocus = () => {
      try {
        if (document.activeElement !== ta) {
          if (ta instanceof HTMLTextAreaElement) {
            (ta as HTMLTextAreaElement).focus({ preventScroll: true });
            const len = (ta as HTMLTextAreaElement).value?.length ?? 0;
            (ta as HTMLTextAreaElement).setSelectionRange(len, len);
          } else {
            (ta as HTMLDivElement).focus({ preventScroll: true });
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(ta as Node);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      } catch {}
    };
    
    // Multiple attempts to ensure focus works across browsers
    requestAnimationFrame(tryFocus);
    const t0 = setTimeout(tryFocus, 0) as unknown as number;
    const t1 = setTimeout(tryFocus, 50) as unknown as number;
    const t2 = setTimeout(tryFocus, 150) as unknown as number;
    (ta as any).__focusTimers = [t0, t1, t2];
    console.info('[RendererV2] textarea appended to body and scheduled focus');

    // Hide transformer while editing
    const prevTransformerVisible = this.transformer?.visible() ?? true;
    try { this.transformer?.visible(false); this.scheduleDraw('overlay'); } catch {}

    // For plain text, hide the Konva text node while editing (match react-image-editor)
    let prevTextVisible: boolean | undefined;
    // For shape nodes, temporarily disable shadows to avoid visible rings while editing
    let prevShapeShadow: { node: Konva.Shape; opacity: number; blur: number; off: { x: number; y: number } } | undefined;
    if (!isSticky) {
      try {
        const group = node as Konva.Group;
        const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
        if (textNode) {
          prevTextVisible = textNode.visible();
          textNode.visible(false);
          this.scheduleDraw('main');
        }
        // Disable shadow for shapes while editing
        if (isCircle || isTriangle || isRect) {
          const shapeNode =
            (isCircle && (group.findOne<Konva.Circle>('Circle.shape') as any)) ||
            (isTriangle && (group.findOne<Konva.Line>('Line.shape') as any)) ||
            (isRect && (group.findOne<Konva.Rect>('Rect.bg') as any));
          if (shapeNode) {
            prevShapeShadow = {
              node: shapeNode,
              opacity: shapeNode.shadowOpacity?.() ?? 0,
              blur: shapeNode.shadowBlur?.() ?? 0,
              off: shapeNode.shadowOffset?.() || { x: 0, y: 0 },
            };
            try {
              shapeNode.shadowOpacity(0);
              shapeNode.shadowBlur(0);
              shapeNode.shadowOffset({ x: 0, y: 0 });
              this.scheduleDraw('main');
            } catch {}
          }
        }
      } catch {}
    }

    // Enhanced measurement logic with circle-specific geometry
    const measureStickyConsistent = () => {
      // Handle circle expansion or regular shape auto-height
      const fontSize = (el as any).fontSize || 14;
      let newHeight = contentHeight;
      
      // Auto-size textarea height for non-circle shapes
      // Save current height to restore if needed
      const currentHeight = ta.style.height;
      ta.style.height = 'auto';
      const scrollHeight = Math.ceil(ta.scrollHeight);
      // Last-line guard to prevent jumpy near-bottom clipping
      const guardPx = Math.max(4, Math.ceil(fontSize * 0.4 * stageScale));
      const minLinePx = Math.max(4, Math.ceil(fs * lh) + 2); // ensure at least one line height to prevent caret jump
      // Allow both growth and shrink: remove previous contentHeight clamp
      newHeight = Math.max(scrollHeight + guardPx, minLinePx);
      
      // Only update height if it actually changed
      if (Math.abs(parseInt(currentHeight) - newHeight) > 1) {
        ta.style.height = `${newHeight}px`;
      } else {
        ta.style.height = currentHeight; // Restore to avoid reflow
      }
      
      // Proposed height based on current content
      let finalElementHeightWorld = (newHeight + padPx * 2) / stageScale;
      
      try {
        const group = node as Konva.Group;
        
        if (isCircle) {
          // FigJam-style typing: keep shape fixed by default; only reflow text. No auto-grow.
          const basePadWorld = padWorld;
          const ellipse = group.findOne<Konva.Ellipse>('Ellipse.shape') || group.findOne<Konva.Circle>('Circle.shape');
          if (ellipse) {
            const currentScale = this.shapesModule!.getConsistentStageScale();
            let currentRadiusX = (ellipse as any).radiusX?.() || (ellipse as any).radius?.() || 65;
            let currentRadiusY = (ellipse as any).radiusY?.() || (ellipse as any).radius?.() || 65;
            
            // Skip redundant height measurement - already done above
            // This avoids double reflow that causes text to disappear
            
            // No real-time expansion while typing (simplified FigJam-style)
            if (false) {
              const currentText = (ta as HTMLTextAreaElement).value;
              const currentFontSize = parseInt(ta.style.fontSize) || 14;
              const lineHeight = parseFloat(ta.style.lineHeight) || 1.2;
              const padding = Math.max(12, currentRadiusX * 0.15);
              const strokeWidth = (el as any).strokeWidth ?? 1;
              
              if (currentText.trim()) {
                const requiredR = (this.shapesModule as ShapesModule).calculateOptimalRadiusBeforeLayout({
                  text: currentText,
                  fontSize: currentFontSize,
                  family: el.fontFamily || 'Inter, system-ui, sans-serif',
                  padding: padding,
                  style: (el as any).fontStyle || 'normal',
                  lineHeight: lineHeight,
                  strokeWidth: strokeWidth,
                });
                
                if (requiredR > currentRadiusX && requiredR !== currentRadiusY) {
                  // Live update for uniform radius expansion
                  currentRadiusX = requiredR;
                  currentRadiusY = requiredR;
                  
                  // Update the ellipse immediately
                  if (ellipse) {
                    if ((ellipse as any).radiusX) {
                      (ellipse as any).radiusX(requiredR);
                      (ellipse as any).radiusY(requiredR);
                      ellipse!.position({ x: 0, y: 0 });
                    } else {
                      (ellipse as any).radius(requiredR);
                      ellipse!.position({ x: 0, y: 0 });
                    }
                  }
                  
                  // Update hit area
                  const hit = group.findOne<Konva.Rect>('Rect.hit-area');
                  if (hit) {
                    hit!.setAttrs({ x: -requiredR, y: -requiredR, width: 2 * requiredR, height: 2 * requiredR });
                  }
                  
                  // Update store
                  this.updateElementCallback?.(elId, { 
                    radius: requiredR,
                    width: requiredR * 2,
                    height: requiredR * 2,
                    radiusX: requiredR,
                    radiusY: requiredR
                  });
                  
                  // CRITICAL FIX: Use the ACTUAL updated radiusX/radiusY values, not requiredR
                  const expandedTextBounds = getEllipticalTextBounds(currentRadiusX, requiredR, 0);
                  const inscribedWidthWorld = expandedTextBounds.width;
                  const inscribedHeightWorld = expandedTextBounds.height;
                  const textareaPadding = 8;
                  const rectWidthPx = Math.max(20, inscribedWidthWorld * currentScale - textareaPadding * 2);
                  const rectHeightPx = Math.max(20, inscribedHeightWorld * currentScale - textareaPadding * 2);
                  
                  const containerRect = this.stage?.container()?.getBoundingClientRect();
                  if (!containerRect) return;
                  const rect = (group as any).getClientRect?.({ skipTransform: false }) ?? group.getClientRect();
                  if (!containerRect) return;
                  const centerX = containerRect!.left + rect.x + rect.width / 2;
                  const centerY = containerRect!.top + rect.y + rect.height / 2;
                  
                  const contentLeft = Math.round(centerX - (rectWidthPx + textareaPadding * 2) / 2);
                  const contentTop = Math.round(centerY - (rectHeightPx + textareaPadding * 2) / 2);
                  
                  ta.style.left = `${contentLeft}px`;
                  ta.style.top = `${contentTop}px`;
                  ta.style.width = `${rectWidthPx}px`;
                  ta.style.height = `${rectHeightPx}px`;
                  
                  // Immediately refresh transformer for real-time frame updates
                  this.refreshTransformer(elId);
                  this.scheduleDraw('main');
                }
              }
            }
            
            // Enhanced overflow detection for proper vertical expansion
            // Use aspect-ratio aware bounds for current ellipse dimensions
            const currentTextBounds = getEllipticalTextBounds(currentRadiusX, currentRadiusY, 0);
            const inscribedWidth = currentTextBounds.width;
            const inscribedHeight = currentTextBounds.height;
            
            // Calculate if text overflows horizontally (causing wrapping)
            ta.style.width = `${inscribedWidth * currentScale}px`;
            ta.style.height = 'auto';
            const naturalScrollHeight = ta.scrollHeight;
            const naturalHeight = naturalScrollHeight / currentScale;
            
            // If natural height exceeds inscribed height, expand vertically
            const targetRadiusX = currentRadiusX; // Keep horizontal fixed
            let targetRadiusY = currentRadiusY;
            
            if (naturalHeight > inscribedHeight) {
              // Calculate required radius to accommodate text height
              // For tall ellipses, we use heightMultiplier of ~1.25, so reverse: radiusY = naturalHeight / 1.25
              targetRadiusY = Math.max(currentRadiusY, Math.ceil((naturalHeight / 1.25) + basePadWorld));
            }
            
            // Declare final radii variables outside the expansion block for consistent access
            let finalRadiusX = currentRadiusX;
            let finalRadiusY = currentRadiusY;
            
            // Update if vertical radius needs to change
            if (Math.abs(targetRadiusY - currentRadiusY) > 1) {
              finalRadiusX = targetRadiusX; // Keep horizontal fixed
              finalRadiusY = targetRadiusY; // Expand vertical
              const newWidth = finalRadiusX * 2;
              const newHeight = finalRadiusY * 2;
              
              // Update ellipse smoothly
              if ((ellipse as any).radiusX) {
                // It's already an ellipse
                (ellipse as any).radiusX(finalRadiusX);
                (ellipse as any).radiusY(finalRadiusY);
                ellipse.position({ x: 0, y: 0 });
              } else {
                // Convert circle to ellipse
                const newEllipse = new Konva.Ellipse({
                  x: finalRadiusX,
                  y: finalRadiusY,
                  radiusX: finalRadiusX,
                  radiusY: finalRadiusY,
                  fill: (ellipse as any).fill(),
                  stroke: (ellipse as any).stroke(),
                  strokeWidth: (ellipse as any).strokeWidth(),
                  name: 'shape',
                  listening: false
                });
                ellipse.destroy();
                group.add(newEllipse);
              }
              currentRadiusX = finalRadiusX;
              currentRadiusY = finalRadiusY;
              
              // Update hit area
              this.shapesModule!.ensureHitAreaSize(group, newWidth, newHeight);
              
              // Don't apply clipping - let text expand naturally
              const content = group.findOne<Konva.Group>('Group.content');
              if (content) {
                // Remove any existing clipping to allow text to display properly
                try {
                  (content as any).clipFunc(null);
                } catch {}
              }
              
              // Update store with new radii
              this.updateElementCallback?.(elId, { 
                radiusX: finalRadiusX,
                radiusY: finalRadiusY,
                width: newWidth,
                height: newHeight
              });
              
              // Update transformer after store update to ensure perfect sync
              if (this.transformer) {
                const selectedNodes = this.transformer.nodes();
                if (selectedNodes.includes(group)) {
                  // Update transformer immediately without delay
                  this.transformer.forceUpdate();
                }
              }
              
              // Schedule a single batch draw to prevent multiple redraws
              requestAnimationFrame(() => {
                this.scheduleDraw('main');
                if (this.layers?.overlay) {
                  this.scheduleDraw('overlay');
                }
              });
            }
            
            // CRITICAL FIX: Use the final radii values that account for any expansion
            const liveTextBounds = getEllipticalTextBounds(finalRadiusX, finalRadiusY, 0);
            const padding = 8; // Match the padding in textarea style  
            const textWidth = Math.max(20, liveTextBounds.width * currentScale - padding * 2);
            const textHeight = Math.max(20, liveTextBounds.height * currentScale - padding * 2);
            const rect = (group.findOne('.shape') || ellipse).getClientRect({ skipTransform: false });
            const containerRect = this.stage!.container().getBoundingClientRect();
            const centerX = containerRect.left + rect.x + rect.width / 2;
            const centerY = containerRect.top + rect.y + rect.height / 2;
            
            // Set textarea dimensions to match ellipse content area
            // Use content-box sizing so padding is added to width/height
            ta.style.boxSizing = 'content-box';
            ta.style.width = `${Math.round(textWidth)}px`;
            const minLinePx2 = Math.max(4, Math.ceil(fs * lh) + 2);
ta.style.height = `${Math.max(Math.round(textHeight), minLinePx2)}px`;
            ta.style.left = `${Math.round(centerX - (textWidth + padding * 2) / 2)}px`;
            ta.style.top = `${Math.round(centerY - (textHeight + padding * 2) / 2)}px`;
            ta.style.overflow = 'hidden'; // Ensure no scrollbars
            ta.style.transition = 'none'; // Prevent animation artifacts
            
            // Schedule a redraw to reflect changes
            this.scheduleDraw('main');
          }
        } else {
          // Rectangle/triangle/sticky: update frame and hit-area to hug content.
          // Sticky notes should not shrink below their initial frame height on first edit.
          try {
            const pad = padWorld;
            const frame = group.findOne<Konva.Rect>('Rect.bg') || group.findOne<Konva.Rect>('Rect.frame');
            const textNode = group.findOne<Konva.Text>('Text.label') || group.findOne<Konva.Text>('.text');
            const baseW = Math.max(1, (frame as any)?.width?.() || (textNode as any)?.width?.() || ((el as any).width || 1));
            const baseFrameH = Math.max(1, (frame as any)?.height?.() || ((el as any).height || 1));
            // Prevent initial empty sticky notes from collapsing below their default frame
            if (isSticky) {
              const hasContent = !!((el as any).text && String((el as any).text).trim().length > 0);
              if (!hasContent) {
                finalElementHeightWorld = Math.max(baseFrameH, finalElementHeightWorld);
              }
            }
            if (frame && typeof (frame as any).height === 'function') {
              frame.height(Math.max(1, finalElementHeightWorld));
              (frame as any).y?.(0);
            }
            if (textNode) {
              (textNode as any).height?.(Math.max(1, finalElementHeightWorld - pad * 2));
              (textNode as any).y?.(pad);
            }
            this.shapesModule!.ensureHitAreaSize(group, baseW, Math.max(1, finalElementHeightWorld));
            this.updateElementCallback?.(elId, { height: Math.max(1, finalElementHeightWorld) });
            this.scheduleDraw('main');
            this.transformer?.forceUpdate?.();
            this.scheduleDraw('overlay');
          } catch {}
        }
        
        // Hit-area is managed per-shape elsewhere; avoid overriding (especially for center-origin circles)
        this.scheduleDraw('main');
        
      } catch (error) {
        console.warn('Error in measureStickyConsistent:', error);
      }
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
      // Update textarea size to fit content without wrapping
      try { (ta as HTMLElement).style.width = 'auto'; } catch {}
      const liveWpx = Math.max(1, Math.ceil((ta as HTMLElement).scrollWidth || 1));
      const nextWpx = liveWpx;
      (ta as HTMLElement).style.width = `${nextWpx}px`;
      const fsWorld = (el as any).fontSize || 14;
      const lh = (el as any).lineHeight || 1.2;
      const nextHpx = Math.max(1, Math.ceil(fsWorld * lh * stageScale));
      ta.style.height = `${nextHpx + 2}px`;

      // Keep the editing wrapper in sync so it also expands/contracts
      try {
        (editWrapper as HTMLElement).style.width = `${nextWpx}px`;
        (editWrapper as HTMLElement).style.height = `${nextHpx + 2}px`;
      } catch {}

      // Update Konva text live for feedback without forcing a fixed width (prevents clipping)
      try {
        const group = node as Konva.Group;
        const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
        if (textNode) {
          textNode.text((ta as HTMLTextAreaElement).value);
          try { (textNode as any).width(undefined); (textNode as any)._clearCache?.(); } catch {}
          const measuredW = Math.max(1, Math.ceil(((textNode as any).getTextWidth?.() || nextWpx) as number));
          const worldW = Math.max(1, measuredW / stageScale);
          const worldH = Math.max(10, Math.ceil(fsWorld * lh));
          this.shapesModule!.ensureHitAreaSize(group, worldW, worldH);
          this.scheduleDraw('main');
          this.transformer?.forceUpdate?.();
          this.scheduleDraw('overlay');
        }
      } catch {}

      // Keep store in sync during typing (no history churn): do not persist width for plain text
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (store?.getState?.().updateElement) {
          store.getState().updateElement(elId, { text: (ta as HTMLTextAreaElement).value }, { skipHistory: true });
        }
      } catch {}
    };

    // IME composition handling to avoid masking or mid-composition mutations
    let composing = false;
    ta.addEventListener('compositionstart', () => { composing = true; });
    ta.addEventListener('compositionend', () => { composing = false; });
    
    // Critical: Force immediate text visibility on ANY input change
    // This ensures typed characters appear immediately
    ta.addEventListener('beforeinput', (e) => {
      console.log('[DEBUG] beforeinput event:', {
        inputType: (e as any).inputType,
        data: (e as any).data,
        color: ta.style.color,
        webkitTextFillColor: (ta.style as any).webkitTextFillColor,
        opacity: ta.style.opacity,
        visibility: ta.style.visibility,
        background: ta.style.background,
        value: (ta as HTMLTextAreaElement).value
      });
      
      // Force text to be visible immediately, not in next frame
      const textColor = safeTextColor || '#111827';
      (ta.style as any).setProperty('color', textColor, 'important');
      (ta.style as any).setProperty('-webkit-text-fill-color', textColor, 'important');
      (ta.style as any).setProperty('opacity', '1', 'important');
      (ta.style as any).setProperty('visibility', 'visible', 'important');
    });
    
    // Also monitor input event to see what happens after character is inserted
    ta.addEventListener('input', (e) => {
      const computed = window.getComputedStyle(ta);
      console.log('[DEBUG] input event fired:', {
        value: (ta as HTMLTextAreaElement).value,
        color: ta.style.color,
        webkitTextFillColor: (ta.style as any).webkitTextFillColor,
        opacity: ta.style.opacity,
        computedColor: computed.color,
        computedWebkitTextFillColor: computed.webkitTextFillColor || computed.getPropertyValue('-webkit-text-fill-color'),
        computedOpacity: computed.opacity,
        computedVisibility: computed.visibility,
        wrapperOpacity: editWrapper.style.opacity,
        wrapperComputedOpacity: window.getComputedStyle(editWrapper).opacity
      });
      
      // Check if we need to force visibility
      if (computed.opacity === '0' || computed.color === 'transparent' || computed.visibility === 'hidden') {
        console.warn('[DEBUG] Text is invisible! Forcing visibility...');
        (ta.style as any).setProperty('color', '#000000', 'important');
        (ta.style as any).setProperty('-webkit-text-fill-color', '#000000', 'important');
        (ta.style as any).setProperty('opacity', '1', 'important');
        (ta.style as any).setProperty('visibility', 'visible', 'important');
        (ta.style as any).setProperty('background', 'white', 'important');
      }
    }, { capture: true });

    // Bind input handler by type
    if (isCircle) {
      // Auto-grow uniformly when content exceeds inscribed square
      let pendingGrowRAF = 0;
      (ta as HTMLElement).addEventListener('input', () => {
        if (composing) return;
        // Sync text to store for undo/redo and renderer state
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const val = (ta as HTMLDivElement).innerText ?? '';
          store?.getState()?.updateElement?.(elId, { text: val }, { skipHistory: true });
        } catch {}

        // Coalesce into a single RAF per frame
        if (pendingGrowRAF) cancelAnimationFrame(pendingGrowRAF);
        pendingGrowRAF = requestAnimationFrame(() => {
          try {
            const group = node as Konva.Group;
            const ellipse = group.findOne<Konva.Ellipse>('Ellipse.shape') || group.findOne<Konva.Circle>('Circle.shape');
            if (!ellipse) return;

            // Use SHAPE absolute scale for measurement (most precise)
            const absT = (ellipse as Konva.Shape).getAbsoluteTransform();
            const p0 = absT.point({ x: 0, y: 0 });
            const px = absT.point({ x: 1, y: 0 });
            const py = absT.point({ x: 0, y: 1 });
            const sx = Math.abs(px.x - p0.x);
            const sy = Math.abs(py.y - p0.y);
            const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));
            const strokeWidth = (ellipse as any).strokeWidth?.() ?? ((el as any).strokeWidth ?? 1);
            const r0 = (ellipse as any).radius?.() ?? (ellipse as any).radiusX?.() ?? ((el as any).radius || 65);
            const padPxFixed = this.getCirclePadPx(el);
            const rClipWorld = Math.max(1, r0 - strokeWidth / 2);
            const sidePx = Math.SQRT2 * rClipWorld * sLim; // outer square in px
            const contentSidePx = Math.max(4, sidePx - 2 * padPxFixed);

            // Ghost measure with convergence and safety buffer
            const base = window.getComputedStyle(ta as HTMLElement);
            const fontPx = parseFloat(base.fontSize || '14') || 14;
            const safetyBufferPx = Math.max(4, Math.ceil(fontPx * 0.5));
            const measureForSide = (contentPx: number) => {
              const ghost = document.createElement('div');
              Object.assign(ghost.style, {
                position: 'fixed', left: '-99999px', top: '-99999px', visibility: 'hidden', pointerEvents: 'none',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
                fontSize: base.fontSize, fontFamily: base.fontFamily, lineHeight: base.lineHeight, letterSpacing: base.letterSpacing,
                width: `${Math.max(4, Math.round(contentPx))}px`,
              } as CSSStyleDeclaration as any);
              ghost.innerText = ((ta as HTMLDivElement).innerText ?? '').length ? (ta as HTMLDivElement).innerText : ' ';
              document.body.appendChild(ghost);
              const h = ghost.scrollHeight;
              const w = ghost.scrollWidth;
              document.body.removeChild(ghost);
              return { h: Math.max(4, h), w: Math.max(4, w) };
            };
            // Seed side from current overlay dimensions to avoid underestimation
            const overlayCW = Math.max(4, (editWrapper as HTMLElement).clientWidth || 0);
            const overlayCH = Math.max(4, (editWrapper as HTMLElement).clientHeight || 0);
            let neededContentPx = Math.max(contentSidePx, overlayCW - 2 * padPxFixed, overlayCH - 2 * padPxFixed);
            for (let i = 0; i < 5; i++) {
              const m = measureForSide(neededContentPx);
              const next = Math.max(neededContentPx, m.h + safetyBufferPx, m.w + safetyBufferPx);
              if (Math.abs(next - neededContentPx) < 0.5) { neededContentPx = next; break; }
              neededContentPx = next;
            }

            // Final guard: include live editor scroll dims in the side
            const liveH = Math.max(4, (ta as HTMLElement).scrollHeight + safetyBufferPx);
            const liveW = Math.max(4, (ta as HTMLElement).scrollWidth + safetyBufferPx);
            neededContentPx = Math.max(neededContentPx, liveH, liveW);

            // SNAP ONCE (WORLD): compute rWorld from measured sidePx, then derive overlay from world
            const dpr = (window.devicePixelRatio || 1);
            const snapWorld = (v: number) => Math.ceil(v * dpr) / dpr;
            const neededSidePx = neededContentPx + 2 * padPxFixed;
            const rWorldRaw = (neededSidePx / Math.SQRT2) / sLim + strokeWidth / 2;
            const targetR = snapWorld(rWorldRaw);

            const growNeeded = targetR > r0 + 0.5;
            if (growNeeded) {
              // SAME-FRAME SYNC: overlay square, ellipse radii, batchDraw, commit
              const sidePxFromWorld = Math.ceil((Math.SQRT2 * (targetR - strokeWidth / 2) * sLim) * dpr) / dpr;
              const cRect = this.stage!.container().getBoundingClientRect();
              const center = group.getAbsoluteTransform().point({ x: 0, y: 0 });
              const cx = cRect.left + center.x;
              const cy = cRect.top + center.y;
              editWrapper.style.left = `${Math.round(cx)}px`;
              editWrapper.style.top = `${Math.round(cy)}px`;
              editWrapper.style.width = `${Math.round(sidePxFromWorld)}px`;
              editWrapper.style.height = `${Math.round(sidePxFromWorld)}px`;
              editWrapper.style.transform = 'translate(-50%, -50%)';

              // Top-aligned: uniform inner padding equals declared pad in screen space
              if (this.currentEditorPad) {
                this.currentEditorPad.style.padding = `${padPxFixed}px`;
              }

              const shapeEllipse = group.findOne<Konva.Ellipse>('Ellipse.shape');
              const shapeCircle = group.findOne<Konva.Circle>('Circle.shape');
              if (shapeEllipse) {
                shapeEllipse.radiusX(targetR);
                shapeEllipse.radiusY(targetR);
                shapeEllipse.position({ x: 0, y: 0 });
              } else if (shapeCircle) {
                shapeCircle.radius(targetR);
                shapeCircle.position({ x: 0, y: 0 });
              }
              this.shapesModule!.ensureHitAreaSize(group, targetR * 2, targetR * 2);
              this.scheduleDraw('main');

              this.updateElementCallback?.(elId, { radius: targetR, radiusX: targetR, radiusY: targetR, width: targetR * 2, height: targetR * 2 });
              this.refreshTransformer(elId);
            }
          } catch { /* swallow */ }
          pendingGrowRAF = 0;
        });
      });
    } else if (isSticky || isShapeLike) {
      ta.addEventListener('input', () => {
        if (composing) return;
        // Update canvas live like sticky notes
        measureStickyConsistent();
        // Keep store text in sync for undo/redo and re-renderers
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          store?.getState()?.updateElement?.(elId, { text: (ta as HTMLTextAreaElement).value }, { skipHistory: true });
        } catch {}
      });
    } else {
      ta.addEventListener('input', () => { if (!composing) measurePlain(); });
    }

    // --- Commit / Cancel ---
    const commit = () => {
      // Use safe closer if available to avoid temporal dead zone
      try { const closer = (this as any)._closeEditor as undefined | (() => void); closer && closer(); } catch {}
      const nextText = (isCircle ? ((ta as HTMLDivElement).innerText ?? '') : (ta as HTMLTextAreaElement).value);
      // Persist text + exit editing
      if (isSticky || isShapeLike) {
        // Circles/ellipses and other shapes: keep size fixed; commit text only
        this.updateElementCallback?.(elId, { text: nextText, isEditing: false });
      } else {
        // Plain text: persist text only; renderer auto-sizes width to content to avoid clipping
        this.updateElementCallback?.(elId, { text: nextText, isEditing: false });
      }
      // Clear editor tracking after commit
      this.currentEditingId = null;
      this.currentEditorWrapper = undefined;
    };
    const cancel = () => {
      try { const closer = (this as any)._closeEditor as undefined | (() => void); closer && closer(); } catch {}
      // Exit editing, discard changes
      this.updateElementCallback?.(elId, { isEditing: false });
      // Clear editor tracking after cancel
      this.currentEditingId = null;
      this.currentEditorWrapper = undefined;
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

    ta.addEventListener('keydown', (ev) => { ev.stopPropagation(); onKeyDown(ev as any); }, { capture: true } as any);
    ta.addEventListener('mousedown', (evt) => { evt.stopPropagation(); evt.stopImmediatePropagation?.(); }, { capture: true } as any);
    ta.addEventListener('pointerdown', (evt) => { evt.stopPropagation(); evt.stopImmediatePropagation?.(); }, { capture: true } as any);
    ta.addEventListener('wheel', (evt) => { evt.stopPropagation(); evt.preventDefault(); }, { passive: false } as any);
    ta.addEventListener('blur', onBlur);

    // Commit on click outside (capture) without blocking Konva handlers
    const onDocMouseDown = (e: MouseEvent) => {
      // Treat clicks inside the wrapper as inside (do not commit)
      const target = e.target as Node | null;
      if (target === ta || (target && editWrapper.contains(target))) return;
      // Defer commit so Konva selection/click can process first
      setTimeout(() => {
        if (document.activeElement === ta) ta.blur();
      }, 0);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);

    // Initial measure so editor matches current content
    // Circles: overlay is already sized; skip measuring to avoid textarea-specific logic
    if (isCircle) {
      // no-op: CE overlay shows immediately
    } else if (isSticky || isShapeLike) {
      measureStickyConsistent();
    } else {
      measurePlain();
    }

    // Store selection state (optional visual tweak)
    this.updateElementCallback?.(elId, { isEditing: true });

    // Keep editor in sync if the canvas pans/zooms during editing
    const onStageTransform = () => {
      const rect = (node as any).getClientRect?.({ skipTransform: false, skipShadow: true, skipStroke: true }) ?? node.getClientRect();
      const containerRect = this.stage!.container().getBoundingClientRect();
      const absScale = this.stage!.getAbsoluteScale?.();
      const stageScale = absScale && typeof absScale.x === 'number' ? absScale.x : 1;
      const padPx = padWorld * stageScale;
      const usePad = (isSticky || isShapeLike) ? padPx : 0;
      let l = containerRect.left + rect.x + usePad;
      let t = containerRect.top + rect.y + usePad;
      let w = (isSticky || isShapeLike) ? Math.max(4, rect.width - padPx * 2) : Math.max(4, rect.width);
      // Recalculate triangle-specific geometry under zoom/pan
      if (isTriangle) {
        const triangleTextOffsetWorld2 = Math.max(padWorld, (el.height || 0) * 0.55);
        const triangleOffsetPx2 = triangleTextOffsetWorld2 * stageScale;
        const topWidthPx2 = Math.max(4, rect.width * (triangleTextOffsetWorld2 / Math.max(1, (el.height || 1))));
        l = containerRect.left + rect.x + Math.max(0, Math.floor((rect.width - topWidthPx2) / 2)) + padPx;
        t = containerRect.top + rect.y + triangleOffsetPx2;
        w = Math.max(4, topWidthPx2 - padPx * 2);
      }
    if (isCircle) {
      // Use latest radii from store during pan/zoom; overlay is a SQUARE
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        const live = store?.getState()?.elements?.get(elId) || el;
        const absT = (node as Konva.Group).getAbsoluteTransform();
        const p0 = absT.point({ x: 0, y: 0 });
        const px = absT.point({ x: 1, y: 0 });
        const py = absT.point({ x: 0, y: 1 });
        const sx = Math.abs(px.x - p0.x);
        const sy = Math.abs(py.y - p0.y);
        const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));
        const worldRadiusX = live.radiusX ?? live.radius ?? 65;
        const worldRadiusY = live.radiusY ?? live.radius ?? 65;
        const strokeWidth = live.strokeWidth ?? 1;
        const minR = Math.max(1, Math.min(worldRadiusX, worldRadiusY) - padWorld - strokeWidth / 2);
        const sidePx = Math.max(4, Math.SQRT2 * minR * sLim);
        const center = absT.point({ x: 0, y: 0 });
        const dpr = (window.devicePixelRatio || 1);
        const roundPx = (v: number) => Math.round(v * dpr) / dpr;
        const ceilPx = (v: number) => Math.ceil(v * dpr) / dpr;
        editWrapper.style.left = `${roundPx(containerRect.left + center.x)}px`;
        editWrapper.style.top = `${roundPx(containerRect.top + center.y)}px`;
        editWrapper.style.width = `${ceilPx(sidePx)}px`;
        editWrapper.style.height = `${ceilPx(sidePx)}px`;
        editWrapper.style.transform = 'translate(-50%, -50%)';
        editWrapper.style.outline = this.getDebug().outlineOverlay ? '1px solid red' : '';
        if (this.getDebug().log) {
          try {
            const padPx = padWorld * sLim;
            const contentWPx = Math.max(0, ceilPx(sidePx) - 2 * padPx);
            const t = (node as Konva.Group).findOne<Konva.Text>('Text') || (node as Konva.Group).findOne<Konva.Text>('.text') || (node as Konva.Group).findOne<Konva.Text>('Text.text');
            const tw = t ? (t as any).width?.() || 0 : 0;
            const twPx = tw * sx;
            const ff = (t as any)?.fontFamily?.() || 'Inter, system-ui, sans-serif';
            const fsPx = (t as any)?.fontSize?.() ? ((t as any).fontSize() * sy) : 14 * sy;
            const lh = (t as any)?.lineHeight?.() ?? 1.3;
            const baselinePx = this.getBaselineOffsetPx(ff, fsPx, lh);
            const zBaseline = this.getDebug().zeroBaseline ? 0 : baselinePx;
            console.log('[TextParityDBG] transform', { contentWPx, textNodeWidthWorld: tw, textNodeWidthPx: twPx, sx, sy, baselinePx, usedBaselinePx: zBaseline });
          } catch {}
        }
        this.scheduleDraw('overlay');
        return; // circle handled; don't touch textarea positioning directly
      }
      // Height is controlled by autosize; don’t override here
      if (this.rotateTextareaWhileEditing) {
        const r = (node as any).getAbsoluteRotation?.() ?? 0;
        ta.style.transform = `rotate(${r}deg)`;
      }
      if (!isCircle) {
        ta.style.left = `${l}px`;
        ta.style.top = `${t}px`;
        ta.style.width = `${w}px`;
      }
      // Keep shapes using sticky-style autosize during pan/zoom (except circles)
      if (isSticky || isShapeLike) {
        measureStickyConsistent();
      } else {
        measurePlain();
      }
    };

    // Subscribe to stage changes (zoom/pan)
    // NB: Konva doesn't have a generic transform event on stage; listen to dragmove, wheel (your zoom handler), and scale/position changes you control.
    const onWheel = () => onStageTransform();
    const onDragMove = () => onStageTransform();
    this.stage?.container()?.addEventListener('wheel', onWheel, { passive: true });
    // If you use stage.on('dragmove', ...) to pan, also hook there:
    this.stage.on('dragmove.editor', onDragMove);

    const cleanup = () => {
      console.info('[RendererV2] cleanup editor');
      ta.removeEventListener('keydown', onKeyDown as EventListener);
      if (isSticky) ta.removeEventListener('input', measureStickyConsistent); else ta.removeEventListener('input', measurePlain);
      ta.removeEventListener('blur', onBlur);
      this.stage?.container()?.removeEventListener('wheel', onWheel);

      document.removeEventListener('mousedown', onDocMouseDown, true);
      this.stage?.off('dragmove.editor', onDragMove as any);

      // Clear any outstanding focus retries
      try {
        const timers: number[] = (ta as any).__focusTimers || [];
        timers.forEach((h) => clearTimeout(h));
      } catch {}
      ta.remove();
      if (this.currentEditor === ta) this.currentEditor = undefined;
      try { editWrapper.remove(); } catch {}
      this.currentEditorWrapper = undefined;
      this.currentEditorPad = undefined;
      try { this.transformer?.visible(true); this.scheduleDraw('overlay'); } catch {}
      // Restore text node visibility for plain text and clear fixed widths
      if (!isSticky) {
        try {
          const group = node as Konva.Group;
          const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
          if (textNode && prevTextVisible !== undefined) {
            textNode.visible(prevTextVisible);
            try { (textNode as any).width(undefined); (textNode as any)._clearCache?.(); } catch {}
            this.scheduleDraw('main');
          }
        } catch {}
      }
      // Restore shape shadow if we disabled it
      if (prevShapeShadow) {
        try {
          prevShapeShadow.node.shadowOpacity(prevShapeShadow.opacity);
          prevShapeShadow.node.shadowBlur(prevShapeShadow.blur);
          prevShapeShadow.node.shadowOffset(prevShapeShadow.off);
          this.scheduleDraw('main');
        } catch {}
      }

      // Ensure the edited element is selected and transformer/handles are visible again
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (store?.getState?.().selectElement) {
          store.getState().selectElement(elId, false);
        }
      } catch {}
      try {
        // Force transformer to re-attach/update after commit mutations
        const selectedIds = (window as any).__UNIFIED_CANVAS_STORE__?.getState().selectedElementIds || new Set();
        this.syncSelection(selectedIds);
        // Also schedule a refresh on next tick to pick up any size changes persisted by commit
        setTimeout(() => this.refreshTransformer(elId), 0);
      } catch {}
    };

    // Expose a closers so other flows (e.g., ESC from renderer-level, switching tools) can close it
    (this as any)._closeEditor = cleanup;
  }

  // Helper used at the top of openTextareaEditor:
  private closeCurrentEditor() {
    if (this.currentEditor) {
      // If we've stored a closer, call it; else just remove the node
      const closer = (this as any)._closeEditor as (() => void) | undefined;
      if (closer) closer();
      else {
        this.currentEditor.remove();
        this.currentEditor = undefined;
        try { this.currentEditorWrapper?.remove(); } catch {}
      }
      // Also clear wrapper/id tracking
      this.currentEditorWrapper = undefined;
      this.currentEditorPad = undefined;
      this.currentEditingId = null;
    }
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
          this.shapesModule!.updateRectangle(node as Konva.Group, el as any);
        } else {
          const group = this.shapesModule!.createRectangle(el as any);
          main.add(group);
          this.nodeMap.set(id, group);
          // Auto-open editor for newly created rectangles
          if ((el as any).newlyCreated) {
            this.openTextareaEditor(id, group);
            if (this.updateElementCallback) {
              this.updateElementCallback(id, { newlyCreated: undefined, isEditing: true });
            }
          }
        }
        return;
      }

      if (el.type === 'circle') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group' && node.name() === 'circle') {
          this.shapesModule!.updateCircle(node as Konva.Group, el as any);
        } else {
          const group = this.shapesModule!.createCircle(el as any);
          main.add(group);
          this.nodeMap.set(id, group);
          if ((el as any).newlyCreated) {
            this.openTextareaEditor(id, group);
            if (this.updateElementCallback) {
              this.updateElementCallback(id, { newlyCreated: undefined, isEditing: true });
            }
          }
        }
        return;
      }

      if (el.type === 'triangle') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group' && node.name() === 'triangle') {
          this.shapesModule!.updateTriangle(node as Konva.Group, el as any);
        } else {
          const group = this.shapesModule!.createTriangle(el as any);
          main.add(group);
          this.nodeMap.set(id, group);
          if ((el as any).newlyCreated) {
            this.openTextareaEditor(id, group);
            if (this.updateElementCallback) {
              this.updateElementCallback(id, { newlyCreated: undefined, isEditing: true });
            }
          }
        }
        return;
      }

      if (el.type === 'circle-text') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        let group: Konva.Group;
        if (node && node.getClassName() === 'Group' && node.name() === 'circle-text') {
          group = node as Konva.Group;
        } else {
          group = new Konva.Group({ id, name: 'circle-text', listening: true, draggable: true });
          main.add(group);
          this.nodeMap.set(id, group);
        }

        this.shapesModule!.syncCircleText(el as any, group);

        if ((el as any).newlyCreated) {
          // Delay editor opening to ensure circle is properly rendered and positioned first
          requestAnimationFrame(() => {
            this.openTextareaEditor(id, group);
            if (this.updateElementCallback) {
              this.updateElementCallback(id, { newlyCreated: undefined, isEditing: true });
            }
          });
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
            this.shapesModule!.ensureHitAreaSize(node as Konva.Group, Math.max(1, el.width || 1), Math.max(1, el.height || 1));
          } else {
            const group = this.shapesModule!.createGroupWithHitArea(id, Math.max(1, el.width || 1), Math.max(1, el.height || 1));
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
          this.layers?.overlay?.visible(false);
          main.add(group);
          this.nodeMap.set(id, group);
          requestAnimationFrame(() => {
            this.layers?.overlay?.visible(true);
            this.layers?.overlay?.batchDraw();
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
          this.layers?.overlay?.visible(false);
          main.add(group);
          this.nodeMap.set(id, group);
          requestAnimationFrame(() => {
            this.layers?.overlay?.visible(true);
            this.layers?.overlay?.batchDraw();
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

      // Image elements
      if (el.type === 'image') {
        const node = this.nodeMap.get(id) as Konva.Group | undefined;
        if (node && node.getClassName() === 'Group' && node.name() === 'image') {
          this.updateImage(node, el);
        } else {
          const group = this.createImage(el);
          main.add(group);
          this.nodeMap.set(id, group);
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
    let removedAny = false;
    Array.from(this.nodeMap.entries()).forEach(([id, node]) => {
      if (!alive.has(id)) {
        try { node.destroy(); } catch {}
        this.nodeMap.delete(id);
        removedAny = true;
      }
    });
    if (removedAny) {
      try { this.clearConnectorOverlay(); } catch {}
    }

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
    // Optional curvature for mindmap-style edges
    try { (connectorNode as any).tension?.((el as any).curved ? 0.5 : 0); } catch {}
    
    
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
    try { (node as any).tension?.((el as any).curved ? 0.5 : 0); } catch {}
    
    // Update arrow-specific properties if it's an arrow
    const isArrow = el.subType === 'arrow' || el.connectorType === 'arrow';
    if (node.getClassName() === 'Arrow' && isArrow) {
      const arrowNode = node as Konva.Arrow;
      arrowNode.pointerLength(12);
      arrowNode.pointerWidth(10);
      arrowNode.fill(el.stroke || '#374151'); // Ensure arrow head has fill color
    }
  }

  // Preview-only reflow of edges connected to these element IDs using Konva node positions
  private previewReflowEdgesForMovedNodes(movedIds: Set<string>) {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      if (!store) return;
      const edges: Map<string, any> = store.getState().edges;
      edges.forEach((edge, id) => {
        const srcId = edge?.source?.elementId;
        const tgtId = edge?.target?.elementId;
        if (!srcId || !tgtId) return;
        if (!movedIds.has(srcId) && !movedIds.has(tgtId)) return;

        const srcNode = this.nodeMap.get(String(srcId)) as Konva.Node | undefined;
        const tgtNode = this.nodeMap.get(String(tgtId)) as Konva.Node | undefined;
        if (!srcNode || !tgtNode) return;

        // Derive port positions from Konva node positions and store dimensions (layer-local coords)
        const srcEl = store.getState().elements.get(srcId);
        const tgtEl = store.getState().elements.get(tgtId);
        const srcW = Math.max(1, srcEl?.width || 1);
        const srcH = Math.max(1, srcEl?.height || 1);
        const tgtW = Math.max(1, tgtEl?.width || 1);
        const tgtH = Math.max(1, tgtEl?.height || 1);
        const start = { x: (srcNode as any).x?.() + srcW, y: (srcNode as any).y?.() + srcH / 2 };
        const end = { x: (tgtNode as any).x?.(), y: (tgtNode as any).y?.() + tgtH / 2 };

        // Build curved or straight path
        let pts: number[];
        if (edge?.curved) {
          const mid = { x: (start.x + end.x) / 2, y: start.y + (end.y - start.y) * 0.35 };
          pts = [start.x, start.y, mid.x, mid.y, end.x, end.y];
        } else {
          pts = [start.x, start.y, end.x, end.y];
        }

        const edgeNode = this.nodeMap.get(id) as Konva.Line | Konva.Arrow | undefined;
        if (edgeNode) {
          edgeNode.points(pts);
        }
      });
      this.scheduleDraw('main');
    } catch {}
  }

  // Track overlay group for reuse
  private connectorOverlayGroup: Konva.Group | null = null;
  private tableControlsGroup: Konva.Group | null = null;
  private tableControlsTargetId: string | null = null;
  
  // Track current text editor (duplicate field removed; see class header for canonical definition)
  // private currentEditor?: HTMLTextAreaElement;
  
  /** Refresh transformer for a specific element (used when dimensions change) */
  // Accessibility: Setup keyboard navigation
  private setupAccessibility() {
    if (!this.stage) return;
    
    const container = this.stage.container();
    
    // Make stage focusable
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', 'Editable shapes canvas');
    
    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.focusedElementId) return;
      
      const node = this.nodeMap.get(this.focusedElementId);
      if (!node) return;
      
      switch(e.key) {
        case 'Enter':
          // Start editing on Enter
          if (node.name() === 'circle' || node.name() === 'triangle') {
            this.openTextareaEditor(this.focusedElementId, node);
          }
          break;
          
        case 'Tab':
          e.preventDefault();
          // Navigate to next element
          this.navigateElements(e.shiftKey ? -1 : 1);
          break;
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    (this as any).accessibilityKeyHandler = handleKeyDown;
  }
  
  private navigateElements(direction: number) {
    const elements = Array.from(this.nodeMap.entries())
      .filter(([id, node]) => node.name() === 'circle' || node.name() === 'triangle');
    
    if (elements.length === 0) return;
    
    let currentIndex = elements.findIndex(([id]) => id === this.focusedElementId);
    if (currentIndex === -1) currentIndex = 0;
    
    const nextIndex = (currentIndex + direction + elements.length) % elements.length;
    const [nextId] = elements[nextIndex];
    
    this.setFocusedElement(nextId);
  }
  
  private setFocusedElement(elementId: string) {
    // Clear previous focus indicator
    if (this.focusedElementId) {
      const prevNode = this.nodeMap.get(this.focusedElementId);
      if (prevNode) {
        const container = prevNode instanceof Konva.Container ? prevNode : null;
        const focusRing = container?.findOne('.focus-ring');
        if (focusRing) {
          const anim = (focusRing as any).focusAnimation;
          if (anim) anim.stop();
          focusRing.destroy();
        }
      }
    }
    
    this.focusedElementId = elementId;
    const node = this.nodeMap.get(elementId);
    
    if (node && node.getClassName() === 'Group') {
      // Add subtle focus indicator
      const group = node as Konva.Group;
      const shape = group.findOne('Circle.shape') || group.findOne('Line.shape');
      
      if (shape && shape.getClassName() === 'Circle') {
        const circle = shape as Konva.Circle;
        const focusRing = new Konva.Circle({
          name: 'focus-ring',
          x: circle.x(),
          y: circle.y(),
          radius: circle.radius() + 5,
          stroke: '#0066CC',
          strokeWidth: 2,
          dash: [5, 5],
          opacity: 0.5,
          listening: false
        });
        
        group.add(focusRing);
        focusRing.moveToBottom();
        
        // Animate dash offset
        const anim = new Konva.Animation((frame) => {
          if (frame) {
            focusRing.dashOffset(-frame.time / 50);
          }
        }, group.getLayer());
        anim.start();
        (focusRing as any).focusAnimation = anim;
      }
    }
    
    this.scheduleDraw('main');
  }
  
  // Memory management: Clean up all resources
  destroy() {
    // Clear all timers
    clearTimeout(this.batchUpdateTimer);
    clearTimeout(this.updateDebounceTimer);
    cancelAnimationFrame(this.raf);
    
    // Destroy all active tweens
    this.activeTweens.forEach(tween => {
      try {
        tween.destroy();
      } catch (e) {
        console.warn('Failed to destroy tween:', e);
      }
    });
    this.activeTweens.clear();
    
    // Clear text update queue
    this.textUpdateQueue.clear();
    
    // Remove event listeners from stage
    if (this.stage) {
      this.stage.off('wheel.renderer');
      this.stage.off('mousedown.renderer');
      this.stage.off('dblclick.renderer');
      this.stage.off('mousemove.renderer');
      this.stage.off('mouseup.renderer');
      this.stage.off('scaleChange');
    }
    
    // Destroy transformer
    if (this.transformer) {
      this.transformer.destroy();
      this.transformer = null;
    }
    
    // Clear node map
    this.nodeMap.forEach(node => {
      try {
        node.destroy();
      } catch (e) {
        console.warn('Failed to destroy node:', e);
      }
    });
    this.nodeMap.clear();
    
    // Clear spatial index
    if (this.spatial?.clear) {
      this.spatial.clear();
    }
    
    // Clean up current editor
    if (this.currentEditor) {
      try {
        this.currentEditor.remove();
      } catch (e) {
        console.warn('Failed to remove editor:', e);
      }
      this.currentEditor = undefined;
      this.currentEditorWrapper = undefined;
      this.currentEditingId = null;
    }
    
    // Clean up context menu
    if (this.contextMenuEl) {
      this.contextMenuEl.remove();
      this.contextMenuEl = null;
    }
    
    // Clean up table overlay
    if (this.tableOverlay) {
      try {
        this.tableOverlay.group.destroy();
      } catch (e) {
        console.warn('Failed to destroy table overlay:', e);
      }
      this.tableOverlay = null;
    }
    
    // Destroy layers
    if (this.layers) {
      Object.values(this.layers).forEach(layer => {
        try {
          layer.destroy();
        } catch (e) {
          console.warn('Failed to destroy layer:', e);
        }
      });
      this.layers = null;
    }
    
    // Clear stage reference
    this.stage = null;
  }
  
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
    if (nodes.length > 0 && this.transformer) {
      console.log(`[DEBUG] ==> Attaching transformer to ${nodes.length} nodes.`);
      // TEST 2: Disable transformer visuals during attach
      this.transformer.borderEnabled(false);
      this.transformer.enabledAnchors([]);
      this.transformer.anchorSize(0);
      this.transformer.nodes(nodes);
      this.transformer.visible(false); // Start invisible
      
      // Re-enable visuals after first RAF once element is settled
      requestAnimationFrame(() => {
        if (!this.transformer) return;
      this.transformer.visible(true);
      this.transformer.borderEnabled(true);

      // If selection is a single text element, constrain proportions (keep ratio) and use corner anchors only
      const single = nodes.length === 1 ? nodes[0] : null;
        const isSingleText = !!single && single.name() === 'text';
        const isSingleSticky = !!single && single.name() === 'sticky-note';
        const isSingleTable = !!single && single.name() === 'table';
        const isSingleImage = !!single && single.name() === 'image';
        const isSingleCircle = !!single && (single.name() === 'circle' || single.name() === 'circle-text');
        const isSingleTriangle = !!single && single.name() === 'triangle';
        
        if (isSingleText && this.transformer) {
          // Ensure no mid-gesture text mutations: remove any legacy textscale handlers
          try { (single as Konva.Group).off('.textscale'); } catch {}
          // Text: lock aspect ratio; restrict to corner anchors only
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right']);

          // Tighten hit-area to exact text bounds so the transformer hugs with no gaps
          try {
            const g = single as Konva.Group;
            const t = g.findOne<Konva.Text>('Text.text') || g.findOne<Konva.Text>('Text') || g.findOne<Konva.Text>('.text');
            const hit = g.findOne<Konva.Rect>('.hit-area');
            if (t && hit) {
              try { (t as any).wrap?.('none'); (t as any).width?.(undefined); (t as any)._clearCache?.(); } catch {}
              const bbox = t.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
              const metricW = Math.max(1, Math.ceil(((t as any).getTextWidth?.() || 0)));
              const w = Math.max(1, metricW); // prefer glyph advance width to eliminate trailing gap
              const h = Math.max(1, Math.ceil(bbox.height));
              hit.width(w); hit.height(h); hit.x(0); hit.y(0);
              t.position({ x: -bbox.x, y: -bbox.y });
              try { (g as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
              try { this.transformer?.forceUpdate?.(); } catch {}
            }
          } catch {}
          
          // Add boundBoxFunc to prevent tiny sizes and correct x when clamping left-edge resizes
          this.transformer.boundBoxFunc((oldBox, newBox) => {
            // Compute dynamic min width from the text node to avoid last-character clipping and keep tight fit
            let dynMinW = 20;
            try {
              const g = single as Konva.Group;
              const tn = g.findOne<Konva.Text>('Text.text') || g.findOne<Konva.Text>('Text') || g.findOne<Konva.Text>('.text');
              if (tn) {
                try { (tn as any).width?.(undefined); (tn as any)._clearCache?.(); } catch {}
                const tw = Math.ceil(((tn as any).getTextWidth?.() || 0));
                dynMinW = Math.max(20, tw); // no extra padding
              }
            } catch {}

            const minHeight = 10;
            const aa = this.transformer?.getActiveAnchor?.();
            const activeName = (aa && (typeof (aa as any).name === 'function' ? (aa as any).name() : (aa as any).getName?.())) || ((this.transformer as any)._movingAnchorName as string) || '';

            // Enforce aspect ratio lock explicitly (width drives height)
            const baseW = Math.max(1, Math.abs(oldBox.width));
            const baseH = Math.max(1, Math.abs(oldBox.height));
            const aspect = baseW / baseH;

            let w = Math.max(dynMinW, Math.abs(newBox.width));
            let h = Math.max(minHeight, Math.round(w / (aspect || 1))); // derive height from width (tight)

            // Adjust x/y to keep opposite edges fixed when clamping
            let x = newBox.x;
            let y = newBox.y;
            if (w !== newBox.width && activeName?.includes?.('left')) {
              x += newBox.width - w;
            }
            if (h !== newBox.height && activeName?.includes?.('top')) {
              y += newBox.height - h;
            }

            return { ...newBox, x, y, width: w, height: h };
          });

          // Do not attach per-frame text handlers; commit occurs on transformend (RIE parity)
        } else if (isSingleSticky && this.transformer) {
          // Sticky note: uniform scaling on corners feels natural; allow rotation; 8 anchors
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors([
            'top-left','top-center','top-right',
            'middle-left','middle-right',
            'bottom-left','bottom-center','bottom-right',
          ]);
        } else if (isSingleTable && this.transformer) {
          // Table: lock proportions, restrict to corner anchors for clarity
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right']);
        } else if (isSingleImage && this.transformer) {
          // Image: maintain aspect ratio, allow rotation, use all anchors
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors([
            'top-left','top-center','top-right',
            'middle-left','middle-right',
            'bottom-left','bottom-center','bottom-right',
          ]);
        } else if (isSingleCircle && this.transformer) {
          // Simplified FigJam-style: locked proportions + BR-only handle
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(false);
          this.transformer.enabledAnchors(['bottom-right']);
          // Keep the node's center fixed while resizing
          try { (this.transformer as any).centeredScaling?.(true); } catch {}
        } else if (isSingleTriangle && this.transformer) {
          // Triangle: proportional resize feels better; allow rotation
          this.transformer.keepRatio(true);
          this.transformer.rotateEnabled(true);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right']);
        } else if (this.transformer) {
          this.transformer.keepRatio(false);
          this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-center','middle-left','middle-right']);
          try { (this.transformer as any).centeredScaling?.(false); } catch {}
        }
        if (this.transformer) this.transformer.anchorSize(8);

        // No per-frame text handlers: allow natural Konva scaling during drag
        // Commit at transformend (special-cased) to convert scale -> width/height

        this.layers?.overlay?.batchDraw();

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
      this.connectorOverlayGroup?.add(highlight);
      
      // Source handle (draggable circle at start point)
      const sourceHandle = this.createConnectorHandle(startPoint, id, 'start');
      this.connectorOverlayGroup?.add(sourceHandle);
      
      // Target handle (draggable circle at end point) 
      const targetHandle = this.createConnectorHandle(endPoint, id, 'end');
      this.connectorOverlayGroup?.add(targetHandle);
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
        {
          const aa = transformer.getActiveAnchor?.();
          activeAnchorName = (aa && (typeof (aa as any).name === 'function' ? (aa as any).name() : (aa as any).getName?.())) || ((transformer as any)._movingAnchorName as string) || '';
        }
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
      try { this.shapesModule!.ensureHitAreaSize(groupNode, finalFrameWidth, finalFrameHeight); } catch {}

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

    // Make textarea fill the entire cell (no padding) to match recent table improvements
    const leftPx = containerRect.left + tableRect.x + col * dims.cellW;
    const topPx  = containerRect.top + tableRect.y + row * dims.cellH;
    const widthPx  = Math.max(4, dims.cellW);
    const stageScale = this.stage.getAbsoluteScale?.().x || 1;
    const fsPx = (el.fontSize || 13) * stageScale;
    const heightPx = Math.max(4, dims.cellH);

    const ta = document.createElement('textarea');
    ta.setAttribute('data-role', 'canvas-text-editor');
    ta.setAttribute('data-text-editing', 'true');
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
      const bg = new Konva.Rect({ width: 18, height: 18, fill: '#111827', cornerRadius: 4, opacity: 0.9 });
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
        } catch (e) { console.warn('Error setting cursor style:', e); }
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

    const getEl = () => (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.elements?.get(elId);
    const setEl = (updates: any) => this.updateElementCallback?.(elId, updates);

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
