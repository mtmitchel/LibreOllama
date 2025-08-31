# LibreOllama Canvas Implementation Guide — Hardened & Unified Edition

## Overview

This document provides the complete, production-ready implementation guide for the LibreOllama canvas system. It consolidates all canvas-related implementation details into a single source of truth.

## 1) Goals & non-negotiables

* **Direct Konva, no react-konva.** A single `CanvasRenderer` service owns the stage and layers.
* **Four fixed layers (order & roles):**

  1. Background (non-listening, static grid/decor)
  2. Main (all interactive shapes, text, sticky notes, connectors)
  3. Fast (images only, GPU accelerated, no events)
  4. Overlay (selection chrome, handles, glow; non-listening by default).
* **Store-first:** Zustand holds only serialisable descriptors (geometry, style, metadata). Never store Konva nodes/DOM refs. Renderer rebuilds by diff (create/update/remove).

## 2) Renderer lifecycle

* **init():**

  * `Konva.pixelRatio = 1`
  * Create Stage sized to container; attach resize observer.
  * Create layers in order; set `background.listening(false)`; use `FastLayer` for images.
  * Keep refs to stage + layers.

* **syncFromState(store):**

  * Compute add/update/remove diffs; enforce **exactly one node per element id**.
  * Instantiate node on correct layer.
  * Update bounding boxes in spatial index.
  * Apply viewport transform with `stage.scale()` and `stage.position()`.

## 3) State & types

* Use **discriminated unions + branded IDs** for elements.
* Example element variants: Rect, Circle, Line/Arrow, Image, Text, StickyNote.
* Store only `{id, type, x, y, rotation, size, style, points, text…}`.
* Zustand modules: `elements`, `selection`, `viewport`, `history`. Use `subscribeWithSelector` for fine-grained subscriptions.

## 4) Event model (renderer-owned only)

* Attach **all pointer/drag/dblclick listeners** inside renderer. Never in React.
* **Drag:** nodes get `draggable:true`. On `dragstart`, move node to drag layer/top; on `dragend`, immutably commit new `{x,y}` to store, move node back.
* **Resize/rotate:** use Transformer in overlay; on `transformend`, immutably commit new geometry.
* **Text editing:** on `dblclick` create a DOM `<textarea>` overlay, commit value back to store on finish, then remove textarea. Only one code path.
* **Background clicks:** clear selection only when stage/background is target (not overlay UI).

## 5) Overlay rules

* Overlay is a **singleton group**, `listening:false` by default.
* Only handles (resize/connector points) become `listening:true` when visible.
* Highlight lines and selection glow remain non-interactive.

## 6) Performance & batching

* **One RAF per frame**; `batchDraw()` once per dirty layer.
* FastLayer = images only (no stickies, text, connectors).
* Use node pooling for heavy tools (freehand).
* Use caching (`node.cache()`) for complex shapes/text.
* Spatial index (QuadTree seam) enables viewport culling.

## 7) Element-specific rules

### Sticky Notes

* Descriptor: `{ id, type:'sticky', x, y, width, height, text, style… }`.
* Renderer: `Konva.Group` on Main, with rect background + text child.
* `draggable:true`, `listening:true`.
* On dragend: commit `{x,y}` immutably.
* On dblclick: spawn textarea overlay for text editing; commit text to store; renderer resyncs.
* Auto-resize: text measurement triggers height expansion in store.

### Text Boxes

* Descriptor: `{ id, type:'text', text, fontSize, fontFamily, fill, x, y, width?, height? }`.
* Renderer: `Konva.Text` on Main.
* Editing: dblclick spawns textarea overlay (same pipeline as sticky notes).
* Support rotation, alignment, and store-first updates.
* Auto-resize optional; width can be fixed or dynamic.

### Connectors (Edges)

* Descriptor: `{ id, type:'edge', points:number[], stroke, strokeWidth, markerEnd:'none'|'arrow' }`.
* Renderer:

  * `Konva.Arrow` if `markerEnd:'arrow'`
  * `Konva.Line` otherwise
* Always exactly one node per id.
* Stored geometry is **points only** (keep `{x:0,y:0}` parent-local).
* Selection: overlay draws glow + draggable handles from committed store points.
* Editing: drag handles updates `points` immutably in store, then resync.
* Optional: auto-reflow connectors on adjacent node move, computed in RAF batch.

## 8) Undo/redo & cleanup

* Store manages history with diffs/snapshots.
* Renderer just resyncs on `undo/redo`.
* On unmount: destroy stage/layers, release pooled nodes, unlisten Tauri events.

## 9) Integration & persistence

* Save/load: Tauri commands (`save_canvas_state`, `load_canvas_state`) handle JSON descriptors.
* Export: via Rust headless renderer or `stage.toDataURL()` + backend write.
* Cross-feature: elements may carry metadata (e.g., `sourceTaskId`) for linking tasks/projects.

## 10) Ship-blocker checklist

* [ ] One Konva node per element id (no Line+Arrow duplicates).
* [ ] No React handlers — renderer owns all.
* [ ] Overlay = singleton, non-listening by default.
* [ ] Sticky/text = Main layer; images = Fast layer.
* [ ] Immutable updates on drag/drop/edit.
* [ ] Viewport transform applied to `stage.scale/position`.
* [ ] Parent-local pointer math for previews.
* [ ] One RAF, one `batchDraw()` per dirty layer per frame.

## 11) Implementation timeline (condensed)

1. **Prototype:** Stage + layers, render rects/circles from store.
2. **Interactions:** Selection, Transformer, drag/resize/rotate.
3. **Advanced:** Sticky notes, text editing, connectors, object pooling, viewport culling.
4. **Persistence:** Save/load/export with Tauri.
5. **Polish:** Optimise caching, stress-test with large boards, add unit/integration tests.

## Conclusion

This unified blueprint eliminates repetition between previous drafts and ensures clarity around sticky notes, text boxes, and connectors. It preserves **renderer-owned events, store-first diffs, four-layer pipeline, and immutability guarantees**. It is implementation-ready for LibreOllama's production canvas.
