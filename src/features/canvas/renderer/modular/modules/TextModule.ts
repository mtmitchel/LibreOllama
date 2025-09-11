import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';
import { commitTextFit, computeTextLiveWorldWidth } from '../../../renderer/compat/snippets';

export class TextModule implements RendererModule {
  private ctx!: ModuleContext;
  private bound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const stage = this.ctx.konva.getStage();
    const overlay = this.ctx.konva.getLayers().overlay;
    if (!stage || !overlay || this.bound) return;
    this.bound = true;

    stage.on('dblclick.modtext', (e: any) => {
      if (!this.isEnabled()) return;
      const target = e.target as Konva.Node;
      const group = this.resolveGroup(target);
      if (!group) return;
      const id = group.id?.();
      if (!id) return;
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const el = store?.getState?.().elements?.get(id);
      if (!el || el.type !== 'text') return;
      e.cancelBubble = true;
      this.openEditor(stage, group as any, id, el);
    });
  }

  sync(_snapshot: CanvasSnapshot): void {
    // No-op in shadow; full sync when cutover is complete
  }

  destroy(): void {
    try { this.ctx?.konva?.getStage()?.off('.modtext'); } catch {}
    this.bound = false;
  }

  private isEnabled(): boolean {
    try {
      const v = localStorage.getItem('FF_TEXT');
      return v === '1' || v === 'true';
    } catch {
      return false;
    }
  }

  private resolveGroup(target: Konva.Node): Konva.Group | null {
    if (!target) return null;
    if (target.getClassName?.() === 'Group') return target as Konva.Group;
    const g = target.findAncestor((n: Konva.Node) => n.getClassName?.() === 'Group', true) as Konva.Group | null;
    return g || null;
  }

  private openEditor(stage: Konva.Stage, group: Konva.Group, elId: string, el: any) {
    const containerRect = stage.container().getBoundingClientRect();
    const rect = (group as any).getClientRect?.({ skipTransform: false, skipShadow: true, skipStroke: true }) ?? group.getClientRect();
    const left = containerRect.left + rect.x;
    const top = containerRect.top + rect.y;
    const width = Math.max(4, rect.width);
    const height = Math.max(4, rect.height);

    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { position: 'fixed', left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, width: `${Math.round(width)}px`, height: `${Math.round(height)}px`, pointerEvents: 'auto', zIndex: '2147483647' });
    const ta = document.createElement('textarea');
    ta.value = el.text ?? '';
    Object.assign(ta.style, { width: '100%', height: '100%', border: '1px solid #3B82F6', borderRadius: '4px', outline: 'none', resize: 'none', background: 'rgba(255,255,255,0.95)', lineHeight: '1', boxSizing: 'content-box' });
    wrapper.appendChild(ta);
    document.body.appendChild(wrapper);

    // live auto-hug width
    const stageScale = (stage.getAbsoluteScale?.().x ?? 1) as number;
    const onInput = () => {
      const textWidthApprox = Math.max(1, ta.scrollWidth);
      const liveWorldW = computeTextLiveWorldWidth(textWidthApprox / stageScale, Math.max(1, el.fontSize || 14));
      wrapper.style.width = `${Math.round(liveWorldW * stageScale)}px`;
    };
    ta.addEventListener('input', onInput);
    setTimeout(onInput, 0);

    const close = () => { try { ta.removeEventListener('input', onInput); } catch {}; try { wrapper.remove(); } catch {}; };

    const commit = () => {
      const text = ta.value;
      // commit-fit size from helper
      const fit = commitTextFit({ width: Math.max(1, ta.scrollWidth / stageScale), height: Math.max(1, ta.scrollHeight / stageScale) });
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      try { store?.getState?.().updateElement?.(elId, { text, width: fit.width, isEditing: false }); } catch {}
      try { store?.getState?.().clearSelection?.(); store?.getState?.().selectElement?.(elId, false); } catch {}
      // probe
      try { const { captureTextCommitProbe } = require('../../../dev/probes'); captureTextCommitProbe({ id: elId, text, metrics: { width: fit.width - 8, height: Math.ceil((fit.height) / 1.2) }, frame: { width: fit.width, height: fit.height }, inset: { x: 4, y: 2 }, viewportScale: { x: stageScale, y: stageScale } }); } catch {}
      close();
    };

    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commit(); }
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    });
    ta.addEventListener('blur', () => commit());
    try { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); } catch {}
  }
}


