// Defer a task until after the canvas has rendered its first frame.
// Uses a custom window event 'canvas-stage-ready' emitted by CanvasStage and
// schedules the task in requestIdleCallback (if available) or setTimeout.

export interface DeferOptions {
  idleTimeout?: number; // ms
}

export function deferUntilCanvasReady(task: () => void, options: DeferOptions = {}): void {
  const { idleTimeout = 1000 } = options;

  if (typeof window === 'undefined') {
    // SSR/Tests: run next tick
    setTimeout(task, 0);
    return;
  }

  const runSoon = () => {
    try {
      const ric: any = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        ric(() => task(), { timeout: idleTimeout });
      } else {
        setTimeout(task, 0);
      }
    } catch {
      setTimeout(task, 0);
    }
  };

  if ((window as any).__CANVAS_STAGE_READY__) {
    runSoon();
    return;
  }

  const handler = () => {
    window.removeEventListener('canvas-stage-ready', handler as EventListener);
    runSoon();
  };
  window.addEventListener('canvas-stage-ready', handler as EventListener, { once: true } as any);
}
