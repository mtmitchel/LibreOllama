// src/features/canvas/tools/ShapeTools.ts
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { RectangleElement, CircleElement, TriangleElement, ElementId } from '../types/enhanced.types';

export interface ITool {
  readonly type: string;
  readonly cursor: string;
  activate(): void;
  deactivate(): void;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
}

export class SelectTool implements ITool {
  readonly type = 'select';
  readonly cursor = 'default';
  private marquee?: Konva.Rect;
  private start?: { x: number; y: number };
  activate() {}
  deactivate() { this.destroyMarquee(); }
  private destroyMarquee() { if (this.marquee) { this.marquee.destroy(); this.marquee = undefined; } }
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const store = useUnifiedCanvasStore.getState();
    const stage = e.target.getStage();
    if (!stage) return;
    const target = e.target;
    if (target) {
      // Ignore transformer handles so they don't toggle selection
      const cls = (target as any).getClassName?.();
      const name = (target as any).name?.();
      if (cls === 'Transformer' || name === 'top-left' || name === 'top-right' || name === 'bottom-left' || name === 'bottom-right') {
        return; // allow transformer to handle the event
      }
      // Ascend to nearest Group with an id so children clicks resolve to parent element
      const group = (target as any).findAncestor?.((node: any) => node.getClassName && node.getClassName() === 'Group' && !!node.id(), true);
      if (group && typeof (group.id) === 'function') {
        const id = group.id() as ElementId;
        const multi = e.evt && (e.evt.ctrlKey || e.evt.metaKey);
        store.selectElement(id, !!multi);
        return;
      }
      if (typeof (target as any).id === 'function' && (target as any).id()) {
        const elementId = (target as any).id() as ElementId;
        const multi = e.evt && (e.evt.ctrlKey || e.evt.metaKey);
        store.selectElement(elementId, !!multi);
        return;
      }
    }
    const pos = stage.getPointerPosition();
    if (!pos) return;
    this.start = { x: pos.x, y: pos.y };
    const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
    const overlay = layers[layers.length - 1];
    this.marquee = new Konva.Rect({ x: pos.x, y: pos.y, width: 0, height: 0, stroke: '#3b82f6', dash: [4, 4], listening: false });
    overlay.add(this.marquee);
    overlay.batchDraw();
  }
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.start || !this.marquee) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const x = Math.min(this.start.x, pos.x);
    const y = Math.min(this.start.y, pos.y);
    const w = Math.abs(pos.x - this.start.x);
    const h = Math.abs(pos.y - this.start.y);
    this.marquee.position({ x, y } as any);
    this.marquee.size({ width: w, height: h } as any);
    this.marquee.getLayer()?.batchDraw();
  }
  onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    const store = useUnifiedCanvasStore.getState();
    if (!this.start || !this.marquee) { this.destroyMarquee(); return; }
    const rect = { x: this.marquee.x(), y: this.marquee.y(), w: this.marquee.width(), h: this.marquee.height() };
    this.destroyMarquee();
    this.start = undefined;
    // Build selection by element bounds (approximate)
    const elements = Array.from(store.elements.values());
    store.clearSelection();
    let first = true;
    for (const el of elements) {
      const ex = (el as any).x ?? 0;
      const ey = (el as any).y ?? 0;
      const ew = (el as any).width ?? ((el as any).radius ? (el as any).radius * 2 : 0);
      const eh = (el as any).height ?? ((el as any).radius ? (el as any).radius * 2 : 0);
      if (ew === 0 && eh === 0 && (el as any).points) {
        const pts = (el as any).points as number[];
        // approximate line bbox
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < pts.length; i += 2) { minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]); minY = Math.min(minY, pts[i+1]); maxY = Math.max(maxY, pts[i+1]); }
        if (maxX >= rect.x && minX <= rect.x + rect.w && maxY >= rect.y && minY <= rect.y + rect.h) {
          store.selectElement(el.id as ElementId, !first);
          first = false;
        }
        continue;
      }
      if (ex + ew >= rect.x && ex <= rect.x + rect.w && ey + eh >= rect.y && ey <= rect.y + rect.h) {
        store.selectElement(el.id as ElementId, !first);
        first = false;
      }
    }
  }
}

export class PanTool implements ITool {
  readonly type = 'pan';
  readonly cursor = 'grab';
  activate() {}
  deactivate() {}
  onMouseDown(_e: Konva.KonvaEventObject<MouseEvent>): void {}
}

abstract class BaseTool implements ITool {
  abstract readonly type: string;
  abstract readonly cursor: string;
  activate() {}
  deactivate() {}
  abstract onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
}

export class RectangleTool extends BaseTool {
  readonly type = 'rectangle';
  readonly cursor = 'crosshair';
  private start?: { x: number; y: number };
  private preview?: Konva.Rect;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    this.start = { x: pos.x, y: pos.y };
    const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
    const overlay = layers[layers.length - 1];
    this.preview = new Konva.Rect({ x: pos.x, y: pos.y, width: 0, height: 0, stroke: '#3b82f6', dash: [4, 4], listening: false });
    overlay.add(this.preview);
    overlay.batchDraw();
  }
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.start || !this.preview) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const alt = !!(e.evt as any).altKey;
    const x1 = this.start.x, y1 = this.start.y;
    let x = Math.min(x1, pos.x);
    let y = Math.min(y1, pos.y);
    let w = Math.abs(pos.x - x1);
    let h = Math.abs(pos.y - y1);
    if (alt) {
      x = x1 - w;
      y = y1 - h;
      w *= 2; h *= 2;
    }
    this.preview.position({ x, y } as any);
    this.preview.size({ width: w, height: h } as any);
    this.preview.getLayer()?.batchDraw();
  }
  onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage || !this.start || !this.preview) { this.cleanupPreview(); return; }
    const rect = { x: this.preview.x(), y: this.preview.y(), w: Math.max(1, this.preview.width()), h: Math.max(1, this.preview.height()) };
    const store = useUnifiedCanvasStore.getState();
    const element: RectangleElement = {
      id: nanoid() as any,
      type: 'rectangle',
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      fill: '#ffffff',
      stroke: '#111827',
      strokeWidth: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.addElement(element as any);
    store.selectElement(element.id as ElementId);
    this.cleanupPreview();
  }
  private cleanupPreview() {
    this.start = undefined;
    if (this.preview) { const layer = this.preview.getLayer(); this.preview.destroy(); layer?.batchDraw(); }
    this.preview = undefined;
  }
}

export class CircleTool extends BaseTool {
  readonly type = 'circle';
  readonly cursor = 'crosshair';
  private start?: { x: number; y: number };
  private preview?: Konva.Circle;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    this.start = { x: pos.x, y: pos.y };
    const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
    const overlay = layers[layers.length - 1];
    this.preview = new Konva.Circle({ x: pos.x, y: pos.y, radius: 0.5, stroke: '#3b82f6', dash: [4, 4], listening: false });
    overlay.add(this.preview);
    overlay.batchDraw();
  }
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.start || !this.preview) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const shift = !!(e.evt as any).shiftKey;
    const alt = !!(e.evt as any).altKey;
    const dx = pos.x - this.start.x;
    const dy = pos.y - this.start.y;
    const r = Math.max(Math.abs(dx), Math.abs(dy)) / 2;
    if (alt) {
      // draw from center
      this.preview.position({ x: this.start.x, y: this.start.y } as any);
      this.preview.radius(Math.max(0.5, r));
    } else {
      // top-left anchor -> center at midpoint
      const cx = this.start.x + Math.sign(dx) * r;
      const cy = this.start.y + Math.sign(dy) * r;
      this.preview.position({ x: cx, y: cy } as any);
      this.preview.radius(Math.max(0.5, r));
    }
    this.preview.getLayer()?.batchDraw();
  }
  onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage || !this.start || !this.preview) { this.cleanupPreview(); return; }
    const store = useUnifiedCanvasStore.getState();
    const element: CircleElement = {
      id: nanoid() as any,
      type: 'circle',
      x: this.preview.x(),
      y: this.preview.y(),
      radius: Math.max(1, this.preview.radius()),
      fill: '#ffffff',
      stroke: '#111827',
      strokeWidth: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.addElement(element as any);
    store.selectElement(element.id as ElementId);
    this.cleanupPreview();
  }
  private cleanupPreview() {
    this.start = undefined;
    if (this.preview) { const layer = this.preview.getLayer(); this.preview.destroy(); layer?.batchDraw(); }
    this.preview = undefined;
  }
}

export class TriangleTool extends BaseTool {
  readonly type = 'triangle';
  readonly cursor = 'crosshair';
  private start?: { x: number; y: number };
  private preview?: Konva.Line;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    this.start = { x: pos.x, y: pos.y };
    const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
    const overlay = layers[layers.length - 1];
    this.preview = new Konva.Line({ points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y], closed: true, stroke: '#3b82f6', dash: [4, 4], listening: false });
    overlay.add(this.preview);
    overlay.batchDraw();
  }
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.start || !this.preview) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const w = pos.x - this.start.x;
    const h = pos.y - this.start.y;
    const p1 = [this.start.x, this.start.y + Math.abs(h)];
    const p2 = [this.start.x + w / 2, this.start.y];
    const p3 = [this.start.x + w, this.start.y + Math.abs(h)];
    this.preview.points([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]]);
    this.preview.getLayer()?.batchDraw();
  }
  onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage || !this.start || !this.preview) { this.cleanupPreview(); return; }
    const pts = this.preview.points();
    const minX = Math.min(pts[0], pts[2], pts[4]);
    const minY = Math.min(pts[1], pts[3], pts[5]);
    const maxX = Math.max(pts[0], pts[2], pts[4]);
    const maxY = Math.max(pts[1], pts[3], pts[5]);
    const element: TriangleElement = {
      id: nanoid() as any,
      type: 'triangle',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points: [pts[0] - minX, pts[1] - minY, pts[2] - minX, pts[3] - minY, pts[4] - minX, pts[5] - minY],
      fill: '#ffffff',
      stroke: '#111827',
      strokeWidth: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
    const store = useUnifiedCanvasStore.getState();
    store.addElement(element as any);
    store.selectElement(element.id as ElementId);
    this.cleanupPreview();
  }
  private cleanupPreview() {
    this.start = undefined;
    if (this.preview) { const layer = this.preview.getLayer(); this.preview.destroy(); layer?.batchDraw(); }
    this.preview = undefined;
  }
}
