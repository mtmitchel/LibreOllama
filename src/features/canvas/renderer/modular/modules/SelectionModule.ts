import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';

export class SelectionModule implements RendererModule {
  private ctx!: ModuleContext;
  private transformer: Konva.Transformer | null = null;
  private enabled = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    this.enabled = this.isEnabled();
    try { console.info('[MOD-SEL] init enabled=', this.enabled); } catch {}
    const overlay = this.ctx.konva.getLayers().overlay;
    if (overlay) {
      // Lazy create transformer
      // @ts-ignore dynamic import type
      const KonvaCtor = (overlay.getStage() as any)?.constructor?.prototype?.constructor;
      this.transformer = new (KonvaCtor as any).Transformer({
        borderStroke: '#3B82F6',
        borderStrokeWidth: 1,
        anchorSize: 8,
        rotateEnabled: true,
        ignoreStroke: true,
      });
      overlay.add(this.transformer as any);
      overlay.batchDraw();
      // Commit transform scale -> size on end
      try {
        this.transformer.on('transformend.modsel', () => {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const nodes = this.transformer?.nodes?.() || [];
          if (nodes.length !== 1) return;
          const node = nodes[0] as any;
          const id = node?.id?.(); if (!id) return;
          // Convert scale to size and reset scale
          const baseW = Math.max(1, node.width?.() || 1);
          const baseH = Math.max(1, node.height?.() || 1);
          const sx = node.scaleX?.() || 1; const sy = node.scaleY?.() || 1;
          const nextW = Math.max(1, baseW * sx);
          const nextH = Math.max(1, baseH * sy);
          try { node.width?.(nextW); node.height?.(nextH); node.scaleX?.(1); node.scaleY?.(1); } catch {}
          try { overlay.batchDraw(); } catch {}
          try { store?.getState?.().updateElement?.(id, { width: nextW, height: nextH, rotation: node.rotation?.() }); } catch {}
          // Probe
          try { const { captureTransformProbe } = require('../../../dev/probes'); captureTransformProbe({ id, kind: 'resize', after: { width: nextW, height: nextH, rotation: node.rotation?.() } }); } catch {}
        });
      } catch {}
    }
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.enabled) return;
    try { console.info('[MOD-SEL] sync selection=', Array.from(snapshot.selection || [])); } catch {}
    if (!this.transformer) return;
    const { overlay } = this.ctx.konva.getLayers();
    if (!overlay) return;
    const stage = overlay.getStage();
    if (!stage) return;

    const nodes: Konva.Node[] = [];
    snapshot.selection.forEach((id) => {
      const n = stage.findOne(`#${id}`);
      if (n) nodes.push(n);
    });
    if (nodes.length === 0) {
      this.transformer.nodes([]);
      this.transformer.visible(false);
    } else {
      this.transformer.nodes(nodes);
      this.transformer.visible(true);
    }
    overlay.batchDraw();
  }

  destroy(): void {
    try { this.transformer?.destroy(); } catch {}
    this.transformer = null;
  }

  onEvent(evt: any, snapshot: CanvasSnapshot): boolean {
    if (!this.enabled) return false;
    try {
      const e = evt?.konvaEvent;
      const target = e?.target;
      const stage = this.ctx.konva.getLayers().overlay?.getStage();
      if (!stage) return false;
      if (evt.type === 'mousedown' || evt.type === 'click') {
        // Ignore overlay adorners
        let id = target?.id?.();
        const name = target?.name?.?.();
        const cls = target?.getClassName?.();
        if (name === 'edge-handle') return true; // let connector module handle
        // If no id on target, attempt to resolve from parent or hit-test under pointer
        if (!id) {
          try { id = target?.getParent?.()?.id?.(); } catch {}
          if (!id) {
            const p = stage.getPointerPosition();
            if (p) {
              const hit = stage.getIntersection(p) as any;
              if (hit?.id) id = hit.id();
              // Fallback: search by proximity for edges (Line/Arrow) when hit graph misses
              if (!id) {
                try {
                  const layer = this.ctx.konva.getLayers().main;
                  const children = (layer as any)?.getChildren?.() || [];
                  for (const n of children) {
                    const clsName = n.getClassName?.();
                    if ((clsName === 'Line' || clsName === 'Arrow') && typeof n.id === 'function') {
                      const nid = n.id(); if (nid) { id = nid; break; }
                    }
                  }
                } catch {}
              }
            }
          }
        }
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (id) {
          store?.getState?.().selectElement?.(id, !!(e?.evt?.shiftKey || e?.evt?.ctrlKey || e?.evt?.metaKey));
        } else {
          store?.getState?.().selectElement?.(null);
        }
        return true;
      }
    } catch {}
    return false;
  }

  private isEnabled(): boolean {
    try {
      const v = localStorage.getItem('FF_SELECT');
      return v === '1' || v === 'true';
    } catch {
      return false;
    }
  }
}


