# Modular Renderer — Precise Implementation Snippets

Authoritative, copy‑pasteable references to ensure zero feature loss when implementing the modular renderer.

## 1) World ↔ DOM Conversion (Overlay Positioning)
```ts
export function worldRectToDOM(
  stage: Konva.Stage,
  rect: { x: number; y: number; width: number; height: number }
): { left: number; top: number; width: number; height: number } {
  const container = stage.container();
  const cbr = container.getBoundingClientRect();
  const s = stage.getAbsoluteScale();
  const p = stage.position();
  const dpr = (window as any).devicePixelRatio || 1;
  const left = cbr.left + (rect.x * s.x + p.x);
  const top = cbr.top + (rect.y * s.y + p.y);
  const width = rect.width * s.x;
  const height = rect.height * s.y;
  return { left, top, width, height };
}
```

## 2) Text Live Auto‑Hug (During Typing)
```ts
const paddingWorld = 10;
const minWorldWidth = (fontSize: number) => Math.max(12, Math.ceil(fontSize));

function liveGrow({ ktext, frame, textarea, scaleX, elementId, store }: any) {
  ktext.text(textarea.value || ' ');
  ktext.width(undefined);
  const textWidth = Math.ceil(ktext.getTextWidth());
  const neededWorldW = Math.max(minWorldWidth(ktext.fontSize()), textWidth + paddingWorld);
  if (Math.abs(neededWorldW - frame.width()) > 0.5) {
    frame.width(neededWorldW);
    textarea.style.width = `${neededWorldW * scaleX}px`;
    store.updateElement(elementId, { width: neededWorldW, text: textarea.value }, { skipHistory: true });
  } else {
    store.updateElement(elementId, { text: textarea.value }, { skipHistory: true });
  }
}
```

## 3) Text Commit Fit (Exact)
```ts
function commitText({ ktext, frame, text, store, elementId }: any) {
  ktext.visible(true);
  ktext.text(text);
  ktext.width(undefined);
  (ktext as any)._clearCache?.();
  const metrics = (ktext as any).measureSize?.(text) || { width: ktext.getTextWidth(), height: ktext.fontSize() };
  const w = Math.ceil(metrics.width) + 8;
  const h = Math.ceil(metrics.height * 1.2);
  frame.width(w);
  frame.height(h);
  ktext.position({ x: 4, y: 2 });
  store.updateElement(elementId, { text, width: w, isEditing: false });
}
```

## 4) Transformend Scale → Size Conversion
```ts
function applyTransformEnd(group: Konva.Group, el: { width: number; height: number; rotation?: number }) {
  const scaleX = group.scaleX();
  const scaleY = group.scaleY();
  const nextW = Math.max(1, el.width * (isFinite(scaleX) ? scaleX : 1));
  const nextH = Math.max(1, el.height * (isFinite(scaleY) ? scaleY : 1));
  group.scaleX(1);
  group.scaleY(1);
  group.rotation(group.rotation());
  return { width: nextW, height: nextH, rotation: group.rotation() };
}
```

## 5) Connector Snap with Hysteresis
```ts
const SNAP_DIST = 20; // world px
const HYSTERESIS = 8; // world px

export function computeSnap(current: { x: number; y: number }, lastSnap?: { x: number; y: number }) {
  const target = findNearestPortOrCenter(current, SNAP_DIST);
  if (!target) return { snapped: false };
  if (lastSnap && distance(current, lastSnap) <= HYSTERESIS) {
    return { snapped: true, point: lastSnap };
  }
  return { snapped: true, point: target };
}
```

## 6) Table Transformer Refresh (Next Frame)
```ts
export function refreshTransformerNextFrame(tableId: string) {
  setTimeout(() => {
    try { (window as any).__REFRESH_TRANSFORMER__?.(tableId); } catch {}
  }, 16);
}
```

## 7) Pooled Preview Lines (Drawing)
```ts
class LinePool {
  private free: Konva.Line[] = [];
  acquire(layer: Konva.Layer): Konva.Line {
    const line = this.free.pop() || new Konva.Line({ listening: false, perfectDrawEnabled: false });
    if (!line.getLayer()) layer.add(line);
    return line;
  }
  release(line: Konva.Line) { this.free.push(line); }
}
```

## 8) History Guards
```ts
// Interim updates
store.updateElement(id, updates, { skipHistory: true });
// Final events only
store.addToHistory('transformEnd');
```


