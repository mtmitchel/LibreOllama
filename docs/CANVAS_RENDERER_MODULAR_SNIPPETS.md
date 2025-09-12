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

### Update (Sept 2025) — Unified, Robust Text Flow

The following snippets reflect the hardened behavior now in the codebase: point‑text measurement during typing and transform, dual‑metric commit, and selection tightening without clipping.

```ts
// Reset a Konva.Text to a clean, natural measurement state
function resetTextNodeForEditing(textNode: Konva.Text) {
  textNode.setAttrs({ width: undefined, height: undefined, scaleX: 1, scaleY: 1 });
  try { (textNode as any)._clearCache?.(); } catch {}
  if ((textNode as any)._cache) { try { (textNode as any).clearCache?.(); } catch {} }
  textNode.getLayer()?.batchDraw();
}

// Live auto‑hug for plain text (create & re‑edit). Content-box textarea is assumed.
function liveAutoHugPlain(
  textarea: HTMLTextAreaElement,
  group: Konva.Group,
  textNode: Konva.Text,
  stageScale: number,
  fontSize: number,
  updateStore: (widthWorld: number, text: string) => void
) {
  // 1) Mirror & natural measurement
  textNode.text(textarea.value || ' ');
  (textNode as any).wrap?.('none');
  (textNode as any).width?.(undefined);
  textNode._clearCache?.();

  const textWidthPx = Math.ceil((textNode as any).getTextWidth?.() || textarea.scrollWidth || 1);
  const minWorld = Math.max(12, Math.ceil(fontSize));
  const contentWorld = Math.max(1, Math.ceil(textWidthPx / stageScale));
  const neededWorldW = Math.max(minWorld, contentWorld + 10);

  // 2) Apply DOM + Konva in lockstep
  const neededPx = Math.ceil(neededWorldW * stageScale);
  textarea.style.width = `${neededPx}px`;
  const hit = group.findOne<Konva.Rect>('Rect.hit-area');
  if (hit) { hit.width(neededWorldW); hit.height(Math.max(10, Math.ceil(fontSize * 1.2))); hit.x(0); hit.y(0); }
  group.getLayer()?.batchDraw();
  updateStore(neededWorldW, textarea.value);
}

// Commit fit on transformend (or text commit) with dual‑metric guard
function commitTextWidth(
  textNode: Konva.Text,
  stageScale: number
): { frameW: number; frameH: number; offset: { x: number; y: number } } {
  (textNode as any).wrap?.('none');
  (textNode as any).width?.(undefined);
  textNode._clearCache?.();

  // Dual‑metric: advance via canvas, visual via getClientRect
  const ctx = document.createElement('canvas').getContext('2d');
  let adv = 0;
  if (ctx) { ctx.font = `${textNode.fontSize()}px ${textNode.fontFamily()}`; adv = ctx.measureText(textNode.text() || ' ').width; }
  const vis = textNode.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true }).width;
  const requiredPx = Math.ceil(Math.max(adv, vis) + 12);
  (textNode as any).width(requiredPx);

  // Re‑measure bbox and reposition to counter glyph overhangs
  const bbox = textNode.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
  textNode.position({ x: -bbox.x, y: -bbox.y });

  const frameW = Math.max(requiredPx, Math.ceil(bbox.width) + 8);
  const frameH = Math.max(1, Math.ceil(bbox.height + textNode.fontSize() * 0.12));
  return { frameW, frameH, offset: { x: -bbox.x, y: -bbox.y } };
}

// Selection tightening (runs when attaching transformer to a single text group)
function tightenTextSelection(group: Konva.Group, transformer: Konva.Transformer) {
  const t = group.findOne<Konva.Text>('.text') || group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text');
  const hit = group.findOne<Konva.Rect>('.hit-area');
  if (!t || !hit) return;
  (t as any).wrap?.('none'); (t as any).width?.(undefined); t._clearCache?.();
  const bbox = t.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
  const w = Math.max(1, Math.ceil((t as any).getTextWidth?.() || bbox.width));
  const h = Math.max(1, Math.ceil(bbox.height));
  hit.width(w); hit.height(h); hit.x(0); hit.y(0);
  t.position({ x: -bbox.x, y: -bbox.y });
  // Do NOT clip during selection (can hide glyphs mid‑drag)
  try { (group as any).clip?.(null); (group as any).clipFunc?.(null); } catch {}
  transformer.forceUpdate?.();
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


