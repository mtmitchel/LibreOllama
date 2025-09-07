// src/features/canvas/tauri/TauriCanvasOptimizations.ts
export function get2D(el: HTMLCanvasElement | OffscreenCanvas) {
  const ctx = (el as any).getContext('2d', {
    alpha: true,
    desynchronized: true,
    willReadFrequently: true,
  });
  if (!ctx) throw new Error('2D context unavailable');
  return enhance2DContext(ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D);
}

export function enhance2DContext(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
) {
  // gate 2D-only properties
  if ('imageSmoothingEnabled' in ctx) {
    (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = true;
  }
  if ('imageSmoothingQuality' in ctx) {
    (ctx as any).imageSmoothingQuality = 'high';
  }
  return ctx;
}
