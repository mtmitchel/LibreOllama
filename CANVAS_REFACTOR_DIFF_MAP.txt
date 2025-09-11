CANVAS RENDERER REFACTOR DIFF MAP

Purpose
- This document highlights critical custom behaviors, integration seams, and implementation details that are easy to lose in a renderer refactor. Use it as a checklist to preserve UX and functionality parity when migrating.

A. Stage, Layers, and Global Contracts
1) Layer contract (must keep names/semantics):
   - background-layer: static 40k canvas, dot grid; listening=false for perf
   - main-layer: persistent elements, hit graph enabled
   - preview-fast-layer: live tool previews, pooled nodes, minimal listeners
   - overlay-layer: transformer, previews (connector), editor overlay positioning
   Risk: Tool preview rendering and editor overlay alignment expect these names and z-order.

2) Global renderer instance and hooks:
   - (window).__CANVAS_RENDERER_V2__ singleton; methods: init, syncElements, syncSelection, refreshTransformer, openTextareaEditor
   - (window).__UNIFIED_CANVAS_STORE__ exposed for renderer to call store actions (selectElement, updateElement)
   - (window).__REFRESH_TRANSFORMER__ used by table ops to force one-frame-later transformer refresh
   Risk: New renderer must re-expose equivalent hooks or provide adapter functions.

B. Text Editing Overlay (HTML over Konva)
1) Double-click behavior:
   - Renderer detects double-click on text-like nodes (text, sticky-note, circle, triangle, circle-text) and calls openTextareaEditor.
2) Editor overlay rules (renderer/editor/overlay.ts):
   - DOM overlay positioned via world→DOM transform, scaled to viewport, clipped optionally
   - Enter commits (textarea); Shift+Enter newline; Esc blurs
   - Paste sanitization for contentEditable
   Risk: Losing precise alignment and scaling produces cursor drift or truncated text.

C. Sticky Notes as Containers
1) Container semantics (elementModule):
   - isContainer=true; allowedChildTypes; clipChildren; maxChildElements
   - findStickyNoteAtPoint(x,y) to detect container under pointer
   - addElementToStickyNote/ removeElementFromStickyNote updates parent+child; parentId, stickyNoteId
2) Child motion on sticky move:
   - Move children by delta; for strokes (pen/marker/highlighter), also translate points array
   - constrainElementToStickyNote enforces padding and clipping
   Risk: Easy to update sticky position but forget to propagate to children and stroke points.

D. Drawing Tools Performance Path
1) Live preview path:
   - Pooled Konva.Line nodes in preview-fast-layer; perfectDrawDisabled; batchDraw
   - Interpolation step (~2px) for smoothness; store avoids per-move re-renders
2) Commit path:
   - addElementDrawing(element) → creates new Map once per stroke to trigger subscribers; history intentionally skipped
3) Eraser integration (store):
   - SimpleEraserIndex; eraseAtPoint/eraseInPath/eraseInBounds remove strokes; history entries appended per operation
   Risk: New renderer must keep preview perf (no React state churn) and commit semantics (history noise control).

E. Connector & Edge Draft System
1) Dual path support:
   - Legacy connector elements (free-floating line/arrow) if no snap targets
   - Modern edge store draft (startEdgeDraft/update pointer/update snap/commit) for element→element connections
2) Snapping heuristics:
   - Snap to left/right/top/bottom/center within SNAP_DISTANCE (~20px); portKind='CENTER' used now
3) Edge reflow pipeline:
   - updateEdgeGeometry(src,tgt) computes points; dirtyEdges recomputed in RAF; movement marks dirty
   Risk: If refactor centralizes all edges, maintain both free-floating and connected workflows during migration.

F. Tables and Transformer Refresh Contract
1) Creation:
   - Click to place 3x3, cellW 120, cellH 36; tool resets to select and auto-selects
2) Edits:
   - updateTableCell/add/remove row/column/resize cell width/height; replace Map refs to trigger redraw
   - After structural change, schedule (window).__REFRESH_TRANSFORMER__(tableId) next frame to update Konva.Transformer frame
   Risk: Without explicit transformer refresh, handles lag behind visual table.

G. Image Insert (Toolbar, Drag & Drop, Paste)
1) Sizing and placement:
   - Clamp max size to 300x300 with preserved aspect ratio; place at viewport center (toolbar) or drop/paste world coords
2) Sticky container integration:
   - On add at position within a sticky, auto child-link to sticky; tool resets to select and selects image
   Risk: Losing world→viewport conversion or sticky detection breaks expected behavior.

H. Selection/Transform/Grouping semantics
1) Select/deselect behavior via renderer & store; multi-select with modifier keys
2) Drag/transform end calls updateElement with new x/y/width/height; transformer scales reset to 1
3) Group move propagates delta to sibling elements and triggers edge reflows
   Risk: Ensure grouping deltas and reflow scheduling survive the refactor.

I. Viewport & Zoom Contracts
1) No Konva stage dragging; pan/zoom via store (`panViewport`, `zoomViewport`), toolbar, and shortcuts
2) Zoom clamps [0.1,10]; `zoomViewport` around center adjusts pan intelligently
   Risk: Accidentally re-enabling stage drag interferes with click/drag gestures.

J. Keyboard Shortcuts (Global)
- Undo/redo; zoom +/-/0; select all; duplicate; delete/backspace; escape; tool hotkeys (V/H/T/R/C/L/P/S/N)
- Editors and inputs suppress global shortcuts
   Risk: Shortcut regression makes power usage painful.

K. Renderer–Store Coordination
- Selection events originate in renderer (mousedown) and call store.selectElement; background clicks clear selection
- Renderer.syncElements must:
  - Create/update nodes per type (sticky, image, circle, triangle, text, table, connectors)
  - Maintain nodeMap and alive set to remove stale nodes
  - Hide sticky text Konva node during isEditing; auto-open editor for newlyCreated
  Risk: Skip/rename node names/classes and selection logic breaks; newlyCreated editing must still trigger overlay.

L. Performance and Memory Disciplines
- Pooled nodes for previews
- BatchDraw per layer
- Debounced text updates and editor overlay movements
- Avoid per-move store updates for drawing
- RAF-batched edge reflows
   Risk: Straightforward refactors often reintroduce per-frame React updates or synchronous edge recomputes.

Porting Checklist
[ ] Preserve layer names/z-order; preview-fast-layer remains non-listening and fast
[ ] Re-expose renderer hooks (init/sync/refreshTransformer/openEditor) or adapters
[ ] Keep double-click → editor overlay flow with exact DOM alignment/scaling
[ ] Retain sticky container semantics (child linking, move deltas, stroke point translation, clipping)
[ ] Drawing: preview via pooled Konva nodes; interpolation; addElementDrawing commit path (history skip)
[ ] Eraser: spatial index-backed deletion; history entries per erase operation
[ ] Connectors: dual path (legacy connector + edge store draft); snap behavior; edge reflow RAF batching
[ ] Tables: structural ops refresh transformer on next frame
[ ] Images: clamp sizing; correct world placement in toolbar/drag/paste; sticky-child attach
[ ] Selection/transform/group semantics; group move reflows edges
[ ] Viewport: no stage drag; store-driven zoom/pan; clamp zoom
[ ] Keyboard shortcuts and suppression while editing
[ ] Renderer.syncElements correctness per element type and newlyCreated auto-edit
[ ] Maintain batchDraw cadence and debounced updates; avoid per-move store thrash

High-Risk Hotspots (test first after refactor)
- Text editor overlay alignment under zoom/pan and high DPI
- Sticky child motion for strokes (points translation) and clipping
- Table transformer refresh after row/col operations
- Edge reflow timing when moving many grouped elements
- Drag/drop and paste image world coordinate placement
- Eraser spatial index refresh cadence and deletion accuracy

M. Testable Invariants (Must Hold After Refactor)
1) Layers present with exact names; removing/renaming any breaks editor/preview alignment
2) Transformer styling: borderStroke '#3B82F6', anchor size ~8, enabled anchors set; selection sync via renderer.syncSelection
3) Newly created sticky/text auto-edit behavior preserved (newlyCreated flag triggers overlay)
4) Table structural edits always refresh transformer on next frame (via equivalent of __REFRESH_TRANSFORMER__)
5) Edge reflow batches in RAF and commits immutably (edges Map reference changes)
6) Drawing preview uses pooled nodes; one Map replacement per stroke on commit; no history spam
7) Sticky container child motion translates stroke points; constrain enforces bounds
8) Connector snap distance approx 20px; green/gray preview semantics preserved; endpoints correctly commit to points
9) Paste/drag-drop images appear at pointer (converted world coords), clamped to 300px, with sticky attach when applicable
10) Keyboard shortcuts suppressed during editor overlay focus; toolbar announces tool changes via aria-live

N. Minimal Automated/Manual Test Checklist
- Text: creation; overlay border color '#3B82F6'; commit/cancel; resize handles; re-edit under zoom 0.75×/1×/2× (cursor alignment)
- Sticky: draw strokes inside; move parent; verify child strokes’ points changed by delta; clipping enforced when moving child near edges
- Drawing: 1000+ points stroke; ensure single map replacement and no excessive memory; eraser removes expected elements at point and along path
- Table: add/remove row/column thrice; confirm transformer refreshes within next animation frame; resize column adjusts total width
- Image: insert 3 images via toolbar (offsets 0/20/40 px); drop at different zooms; paste at pointer; sticky attach when inside
- Connectors: free-floating arrow remains selectable; snapped edge reflows when either endpoint moves; hitStrokeWidth effective ~40 px
- Undo/Redo: 20 mixed operations; undo/redo reliably restores element snapshots and selection
- Zoom/Pan: shortcuts and toolbar update viewport.scale; stage drag disabled; selection unaffected

O. Migration Notes & Adapters
- Provide a RendererAdapter that exposes init/syncElements/syncSelection/refreshTransformer/openTextareaEditor and wraps new renderer internals
- Maintain a StoreAdapter global for renderer callbacks (select/update) unless you refactor to prop-drill these safely
- Migrate __REFRESH_TRANSFORMER__ to a typed event bus or explicit renderer API (but keep same timing: next frame)

End of diff map.
