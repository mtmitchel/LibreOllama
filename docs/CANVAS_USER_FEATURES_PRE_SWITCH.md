CANVAS FEATURE & INTERACTION GUIDE (Pre-Switch Renderer)

Scope and intent
- This document describes, in exhaustive step-by-step detail, every canvas feature, user-facing tool, UI element, and interaction pathway as implemented in the pre-switch renderer baseline. It is derived from the current code for `src/features/canvas`, including the stage, renderer, toolbar, tools, store modules (Zustand), and helpers. It focuses on actual user behavior as exposed by the UI and the imperative Konva integration.
- Main entry points inspected include: `CanvasContainer.tsx`, `NonReactCanvasStage.tsx`, `ModernKonvaToolbar.tsx`, drawing tools (Pen/Marker/Highlighter), creation tools (Sticky Note, Connector), table creation click handler, image upload (toolbar and drag/drop), shapes (circle, triangle, mindmap), selection/transform/drag, zoom/pan, undo/redo, grouping, sticky note container behaviors, edge routing flow, and keyboard shortcuts.

Top-level UI: Canvas container and toolbar
- Component: `src/features/canvas/components/CanvasContainer.tsx`
  - Layout:
    - Renders a full-size `div` with the bottom-center floating `ModernKonvaToolbar` over the canvas.
    - Wraps the stage in `CanvasDragDropHandler` for drop/paste images.
    - Chooses `NonReactCanvasStage` (imperative Konva) for production and dev.
    - Maintains a stable `stageRef` for tools and event handlers.
  - Undo/Redo wiring: Uses store’s `undo` and `redo` passed into the toolbar.

- Toolbar: `src/features/canvas/toolbar/ModernKonvaToolbar.tsx`
  - Floating toolbar centered at the bottom. Clusters:
    - Basic tools: Select, Pan
    - Content tools: Text, Sticky Note, Table, Image
    - Shapes dropdown: Circle, Mindmap
    - Drawing tools: Pen, Marker, Highlighter, Eraser
    - Connectors dropdown: Line, Arrow
    - Actions: Undo, Redo, Delete Selected, Clear Canvas, Zoom Out, Zoom Level Button (Reset to 100%), Zoom In
  - Tool activation:
    - Clicking a tool sets `selectedTool` in the unified store. Screen reader polite announcement emitted.
    - Image tool opens a hidden `<input type="file" multiple accept="image/*">`; selected images are added into the canvas centered in the viewport (world coords), then selection switches to the new image and `selectedTool` resets to `select`.
  - Sticky note color indicator:
    - When sticky tool active, a small color swatch dot overlays the button; a palette popover appears allowing one-click update of default sticky color and updating selected sticky’s color in place.
  - Delete & Clear:
    - Delete removes the single selected item (element or edge). If selected id belongs to `edges`, it calls edge removal; otherwise `deleteElement`.
    - Clear prompts confirmation and then calls `clearCanvas()` (wipes elements, edges, selection, draft).
  - Zoom controls:
    - Zoom Out / Reset / Zoom In mutate `viewport.scale` with store `setViewport`.

Stage, layers, and rendering pipeline
- Stage creation: `src/features/canvas/components/NonReactCanvasStage.tsx`
  - Initializes a `Konva.Stage` directly into the container element with these layers:
    - `background-layer`: Static 40K x 40K light gray rect and a dot grid (FigJam-style) via `createDotGridHelper`.
    - `main-layer`: Persistent elements (text, sticky notes, shapes, images, edges/connectors, drawing strokes, tables).
    - `preview-fast-layer`: Live previews for drawing tools (Pen/Marker/Highlighter) with pooled Konva nodes for high FPS.
    - `overlay-layer`: Interactive elements including `Konva.Transformer`, keyboard/mouse overlays, and connector preview lines.
  - Renderer initialization (`CanvasRendererV2`):
    - Once the stage and layers exist, a single global instance `(window).__CANVAS_RENDERER_V2__` is created and `init(...)` called with `{ background, main, preview, overlay }`.
    - Renderer manages: node map, transformer, context menu, and syncing store state to Konva nodes.
    - `renderer.syncElements(...)` renders combined elements and edges from the store. Sticky notes, images, connectors, tables have dedicated create/update paths.
    - `renderer.syncSelection(...)` attaches `Konva.Transformer` to selected nodes.
  - Selection and double-click to edit text:
    - Renderer listens for mousedown to select/deselect via store. Double-click on text-like elements opens editor overlay.
  - Stage events are registered per active tool (see Tool activation below).

Unified store (Zustand) high-level
- Root: `src/features/canvas/stores/unifiedCanvasStore.ts`
  - Composes modules: element, selection, viewport, drawing (includes eraser), history, section, ui, event, edge.
  - Persists elements, selection, viewport, drawing config, sections, edges; draft edge is transient.
  - Provides connector draft actions (begin/update/commit/cancel), sticky note container operations, and high-performance drawing commits.

Viewport, zoom, pan
- Module: `stores/modules/viewportModule.ts`
  - State: `viewport` = { x, y, scale, width, height }.
  - Actions: `setViewport`, `panViewport(dx,dy)`, `zoomViewport(scale, center?)`, `zoomTo(x,y,scale?)`, plus legacy `zoomIn`, `zoomOut`.
  - Zoom clamps between 0.1 and 10. `zoomViewport` can zoom around a provided center point, adjusting pan accordingly.

Undo/redo and history
- Module: `stores/modules/historyModule.ts`
  - Simplified linear history of snapshots (elements and selection), up to `maxHistorySize` (default 50).
  - `addToHistory(operation)` or `addHistoryEntry` records snapshots; `undo`/`redo` restore `elements`, `selectedElementIds`, and `elementOrder`.
  - Many frequent operations (e.g., pointer-move) set `skipHistory=true` to avoid noise; final commits (drag end, transform end, edit commits, table edits) typically record history.

Selection, transform, drag
- Module: `stores/modules/selectionModule.ts`
  - `selectElement(id, multi?)` toggles or sets selection. `clearSelection()` clears all.
  - Grouping: `groupElements([...ids])` creates a group id and maps element→group; `ungroupElements(groupId)` reverses it.
  - `selectToolHandler.ts` integrates Konva events with store updates for drag/transform: on drag end/transform end, calls `updateElement` with final x/y/width/height. Transformer scales are reset to 1 after commit.
  - Group move: when moving an element that has `groupId`, siblings in the same group are moved by the same delta; connected edges are marked dirty and reflowed.

Drawing tools (Pen, Marker, Highlighter, Eraser)
- Activation:
  - Toolbar sets `selectedTool` to `pen`, `marker`, or `highlighter`. Each tool component mounts when active and attaches Konva pointer events directly to the stage.
  - Preview rendering uses pooled Konva.Line nodes on the `preview-fast-layer`; no React re-renders during stroke capture.
- Pen: `components/tools/drawing/PenTool.tsx`
  - Pointerdown: startDrawing('pen'), start with empty `pointsRef`; add interpolated points at ~2px step for smoothness, set stroke defaults (color from `penColor`, width 2, round caps).
  - Pointermove: updates interpolated points and preview line; updates `updateDrawing(pointer)` for store-awareness without spamming state.
  - Pointerup: if ≥4 points, creates a `pen` element with points and commits via `addElementDrawing` (history skipped for performance). If the start point is inside a sticky note container, associates the stroke to that sticky as a child.
- Marker: `components/tools/drawing/MarkerTool.tsx`
  - Similar to pen but with configurable `strokeStyle` (wider width, opacity, smoothness, round joins), supports width variation metadata; blend mode is typically source-over.
  - Commits a `marker` element with `.style` describing appearance; can auto-associate to a sticky note container.
- Highlighter: `components/tools/drawing/HighlighterTool.tsx`
  - Similar capture; preview uses `globalCompositeOperation` to simulate multiply highlight; default width ~12–16 px and opacity ~0.4–0.5.
  - Commits `highlighter` element with blend mode and base opacity; can associate to sticky.
- Eraser: Store: `stores/modules/drawingModule.ts`
  - Spatial index: `SimpleEraserIndex` built over erasable elements (pen/marker/highlighter) with `updateSpatialIndex()`.
  - `eraseAtPoint(x,y,size)`: Deletes any stroke with a point within eraser radius, marks index dirty, adds `Erase strokes` history entry.
  - `eraseInPath(path[], size)` and `eraseInBounds(bounds)` provide bulk deletion strategies, also marking history.
  - Eraser tool button is present in the toolbar; interaction layer would call these store actions to delete strokes under cursor or path.

Content tools
- Text tool (pure Konva in `NonReactCanvasStage.tsx`):
  - Activation: set `selectedTool` = 'text'. Cursor changes to crosshair; a ghost "Text" label follows the pointer in the overlay layer.
  - Click to create: on mousedown, a text box is created at world coords with FigJam-like defaults (BASE_FONT 24, PADDING 8, auto-size rules). Immediately opens HTML overlay editor aligned to the Konva node (editor overlay lives in `renderer/editor/overlay.ts`).
  - Typing behavior: FigJam-style typing with manual wrapping and editor clipping; `openTextareaEditor` manages blur/commit. Enter commits; Shift+Enter inserts newline. Escape cancels focus.
  - Auto fit: by default, `autoFitDuringTyping` is false; editor clipping is enabled.

- Sticky Note tool: `components/tools/creation/StickyNoteTool.tsx`
  - Activation: set `selectedTool` = 'sticky-note'.
  - Click to create: at pointer world coords, creates a `sticky-note` element sized 200x150 (centered on cursor), with `backgroundColor` = selected sticky color, text empty, `newlyCreated=true`.
  - After add:
    - Switches tool to `select`.
    - Selects the new note.
    - Triggers text editor overlay open on the sticky (auto-edit) on next tick.
  - Sticky as container:
    - enableStickyNoteContainer(...) sets `isContainer=true`, `childElementIds`, `allowedChildTypes` (pen, marker, highlighter, text, connector, image, table), `clipChildren`, `maxChildElements`.
    - Strokes and images dropped or created within bounds attach as children; moving the sticky moves children by delta; stroke points shift accordingly.

- Table creation: `NonReactCanvasStage.tsx` (click handler when tool='table')
  - Activation: set `selectedTool` = 'table'.
  - Click to place a 3x3 table at cursor (rows=3, cols=3, cellWidth=120, cellHeight=36). `addElement` adds the `table` element. Tool resets to `select` and selects the new table.
  - Renderer draws the table imperatively with grid cells; table operations (add/remove rows/cols, cell edits, resizing) are in `elementModule`:
    - `updateTableCell(tableId, r,c, value)` updates enhanced cell data, forces Map replacement for re-render, and refreshes `Konva.Transformer` next frame.
    - `addTableRow/Column` adjusts size, updates enhanced data structures, forces redraw, and schedules transformer refresh.
    - `removeTableRow/Column` updates size and structures and refreshes transformer.
    - `resizeTableCell` updates column width or row height while maintaining minimums, adjusts overall table size.

- Image upload:
  - Toolbar flow (ModernKonvaToolbar): opening file input; each image is loaded, dimension-clamped to max 300x300 while maintaining aspect ratio, placed at viewport center in world coords with small offsets for multiple files, `addElement(image)` commits, tool resets to select, and selects the image.
  - Drag & Drop / Paste: `components/ui/CanvasDragDropHandler.tsx`
    - Dragging image files over canvas adds a dashed-border highlight; dropping images computes world coords and creates images in place.
    - Pasting images from clipboard: when canvas is focused (not typing in inputs), extracts images and places at pointer or center if pointer unavailable.
    - Sticky container check: If drop/paste position is inside a sticky, the image is automatically added as a child.

- Shapes: `ShapesDropdown.tsx` + `NonReactCanvasStage.tsx`
  - Circle (tool='draw-circle'): Click to create a `circle` element with larger default radius (65), a white fill and gray stroke; marks `newlyCreated=true` and `isEditing=true` for immediate text entry if applicable; selects it and resets tool to `select`.
  - Triangle (code scaffold exists but currently the dropdown exposes Circle + Mindmap per code). If present, would follow similar click-to-place.
  - Mindmap (tool='mindmap'):
    - Click places a central rectangle-like node and several sub-nodes around it, then adds curved connectors (edges) from center to subs immediately using the edge store (`addEdge`, then `updateEdge(... points ...)` to mark curved). Tool resets to `select` and selects center node.

Connector tools and edges
- Connector tools UI: `ConnectorDropdown.tsx` exposes 'connector-line' and 'connector-arrow'.
- Tool behavior: `components/tools/creation/ConnectorTool.tsx`
  - Activation: select 'connector-line' or 'connector-arrow'. Cursor is crosshair.
  - Mousedown:
    - Computes world position; tries to find a nearby element edge or center within SNAP_DISTANCE ~20px (left/right/top/bottom/center) using element bounds.
    - If an element is found, `startEdgeDraft({ elementId, portKind: 'CENTER' })` and sets `startElement`.
    - Otherwise, starts a free-floating draft from world point (legacy path).
  - Mousemove:
    - Updates draft pointer `updateEdgeDraftPointer(world)`.
    - Checks for a snap target at the current pointer; if found and not equal to start element, sets `updateEdgeDraftSnap({ elementId, portKind: 'CENTER' })` and shows green preview; otherwise gray dashed preview.
  - Mouseup:
    - If distance is small, cancels.
    - If started free-floating: creates legacy `connector` element with start/end points and subType: 'line' or 'arrow'.
    - If started on an element: `commitEdgeDraftTo(snapTarget || undefined)` which creates an `edge` in the edge store. Then `computeAndCommitDirtyEdges()` recalculates routed points; newly created edge is selected.
  - Preview: draws dashed preview line on `overlay-layer`; green when snapping, gray otherwise.
- Edge store: `stores/modules/edgeModule.ts`
  - State: `edges` (Map), `draft`, `dirtyEdges` (Set of ids needing reflow).
  - Draft actions: `startEdgeDraft`, `updateEdgeDraftPointer`, `updateEdgeDraftSnap`, `commitEdgeDraftTo`, `cancelEdgeDraft`.
  - `computeAndCommitDirtyEdges()` calls `updateEdgeGeometry(edge, src, tgt)` to compute `points` for routing and commits them immutably, clearing `dirtyEdges`.
  - Element movement calls `reflowEdgesForElement(movedId)`; a RAF schedules recompute of all dirty edges.
  - Removal clears selection state for the edge id.

Transformer and selection overlay
- Renderer (`CanvasRendererV2`):
  - Creates a `Konva.Transformer` with blue border, white-anchored handles; keeps anchors top-left/top-right/bottom-left/bottom-right; rotate enabled.
  - `syncSelection` binds transformer to selected nodes (sticky, text, image, table, circle, triangle; connectors are lines and are not group-wrapped, transform rules differ).
  - Double-click on text-like nodes opens the `EditorOverlay` (HTML) positioned and scaled to world coordinates with dom-to-world mapping; input/blur events update the element text and commit on blur/Enter.

Sticky notes as containers
- In `elementModule.ts`:
  - `enableStickyNoteContainer(stickyId, options)` toggles container behavior and defines `allowedChildTypes` list.
  - `addElementToStickyNote(childId, stickyId)` updates both parent and child; `removeElementFromStickyNote` unlinks.
  - `findStickyNoteAtPoint({x,y})` searches elements for a sticky container whose rect contains the point.
  - During sticky movement, all children move by delta; for strokes, the `points` arrays are offset.

Keyboard shortcuts
- `hooks/useKeyboardShortcuts.ts` (global window listener)
  - Ctrl/Cmd+Z: undo; Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo.
  - Ctrl/Cmd+0: reset to 100% (delegates to global hooks set by canvas).
  - Ctrl/Cmd+Plus/Equal: zoom in; Ctrl/Cmd+Minus: zoom out.
  - Ctrl/Cmd+A: select all.
  - D (with no modifiers): duplicate first selected element (offset by 20,20).
  - Delete/Backspace: delete selected.
  - Escape: clear selection.
  - Tool keys: V=Select, H=Pan, T=Text, R=Rectangle (scaffold), C=Circle, L=Line (legacy), P=Pen, S=Star (scaffold), N=Sticky Note.

Zoom and pan interactions on the stage
- Pan tool (selectedTool='pan') uses `PenTool` mount condition allowing panning via stage-level logic; overall panning is typically implemented via specific handlers (not dragging the stage itself). The store exposes `panViewport` and `zoomViewport`; toolbar drives zoom.
- Renderer/Stage avoid Konva stage drag for panning; pan behaviors can be implemented via modifiers (e.g., spacebar), or Pan tool with handlers.

Undo/Redo visual affordances
- Toolbar Undo/Redo buttons reflect `canUndo`/`canRedo` from history state. Keyboard shortcuts mirror the same.
- History is appended on atomic operations (add/update/delete, table operations); high-frequency drawing commits are excluded to keep history meaningful.

Edge cases and behaviors of note
- Selection vs. text editing: typing in overlay editors suppresses global keyboard shortcuts; blur commits.
- Element updates inside sections are constrained to section bounds.
- Group moves propagate to siblings and trigger edge reflows.
- Table operations force transformer refresh via a globally stored `__REFRESH_TRANSFORMER__` function, invoked on the next frame after edits.
- Sticky container clipping: `clipChildren` prevents child elements from exceeding sticky bounds (enforced via `constrainElementToStickyNote`).
- Drawing performance: pooled Konva nodes, interpolation at ~2px steps, perfectDrawDisabled for preview, batchDraw calls per frame.

Step-by-step user walkthroughs
1) Creating and editing a sticky note
- Click Sticky Note tool in the toolbar. Cursor becomes crosshair.
- Click anywhere on canvas: a sticky note appears centered at the click with the selected color.
- Tool auto-resets to Select; note becomes selected; text editor opens immediately on the sticky.
- Type your text; press Enter to commit or click elsewhere. Edit overlay disappears; the Konva text updates inside the note, auto-sized.
- Drag the note to reposition; any child strokes/images move with it. Resize via transformer handles; children remain clipped.

2) Drawing with pen/marker/highlighter
- Choose Pen/Marker/Highlighter. Cursor remains default; start drawing with left button.
- A live stroke preview follows the cursor smoothly; when you release, the stroke is committed and becomes selectable like other elements.
- Highlighter appears translucent and multiplies with content (blend mode), ideal for emphasis.
- Use Eraser: scrub over strokes to remove segments; strokes intersecting the eraser area are deleted. Multiple erasures add a single history entry per operation.

3) Creating a table
- Select Table tool. Click where you want the table. A 3x3 table appears centered on click.
- Tool resets to Select and table is selected with transformer handles.
- Right-click (renderer invokes a context menu) or use controls to add/remove rows/columns. Table resizes accordingly; the transformer refreshes in the next frame.
- Double-click inside the table cell region opens text editing mode for that cell (renderer manages overlay positioning and commits changes back to `enhancedTableData`).

4) Inserting images
- Toolbar Image: click and select one or more image files. Each is loaded, sized to max 300px on larger edge, placed at viewport center (offsets for multiples), selected, and tool resets to Select.
- Drag-and-drop: drop image files on the canvas; images appear at the drop location. Sticky notes under the drop receive images as children automatically.
- Paste: copy an image to clipboard and press Ctrl/Cmd+V while canvas is focused; the image is inserted at pointer or center.

5) Adding connectors (lines/arrows)
- Select Line or Arrow in Connector dropdown.
- Mousedown near the edge/center of a shape (sticky, circle, table, image). If close enough, the tool snaps to that element; otherwise starts free-floating.
- Move the mouse: a dashed preview line shows from start to current; green when snapping to a valid target, gray otherwise.
- Release near a second element to snap and create a connected edge; edge routing computes points and the edge is selected. Free-floating ends create legacy connector elements when no target.
- Moving connected elements triggers reflow of connected edges (routed again on next frame).

6) Shapes: circle and mindmap
- Circle: Choose Shapes → Circle, click to place a circle (white fill) at cursor; tool resets to Select and the circle is selected. Double-click opens text editing inside the circle.
- Mindmap: Select Mindmap, click to create center node; automatically creates child nodes around with curved edges. Tool resets to Select and center node selected.

7) Selection, transform, group, delete
- Click an element to select; Shift/Ctrl/Cmd-click to multi-select (toggle).
- Drag to move; blue transformer handles to resize/rotate for supported types. Release commits final x/y/w/h; history updated.
- Group: select 2+ elements and click Group on toolbar; ungroup when a grouped element is selected. Moving one moves grouped siblings.
- Delete: press Delete/Backspace or click the toolbar delete button.

8) Zoom and pan
- Use toolbar zoom controls or keyboard shortcuts: Ctrl/Cmd + / - / 0. Reset returns to 100%.
- Pan tool can be selected to pan via specific handlers; stage dragging is disabled by default to avoid conflicts.

9) Undo/Redo and keyboard shortcuts
- Ctrl/Cmd+Z / Shift+Ctrl/Cmd+Z (or Ctrl/Cmd+Y) for undo/redo. History is coherent and excludes overly granular drawing updates.
- Ctrl/Cmd+A selects all. D duplicates first selected. Escape clears selection. Various letter keys select tools (V/H/T/C/P/N).

Notes on persistence and performance
- Store persists elements and view; upon reload, elements, selection, viewport rehydrate from localStorage.
- Performance optimizations: pooled nodes for preview, batched draws, spatial indexes for eraser and visibility, debounced updates in renderer for text and table overlay operations.

File references for further maintenance (non-exhaustive)
- Stage and renderer:
  - components/NonReactCanvasStage.tsx
  - services/CanvasRendererV2.ts
- Toolbar and menus:
  - toolbar/ModernKonvaToolbar.tsx
  - toolbar/ShapesDropdown.tsx
  - toolbar/ConnectorDropdown.tsx
- Tools:
  - components/tools/drawing/PenTool.tsx
  - components/tools/drawing/MarkerTool.tsx
  - components/tools/drawing/HighlighterTool.tsx
  - components/tools/creation/StickyNoteTool.tsx
  - components/tools/creation/ConnectorTool.tsx
- Drag/drop & paste:
  - components/ui/CanvasDragDropHandler.tsx
- Store core & modules:
  - stores/unifiedCanvasStore.ts
  - stores/modules/* (viewport, selection, element, drawing, history, edge)
- Editor overlay (text):
  - renderer/editor/overlay.ts
- Spatial index helpers:
  - utils/spatial-index.ts
  - utils/spatial/QuadTree.ts

APPENDIX A — GLOBAL INTERACTION MATRIX (FULL USER + SYSTEM VIEW)

A1. Pointer + Keyboard Baseline
- Primary pointer actions (mouse/stylus):
  - Left down/move/up: selection, drag, transform, drawing strokes, connector drafting, table placement
  - Double-click: open editor overlay for text-like nodes (text, sticky-note text, circle text)
  - Right-click: table context menu (renderer), OS default context menu generally suppressed elsewhere by app webview configuration
  - Wheel: standard scroll; zoom handled via shortcuts; stage dragging disabled by design; panning via Pan tool
- Keyboard shortcuts (suppressed while an editor overlay is focused):
  - Undo/Redo: Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z or Ctrl/Cmd+Y
  - Zoom: Ctrl/Cmd +, Ctrl/Cmd −, Ctrl/Cmd 0 (reset to 100%)
  - Selection: Ctrl/Cmd+A (select all), Esc (clear selection)
  - Duplicate first selected: D (no modifiers)
  - Delete: Delete/Backspace
  - Tools: V (Select), H (Pan), T (Text), C (Circle), R (Rectangle scaffold), L (Line scaffold), P (Pen), S (Star scaffold), N (Sticky)
- Focus and accessibility:
  - Toolbar: buttons are keyboard focusable; ArrowLeft/ArrowRight move focus among tools; Enter/Space activates; aria-live announcement when tool changes
  - Editor overlay: tagged with data-role="canvas-text-editor"; stops propagation of pointer/wheel; Esc cancels, Enter (without Shift) commits

A2. Layer/Space Contracts
- World space: all element positions/sizes are in world coordinates (zoom invariant)
- Stage space: Konva Stage absolute transform converts between world and stage pixel space
- DOM space: editor overlays compute world rectangles and convert them to fixed-position DOM pixels using container.getBoundingClientRect() + stage scale
- Required layers (names and order):
  - background-layer (static rect + dot grid, listening=false)
  - main-layer (persistent elements, listening=true)
  - preview-fast-layer (live drawing previews, pooled nodes, listening=true but minimal)
  - overlay-layer (transformer, connector previews, editor overlays, listening=true)

A3. Selection + Transformer Lifecycle
- Selecting: mousedown on element → store.selectElement(id[,multi]) → renderer.syncSelection(new Set([...])) → transformer targets group(s)
- Drag/transform: intermediate updates via store.updateElement(..., {skipHistory:true}) to avoid history spam; on end, modules ensure a final history entry is recorded
- Deselecting: click background/layer (Select tool active) → store.clearSelection(); transformer cleared/hidden


APPENDIX B — TOOL LIFECYCLES (CREATE → PREVIEW → COMMIT → MANIPULATE → INTERACT → DESTROY → PERSIST)

B1. Text Tool (Tool ID: 'text')
- Create: clicking background inserts a minimal text element at world coords; tool auto-switches to Select
- Node sync: renderer creates group with Konva.Text ('.text') + Konva.Rect ('.hit-area'); nodeMap updated
- Editing overlay:
  - A fixed-position textarea is created with border 1px solid #3B82F6, background rgba(255,255,255,0.95), line-height 1, padding 0 1px
  - Font family/size copied from Konva.Text; DOM rect computed from worldRectToDOM(group x/y, frame w/h)
  - Keys: Enter=commit (unless Shift), Esc=cancel, blur=commit; input triggers liveGrow measurement
- liveGrow behavior:
  - Mirror content into Konva.Text (point‑text: wrap none, width undefined); clear caches; measure natural width via getTextWidth()
  - Compute neededWorldW = max(minWidth, measured + padding≈10); set overlay DOM width from world*stageScale for stable contraction
  - Update hit‑area width/height; batchDraw; store.updateElement(id,{width,text}) with skipHistory true
- Commit:
  - Reset to point‑text; dual‑metric width = max(canvas advance, visual bbox) + guard; apply width; re‑measure bbox and reposition text by −bbox
  - Frame.width = max(required, ceil(bbox.width)+8); Frame.height = ceil(bbox.height + fontSize*0.12); store.updateElement(...,{isEditing:false})
- Cancel: mark non-editing then delete element
- Manipulation: drag and transform commit updates and history; constraints apply if element resides within a section
- Destroy: delete key or toolbar delete
- Persist: in-memory (Zustand persistence) and optionally via Tauri encrypted save (Appendix E)

B2. Sticky Note Tool (Tool ID: 'sticky-note')
- Create: click inserts 200×150 sticky centered at cursor; default color (or selected palette); flags newlyCreated=true and isContainer=true with clipChildren
- Auto-edit: renderer opens overlay immediately for newlyCreated
- Container semantics:
  - allowedChildTypes includes strokes, text, connectors, image, table; childElementIds tracked
  - Tools (drawing and image insert) call findStickyNoteAtPoint to auto-link new items as children when started/placed within bounds
  - Moving parent: children move by delta; strokes update every x,y pair in points; constrainElementToStickyNote ensures child remains inside padding
- Manipulate/Destroy: same as other elements; clearStickyNoteChildren can unlink all children before deletion

B3. Pen/Marker/Highlighter Tools
- Live preview pipeline:
  - On pointerdown: acquire pooled Konva.Line from KonvaNodePool; add to preview-fast-layer; perfectDrawEnabled=false; batchDraw after updates
  - Interpolation (~2px step) produces smooth paths without per-move React renders
- Commit pipeline:
  - addElementDrawing(element) replaces Map once per stroke (no history spam); optionally child-link to sticky note via start point
- Marker specifics: richer style object (opacity, smoothness, widthVariation hint)
- Highlighter specifics: globalCompositeOperation (e.g., 'multiply'), default color '#f7e36d', width ~12, opacity ~0.5

B4. Eraser
- Spatial index lazily rebuilt (SimpleEraserIndex) over erasable elements (pen/marker/highlighter)
- eraseAtPoint/eraseInPath/eraseInBounds remove strokes intersecting the eraser aperture; history entry recorded succinctly per operation

B5. Table Tool
- Create: 3×3 at click; element carries rows, cols, width, height, typography and border styling
- Edits (module): updateTableCell/add/remove row/column/resize cell; Map replacement triggers redraw; __REFRESH_TRANSFORMER__(tableId) scheduled next frame after structural change
- Renderer table groups: frame (Rect), bgrows, grid, cells; context menu and mouseleave listeners attached

B6. Image Insert (Toolbar / Drag-Drop / Paste)
- Sizing: clamp to ≤300×300 while preserving aspect ratio; toolbar places at viewport center (world coords) with slight offsets per multiple files
- Drag/Drop: drop position converted to world coords; images created at that point; sticky auto-link when dropping inside a sticky
- Paste: places at pointer (or center fallback) when canvas has focus; sanitized for correctness

B7. Shapes (Circle, Mindmap)
- Circle: click-to-place radius 65 (diameter 130), fill white, stroke '#d1d5db', newlyCreated=true + isEditing=true to open overlay
- Mindmap: click creates center + satellite nodes; edges created immediately; marked curved by setting three-point paths; select center on finish

B8. Connector Tools ('connector-line', 'connector-arrow')
- Start: hit-test nearby elements for snap points (left/right/top/bottom/center within ~20px); startEdgeDraft if found, else free-floating startPoint
- Move: updateEdgeDraftPointer + potential updateEdgeDraftSnap; overlay dashed preview (green snapping, gray free)
- End: if short segment cancel; else free-floating → legacy ConnectorElement, or snap commitEdgeDraftTo target → EdgeElement; computeAndCommitDirtyEdges routes; select new edge
- Endpoint edit (store): beginEndpointDrag/updateEndpointDrag/commitEndpointDrag available for renderer-driven endpoint manipulation


APPENDIX C — EDGE CASES, PERFORMANCE, ACCESSIBILITY

C1. History hygiene: drawing commits skip history; structural and finalizing updates add single, meaningful entries
C2. Editor overlay robustness: computed via worldRectToDOM; consistent under zoom/pan/high-DPI; paste sanitized to plain text
C3. Edge reflow: batched via RAF; dirtyEdges cleared after immutable commit; group moves mark all connected edges dirty
C4. Hit areas: connectors have large hitStrokeWidth to remain selectable; strokeScaleEnabled=false for consistent feel under zoom
C5. Persistence merge: Maps/Sets reconstructed; defensive asserts replace corrupted structures; selection Sets recreated
C6. a11y: toolbar announces selection changes; editor overlay stops event propagation to avoid accidental canvas gestures while typing


APPENDIX D — MANUAL QA PLAYBOOK (CRITICAL FLOWS)

D1. Text: create → type 2 lines → commit → transformer visible; re-edit (double-click) → Esc cancel; ensure single history increment on commit only
D2. Sticky container: create → draw pen inside → child moves with parent; resize sticky → drag child to edge → constrained; delete parent after unlink → children persist
D3. Drawing: rapid long stroke → preview smooth, no history explosion; delete works; highlighter multiplies correctly over image/text
D4. Table: add/remove rows/cols; verify transformer refresh next frame; resize column updates element width
D5. Images: toolbar insert multi files (center + offsets), drag/drop at pointer, paste at pointer; sticky child attach when inside bounds
D6. Connectors: line from sticky to image (preview gray→green snap); commit; move image → edge reflows; free-floating arrow remains selectable
D7. Undo/Redo + Zoom: perform sequence then undo/redo step-by-step; zoom in/out and reset


APPENDIX E — BACKEND (TAURI) CANVAS COMMANDS

E1. ensure_encryption_key: generate/store 256-bit AES key in OS keyring if missing; id: LibreOllama/canvas_encryption
E2. save_canvas_data: AES-256-GCM encrypts CanvasData {data,version,timestamp} with random 96-bit nonce; stores [nonce|ciphertext] under app_data_dir/canvas/filename
E3. load_canvas_data: reads file; splits nonce; decrypts; returns CanvasData.data; logs timestamp
E4. list_canvas_files: returns .canvas/.json under app_data_dir/canvas
E5. delete_canvas_file: removes the specified file; reports errors via Err

End of document.
 
APPENDIX F — PER-TOOL SEQUENCE DIAGRAMS (USER → STORE → RENDERER → KONVA → TAURI)

F1. Text (Create & Commit)
- USER: Click Text tool → Click canvas background
- STORE: addElement({type:'text', x,y, width:60, height:fontSize, text:''}); addToHistory('addElement'); setSelectedTool('select')
- RENDERER: syncElements → create Konva group('.text','.hit-area'); nodeMap.set(id, group)
- RENDERER: openTextareaEditor(group)
- KONVA: none (overlay is HTML)
- USER: Type → Enter (no Shift)
- RENDERER: finalizeText → measure text → update frame → batchDraw
- STORE: updateElement(id,{text,width,isEditing:false}); clearSelection(); selectElement(id)
- RENDERER: syncSelection(Set[id]) → Transformer (#3B82F6) attaches

F2. Sticky (Create & Child Stroke)
F1b. Text (Re-Edit After Initial Commit — Double-Click Flow)
- USER: Double-click text element (on group, not on transformer anchor)
- STORE: updateElement(id,{ isEditing:true },{ skipHistory:true })
- RENDERER: hide Konva text; mount DOM textarea overlay at element’s world rect → DOM; prefill current text; focus to end; style with 1px #3B82F6 border, radius 4, background rgba(255,255,255,0.95), line-height 1; disable stage panning
- KONVA: group stays; transformer may remain attached but non-interactive; main layer redraws
- USER: Types — on input:
  - RENDERER: mirror value to hidden ktext via ktext.text(value||' '); ensure ktext.width(undefined)
  - RENDERER: textWidth = ceil(ktext.getTextWidth()); minWorldWidth = max(12, ceil(fontSize)); neededWorldW = max(minWorldWidth, textWidth + padding≈10)
  - RENDERER: frame.width(neededWorldW); textarea.style.width = neededWorldW * scaleX px; textarea.style.height = fontSize*scaleY + 2 px
  - STORE: updateElement(id,{ width: neededWorldW, text: value },{ skipHistory:true }) or text-only if width unchanged
  - KONVA: mainLayer.batchDraw()
- USER: Presses Enter (no Shift) or overlay blurs — commit
  - RENDERER: show ktext; ktext.text(value); ktext.width(undefined); ktext._clearCache(); metrics = ktext.measureSize(value)
  - RENDERER: frame.width = ceil(metrics.width) + 8; frame.height = ceil(metrics.height * 1.2); ktext.position({ x:4, y:2 })
  - STORE: updateElement(id,{ text:value, width: frame.width, isEditing:false }); clearSelection(); selectElement(id)
  - RENDERER: transformer.nodes([group]); transformer.borderStroke('#3B82F6'); renderer.syncSelection(new Set([id]))
  - DOM: remove textarea; stage remains non-draggable
  - KONVA: overlay/main layers batchDraw

F1c. Text (Reselect / Click-Away / Move)
F3. Sticky Notes (Create → Edit → Move → Children)
- Cursor: default select pointer; Sticky tool shows note icon (if present) or standard cursor
- Create: click canvas → add sticky element (defaults: width≈200,height≈150, background color from palette)
- Edit: double-click opens textarea-like overlay for sticky content; same live-hug semantics as Text (F1b)
- Move: dragging parent updates x/y; children (strokes/text/etc.) translate by delta; store updates child points for strokes
- Bounds: if `clipChildren` true, child positions constrained to padding within sticky bounds
- Delete: delete key removes note and detaches or deletes children based on policy

F4. Drawing Tools — Pen / Marker / Highlighter
- Cursor: crosshair or pen cursor; preview layer active
- Down→Move: renderer emits preview stroke in `preview-fast-layer`; points buffered with smoothing; store not spammed
- Up (Commit): pooled Konva Line path committed to main layer; one history entry; stroke style set according to tool (opacity/width)
- Undo/Redo: coalesced entries; redo replays stroke
- Interactions: selection box ignores drawing strokes unless Select tool active; eraser can target them

F5. Eraser
- Cursor: eraser icon; hit test against strokes/elements per policy
- Down→Move: on hover, preview erasure target; on up, delete targets; update store; add one history entry
- Edge cases: overlapping strokes → prioritize topmost or last-created

F6. Shapes — Rectangle / Circle / Triangle / Mindmap
- Cursor: crosshair
- Create: click (or drag, if supported) creates shape with default dimensions; mindmap may create root node
- Edit: transformer anchors per-shape; Shift locks aspect where applicable; circle text editor uses inscribed ellipse sizing
- Commit: size/position persisted; selection retained

F7. Image — Upload / Paste / Drag-Drop
- Creation funnel: paste clipboard image, drag-drop file, or file picker → common handler creates image element
- Sizing: respects EXIF orientation; default fit to a max dimension; transformer allows aspect lock with Shift
- Interactions: selection, move, resize; connectors can attach to image center/ports if defined

F8. Table
- Create: click to place grid with default rows/cols
- Edit: cell editor overlay matches cell rect; arrow keys navigate; Enter commits cell
- Structure: add/remove rows/cols updates layout; transformer refresh triggered next frame for accurate frame
- Interactions: selection of table group; resize affects overall grid; copy/paste within cells supported if present

F9. Connectors
- Cursor: crosshair; starting over a node highlights snap target (green); otherwise gray floating preview
- Draft: click-drag from source → live line preview; snapping at threshold (~20px) to centers/ports
- Commit: on release, edge stored in graph; reflow batched in RAF; moving nodes updates endpoints
- Interactions: selection transforms updates edge endpoints; delete removes edge

F10. Selection & Transformer
- Box select (if supported) creates selection set; transformer attaches to selected groups
- Anchors: `['top-left','top-right','bottom-left','bottom-right','middle-left','middle-right','top-center','bottom-center']`; border #3B82F6
- Transform: onTransformEnd commits width/height/rotation attrs to store; intermediate transforms do not spam history

F11. Viewport — Zoom & Pan
APPENDIX J — Keyboard & Accessibility Maps (Per Tool)

J1. Global
- Undo/Redo: Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z or Ctrl/Cmd+Y
- Zoom: Ctrl/Cmd + / − / 0; selection clear: Esc; select all: Ctrl/Cmd+A
- Editor Focus Trap: when textarea overlay present, global shortcuts suppressed; Esc cancels (or deletes if empty), Enter commits

J2. Text
- Enter: commit; Shift+Enter: newline (if supported); Esc: cancel; Tab: defocus/commit
- Arrow keys: move caret; Ctrl/Cmd+A: select all text
- Screen readers: textarea has role=textbox; label via aria-label "Canvas text editor"; focus ring visible

J3. Sticky
- Same as Text when editing sticky content; Esc commits or cancels per policy
- While selected: arrow keys nudge (if supported) by 1px; Shift+nudge by 10px

J4. Drawing (Pen/Marker/Highlighter)
- Hold Space to pan (if supported); Esc cancels active stroke draft

J5. Eraser
- Esc cancels erasing preview

J6. Shapes
- Shift constrains aspect during resize; arrow keys nudge (if supported)

J7. Image
- Shift maintains aspect ratio; Delete removes image; Enter no-op

J8. Table
- Enter commits cell; Tab/Shift+Tab navigates cells; Arrow keys move selection in grid; Esc exits cell edit

J9. Connectors
- Esc cancels draft; Enter commits if snapped; Arrow keys no-op during draft

APPENDIX K — Edge-Case Matrices (Per Tool)

K1. Text
- Empty commit: deletes element; Undo restores; IME composition respected; emojis/CJK measured correctly
- Zoomed editing: overlay scales via DOM; measurement uses world units
- Rotation (if any): overlay may not rotate; text measured then reinserted

K2. Sticky
- Moving with many children: performance remains responsive; child stroke points translated
- Clip enabled: children constrained within padded bounds

K3. Drawing
- Very long stroke: memory and FPS within budget; coalesced history; pooled nodes reused
- Rapid undo/redo: no orphan preview nodes remain

K4. Eraser
- Overlap ambiguity: topmost hit first; multi-target erasure resolved deterministically

K5. Shapes
- Tiny sizes: min size enforced; anchors remain accessible

K6. Image
- Huge images: downscale to safe default; EXIF orientations handled

K7. Table
- Rapid add/remove: transformer refresh on next frame; editor overlay realigns to new cell rect

K8. Connectors
- Snapping jitter: threshold hysteresis to prevent flicker; endpoints update smoothly on node move

APPENDIX L — Global Contracts & Constants (User-Facing Summary)
- Layers: overlay > preview-fast > main > background; what appears where
- Naming: group, .hit-area, .text, .stroke, .edge, .port; transformer attaches to group
- World↔DOM: overlays align to element world rect; re-align on zoom/pan/scroll/resize
- Event routing: overlay captures; typing prevents global shortcuts; stage ignores events during edit
- Text constants: live padding=10, minWidth=max(12, ceil(fontSize)), shrink threshold=0.5; commit width=ceil(w)+8, height=ceil(h*1.2), inset (4,2)
- Connector constants: snap=20px; hysteresis lock=±8px; port priority > center > midpoint
- Drawing: sampling 3–5px; smoothing (Catmull-Rom/SMA N=3) [implementation]; max points 5000
- Table: cell min sizes (60×30); transformer refresh next frame after structure ops
- Image: max dim 4096; EXIF 1–8; aspect preserved
- Viewport: zoom step 0.1, min 0.25, max 4.0; pan precedence rules

APPENDIX M — Parity Quick Reference (Pre‑Switch vs Modular)
- Selection/Transformer: same blue frame and anchors; resize commits on release; keyboard nudge preserved
- Text (box/sticky/circle): same editor overlay, live auto-hug, commit fit; double‑click to edit
- Sticky: container behavior maintained; children move with parent; clipping when enabled
- Drawing: previews on fast layer; same stroke look and commit rules
- Eraser: deletes same targets; one history entry per erase
- Table: same cell editing, structural operations, and frame refresh timing
- Image: same initial sizing and aspect lock; paste/drop/upload paths unify
- Connectors: same snap distance and colors; edges follow nodes; selection affects endpoints
- Viewport: same zoom/pan shortcuts; stage drag disabled during edits
- Zoom: Ctrl/Cmd +/−/0 or mousewheel shortcuts; focal point is pointer location; min/max clamped
- Pan: Pan tool or space-drag (if supported) moves viewport; stage drag disabled during element drag/edit
- USER: Click empty stage — selection cleared; transformer hidden
- USER: Drag text group — on dragend store updates x/y; transformer follows
- USER: Double-click again — F1b flow repeats
- USER: Click Sticky tool → Click canvas
- STORE: addElement(sticky with isContainer=true, clipChildren=true); addToHistory('addElement'); setSelectedTool('select')
- RENDERER: syncElements; auto-open editor overlay
- USER: Switch to Pen → Draw inside sticky
- RENDERER (Pen): preview line (pooled) on preview-fast-layer; on up → commit element {type:'pen', points}
- STORE: addElementDrawing(stroke); findStickyNoteAtPoint(startPoint)→ addElementToStickyNote(strokeId, stickyId) → addToHistory('addElementToStickyNote')
- RENDERER: syncElements → stroke grouped under sticky in logical sense (parentId)

F3. Table (Add Row)
- USER: Create table (tool click) → Right-click context/add row
- STORE: addTableRow(tableId) → elements Map replaced; schedule window.__REFRESH_TRANSFORMER__(tableId)
- RENDERER: next frame → refresh transformer visual frame → selection remains

F4. Connector (Snapped Edge)
- USER: Select Arrow → mousedown near sticky center → drag towards image center → mouseup near image
- STORE: startEdgeDraft({elementId:sticky, portKind:'CENTER'}) → updateEdgeDraftPointer(world) → updateEdgeDraftSnap(image)
- RENDERER: overlay dashed preview (gray→green on snap)
- STORE: commitEdgeDraftTo({elementId:image, portKind:'CENTER'}) → addEdge(EdgeElement)
- STORE: computeAndCommitDirtyEdges() via RAF → updateEdgeGeometry points → edges Map replacement
- RENDERER: syncElements; select new edge

F5. Save to Disk (optional)
- USER: Trigger save (UI TBD)
- FRONTEND: invoke('save_canvas_data', {data: JSON.stringify(store state), filename})
- TAURI: ensure_encryption_key → AES-256-GCM encrypt → write file under app_data_dir/canvas


APPENDIX G — STATE CHARTS (HIGH-LEVEL)

G1. Text Element
- States: idle → editing → (commit|cancel)
- Transitions: double-click → editing; Enter(no Shift)/blur → commit; Esc → cancel; on commit → idle + transformer attached

G2. Sticky Container
- States: empty → hasChildren → movingParent (propagate delta) → settled
- Transitions: child added via tool/insert; move sticky triggers child movement and edge reflow; resize constraint enforcement on child drag

G3. Drawing Stroke
- States: previewing → committed → selectable → erased
- Transitions: pointerdown → previewing; pointerup → committed; select/delete → erased; eraser ops can transition directly to erased


APPENDIX H — ACCESSIBILITY-ONLY FLOWS & FOCUS ORDER

H1. Toolbar-only navigation (no mouse)
- Tab to toolbar → ArrowRight/Left to move across clusters (Basic → Content → Shapes/Draw → Connectors → Actions → Zoom → Group)
- Enter/Space activates selected tool or action; Image opens file dialog; sticky color popover appears when sticky is active (Tab moves into it)
- Undo/Redo/Zoom/Delete accessible via buttons and shortcuts

H2. Editing text without mouse
- Select element with Tab focus ring off-canvas (use keyboard shortcuts):
  - Press N to create sticky, then start typing (auto-edit)
  - For existing text: ensure selection, press Enter to open overlay (double-click alternative is keyboard action via renderer command; add menu accelerator if needed)
- Esc cancels, Enter commits; arrow keys within overlay move caret; overlay prevents propagation to canvas

H3. Focus order consistency
- Toolbar → popovers (sticky colors, shapes, connectors) → editor overlay (when present) → back to toolbar/canvas
- Screen reader announcements: tool selected announced via aria-live; editor overlay relies on HTML semantics


APPENDIX I — ERROR RECOVERY & MISALIGNMENT HANDLING

I1. Editor overlay misalignment
- Symptom: caret visually off due to font load or zoom race
- Mitigation: document.fonts.ready logged; overlay recomputes worldRectToDOM on input; if severe, re-open overlay via double-click (renderer restarts positioning)

I2. Table transformer stale frame
- Symptom: handles not matching new grid size after add/remove row/col
- Fix: __REFRESH_TRANSFORMER__(tableId) next frame; ensure adapter preserves this timing; verify in QA checklist

I3. Edge reflow delays under heavy moves
- Symptom: edges lag one frame
- Expected: RAF-batched; if multiple frames lag, ensure computeAndCommitDirtyEdges is invoked and not starved; verify immutable Map replacement to trigger subscribers

I4. Persistence failures
- Decrypt failed / key missing: Tauri returns Err; frontend should surface a toast/modal; user can re-generate key via ensure_encryption_key

I5. Sticky child overflow
- Symptom: child drags outside bounds with clipChildren=true
- Fix: constrainElementToStickyNote invoked on updates; verify padding and width/height calculations

APPENDIX O — Modular Parity Validation (User-Facing Checklist)
- Text: overlay aligns to the text box; auto-hugs while typing; commit re‑measures and the frame hugs text; transformer reattaches.
- Circle text: editor square is centered; typing doesn’t distort the circle; commit keeps visual centered and selection behaves the same.
- Table: adding/removing rows/cols updates the selection frame on the next frame; cell editor stays aligned when zooming/panning.
- Connectors: snap points and colors feel identical; green when snapped; moving connected elements updates lines immediately.
- Sticky: moving a note moves its strokes/images; content remains clipped when clipping is on.
- Images: paste/drag/upload behave exactly as before; Shift‑drag locks aspect ratio.
- Performance: drawing previews are smooth; no lag on selection moves or text edits.