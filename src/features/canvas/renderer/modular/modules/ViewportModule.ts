import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';

export class ViewportModule implements RendererModule {
  private ctx!: ModuleContext;
  init(ctx: ModuleContext): void { this.ctx = ctx; }
  sync(snapshot: CanvasSnapshot): void { /* reserved for future pan/zoom parity checks */ }
  destroy(): void {}
}


