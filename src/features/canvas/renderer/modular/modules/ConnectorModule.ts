import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, ElementId } from '../../modular/types';

// Minimal modular connector module: snap preview + simple edge commit hooks
export class ConnectorModule implements RendererModule {
  private ctx: ModuleContext | null = null;
  private enabled = false;
  private stageHandlersBound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    this.enabled = this.isEnabled();
    if (!this.enabled) return;
    const stage = this.ctx.konva.getStage();
    if (!stage || this.stageHandlersBound) return;
    // Minimal stage listeners to forward pointer for draft snapping
    stage.on('mousemove.mod-connectors', () => this.onPointerMove());
    // Do not auto-commit on mouseup; the React tool owns commits to avoid conflicts
    this.stageHandlersBound = true;
  }

  sync(_snapshot: CanvasSnapshot): void {
    // No-op for now; snapping handled from stage events when active
  }

  destroy(): void {
    try {
      const stage = this.ctx?.konva.getStage();
      stage?.off('mousemove.mod-connectors');
      stage?.off('mouseup.mod-connectors');
    } catch {}
    this.stageHandlersBound = false;
    this.ctx = null;
  }

  private isEnabled(): boolean {
    try {
      const v = localStorage.getItem('FF_CONNECTOR');
      return v === '1' || v === 'true';
    } catch {
      return false;
    }
  }

  private onPointerMove() {
    if (!this.ctx) return;
    const stage = this.ctx.konva.getStage();
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    if (!stage || !store?.getState?.()?.updateEdgeDraftPointer) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    // Convert from stage to world assuming stage absolute scale/position
    const abs = stage.getAbsoluteTransform().copy().invert().point(p);
    try { store.getState().updateEdgeDraftPointer({ x: abs.x, y: abs.y }); } catch {}

    // Snap detection (20 world px) to element ports (N,S,E,W,CENTER)
    try {
      const SNAP = 20;
      const snap = this.findNearestSnap(abs.x, abs.y, SNAP);
      store.getState().updateEdgeDraftSnap(snap);
    } catch {}
  }

  // no-op onPointerUp to avoid double-commit conflicts with React tool
  private onPointerUp() {}

  private findNearestSnap(wx: number, wy: number, maxDist: number): { elementId: ElementId; portKind: string } | null {
    if (!this.ctx) return null;
    const snapCandidates: Array<{ elementId: ElementId; portKind: string; x: number; y: number }> = [];
    const snapFromDraft = (() => {
      try { return (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.draft?.from?.elementId as ElementId | undefined; } catch { return undefined; }
    })();
    const { elements } = this.ctx.store.getSnapshot();
    elements.forEach((el, id) => {
      if (!el || el.type === 'edge') return;
      if (snapFromDraft && id === snapFromDraft) return; // don't snap to source
      const x = Number(el.x || 0);
      const y = Number(el.y || 0);
      const w = Math.max(1, Number(el.width || 0));
      const h = Math.max(1, Number(el.height || 0));
      const cx = x + w / 2;
      const cy = y + h / 2;
      // Circles use center-origin in some paths; widths/heights are diameters
      snapCandidates.push({ elementId: id, portKind: 'CENTER', x: cx, y: cy });
      snapCandidates.push({ elementId: id, portKind: 'W', x: x, y: cy });
      snapCandidates.push({ elementId: id, portKind: 'E', x: x + w, y: cy });
      snapCandidates.push({ elementId: id, portKind: 'N', x: cx, y: y });
      snapCandidates.push({ elementId: id, portKind: 'S', x: cx, y: y + h });
    });

    let best: { elementId: ElementId; portKind: string } | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const s of snapCandidates) {
      const dx = s.x - wx;
      const dy = s.y - wy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) { bestDist = d; best = { elementId: s.elementId, portKind: s.portKind }; }
    }
    if (best && bestDist <= maxDist) return best;
    return null;
  }
}


