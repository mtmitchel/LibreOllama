import Konva from 'konva';
import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { requiredRadiusForText } from '../../utils/circleAutoGrow'; // Keep this import for now
import { getEllipticalTextBounds } from '../../renderer/geometry'; // Import from geometry

export interface RendererLayers {
  background: Konva.Layer;
  main: Konva.Layer;
  preview: Konva.Layer;
  overlay: Konva.Layer;
}

export class ShapesModule {
  private nodeMap: Map<string, Konva.Node>;
  private layers: RendererLayers | null;
  private updateElementCallback?: (id: string, updates: any) => void;
  private scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  private refreshTransformer?: (elId: string) => void;
  private currentEditingId: string | null;
  private currentEditorWrapper?: HTMLDivElement;
  private currentEditorPad?: HTMLDivElement;
  private stage: Konva.Stage | null;
  private getCirclePadPx: (el?: any) => number;
  private getBaselineOffsetPx: (family: string, sizePx: number, lineHeight: number) => number;
  private getDebug: () => { outlineOverlay?: boolean; log?: boolean; zeroBaseline?: boolean };
  public radiusTweens: Map<string, { cancel: () => void }> = new Map(); // Made public for CanvasRendererV2 access

  // Manual text wrapping function as fallback for Konva's unreliable wrap
  public wrapTextManually(text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Create temporary canvas for measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [text]; // Fallback if canvas context fails
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  }

  // Geometry functions are now in the new modular renderer
  public getCircleTextBounds(radius: number, padding: number = 8) {
    // Ensure radius is a valid positive number
    const safeRadius = Math.max(1, isFinite(radius) ? radius : 40);
    
    // Inscribed square in circle with padding
    let side = (safeRadius * 2) / Math.sqrt(2) - padding * 2;
    
    // Ensure side is finite and positive
    side = isFinite(side) && side > 0 ? side : 50;
    
    return {
      width: side,
      height: side,
      x: -side / 2,
      y: -side / 2,
      padding
    };
  }


  // Function to calculate optimal radius for text in a circle
  public calculateOptimalRadiusBeforeLayout(opts: { text: string; family: string; style: string; lineHeight: number; fontSize: number; padding: number; strokeWidth: number }): number {
    return requiredRadiusForText(opts);
  }

  constructor(
    nodeMap: Map<string, Konva.Node>,
    layers: RendererLayers | null,
    updateElementCallback: ((id: string, updates: any) => void) | undefined,
    scheduleDraw: ((layer: 'main' | 'overlay' | 'preview') => void) | undefined,
    refreshTransformer: ((elId: string) => void) | undefined,
    currentEditingId: string | null,
    currentEditorWrapper: HTMLDivElement | undefined,
    currentEditorPad: HTMLDivElement | undefined,
    stage: Konva.Stage | null,
    getCirclePadPx: (el?: any) => number,
    getBaselineOffsetPx: (family: string, sizePx: number, lineHeight: number) => number,
    getDebug: () => { outlineOverlay?: boolean; log?: boolean; zeroBaseline?: boolean }
  ) {
    this.nodeMap = nodeMap;
    this.layers = layers;
    this.updateElementCallback = updateElementCallback;
    this.scheduleDraw = scheduleDraw;
    this.refreshTransformer = refreshTransformer;
    this.currentEditingId = currentEditingId;
    this.currentEditorWrapper = currentEditorWrapper;
    this.currentEditorPad = currentEditorPad;
    this.stage = stage;
    this.getCirclePadPx = getCirclePadPx;
    this.getBaselineOffsetPx = getBaselineOffsetPx;
    this.getDebug = getDebug;
  }

  // Helper for consistent stage scale
  public getConsistentStageScale(): number {
    const absScale = this.stage?.getAbsoluteScale?.();
    return (absScale && typeof absScale.x === 'number') ? absScale.x : 1;
  }

  // Utility: build a group with a hit-area rect sized to width/height
  public createGroupWithHitArea(id: string, width: number, height: number, draggable: boolean = true): Konva.Group {
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

  public ensureHitAreaSize(group: Konva.Group, width: number, height: number) {
    // First, clean up any duplicate hit-areas (there should only be one)
    const allHitAreas = group.find('.hit-area');
    if (allHitAreas.length > 1) {
      for (let i = 1; i < allHitAreas.length; i++) {
        allHitAreas[i].destroy();
      }
    }
    
    // Find hit-area by name attribute (not class selector)
    const hit = group.findOne((node: Konva.Node) => node.name() === 'hit-area') as Konva.Rect | undefined;
    
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

  public updateCircleShadow(ellipse: Konva.Ellipse, isEditing: boolean) {
    if (!isEditing) {
      // Standard shadow for display mode
      ellipse.shadowColor('#000');
      ellipse.shadowOpacity(0.08);
      ellipse.shadowBlur(8);
      ellipse.shadowOffset({ x: 0, y: 1 });
    } else {
      // Subtle shadow during editing to maintain visual reference
      ellipse.shadowColor('#007ACC');
      ellipse.shadowOpacity(0.03);
      ellipse.shadowBlur(2);
      ellipse.shadowOffset({ x: 0, y: 0 });
    }
  }

  // Smoothly tween a circle's radius; updates store and keeps DOM overlay square in sync
  public tweenCircleRadius(elId: string, rStart: number, rTarget: number, padWorld: number, strokeWidth: number, durationMs: number = 150) {
    // Cancel existing tween for this element
    const prev = this.radiusTweens.get(elId);
    try { prev?.cancel(); } catch {}

    let raf = 0;
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
    const tick = () => {
      const now = performance.now();
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeOut(t);
      const r = rStart + (rTarget - rStart) * e;

      // Commit to store
      this.updateElementCallback?.(elId, { radius: r, radiusX: r, radiusY: r, width: r * 2, height: r * 2 });

      // Update DOM overlay square if this element is being edited
      if (this.currentEditingId === elId && this.currentEditorWrapper && this.stage) {
        try {
          const node = this.nodeMap.get(elId) as Konva.Node | undefined;
          const group = node as Konva.Group;
          const rect = (group as any)?.getClientRect?.({ skipTransform: false }) ?? group?.getClientRect?.();
          const containerRect = this.stage.container().getBoundingClientRect();
          // Use per-axis scale limit and DPR-snapped sizing to avoid sag/drift
          const absT = group.getAbsoluteTransform();
          const p0 = absT.point({ x: 0, y: 0 });
          const px = absT.point({ x: 1, y: 0 });
          const py = absT.point({ x: 0, y: 1 });
          const sx = Math.abs(px.x - p0.x);
          const sy = Math.abs(py.y - p0.y);
          const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));
          const minR = Math.max(1, r - padWorld - strokeWidth / 2);
          const sidePx = Math.max(4, Math.SQRT2 * minR * sLim);
          const centerX = containerRect.left + rect.x + rect.width / 2;
          const centerY = containerRect.top + rect.y + rect.height / 2;
          const dpr = (window.devicePixelRatio || 1);
          const roundPx = (v: number) => Math.round(v * dpr) / dpr;
          const ceilPx = (v: number) => Math.ceil(v * dpr) / dpr;
          const l = roundPx(centerX - sidePx / 2);
          const tt = roundPx(centerY - sidePx / 2);
          const w = ceilPx(sidePx);
          Object.assign(this.currentEditorWrapper.style, { left: `${l}px`, top: `${tt}px`, width: `${w}px`, height: `${w}px`, transform: 'translate(-50%, -50%)', outline: this.getDebug().outlineOverlay ? '1px solid red' : '' });

          // Debug parity logging (same RAF): DOM content px vs Konva world
          if (this.getDebug().log) {
            try {
              const padPx = padWorld * sLim;
              const contentWPx = Math.max(0, w - 2 * padPx);
              const t = group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text') || group.findOne<Konva.Text>('Text.text');
              const tw = t ? (t as any).width?.() || 0 : 0;
              const twPx = tw * sx;
              const sxDbg = sx;
              const syDbg = sy;
              const ff = (t as any)?.fontFamily?.() || 'Inter, system-ui, sans-serif';
              const fsPx = (t as any)?.fontSize?.() ? ((t as any).fontSize() * sy) : 14 * sy;
              const lh = (t as any)?.lineHeight?.() ?? 1.3;
              const baselinePx = this.getBaselineOffsetPx(ff, fsPx, lh);
              const zBaseline = this.getDebug().zeroBaseline ? 0 : baselinePx;
              console.log('[TextParityDBG] tween', { contentWPx, textNodeWidthWorld: tw, textNodeWidthPx: twPx, sx: sxDbg, sy: syDbg, baselinePx, usedBaselinePx: zBaseline });
            } catch {}
          }
        } catch {}
      }

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        this.refreshTransformer?.(elId);
        this.radiusTweens.delete(elId);
      }
    };
    raf = requestAnimationFrame(tick);
    const cancel = () => { try { cancelAnimationFrame(raf); } catch {} };
    this.radiusTweens.set(elId, { cancel });
  }

  // Rectangle
  public createRectangle(el: any): Konva.Group {
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

    if (el.text !== undefined) {
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
      ;(text as any).wrap('word');
      ;(text as any).align(((el as any).style?.align ?? (el as any).align) || 'left');
      ;(text as any).lineHeight(((el as any).style?.lineHeight ?? (el as any).lineHeight) || 1.25);
      try { text.visible(!((el as any).isEditing)); } catch {}

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
        try { text.visible(!((el as any).isEditing)); } catch {}
        this.ensureHitAreaSize(group, w, h);

        // Report height change to the store so element can be updated
        if (this.updateElementCallback) {
          this.updateElementCallback(id, { height: h });
        }
      }
    }

    return group;
  }

  public updateRectangle(group: Konva.Group, el: any) {
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
      // Use proportional padding for circles to better utilize circular space
      const basePad = (el as any).padding ?? 12;
      const pad = basePad;
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
        ;(text as any).wrap('word');
        ;(text as any).align(((el as any).style?.align ?? (el as any).align) || 'left');
        ;(text as any).lineHeight(((el as any).style?.lineHeight ?? (el as any).lineHeight) || 1.25);
        try { text.visible(!((el as any).isEditing)); } catch {}

        // Auto-height logic
        const desiredHeight = Math.max(h, Math.ceil(text.height()) + pad * 2);
        const maxH = (el as any).maxHeight ? Math.max(1, (el as any).maxHeight) : undefined;
        const clamped = maxH ? Math.min(desiredHeight, maxH) : desiredHeight;
        
        if (clamped !== h) {
          h = clamped;
          rect?.height(h);
          try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {}
          try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
          try { text.visible(!((el as any).isEditing)); } catch {}
          this.ensureHitAreaSize(group, w, h);

          if (this.updateElementCallback) {
            this.updateElementCallback(String(el.id), { height: h });
          }
        }

        try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {}
      }
    }
  }

  // Circle
  public createCircle(el: any): Konva.Group {
    const id = String(el.id);
    // Use a center-origin group.
    const group = new Konva.Group({ id, name: 'circle', listening: true, draggable: true });
    group.position({ x: el.x || 0, y: el.y || 0 });

    // The ellipse is positioned at (0,0) within the group.
    const ellipse = new Konva.Ellipse({
      x: 0,
      y: 0,
      radiusX: el.radiusX || el.radius || 40,
      radiusY: el.radiusY || el.radius || 40,
      name: 'shape',
      listening: false,
      perfectDrawEnabled: false,
      strokeScaleEnabled: false,
    });
    group.add(ellipse);

    // The content group for text also uses the center-origin.
    const content = new Konva.Group({ name: 'content', listening: false, x: 0, y: 0 });
    group.add(content);

    const text = new Konva.Text({
        name: 'label',
        listening: false,
        align: 'left',
    });
    content.add(text);

    // A hit area rectangle, centered on the origin.
    const hitArea = new Konva.Rect({ name: 'hit-area', listening: true });
    group.add(hitArea);
    hitArea.moveToBottom();

    // Delegate final attribute setting to the unified update function.
    this.updateCircle(group, el);
    return group;
  }

  public updateCircle(group: Konva.Group, el: any) {
    const radiusX = Math.max(20, el.radiusX || el.radius || 20);
    const radiusY = Math.max(20, el.radiusY || el.radius || 20);
    const strokeWidth = el.strokeWidth ?? 1;

    group.position({ x: el.x || 0, y: el.y || 0 });
    group.rotation(el.rotation || 0);

    let ellipse = group.findOne<Konva.Ellipse>('.shape');
    if (!ellipse || (radiusX !== radiusY && ellipse.getClassName() === 'Circle')) {
        const oldShape = ellipse;
        ellipse = new Konva.Ellipse({ name: 'shape', listening: false, radiusX, radiusY });
        group.add(ellipse);
        if (oldShape) {
            ellipse.moveUp();
            oldShape.destroy();
        }
    }

    ellipse.setAttrs({
        x: 0, 
        y: 0,
        radiusX,
        radiusY,
        fill: el.fill || '#ffffff',
        stroke: el.stroke || '#d1d5db',
        strokeWidth,
        strokeScaleEnabled: false,
        perfectDrawEnabled: false,
    });

    this.updateCircleShadow(ellipse, el.isEditing);

    const hitArea = group.findOne<Konva.Rect>('.hit-area');
    if (hitArea) {
        hitArea.setAttrs({ x: -radiusX, y: -radiusY, width: radiusX * 2, height: radiusY * 2 });
    }

    if (typeof el.text === 'string' || el.isEditing) {
        const pad = el.padding ?? 16;
        const content = group.findOne<Konva.Group>('.content');
        const textNode = content?.findOne<Konva.Text>('.label');

        if (content && textNode) {
            const clipRx = Math.max(1, radiusX - strokeWidth / 2);
            const clipRy = Math.max(1, radiusY - strokeWidth / 2);
            content.clipFunc((ctx: CanvasRenderingContext2D) => {
                ctx.ellipse(0, 0, clipRx, clipRy, 0, 0, Math.PI * 2);
            });

            // First clear any existing text to reset state
            textNode.text('');
            
            // Set basic properties without text
            textNode.setAttrs({
                fontSize: el.fontSize || 14,
                fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
                fill: el.textColor || '#374151',
                lineHeight: 1.3,
                align: 'left',
            });
            try { (textNode as any).letterSpacing?.(((el as any).letterSpacing) ?? 0); } catch {}

            // Size text area: use inscribed square for perfect circles, top-aligned with uniform padding
            const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
            const padding = el.padding ?? 16;  // Use element padding or default
            
            // Calculate text area dimensions BEFORE setting text
            let textAreaWidth: number;
            let textAreaHeight: number;
            
            if (nearlyCircle) {
              // For circles, use inscribed square
              const rClip = Math.max(1, Math.min(radiusX, radiusY) - strokeWidth / 2);
              const side = Math.SQRT2 * rClip - padding * 2;
              
              // Critical fix: Ensure dimensions are NEVER Infinity or NaN
              if (!isFinite(side) || side <= 0) {
                textAreaWidth = 30;
                textAreaHeight = 30;
              } else {
                textAreaWidth = Math.max(30, side);
                textAreaHeight = Math.max(30, side);
              }
              
              // CRITICAL DEBUG: Check for Infinity before setting
              if (!isFinite(textAreaWidth) || !isFinite(textAreaHeight)) {
                textAreaWidth = 30;
                textAreaHeight = 30;
              }
              
              // Set dimensions and wrap FIRST (critical for Konva wrapping to work)
              textNode.setAttrs({
                width: textAreaWidth,
                height: textAreaHeight,
                wrap: 'word',
                ellipsis: false
              });
              
              // Now apply manual text wrapping
              if (el.text) {
                const lines = this.wrapTextManually(
                  el.text,
                  textAreaWidth,
                  el.fontSize || 14,
                  el.fontFamily || 'Inter, system-ui, sans-serif'
                );
                const wrappedText = lines.join('\n');
                textNode.text(wrappedText);
                // Disable Konva wrapping since we're doing it manually
                (textNode as any).wrap('none');
              } else {
                textNode.text('');
              }
              
              // Clear cache to force remeasurement
              try {
                textNode.clearCache();
                (textNode as any)._clearCache?.();
                (textNode as any).getTextWidth = null;
              } catch (e) {
                console.warn('[Circle updateCircle] Cache clear error:', e);
              }
              
              // Position text centered
              const xWorld = -textAreaWidth / 2;
              const yWorld = -textAreaHeight / 2;
              textNode.position({ x: xWorld, y: yWorld });
            } else {
              // For ellipses, use aspect-aware inscribed rectangle
              const tb = getEllipticalTextBounds(radiusX, radiusY, padding, strokeWidth);
              textAreaWidth = Math.max(30, tb.width);
              textAreaHeight = Math.max(30, tb.height);
              
              // Set dimensions and wrap FIRST
              textNode.setAttrs({
                width: textAreaWidth,
                height: textAreaHeight,
                wrap: 'word',
                ellipsis: false
              });
              
              // Apply manual text wrapping for ellipses too
              if (el.text) {
                const lines = this.wrapTextManually(
                  el.text,
                  textAreaWidth,
                  el.fontSize || 14,
                  el.fontFamily || 'Inter, system-ui, sans-serif'
                );
                const wrappedText = lines.join('\n');
                textNode.text(wrappedText);
                (textNode as any).wrap('none');
              } else {
                textNode.text('');
              }
              
              // Clear cache
              try {
                textNode.clearCache();
                (textNode as any)._clearCache?.();
              } catch {}
              
              const xWorld = -textAreaWidth / 2;
              const yWorld = -textAreaHeight / 2;
              textNode.position({ x: xWorld, y: yWorld });
            }
            
            // Force layer redraw to ensure text changes are visible
            if (group.getLayer() && this.scheduleDraw) {
              this.scheduleDraw('main');
            }

            textNode.visible(!el.isEditing);

            // Auto-grow while typing for perfect circles (font size fixed, expand radius only)
            // Check if text needs more space and grow the circle if needed
            try {
              if (nearlyCircle && el.isEditing) {
                const fontSize = textNode.fontSize();
                const lineHeight = (textNode as any).lineHeight?.() ?? 1.3;
                const family = textNode.fontFamily();
                const style = (textNode as any).fontStyle?.() ?? 'normal';
                const currentR = Math.max(radiusX, radiusY);
                // Compute required radius to contain the text inside inscribed square at fixed font size
                const requiredR = requiredRadiusForText({
                  text: textNode.text() || '',
                  family,
                  style,
                  lineHeight,
                  fontSize,
                  padding: padding,
                  strokeWidth: strokeWidth || 0,
                });
                
                if (requiredR > currentR + 0.5) {
                  // Update ellipse radii uniformly
                  if (ellipse.getClassName() === 'Circle') {
                    (ellipse as any).radius(requiredR);
                  } else {
                    (ellipse as any).radiusX?.(requiredR);
                    (ellipse as any).radiusY?.(requiredR);
                  }

                  // Update hit-area
                  const sideR = requiredR;
                  const hitArea = group.findOne<Konva.Rect>('.hit-area');
                  if (hitArea) {
                    hitArea.setAttrs({ x: -sideR, y: -sideR, width: 2 * sideR, height: 2 * sideR });
                  }

                  // Update text area to new inscribed square
                  const rClip = Math.max(1, requiredR - (strokeWidth || 0) / 2);
                  const sideWorld = Math.SQRT2 * rClip;
                  const innerWorld = Math.max(1, sideWorld - padding * 2);
                  const absT = group.getAbsoluteTransform();
                  const p0 = absT.point({ x: 0, y: 0 });
                  const px1 = absT.point({ x: 1, y: 0 });
                  const py1 = absT.point({ x: 0, y: 1 });
                  const sx = Math.max(1e-6, Math.abs(px1.x - p0.x));
                  const sy = Math.max(1e-6, Math.abs(py1.y - p0.y));
                  const sLim = Math.min(sx, sy);
                  const innerPx = innerWorld * sLim;
                  const widthWorld = innerPx / sx;
                  const heightWorld = innerPx / sy;
                  textNode.width(Math.max(1, widthWorld));
                  textNode.height(Math.max(1, heightWorld));
                  const xWorld = -(innerPx / 2) / sx;
                  const yWorld = -(innerPx / 2) / sy;
                  textNode.position({ x: xWorld, y: yWorld });

                  // SAME-FRAME: Sync DOM overlay square if editing this element
                  if (this.currentEditingId === String(el.id) && this.currentEditorWrapper && this.stage) {
                    try {
                      const abs = group.getAbsoluteTransform().decompose();
                      const scale = Math.max(abs.scaleX || 1, abs.scaleY || 1);
                      const sidePx = Math.max(4, Math.SQRT2 * rClip * scale);
                      const center = group.getAbsoluteTransform().point({ x: 0, y: 0 });
                      const cRect = this.stage.container().getBoundingClientRect();
                      const cx = cRect.left + center.x;
                      const cy = cRect.top + center.y;
                      Object.assign(this.currentEditorWrapper.style, { left: `${Math.round(cx)}px`, top: `${Math.round(cy)}px`, width: `${Math.round(sidePx)}px`, height: `${Math.round(sidePx)}px`, transform: 'translate(-50%, -50%)' });
                    } catch {}
                  }

                  // Persist size to store and refresh transformer
                  this.updateElementCallback?.(String(el.id), {
                    radius: requiredR,
                    radiusX: requiredR,
                    radiusY: requiredR,
                    width: 2 * requiredR,
                    height: 2 * requiredR,
                  });
                  this.refreshTransformer?.(String(el.id));
                  this.scheduleDraw?.('main');
                }
              }
            } catch {}
        }
    }
  }

  // Circle-Text: centered text with auto-fit font size
  public createCircleText(el: any): Konva.Group {
    const id = String(el.id);
    let r = (el.radius ?? (Math.min(el.width || 0, el.height || 0) / 2));
    if (!r || r <= 0) r = 40;
    const group = new Konva.Group({ id, name: 'circle-text', listening: true, draggable: true });
    // Center-origin: group at element center
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Circle node at origin
    let circle = new Konva.Circle({ name: 'Circle', listening: true });
    group.add(circle);

    // Text node aligned to center-origin
    let textNode = new Konva.Text({ name: 'Text', listening: false, align: 'left', verticalAlign: 'middle' as any });
    group.add(textNode);

    // Hit area centered
    const hit = new Konva.Rect({ name: 'hit-area', listening: true, x: -r, y: -r, width: r * 2, height: r * 2, fill: 'rgba(0,0,0,0.001)' });
    group.add(hit);

    // Let sync method lay out nodes fully
    this.syncCircleText(el as any, group);
    return group;
  }

  public updateCircleTextElement(group: Konva.Group, el: any) {
    // Replaced by syncCircleText to use center-origin and utils
    this.syncCircleText(el as any, group);
  }

  // New: unified circle-text sync using center-origin and inscribed-square layout
  public syncCircleText(el: any, group: Konva.Group) {
    const id = String(el.id);
    // Center-origin
    group.position({ x: el.x || 0, y: el.y || 0 });
    group.rotation(el.rotation || 0);
    group.scale({ x: 1, y: 1 });

    // Nodes
    let circle = group.findOne<Konva.Circle>('Circle');
    if (!circle) { circle = new Konva.Circle({ name: 'Circle', listening: true }); group.add(circle); }
    let textNode = group.findOne<Konva.Text>('Text');
    if (!textNode) { textNode = new Konva.Text({ name: 'Text', listening: false, align: 'left', verticalAlign: 'middle' as any }); group.add(textNode); }
    let hit = group.findOne<Konva.Rect>('Rect.hit-area') as Konva.Rect | null;
    if (!hit) { hit = new Konva.Rect({ name: 'hit-area', listening: true, fill: 'rgba(0,0,0,0.001)' }); group.add(hit); }

    // Handle both circular and elliptical shapes
    let radiusX = el.radiusX || el.radius || (el.width ? el.width / 2 : 40);
    let radiusY = el.radiusY || el.radius || (el.height ? el.height / 2 : 40);
    if (radiusX <= 0) radiusX = 40;
    if (radiusY <= 0) radiusY = 40;
    
    // Effective padding uses declared padding; stroke is handled separately
    const pad = Math.max(0, (el.padding ?? 12));
    // Use aspect-ratio aware bounds calculation to prevent text spillover
    const strokeWidth = el.strokeWidth ?? 1;
    let textBounds = getEllipticalTextBounds(radiusX, radiusY, pad, strokeWidth);
    // For perfect circles, use a prominent inscribed SQUARE for text area
    let textAreaWidth = textBounds.width;
    let textAreaHeight = textBounds.height;
    if (Math.abs(radiusX - radiusY) < 0.001) {
      const rClip = Math.max(1, radiusX - pad - strokeWidth / 2);
      const side = Math.SQRT2 * rClip; // inscribed square side
      textAreaWidth = side;
      textAreaHeight = side;
    }
    
    // Ensure we never have invalid dimensions
    // Also ensure minimum size for text wrapping to work properly
    if (!isFinite(textAreaWidth) || textAreaWidth <= 0) {
      textAreaWidth = Math.max(100, (el.fontSize || 14) * 4); // Dynamic fallback based on font size
    } else if (textAreaWidth < 30) {
      textAreaWidth = 30; // Minimum width for text to wrap
    }
    
    if (!isFinite(textAreaHeight) || textAreaHeight <= 0) {
      textAreaHeight = Math.max(100, (el.fontSize || 14) * 3); // Dynamic fallback based on font size
    } else if (textAreaHeight < 30) {
      textAreaHeight = 30; // Minimum height
    }
    
    // Handle both circle and ellipse visuals at origin
    if (radiusX === radiusY) {
      // Perfect circle
      circle.setAttrs({ x: 0, y: 0, radius: radiusX, fill: el.fill || '#ffffff', stroke: el.stroke || '#d1d5db', strokeWidth: el.strokeWidth ?? 1 });
    } else {
      // Need to convert to ellipse or create ellipse
      if (circle.getClassName() === 'Circle') {
        // Replace circle with ellipse
        const ellipse = new Konva.Ellipse({
          x: 0, y: 0,
          radiusX, radiusY,
          fill: el.fill || '#ffffff', 
          stroke: el.stroke || '#d1d5db', 
          strokeWidth: el.strokeWidth ?? 1,
          name: 'Circle'
        });
        try { (ellipse as any).strokeScaleEnabled(false); } catch {}
        circle.destroy();
        group.add(ellipse);
        // Update reference for later use
        circle = ellipse as any;
      } else {
        // Already an ellipse, update it
        (circle as any).radiusX?.(radiusX);
        (circle as any).radiusY?.(radiusY);
        circle.setAttrs({ fill: el.fill || '#ffffff', stroke: el.stroke || '#d1d5db', strokeWidth: el.strokeWidth ?? 1 });
      }
    }
    try { (circle as any).strokeScaleEnabled(false); } catch {}

    // Hit area centered on origin, using max radius for interaction area
    const maxRadius = Math.max(radiusX, radiusY);
    hit.setAttrs({ x: -maxRadius, y: -maxRadius, width: 2 * maxRadius, height: 2 * maxRadius });

    // Font sizing
    const minFont = Math.max(1, el.minFont ?? 10);
    const maxFont = Math.max(minFont, el.maxFont ?? 240);
    const lineHeight = el.lineHeight ?? 1.3;
    const wrapMode: 'scale' | 'wrap' | 'ellipsis' = el.textFit ?? 'wrap';

    // FigJam-style: do not auto-scale font on resize; use explicit fontSize only
    const fontSize: number = el.fontSize || 14;

    // Create content group with elliptical clipping for safety net
    let content = group.findOne<Konva.Group>('Group.text-content');
    if (!content) {
      content = new Konva.Group({ name: 'text-content', listening: false });
      group.add(content);
      textNode.moveTo(content);
    }
    
    // Apply elliptical clipping as safety net using exact pad + stroke/2 reduction
    const rxClip = Math.max(1, radiusX - pad - strokeWidth / 2);
    const ryClip = Math.max(1, radiusY - pad - strokeWidth / 2);
    try {
      (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.ellipse(0, 0, rxClip, ryClip, 0, 0, Math.PI * 2);
      });
    } catch {}

    // If actively editing via DOM overlay, keep Konva text hidden (relayout continues for auto-grow parity)
    const editingActive = (this.currentEditingId === id) && !!el.isEditing;
    if (editingActive) {
      try { textNode.visible(false); } catch {}
    }

    // CRITICAL: Set dimensions and wrap FIRST (before text and positioning)
    // This is required for Konva text wrapping to work properly
    textNode.setAttrs({
      width: textAreaWidth,
      height: textAreaHeight,
      wrap: 'word',
      ellipsis: false,
    } as any);
    
    // MANUAL TEXT WRAPPING FALLBACK - Use our own wrapping if Konva fails
    const useManualWrapping = true; // Enable manual wrapping as primary strategy
    
    if (useManualWrapping && el.text) {
      const lines = this.wrapTextManually(
        el.text,
        textAreaWidth,
        fontSize,
        el.fontFamily || 'Inter, system-ui, sans-serif'
      );
      const wrappedText = lines.join('\n');
      textNode.text(wrappedText);
      // Disable Konva wrapping since we're doing it manually
      (textNode as any).wrap('none');
    } else {
      // Fallback to Konva wrapping
      textNode.text(el.text || '');
    }
    
    // NOW set positioning and styling after wrapping is configured
    textNode.setAttrs({
      x: -textAreaWidth / 2,
      y: -textAreaHeight / 2,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fontStyle: el.fontStyle || 'normal',
      fontSize,
      lineHeight,
      fill: el.textColor || '#111827',
      align: 'left',
      listening: false,
    } as any);
    
    // FORCE TEXT REMEASUREMENT - Clear any existing cache that might interfere
    try {
      textNode.clearCache();
      (textNode as any).getTextWidth = null; // Clear internal cache
      (textNode as any)._clearCache?.(); // Additional cache clear
      (textNode as any)._requestDraw?.(); // Force redraw
    } catch (e) {
      console.warn('[Circle Text] Cache clear error:', e);
    }
    
    try { (textNode as any).letterSpacing?.((el as any).letterSpacing ?? 0); } catch {}
    
    // Force layer redraw to ensure text changes are visible
    if (group.getLayer() && this.scheduleDraw) {
      this.scheduleDraw('main');
    }

    // Top-aligned contract with non-uniform scale mapping and baseline compensation
    const absT = group.getAbsoluteTransform();
    const p0 = absT.point({ x: 0, y: 0 });
    const px1 = absT.point({ x: 1, y: 0 });
    const py1 = absT.point({ x: 0, y: 1 });
    const sx = Math.max(1e-6, Math.abs(px1.x - p0.x));
    const sy = Math.max(1e-6, Math.abs(py1.y - p0.y));
    const sLim = Math.min(sx, sy);
    // Fixed on-screen padding per contract (in CSS px)
    const padPx = this.getCirclePadPx(el);
    // Compute overlay content size in px using limiting axis, then map per-axis to world
    const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
    if (nearlyCircle) {
      // Inscribed square (screen px) then map to world using per-axis scale
      const rClip = Math.max(1, Math.min(radiusX, radiusY) - strokeWidth / 2);
      const sidePx = Math.SQRT2 * rClip * sLim;
      const contentPx = Math.max(1, sidePx - 2 * padPx);
      // FIXED: Use the original textAreaWidth which was calculated correctly
      // Don't recalculate with transforms - that was causing the width to be too large
      const widthToUse = textAreaWidth;
      const heightToUse = textAreaHeight;
      
      textNode.width(Math.max(1, widthToUse));
      textNode.height(Math.max(1, heightToUse));
      // Position based on the actual width/height we're using
      const xWorld = -widthToUse / 2;
      const yWorld = -heightToUse / 2;
      textNode.position({ x: xWorld, y: yWorld });
      
      // Don't re-apply wrap here - it's already configured above
      // Just clear cache if needed
      try { 
        (textNode as any)._clearCache?.();
        (textNode as any).clearCache?.();
      } catch {}
    } else {
      const innerPad = pad; // Define innerPad here if needed
      const innerW = Math.max(1, textAreaWidth - innerPad * 2);
      const innerH = Math.max(1, textAreaHeight - innerPad * 2);
      // Map to px using axis scales, then convert back to world using same axes to keep parity explicit
      const innerWPx = innerW * sLim; // using limiting axis for overlay parity
      const innerHPx = innerH * sLim;
      const widthWorld = innerWPx / sx;
      const heightWorld = innerHPx / sy;
      textNode.width(Math.max(1, widthWorld));
      textNode.height(Math.max(1, heightWorld));
      const fontPx = fontSize * sy;
      let baselinePx = this.getBaselineOffsetPx(textNode.fontFamily?.() || (el.fontFamily || 'Inter, system-ui, sans-serif'), fontPx, lineHeight);
      if (this.getDebug().zeroBaseline) baselinePx = 0;
      const baselineWorld = baselinePx / sy;
      const xWorld = -(innerWPx / 2) / sx;
      const yWorld = -(innerHPx / 2) / sy - baselineWorld;
      textNode.position({ x: xWorld, y: yWorld });
      
      // Don't re-apply wrap here - it's already configured above
      // Just clear cache if needed
      try { 
        (textNode as any)._clearCache?.();
        (textNode as any).clearCache?.();
      } catch {}
    }

    // Auto-grow while typing for perfect circles (font size fixed, expand radius only)
    try {
      const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
      if (nearlyCircle && el.isEditing) {
        const fontSize = textNode.fontSize();
        const family = textNode.fontFamily();
        const style = (textNode as any).fontStyle?.() ?? 'normal';
        const currentR = Math.max(radiusX, radiusY);
        const requiredR = this.calculateOptimalRadiusBeforeLayout({
          text: textNode.text() || '',
          family,
          style,
          lineHeight,
          fontSize,
          padding: pad,
          strokeWidth: strokeWidth || 0,
        });
        if (requiredR > currentR + 0.5) {
          // SNAP ONCE (WORLD)
          const dpr = (window.devicePixelRatio || 1);
          const snapWorld = (v: number) => Math.ceil(v * dpr) / dpr;
          const rWorld = snapWorld(requiredR);

          radiusX = rWorld;
          radiusY = rWorld;
          if (circle && circle.getClassName() === 'Circle') {
            (circle as any).radius(rWorld);
          } else if (circle) {
            (circle as any).radiusX?.(rWorld);
            (circle as any).radiusY?.(rWorld);
          }
          hit.setAttrs({ x: -rWorld, y: -rWorld, width: 2 * rWorld, height: 2 * rWorld });
          // Inscribed square for perfect circles
          const rClip = Math.max(1, rWorld - (strokeWidth || 0) / 2);
          const side = Math.SQRT2 * rClip;
          const innerPad2 = pad;
          const innerSide = Math.max(1, side - innerPad2 * 2);
          // Map to world under non-uniform scale
          const abs2 = group.getAbsoluteTransform();
          const p02 = abs2.point({ x: 0, y: 0 });
          const px2 = abs2.point({ x: 1, y: 0 });
          const py2 = abs2.point({ x: 0, y: 1 });
          const sx2 = Math.max(1e-6, Math.abs(px2.x - p02.x));
          const sy2 = Math.max(1e-6, Math.abs(py2.y - p02.y));
          const widthWorld2 = innerSide / sx2;
          const heightWorld2 = innerSide / sy2;
          textNode.width(Math.max(1, widthWorld2));
          textNode.height(Math.max(1, heightWorld2));
          const fontPx2 = (textNode.fontSize?.() || fontSize) * sy2;
          let baselinePx2 = this.getBaselineOffsetPx(textNode.fontFamily?.() || (el.fontFamily || 'Inter, system-ui, sans-serif'), fontPx2, (textNode as any).lineHeight?.() ?? 1.3);
          if (this.getDebug().zeroBaseline) baselinePx2 = 0;
          const baselineWorld2 = baselinePx2 / sy2;
          const xWorld2 = -(innerSide / 2) / sx2;
          const yWorld2 = -(innerSide / 2) / sy2 - baselineWorld2;
          textNode.position({ x: xWorld2, y: yWorld2 });
          // SAME-FRAME: Sync DOM overlay square if editing this element
          if (this.currentEditingId === id && this.currentEditorWrapper && this.stage) {
            try {
              const absT = group.getAbsoluteTransform();
              const p0 = absT.point({ x: 0, y: 0 });
              const px = absT.point({ x: 1, y: 0 });
              const py = absT.point({ x: 0, y: 1 });
              const sx = Math.abs(px.x - p0.x);
              const sy = Math.abs(py.y - p0.y);
              const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));
              const dpr = (window.devicePixelRatio || 1);
              const sidePx = Math.ceil((Math.SQRT2 * (rWorld - (strokeWidth || 0) / 2) * sLim) * dpr) / dpr;
              const cRect = this.stage.container().getBoundingClientRect();
              const center = group.getAbsoluteTransform().point({ x: 0, y: 0 });
              const cx = cRect.left + center.x;
              const cy = cRect.top + center.y;
              Object.assign(this.currentEditorWrapper.style, { left: `${Math.round(cx)}px`, top: `${Math.round(cy)}px`, width: `${Math.round(sidePx)}px`, height: `${Math.round(sidePx)}px`, transform: 'translate(-50%, -50%)' });
              // Fixed inner pad (screen px)
              if (this.currentEditorPad) {
                const px = this.getCirclePadPx(el);
                this.currentEditorPad.style.padding = `${px}px`;
              }
            } catch {}
          }
          this.updateElementCallback?.(id, { radius: rWorld, radiusX: rWorld, radiusY: rWorld, width: 2 * rWorld, height: 2 * rWorld });
          this.refreshTransformer?.(id);
          this.scheduleDraw?.('main');
        }
      }
    } catch {}

    // Visibility during editing
    try { textNode.visible(!el.isEditing); } catch {}
  }

  // Triangle
  public createTriangle(el: any): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 180);
    const h = Math.max(1, el.height || 180);
    const group = this.createGroupWithHitArea(id, w, h);
    group.name('triangle');
    group.position({ x: el.x || 0, y: el.y || 0 });

    const points = [
      Math.round(w / 2), 0,
      w, h,
      0, h,
    ];

    const tri = new Konva.Line({
      points,
      closed: true,
      fill: el.fill || '#ffffff',
      stroke: el.stroke || '#d1d5db',
      strokeWidth: el.strokeWidth ?? 1,
      listening: false,
      perfectDrawEnabled: false,
      name: 'shape'
    });
    try { (tri as any).strokeScaleEnabled(false); } catch {}
    tri.shadowColor('#000');
    tri.shadowOpacity(0.08);
    tri.shadowBlur(8);
    tri.shadowOffset({ x: 0, y: 1 });
    group.add(tri);

    // Optional centered text (clipped to triangle)
    if (typeof el.text === 'string') {
      const pad = (el as any).padding ?? 12;
      let content = group.findOne<Konva.Group>('Group.content');
      if (!content) {
        content = new Konva.Group({ name: 'content', listening: false });
        // Clip to triangle shape
        try {
          (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
          });
        } catch {}
        group.add(content);
      }
      let text = group.findOne<Konva.Text>('Text.label');
      if (!text) {
        text = new Konva.Text({ name: 'label', listening: false });
        (content as Konva.Group).add(text);
      }
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      ;(text as any).wrap('word');
      ;(text as any).align('center');
      // Position text lower for a wider area and center it
      const y0 = Math.max(pad, Math.floor(h * 0.55)); // ~55% down from top for better width
      const topWidth = Math.max(1, Math.floor((w * y0) / Math.max(1, h))); // linear width along sides
      const innerW = Math.max(1, topWidth - pad * 2);
      text.width(innerW);
      text.x(Math.max(0, Math.floor((w - innerW) / 2)));
      text.y(y0);
      try { text.moveToTop(); text.visible(!((el as any).isEditing)); } catch {}
      const measuredH = Math.ceil(text.height());
      const innerH = Math.max(1, h - y0 - pad);
      if (measuredH > innerH) {
        const newH = measuredH + pad * 2;
        tri.points([Math.round(w / 2), 0, w, newH, 0, newH]);
        this.ensureHitAreaSize(group, w, newH);
        if (this.updateElementCallback) {
          this.updateElementCallback(id, { height: newH });
        }
      }
    }
    return group;
  }

  public updateTriangle(group: Konva.Group, el: any) {
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });
    this.ensureHitAreaSize(group, w, h);

    // Find existing triangle shape or create one
    let tri = group.findOne<Konva.Line>((node: any) => node.name() === 'shape' && node.getClassName() === 'Line');
    if (!tri) {
      // Remove any duplicate shapes before creating new one
      const existingShapes = group.find((node: any) => node.name() === 'shape');
      existingShapes.forEach(shape => shape.destroy());
      
      tri = new Konva.Line({ name: 'shape', listening: false, closed: true });
      group.add(tri);
    }
    const points = [
      Math.round(w / 2), 0,
      w, h,
      0, h,
    ];
    tri.points(points);
    tri.closed(true);
    tri.fill(el.fill || '#ffffff');
    tri.stroke(el.stroke || '#d1d5db');
    tri.strokeWidth(el.strokeWidth ?? 1);
    // Ensure no duplicate rendering
    tri.perfectDrawEnabled(false);
    try { (tri as any).strokeScaleEnabled(false); } catch {}
    tri.shadowColor('#000');
    tri.shadowOpacity(0.08);
    tri.shadowBlur(8);
    tri.shadowOffset({ x: 0, y: 1 });

    if (typeof el.text === 'string') {
      const pad = (el as any).padding ?? 12;
      let content = group.findOne<Konva.Group>('Group.content');
      if (!content) {
        content = new Konva.Group({ name: 'content', listening: false });
        group.add(content);
      }
      // Refresh clip to triangle shape
      try {
        (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
        });
      } catch {}
      let text = group.findOne<Konva.Text>('Text.label');
      if (!text) {
        text = new Konva.Text({ name: 'label', listening: false });
        (content as Konva.Group).add(text);
      }
      // Compute a centered inner rectangle inside triangle
      const innerWmax = Math.max(1, w - pad * 2);
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      ;(text as any).wrap('word');
      ;(text as any).align('center');
      const y0 = Math.max(pad, Math.floor(h * 0.55));
      const topWidth = Math.max(1, Math.floor((w * y0) / Math.max(1, h)));
      const innerW = Math.min(innerWmax, Math.max(1, topWidth - pad * 2));
      text.width(innerW);
      text.x(Math.max(0, Math.floor((w - innerW) / 2)));
      text.y(y0);
      try { text.moveToTop(); text.visible(!((el as any).isEditing)); } catch {}
      const measuredH = Math.ceil(text.height());
      const innerH = Math.max(1, h - y0 - pad);
      if (measuredH > innerH) {
        const newH = measuredH + pad * 2;
        tri.points([Math.round(w / 2), 0, w, newH, 0, newH]);
        this.ensureHitAreaSize(group, w, newH);
        if (this.updateElementCallback) {
          this.updateElementCallback(String(el.id), { height: newH });
        }
      }
    }
  }
}