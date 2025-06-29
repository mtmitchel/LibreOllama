Here is a **combined and streamlined version** that merges the sharp diagnosis and roadmap from the first document with the robust architectural detail and implementation plan from the second. This version preserves all key insights while improving clarity and cohesion.

---

## 🔍 Root Cause Summary: Why Toolbar Creation Broke

The Phase 4 refactor introduced regressions due to architectural debt and incomplete integration:

1. **`startDrawing` / `updateDrawing` broke shared drawing flow**

   * Only pen/pencil tools initialize `currentPath`. All others run with `undefined`, so `finishDrawing` bails early (it expects `currentPath.length >= 4`).
   * Result: Pen strokes vanish on mouse-up, and tools like rectangle/text create nothing.

2. **`createElement` is declared but not implemented in unified store**

   * Toolbar buttons call `store.createElement(...)`, but it’s a no-op—no logic exists to handle this in the new store.
   * Search for `createElement:` returns only old/archived reducers.

3. **Section tool bypasses shared drawing pipeline**

   * It now draws directly via `UnifiedEventHandler`, avoiding the broken `startDrawing` flow.
   * This fix isolated it, but left other tools broken.

---

## ✂️ Immediate Band-Aid (10-min Fix)

```ts
// unifiedCanvasStore.ts – temporary restore for all tools
startDrawing: (tool, pt) => {
  draft.isDrawing = true;
  draft.drawingTool = tool;
  draft.drawingStartPoint = pt;
  draft.drawingCurrentPoint = pt;

  // Restore path to prevent regressions
  draft.currentPath = [pt.x, pt.y];
}
```

*Purpose:* Keep legacy expectations intact while transitioning to a cleaner, tool-specific state model.

---

## 🧱 Refactor Plan (Robust and Future-Proof)

### 1. Replace Overloaded State with a Discriminated Union

Define a tool-specific drawing state to prevent collisions and future regressions:

```ts
type DrawingState =
  | { tool: 'pen' | 'pencil'; path: number[] }
  | { tool: 'rectangle' | 'circle' | 'section'; startPoint: Pt; endPoint: Pt }
  | { tool: 'text'; position: Pt }
  | null;
```

Add this to the store as `activeDrawing`, replacing `currentPath` and `drawingTool`.

---

### 2. Refactor Store Methods (`startDrawing`, `updateDrawing`, `finishDrawing`)

```ts
startDrawing: (tool, point) => set(draft => {
  draft.activeDrawing =
    tool === 'pen' || tool === 'pencil'
      ? { tool, path: [point.x, point.y] }
      : tool === 'rectangle' || tool === 'circle' || tool === 'section'
      ? { tool, startPoint: point, endPoint: point }
      : null;
}),

updateDrawing: (point) => set(draft => {
  if (!draft.activeDrawing) return;
  switch (draft.activeDrawing.tool) {
    case 'pen':
    case 'pencil':
      draft.activeDrawing.path.push(point.x, point.y);
      break;
    case 'rectangle':
    case 'circle':
    case 'section':
      draft.activeDrawing.endPoint = point;
      break;
  }
}),

finishDrawing: () => set(draft => {
  const drawing = draft.activeDrawing;
  if (!drawing) return;

  const newElement = createCanvasElementFromDrawing(drawing);
  if (newElement) {
    draft.elements.set(newElement.id, newElement);
  }

  draft.activeDrawing = null;
}),
```

---

### 3. Centralize Drawing Conversion

```ts
createCanvasElementFromDrawing = (drawingState: DrawingState) => {
  if (!drawingState) return null;
  const id = createElementId();

  switch (drawingState.tool) {
    case 'pen':
    case 'pencil':
      return createPenElement({ id, points: drawingState.path });
    case 'rectangle':
    case 'circle':
    case 'section': {
      const shape = getShapeFromPoints(drawingState.startPoint, drawingState.endPoint);
      if (drawingState.tool === 'rectangle') return createRectangleElement({ id, ...shape });
      if (drawingState.tool === 'section') return createSectionElement({ id, ...shape });
      break;
    }
  }

  return null;
};
```

---

### 4. Restore `createElement` for Toolbar Use

```ts
createElement: (type, position) => set(draft => {
  const id = createElementId();
  let newEl = null;

  if (type === 'rectangle') {
    newEl = createRectangleElement({ id, x: position.x, y: position.y, width: 100, height: 100 });
  }

  if (newEl) {
    draft.elements.set(id, newEl);
  }
});
```

---

### 5. Update `UnifiedEventHandler`

```ts
// On mouse down
useCanvasStore.getState().startDrawing(tool, getCanvasCoordinates(e));

// On mouse move
if (useCanvasStore.getState().activeDrawing) {
  useCanvasStore.getState().updateDrawing(getCanvasCoordinates(e));
}

// On mouse up
if (useCanvasStore.getState().activeDrawing) {
  useCanvasStore.getState().finishDrawing();
}
```

---

## 🧪 Debug Checklist

1. **Console Inspection**

```js
window.store = require('features/canvas/stores/unifiedCanvasStore').useStore.getState();
store.subscribe(s => console.log('elements size', s.elements.size));
```

2. **Network Inspection**

   * No IPCs should fire on local element creation.

3. **React Profiler**

   * Only `MainLayer` should re-render on drawing.

---

## ✅ Exit Criteria for Phase 4

| Check            | Pass Condition                                       |
| ---------------- | ---------------------------------------------------- |
| Toolbar add      | Rectangle, circle, text, sticky appear on click/drag |
| Freehand         | Pen strokes persist after mouse-up                   |
| Section          | Draws correctly without capturing pen path           |
| Regression tests | `npm test` remains green                             |
| TS strict        | `npm run type-check` returns zero errors             |

---

## 🚦 Long-Term Guidance

* **Store-first**: All drawing logic lives in the store, not in components.
* **Tool slices**: Modular Zustand slices per tool improve isolation and reuse.
* **Typed commands**: Move toward structured action objects (`{type: 'ADD_RECT', ...}`) to shrink `finishDrawing`.

These steps align with best practices in the FigJam architecture guide and provide a scalable foundation for future tool development.

---

**Confidence: 100%**
This combined document captures and reconciles both inputs into a unified fix + architecture strategy. Let me know if you want it broken into implementation tasks.
