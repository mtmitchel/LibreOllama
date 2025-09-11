import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';

export class DrawingModule implements RendererModule {
  private ctx!: ModuleContext;
  init(ctx: ModuleContext): void { this.ctx = ctx; }
  sync(_snapshot: CanvasSnapshot): void { /* shadow mode: no-op */ }
  destroy(): void {}
}


