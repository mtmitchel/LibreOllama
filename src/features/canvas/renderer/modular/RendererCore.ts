import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from './types';

export class RendererCore {
  private modules: RendererModule[] = [];
  private ctx: ModuleContext | null = null;

  register(mod: RendererModule): void {
    this.modules.push(mod);
  }

  async init(ctx: ModuleContext): Promise<void> {
    this.ctx = ctx;
    for (const m of this.modules) {
      await m.init(ctx);
    }
  }

  sync(snapshot: CanvasSnapshot): void {
    if (this.modules.length === 0) {
      console.error('[RendererCore] CRITICAL: No modules registered!');
      return;
    }

    // Sync all modules with current snapshot
    for (const module of this.modules) {
      try {
        module.sync(snapshot);
      } catch (error) {
        console.error(`[RendererCore] ERROR in ${module.constructor.name}:`, error);
      }
    }
  }

  destroy(): void {
    for (const m of this.modules) m.destroy();
    this.modules = [];
    this.ctx = null;
  }
}


