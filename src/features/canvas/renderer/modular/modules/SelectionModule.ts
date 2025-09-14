import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';

export class SelectionModule implements RendererModule {
  private ctx!: ModuleContext;
  private transformer: Konva.Transformer | null = null;
  private activeIsText: boolean = false;
  private textResizeBase: { width: number; height: number; fontSize: number } | null = null;
  private resizeRAF: number = 0;

  async init(ctx: ModuleContext): Promise<void> {
    this.ctx = ctx;
    const overlay = this.ctx.konva.getLayers().overlay;
    if (overlay) {
      // Import Konva dynamically to get proper constructor
      const Konva = await import('konva');
      this.transformer = new Konva.default.Transformer({
        anchorSize: 8,
        borderStroke: '#3B82F6',
        borderStrokeWidth: 1,
        keepRatio: false,
        rotateEnabled: false,
        enabledAnchors: ['top-left','top-right','bottom-left','bottom-right'],
        // Disable resizing for text elements (we'll keep the border but no anchors)
        boundBoxFunc: (oldBox: any, newBox: any) => {
          // If a text element is active, block resizing by returning the old box
          if (this.activeIsText) return oldBox;
          return newBox;
        }
      });
      overlay.add(this.transformer as any);
      overlay.batchDraw();
      // Click handling for select/deselect behavior
      const stage = overlay.getStage();
      stage?.on('mousedown.modsel', (e: any) => {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        const selectedTool = store?.getState?.().selectedTool;
        if (selectedTool && selectedTool !== 'select') return;
        const target = e.target as any;
        // If any text is currently editing, let the editor's blur handler run; don't change selection here
        let anyEditing = false;
        try {
          const els: Map<string, any> = store?.getState?.().elements;
          if (els && els instanceof Map) {
            anyEditing = Array.from(els.values()).some((el: any) => el?.type === 'text' && el?.isEditing);
          }
        } catch {}
        if (anyEditing) return;

        // Clicked on empty stage or a bare layer: clear selection
        if (target === stage || target.getClassName?.() === 'Layer') {
          try { store?.getState?.().clearSelection?.(); } catch {}
          this.transformer?.nodes([]);
          this.transformer?.visible(false);
          overlay.batchDraw();
          return;
        }

        // Otherwise, try to select the nearest Group with an id
        const group = (target && target.findAncestor?.((n: any) => n.getClassName?.() === 'Group' && !!n.id?.(), true)) || null;
        const id = group?.id?.();
        if (id) {
          const multi = !!(e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey);
          try { store?.getState?.().selectElement?.(id, multi); } catch {}
        }
      });
      // Text-specific: lock resizing entirely; keep transform listeners but make them no-op for text.
      try {
        this.transformer!.on('transformstart.modsel', () => {
          const nodes = this.transformer?.nodes?.() || [];
          if (nodes.length !== 1) return;
          const node = nodes[0] as any;
          // Detect if this is a text group
          const isText = !!(node?.getClassName?.() === 'Group' && (node.name?.() === 'text' || node.findOne?.('Text.text') || node.findOne?.('.text')));
          this.activeIsText = isText;
          if (!isText) return;
          // For text, we disable resizing; no base metrics required
          this.textResizeBase = null;
        });

        this.transformer!.on('transform.modsel', () => {
          // No-op for text; resizing is locked out via anchors and boundBoxFunc
          if (this.activeIsText) return;
          if (this.resizeRAF) cancelAnimationFrame(this.resizeRAF);
          this.resizeRAF = requestAnimationFrame(() => {
            const nodes = this.transformer?.nodes?.() || [];
            if (nodes.length !== 1) return;
            const node = nodes[0] as any;
            const t = node.findOne('Text.text') || node.findOne('Text') || node.findOne('.text');
            const hit = node.findOne('Rect.hit-area') || node.findOne('.hit-area');
            if (!t || !hit) return;
            // Measure transformer box (untransformed) and derive uniform scale
            const box = this.transformer!.getClientRect({ skipTransform: true } as any);
            const baseW = Math.max(1e-6, this.textResizeBase!.width);
            const baseH = Math.max(1e-6, this.textResizeBase!.height);
            const s = Math.min(Math.max(1e-6, box.width / baseW), Math.max(1e-6, box.height / baseH));

            const nextFont = Math.max(1, this.textResizeBase!.fontSize * s);
            (t as any).fontSize?.(nextFont);
            try { (t as any).wrap?.('none'); (t as any).width?.(undefined); (t as any)._clearCache?.(); } catch {}
            // Compute tight text bbox at this font size and align to eliminate clipping
            const bbox = (t as any).getClientRect?.({ skipTransform: true, skipStroke: true, skipShadow: true }) || { x: 0, y: 0, width: baseW * s, height: baseH * s };
            (t as any).position?.({ x: -bbox.x, y: -bbox.y });
            // Use scaled base dimensions to avoid snap-back and maintain lock-step
            const nextW = Math.max(1, Math.ceil(baseW * s));
            const nextH = Math.max(1, Math.ceil(baseH * s));
            (hit as any).width?.(nextW); (hit as any).height?.(nextH);
            try { (hit as any).x?.(0); (hit as any).y?.(0); } catch {}
            try { (node as any).clip?.({ x: 0, y: 0, width: nextW, height: nextH }); } catch {}
            try { this.ctx.konva.getLayers().main?.batchDraw(); } catch {}
            try { this.ctx.konva.getLayers().overlay?.batchDraw(); } catch {}
          });
        });

        this.transformer!.on('transformend.modsel', () => {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const nodes = this.transformer?.nodes?.() || [];
          if (nodes.length !== 1) return;
          const node = nodes[0] as any;
          const id = node?.id?.(); if (!id) return;
          // For text: do nothing on transform end (resizing is disabled)
          if (this.activeIsText) {
            this.textResizeBase = null;
            return;
          }
          if (this.textResizeBase) {
            const t = node.findOne('Text.text') || node.findOne('Text') || node.findOne('.text');
            const hit = node.findOne('Rect.hit-area') || node.findOne('.hit-area');
            if (!t || !hit) return;
            // Compute uniform scale from current transformer box to avoid relying on node scale
            const box = this.transformer!.getClientRect({ skipTransform: true } as any);
            const baseW = Math.max(1e-6, this.textResizeBase!.width);
            const baseH = Math.max(1e-6, this.textResizeBase!.height);
            const s = Math.min(Math.max(1e-6, box.width / baseW), Math.max(1e-6, box.height / baseH));
            const nextFont = Math.max(1, this.textResizeBase.fontSize * s);
            (t as any).fontSize?.(nextFont);
            try { (t as any).wrap?.('none'); (t as any).width?.(undefined); (t as any)._clearCache?.(); } catch {}
            // Final tight alignment to prevent clipping
            const bbox = (t as any).getClientRect?.({ skipTransform: true, skipStroke: true, skipShadow: true }) || { x: 0, y: 0, width: baseW * s, height: baseH * s };
            (t as any).position?.({ x: -bbox.x, y: -bbox.y });
            const nextW = Math.max(1, Math.ceil(baseW * s));
            const nextH = Math.max(1, Math.ceil(baseH * s));
            (hit as any).width?.(nextW); (hit as any).height?.(nextH); (hit as any).x?.(0); (hit as any).y?.(0);
            try { node.scaleX?.(1); node.scaleY?.(1); } catch {}
            try { (node as any).clip?.({ x: 0, y: 0, width: nextW, height: nextH }); } catch {}
            try { overlay.batchDraw(); this.ctx.konva.getLayers().main?.batchDraw(); } catch {}
            try { store?.getState?.().updateElement?.(id, { fontSize: nextFont, width: nextW, height: nextH }); } catch {}
            // Force transformer to recompute handles
            this.transformer?.forceUpdate?.();
          } else {
            // Generic convert scale to size for non-text nodes
            const baseW = Math.max(1, node.width?.() || 1);
            const baseH = Math.max(1, node.height?.() || 1);
            const sx = node.scaleX?.() || 1; const sy = node.scaleY?.() || 1;
            const nextW = Math.max(1, baseW * sx);
            const nextH = Math.max(1, baseH * sy);
            try { node.width?.(nextW); node.height?.(nextH); node.scaleX?.(1); node.scaleY?.(1); } catch {}
            try { overlay.batchDraw(); } catch {}
            try { store?.getState?.().updateElement?.(id, { width: nextW, height: nextH, rotation: node.rotation?.() }); } catch {}
          }
          this.textResizeBase = null;
        });
      } catch {}
    }
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.transformer) return;
    const { overlay } = this.ctx.konva.getLayers();
    if (!overlay) return;
    const stage = overlay.getStage();
    if (!stage) return;

    const nodes: Konva.Node[] = [];
    let anyEditing = false;
    snapshot.selection.forEach((id) => {
      const n = stage.findOne(`#${id}`);
      if (n) nodes.push(n);
      const el = snapshot.elements.get(id as any);
      if (el && el.type === 'text' && (el as any).isEditing) anyEditing = true;
    });
    if (nodes.length === 0 || anyEditing) {
      this.transformer.nodes([]);
      this.transformer.visible(false);
    } else {
      this.transformer.nodes(nodes);
      this.transformer.visible(true);

      // If any selected node is text, hide anchors (disable resize) but keep border for movement/selection
      const containsText = nodes.some((n: any) => n?.getClassName?.() === 'Group' && (n.name?.() === 'text' || n.findOne?.('Text.text') || n.findOne?.('.text')));
      if (containsText) {
        try { this.transformer.enabledAnchors([]); } catch {}
        try { this.transformer.rotateEnabled(false); } catch {}
      } else {
        try { this.transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right']); } catch {}
        try { this.transformer.rotateEnabled(false); } catch {}
      }

      // Tighten text selection to hug text exactly (single node only)
      if (nodes.length === 1) {
        const g = nodes[0] as any;
        if (g?.getClassName?.() === 'Group' && (g.name?.() === 'text' || g.findOne?.('Text.text') || g.findOne?.('.text'))) {
          try {
            const t = g.findOne('Text.text') || g.findOne('Text') || g.findOne('.text');
            const hit = g.findOne('Rect.hit-area') || g.findOne('.hit-area');
            if (t && hit) {
              (t as any).wrap?.('none'); (t as any).width?.(undefined); (t as any)._clearCache?.();
              const bbox = (t as any).getClientRect?.({ skipTransform: true, skipStroke: true, skipShadow: true }) || { x: 0, y: 0, width: (t as any).width?.() || 1, height: (t as any).height?.() || 1 };
              const glyphW = Math.max(1, Math.ceil(((t as any).getTextWidth?.() || bbox.width) as number));
              const h = Math.max(1, Math.ceil(bbox.height));
              (hit as any).width?.(glyphW); (hit as any).height?.(h); (hit as any).x?.(0); (hit as any).y?.(0);
              (t as any).position?.({ x: -bbox.x, y: -bbox.y });
              try { (g as any).clip?.({ x: 0, y: 0, width: glyphW, height: h }); } catch {}
              this.transformer.forceUpdate?.();
              // Ensure text group remains draggable so user can move it
              try { g.draggable(true); } catch {}
            }
          } catch {}
        }
      }
    }
    overlay.batchDraw();
  }

  destroy(): void {
    try { this.transformer?.destroy(); } catch {}
    this.transformer = null;
  }
}
