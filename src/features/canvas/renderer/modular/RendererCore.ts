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
  }

  sync(snapshot: CanvasSnapshot): void {
    for (const m of this.modules) m.sync(snapshot);
  }

  destroy(): void {
    for (const m of this.modules) m.destroy();
    this.modules = [];
    this.ctx = null;
  }
}


