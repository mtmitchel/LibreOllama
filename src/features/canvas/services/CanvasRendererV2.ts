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
      fill: 'rgba(0,0,0,0)', // fully transparent with 0 alpha
      stroke: undefined, // explicitly no stroke
      strokeWidth: 0,
      listening: true,
      hitStrokeWidth: 0,
      name: 'hit-area',
      opacity: 0 // ensure it's completely invisible
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
      hit.fill('rgba(0,0,0,0)'); // ensure fill is transparent
      hit.stroke(undefined); // ensure no stroke
      hit.strokeWidth(0);
      hit.opacity(0); // ensure completely invisible
      // Move hit area to back so it doesn't cover visual elements
      hit.moveToBottom();
    } else {
      const newHit = new Konva.Rect({ 
        x: 0, 
        y: 0, 
        width, 
        height, 
        fill: 'rgba(0,0,0,0)', // fully transparent with 0 alpha
        stroke: undefined, // explicitly no stroke
        strokeWidth: 0,
        listening: true, 
        hitStrokeWidth: 0, 
        name: 'hit-area',
        opacity: 0 // ensure it's completely invisible
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
      text.height(h);
      (text as any).wrap('word');
      (text as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);
    }
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


    // Commit on transform end: convert scale -> size, normalize nodes, update store
    // Transform normalization: convert scale -> size, reset scale to 1, update store, re-layout immediately
    this.transformer.on('transformend.renderer', () => {
      const nodes = this.transformer?.nodes() || [];
      nodes.forEach((node) => {
        const id = node.id?.();
        if (!id) return;

        // 1) Read scale applied by the transformer
        const sX = node.scaleX() || 1;
        const sY = node.scaleY() || 1;
        
        console.log(`[RESIZE DEBUG] Node ${id} - Scale: ${sX}x${sY}`);

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
          (text as any).width(Math.max(1, nextW - 2 * pad));
          (text as any).height(Math.max(1, nextH - 2 * pad));
        }

        // Hit area MUST match the new logical size - this is critical
        try { 
          this.ensureHitAreaSize(group, nextW, nextH); 
          // Force the group's cached bounds to update
          group.clearCache();
          (group as any)._clearSelfAndDescendantCache?.('bounds');
        } catch {}

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
    
    // Double-click for text editing
    this.stage.on('dblclick.renderer', (e: any) => {
      console.info('[RendererV2] dblclick received', { target: e.target?.name?.(), id: e.target?.id?.(), className: e.target?.getClassName?.() });
      const node = this.getElementNodeFromEvent(e.target);
      if (!node || !node.id()) return;

      const isTextLike = node.name() === 'sticky-note' || node.name() === 'text';
      if (isTextLike) {
        e.cancelBubble = true;
        this.openTextareaEditor(node.id(), node);
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
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      transformOrigin: '0 0',
      // Rotation: opt-in (off by default for better caret behavior)
      transform: this.rotateTextareaWhileEditing ? `rotate(${absRot}deg)` : 'none',
      // Keep it above everything in the overlay
      zIndex: '1000',
      opacity: '0',           // Start invisible
      caretColor: 'transparent' // Hide caret initially
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

    // --- Live autosize (height) & live element height updates ---
    // We’ll measure with the textarea’s scrollHeight (fast + good enough for sticky notes).
    const measure = () => {
      // Grow textarea height to content (within a reasonable max, e.g., 2x initial)
      const minHpx = contentHeight; // px
      ta.style.height = 'auto';
      const scrollHpx = Math.ceil(ta.scrollHeight);
      // Add a small descender guard to prevent caret clipping (px)
      const guardPx = Math.max(1, Math.round(((el as any).fontSize || 14) * 0.15 * stageScale));
      const nextHpx = Math.max(minHpx, scrollHpx + guardPx);
      ta.style.height = `${nextHpx}px`;

      // Convert DOM px to canvas world units
      const finalElementHeightWorld = isSticky ? (nextHpx + padPx * 2) / stageScale : nextHpx / stageScale;

      // Immediate Konva update for perfect lockstep (no visual lag)
      try {
        const group = node as Konva.Group;
        const frame = group.findOne<Konva.Rect>('.frame') || group.findOne<Konva.Rect>('.bg');
        const textNode = group.findOne<Konva.Text>('.text') || group.findOne<Konva.Text>('.label') || group.findOne<Konva.Text>('Text');
        if (frame) {
          frame.height(finalElementHeightWorld);
        }
        if (textNode && isSticky) {
          // Mirror textarea content and metrics to Konva text for perfect wrap measurement
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

      // Tell the store so Konva sticky grows too (renderer will sync quickly as well)
      this.updateElementCallback?.(elId, { height: finalElementHeightWorld });
    };
    // Measure immediately on input for lockstep visual parity
    ta.addEventListener('input', measure);

    // --- Commit / Cancel ---
    const commit = () => {
      cleanup();
      const nextText = ta.value;
      // Persist text + exit editing
      this.updateElementCallback?.(elId, { text: nextText, isEditing: false });
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

    // Initial measure so height matches current content
    measure();

    // Store selection state (optional visual tweak)
    this.updateElementCallback?.(elId, { isEditing: true });

    // Keep editor in sync if the canvas pans/zooms during editing
    const onStageTransform = () => {
      const rect = (node as any).getClientRect?.({ skipTransform: false }) ?? node.getClientRect();
      const containerRect = this.stage!.container().getBoundingClientRect();
      const absScale = this.stage!.getAbsoluteScale?.();
      const stageScale = absScale && typeof absScale.x === 'number' ? absScale.x : 1;
      const padPx = padWorld * stageScale;
      const l = containerRect.left + rect.x + padPx;
      const t = containerRect.top + rect.y + padPx;
      const w = Math.max(4, rect.width - padPx * 2);
      // Height is controlled by autosize; don’t override here
      if (this.rotateTextareaWhileEditing) {
        const r = (node as any).getAbsoluteRotation?.() ?? 0;
        ta.style.transform = `rotate(${r}deg)`;
      }
      ta.style.left = `${l}px`;
      ta.style.top = `${t}px`;
      ta.style.width = `${w}px`;
      measure();
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
      ta.removeEventListener('input', measure);
      ta.removeEventListener('blur', onBlur);
      this.stage.container().removeEventListener('wheel', onWheel);

      document.removeEventListener('mousedown', onDocMouseDown, true);
      this.stage?.off('dragmove.editor', onDragMove as any);

      ta.remove();
      if (this.currentEditor === ta) this.currentEditor = undefined;
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
      style = { color: (el as any).color || '#000000', width: (el as any).strokeWidth || 2, opacity: 1, blendMode: 'source-over' };
    } else if (el.type === 'marker') {
      style = { color: (el as any).color || '#ff0000', width: (el as any).strokeWidth || 8, opacity: 0.7, blendMode: 'multiply' };
    } else if (el.type === 'highlighter') {
      style = { color: (el as any).color || '#f7e36d', width: (el as any).strokeWidth || 12, opacity: 0.5, blendMode: 'multiply' };
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
  
  // Track current text editor
  private currentEditor?: HTMLTextAreaElement;
  
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
        this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right','top-center','bottom-center','middle-left','middle-right']);
        this.transformer.anchorSize(8);
        this.layers.overlay.batchDraw();
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
}

export default CanvasRendererV2;