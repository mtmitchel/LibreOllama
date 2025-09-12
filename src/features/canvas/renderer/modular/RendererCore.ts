import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from './types';

export class RendererCore {
  private modules: RendererModule[] = [];
  private ctx: ModuleContext | null = null;

  register(mod: RendererModule): void {
    this.modules.push(mod);
  }

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    for (const m of this.modules) m.init(ctx);
    try { console.info('[MOD-CORE] init: modules=', this.modules.map((m) => m.constructor?.name)); } catch {}
  }

  sync(snapshot: CanvasSnapshot): void {
    for (const m of this.modules) m.sync(snapshot);
  }

  destroy(): void {
    for (const m of this.modules) m.destroy();
    this.modules = [];
    this.ctx = null;
  }

  /** Bind stage events and forward to modules that implement onEvent */
  bindStage(stage: any): void {
    const forward = (type: string) => (e: any) => {
      try { this.dispatchEvent({ type, konvaEvent: e }); } catch {}
    };
    try {
      console.info('[MOD-CORE] bindStage');
      stage.on('mousedown.modcore', forward('mousedown'));
      stage.on('mouseup.modcore', forward('mouseup'));
      stage.on('click.modcore', forward('click'));
      stage.on('dblclick.modcore', forward('dblclick'));
      stage.on('dragstart.modcore', forward('dragstart'));
      stage.on('dragmove.modcore', forward('dragmove'));
      stage.on('dragend.modcore', forward('dragend'));
    } catch {}
  }

  private dispatchEvent(evt: any): boolean {
    let handled = false;
    if (!this.ctx) return handled;
    const snapshot = this.ctx.store.getSnapshot();
    for (const m of this.modules) {
      try {
        const ok = (m as any).onEvent?.(evt, snapshot);
        if (ok) handled = true;
      } catch {}
    }
    return handled;
  }
}


