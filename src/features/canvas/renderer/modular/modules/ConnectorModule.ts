import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, ElementId } from '../../modular/types';

// Modular connector module: draft snapping + endpoint handles when selected (FF_CONNECTOR)
export class ConnectorModule implements RendererModule {
  private ctx: ModuleContext | null = null;
  private enabled = false;
  private stageHandlersBound = false;
  private overlayGroup: Konva.Group | null = null;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    this.enabled = this.isEnabled();
    try { console.info('[MOD-CONNECTOR] init enabled=', this.enabled); } catch {}
    const overlay = this.ctx.konva.getLayers().overlay;
    if (overlay && !this.overlayGroup) {
      // Singleton overlay group for connector UI
      this.overlayGroup = new Konva.Group({ name: 'mod-connector-overlay', listening: true, visible: false });
      overlay.add(this.overlayGroup as any);
      overlay.batchDraw();
    }

    if (!this.enabled) return;
    const stage = this.ctx.konva.getStage();
    if (!stage || this.stageHandlersBound) return;
    // Stage listeners to forward pointer for draft snapping
    stage.on('mousemove.mod-connectors', () => this.onPointerMove());
    this.stageHandlersBound = true;
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.enabled) return;
    const overlay = this.ctx?.konva.getLayers().overlay;
    const stage = overlay?.getStage();
    if (!overlay || !stage || !this.overlayGroup) return;

    // Clear overlay each sync; re-render for selected edges
    try { this.overlayGroup.destroyChildren(); } catch {}
    const selected = Array.from(snapshot.selection || []);
    const edges: string[] = [];
    for (const id of selected) {
      const inEdges = (snapshot as any).edges?.get?.(id);
      const inElements = (snapshot as any).elements?.get?.(id);
      if ((inEdges && (inEdges.type === 'edge' || inEdges.type === 'connector')) || (inElements && inElements.type === 'connector')) {
        edges.push(id);
      }
    }
    try { console.info('[MOD-CONNECTOR] sync selection=', selected, 'edges=', edges); } catch {}
    if (edges.length === 0) {
      this.overlayGroup.visible(false);
      overlay.batchDraw();
      return;
    }
    this.overlayGroup.visible(true);

    edges.forEach((id) => this.renderHandlesForEdge(id));
    overlay.batchDraw();
  }

  destroy(): void {
    try {
      const stage = this.ctx?.konva.getStage();
      stage?.off('mousemove.mod-connectors');
    } catch {}
    try { this.overlayGroup?.destroyChildren(); } catch {}
    try { this.ctx?.konva.getLayers().overlay?.batchDraw(); } catch {}
    this.stageHandlersBound = false;
    this.overlayGroup = null;
    this.ctx = null;
  }

  private renderHandlesForEdge(edgeId: string) {
    if (!this.ctx || !this.overlayGroup) return;
    const stage = this.ctx.konva.getLayers().overlay?.getStage();
    if (!stage) return;
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    let edge = store?.getState?.().edges?.get?.(edgeId);
    if (!edge) {
      const el = store?.getState?.().elements?.get?.(edgeId);
      if (el && el.type === 'connector') edge = el;
    }
    if (!edge) return;

    const pts: number[] = Array.isArray(edge.points) && edge.points.length >= 4
      ? [...edge.points]
      : (edge.startPoint && edge.endPoint ? [edge.startPoint.x, edge.startPoint.y, edge.endPoint.x, edge.endPoint.y] : [] as number[]);
    if (pts.length < 4) return;
    try { console.info('[MOD-CONNECTOR] renderHandlesForEdge', edgeId, 'points=', pts); } catch {}

    // selection glow
    const glow = new Konva.Line({ points: pts, stroke: 'rgba(59,130,246,0.35)', strokeWidth: (edge.strokeWidth || 2) + 6, lineCap: 'round', lineJoin: 'round', listening: false, strokeScaleEnabled: false, name: 'edge-highlight' });
    this.overlayGroup.add(glow);

    const start = { x: pts[0], y: pts[1] };
    const end = { x: pts[pts.length - 2], y: pts[pts.length - 1] };
    const hStart = this.createHandle(start, edgeId, 'start');
    const hEnd = this.createHandle(end, edgeId, 'end');
    this.overlayGroup.add(hStart);
    this.overlayGroup.add(hEnd);
  }

  private createHandle(pos: { x: number; y: number }, edgeId: string, endpoint: 'start'|'end') {
    const handle = new Konva.Circle({ x: pos.x, y: pos.y, radius: 8, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2, listening: true, draggable: true, name: 'edge-handle' });
    handle.on('mouseenter', (e: any) => { try { e.target.scale({ x: 1.2, y: 1.2 }); stageCursor(e, 'grab'); } catch {} });
    handle.on('mouseleave', (e: any) => { try { e.target.scale({ x: 1, y: 1 }); stageCursor(e, ''); } catch {} });
    handle.on('dragstart', (e: any) => {
      e.cancelBubble = true;
      try { const st = (window as any).__UNIFIED_CANVAS_STORE__?.getState?.(); if (typeof st?.saveSnapshot === 'function') st.saveSnapshot(); } catch {}
      handle.setAttr('draggingEdgeId', edgeId);
      handle.setAttr('draggingEndpoint', endpoint);
    });
    handle.on('dragmove', (e: any) => this.onHandleDragMove(e));
    handle.on('dragend', (e: any) => this.onHandleDragEnd(e));
    const stageCursor = (e: any, cursor: string) => { const s = e?.target?.getStage?.(); if (s?.container) s.container().style.cursor = cursor; };
    return handle;
  }

  private onHandleDragMove(e: any) {
    if (!this.ctx) return;
    e.cancelBubble = true;
    const overlay = this.ctx.konva.getLayers().overlay;
    if (!overlay) return;
    const edgeId = e.target.getAttr('draggingEdgeId');
    const endpoint = e.target.getAttr('draggingEndpoint');
    if (!edgeId || !endpoint) return;

    const stagePos = e.target.getAbsolutePosition();
    const local = overlay.getAbsoluteTransform().copy().invert().point(stagePos);

    // Snap to nearest port
    const SNAP = 20;
    const snap = this.findNearestSnap(local.x, local.y, SNAP);
    e.target.setAttr('snapTarget', snap);
    if (snap) { e.target.fill('#10b981'); } else { e.target.fill('#3b82f6'); }

    // Preview update via store API and node points
    try { (window as any).__UNIFIED_CANVAS_STORE__?.getState?.().updateEdgeEndpointPreview?.(edgeId, endpoint, local.x, local.y); } catch {}
    try {
      const main = this.ctx.konva.getLayers().main;
      const stage = main?.getStage();
      const node = stage?.findOne(`#${edgeId}`) as any;
      if (node) {
        const pts: number[] = node.points?.() || [];
        if (pts.length >= 4) {
          if (endpoint === 'start') { pts[0] = local.x; pts[1] = local.y; } else { pts[pts.length - 2] = local.x; pts[pts.length - 1] = local.y; }
          node.points(pts);
          main?.batchDraw();
        }
      }
    } catch {}

    e.target.position(local);
    overlay.batchDraw();
  }

  private onHandleDragEnd(e: any) {
    if (!this.ctx) return;
    e.cancelBubble = true;
    const edgeId = e.target.getAttr('draggingEdgeId');
    const endpoint = e.target.getAttr('draggingEndpoint');
    const snap = e.target.getAttr('snapTarget');
    if (!edgeId || !endpoint) return;
    try { const st = (window as any).__UNIFIED_CANVAS_STORE__?.getState?.(); st?.commitEdgeEndpoint?.(edgeId, endpoint, snap || null); } catch {}
    try { e.target.setAttr('draggingEdgeId', null); e.target.setAttr('draggingEndpoint', null); e.target.setAttr('snapTarget', null); } catch {}
    // re-sync overlay will re-render handles in new positions on next snapshot
  }

  private isEnabled(): boolean {
    try {
      const v = localStorage.getItem('FF_CONNECTOR');
      if (v === '1' || v === 'true') return true;
      // Default ON in development to aid migration
      // @ts-ignore
      const mode = (import.meta as any)?.env?.MODE || (process as any)?.env?.NODE_ENV;
      return mode === 'development';
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


