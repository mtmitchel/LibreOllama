/*
  Precise, testable helpers mirrored from
  docs/CANVAS_RENDERER_MODULAR_SNIPPETS.md
  to enforce zero-loss parity.
*/

export type Rect = { x: number; y: number; width: number; height: number };

export function worldRectToDOMLike(
  containerRect: { left: number; top: number },
  stagePosition: { x: number; y: number },
  stageScale: { x: number; y: number },
  rect: Rect
): { left: number; top: number; width: number; height: number } {
  const left = containerRect.left + (rect.x * stageScale.x + stagePosition.x);
  const top = containerRect.top + (rect.y * stageScale.y + stagePosition.y);
  const width = rect.width * stageScale.x;
  const height = rect.height * stageScale.y;
  return { left, top, width, height };
}

export function computeTextLiveWorldWidth(textWidth: number, fontSize: number): number {
  const paddingWorld = 2; // Minimal padding to prevent clipping
  const minWorldWidth = Math.max(12, Math.ceil(fontSize));
  return Math.max(minWorldWidth, Math.ceil(textWidth) + paddingWorld);
}

export function commitTextFit(measured: { width: number; height: number }) {
  const width = Math.ceil(measured.width) + 8;
  const height = Math.ceil(measured.height * 1.2);
  const inset = { x: 4, y: 2 };
  return { width, height, inset };
}

export function scaleToSize(width: number, height: number, scaleX: number, scaleY: number) {
  const nextW = Math.max(1, width * (isFinite(scaleX) ? scaleX : 1));
  const nextH = Math.max(1, height * (isFinite(scaleY) ? scaleY : 1));
  return { width: nextW, height: nextH };
}

export function hysteresisSnap(
  current: { x: number; y: number },
  nearest: { x: number; y: number } | null,
  lastSnap: { x: number; y: number } | null,
  threshold = 20,
  hysteresis = 8
): { snapped: boolean; point?: { x: number; y: number } } {
  const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  if (nearest && dist(current, nearest) <= threshold) {
    if (lastSnap && dist(current, lastSnap) <= hysteresis) {
      return { snapped: true, point: lastSnap };
    }
    return { snapped: true, point: nearest };
  }
  return { snapped: false };
}

export function nextFrameRefresh(fn: (id: string) => void, id: string, delayMs = 16) {
  setTimeout(() => fn(id), delayMs);
}


