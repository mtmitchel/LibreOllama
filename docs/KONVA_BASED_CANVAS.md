Blueprint for Lightweight Konva‑based Canvas in LibreOllama
Purpose

This document synthesises the official Konva, React, Rust/Tauri documentation and the LibreOllama architecture guide to outline a production‑ready canvas system built with direct Konva API calls (no react‑konva). The goal is to match the existing patterns (multi‑layer rendering, state management with Zustand, object pooling, viewport culling, and type safety) while removing the dependency on the React wrapper. The plan below is organised so a coding agent can follow it step by step.

Sources consulted

Konva documentation describing the stage/layer concept, custom shapes, events, drag/drop support and performance tips
konvajs.org
konvajs.org
.

Guidance on using the Transformer for resizing/rotating and multi‑selection
konvajs.org
.

Warnings against serialising canvas state via toJSON() and the recommendation to manage your own state
konvajs.org
.

React hooks (useEffect, useRef) for integrating external libraries
react.dev
react.dev
.

Tauri architecture and the command/event system for Rust ↔ frontend communication
v2.tauri.app
v2.tauri.app
.

The LibreOllama architecture document (hereafter ARCHITECTURE) describing the existing canvas system patterns (multi‑layer pipeline, unified state store, object pooling, spatial index and type safety).

1. High‑level design goals

Replace react‑konva with direct Konva usage. The React wrapper previously rendered each Konva node as a React component. Our plan instantiates a Konva.Stage directly in the DOM and manually manages layers and nodes, reducing overhead and enabling more direct optimisation.

Preserve existing architectural patterns: multi‑layer rendering (background, main, fast, overlay), unified canvas store in Zustand, object pooling, viewport culling, discriminated unions for element types and Branded IDs. We will not break existing modules; instead, we implement a CanvasRenderer service class to bridge the Konva API with the store.

Guarantee performance: incorporate Konva’s performance recommendations—use separate drag layer, enable caching, minimise listening, control pixel ratio, reuse nodes via pooling, and cull offscreen items
konvajs.org
konvajs.org
. Avoid heavy React re‑renders by using subscribeWithSelector and storing stage/layer references in useRef
react.dev
.

Integrate with Tauri: persist canvas state and images via Rust commands or the filesystem plugin, emit events back to Rust when necessary, and handle long‑running operations (e.g., file export) outside the UI thread
v2.tauri.app
.

Maintain type safety: use TypeScript branded types for IDs and discriminated unions for element types (e.g., RectElement, TextElement, ImageElement). Never store Konva nodes in the Zustand store; instead store lightweight serialisable data (positions, sizes, meta) and reconstruct nodes during rendering
konvajs.org
.

2. Setup and prerequisites

Install Konva: add konva to your project dependencies.

Folder structure: place the renderer under src/features/canvas/services/CanvasRenderer.ts. The renderer will encapsulate all Konva operations.

Zustand store: extend the existing unifiedCanvasStore modules to expose the current viewport transform (zoom/pan), element data, selection state and actions. Do not store Konva nodes here—only plain objects representing each element.

React component: create CanvasRoot.tsx under src/features/canvas/components. This component holds a div container for the Konva stage and interacts with the CanvasRenderer via a ref. Because we bypass react‑konva, we must call new Konva.Stage(...) inside a useEffect and clean up in the return callback
react.dev
.

// simplified CanvasRoot component
function CanvasRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const store = useCanvasStore(); // selector for necessary state

  // initialise stage and renderer on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new CanvasRenderer({ container: containerRef.current });
    rendererRef.current = renderer;
    renderer.init();
    return () => {
      renderer.destroy();
    };
  }, []);
  // watch store updates
  useEffect(() => {
    rendererRef.current?.syncFromState(store);
  }, [store]);
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}


This pattern uses useRef to persist the renderer instance across renders and useEffect to manage lifecycle. It mirrors the recommended way of connecting React with external libraries
react.dev
.

3. CanvasRenderer service
3.1. Stage and layers

When CanvasRenderer.init() runs, it should:

Set global Konva configurations: Konva.pixelRatio = 1 to avoid doubling resolution on high DPI screens and disable perfect drawing by default for shapes when heavy performance is required
konvajs.org
.

Create a Konva.Stage with the provided container and initial dimensions (use the container’s bounding rect). Attach resize observer to adjust stage size on window resize.

Create four layers: backgroundLayer, mainLayer, fastLayer and overlayLayer. Set backgroundLayer.listening(false) because the grid does not need events; this improves hit‑testing performance
konvajs.org
.

Add these layers to the stage in the order: background → main → fast → overlay. The fast layer’s canvas will use fastLayer.getContext().canvas to enable GPU acceleration for images; ensure heavy image operations are cached via node.cache().

Keep references to layers in the renderer instance for later use.

class CanvasRenderer {
  stage: Konva.Stage;
  layers: { background: Konva.Layer; main: Konva.Layer; fast: Konva.Layer; overlay: Konva.Layer };
  pool: KonvaNodePool;
  quadTree: SpatialIndex;
  init() {
    Konva.pixelRatio = 1;
    this.stage = new Konva.Stage({ container: this.options.container, width: this.getWidth(), height: this.getHeight() });
    this.layers = {
      background: new Konva.Layer({ listening: false }),
      main: new Konva.Layer(),
      fast: new Konva.FastLayer(),
      overlay: new Konva.Layer(),
    };
    Object.values(this.layers).forEach(layer => this.stage.add(layer));
    // draw static grid on background layer
    this.drawGrid();
    this.pool = new KonvaNodePool();
    this.quadTree = new SpatialIndex();
  }
  destroy() { this.stage?.destroy(); }
}


The Konva.FastLayer is used for ImageElements; it leverages GPU acceleration and does not support event listeners, which is acceptable for images【ARCHITECTURE】.

3.2. Object pooling (KonvaNodePool)

Drawing tools like Pen/Marker generate many small line segments. Creating/destroying thousands of Konva Line nodes per stroke can cause garbage collection pauses. The existing app uses a KonvaNodePool pattern; replicate it by pre‑allocating a configurable number of nodes for each shape type and reusing them:

class KonvaNodePool {
  private pools: Record<string, Konva.Node[]> = {};
  getNode(type: 'Line' | 'Rect' | 'Circle'): Konva.Node {
    const pool = this.pools[type] ?? (this.pools[type] = []);
    if (pool.length) return pool.pop()!;
    switch (type) {
      case 'Line': return new Konva.Line();
      case 'Rect': return new Konva.Rect();
      case 'Circle': return new Konva.Circle();
    }
  }
  release(node: Konva.Node) {
    // remove from layer and reset attrs before pooling
    node.remove();
    this.pools[node.getClassName()]?.push(node);
  }
}


When drawing, request a node from the pool, set its properties (points, stroke, etc.), add it to the appropriate layer and commit layer.draw() once per batch. After the stroke is committed to the store, release nodes that are no longer needed. For images, maintain a separate texture cache keyed by URL to avoid reloading.

3.3. Spatial index and viewport culling

Add a SpatialIndex implementation (e.g., a QuadTree) to track which element bounding boxes intersect the viewport. During syncFromState(store), query the index to get visible element IDs and render only those shapes. Insert or update bounding boxes in the index whenever an element moves or is resized. This replicates the useSpatialIndex hook mentioned in ARCHITECTURE and ensures high performance.

3.4. Syncing from store

The syncFromState(store) method should:

Compute diffs: compare current in‑memory element map (id → node) with the store’s element list. Determine which elements need to be created, updated or removed.

Create nodes: For each new element, call pool.getNode(type) and configure it based on the element descriptor. Add nodes to the correct layer (fast layer for images; main layer for shapes and text). Call cache() for complex shapes or images to improve redraw speed
konvajs.org
.

Update nodes: For existing nodes, set updated attributes (position, size, rotation). Use node.setAttrs() to batch updates and call batchDraw() on the layer after processing all changes.

Remove nodes: For removed elements, call pool.release(node).

Update spatial index: Insert or update the bounding box of each node. Remove bounding boxes for deleted elements.

Selection and transform: If the store indicates a selected element or multiple selection, attach a singleton Konva.Transformer to the selected nodes. When selection changes, call transformer.nodes([...selectedNodes])
konvajs.org
. Use the overlay layer for the transformer.

Handle viewport transform: When the store’s zoom or pan changes, update stage.scale() and stage.position() accordingly. Because we are not using React to render Konva, we must update these properties manually.

3.5. Event handling and dispatch

Attach event listeners directly to the stage and to nodes. For example:

Pointer events: stage.on('mousedown', handlePointerDown) to start selection or dragging. Determine if the user clicked on empty space or on a node; update the selection state in Zustand accordingly.

Drag and drop: enable draggable on nodes. On dragstart, move the node to the top of its layer or to a dedicated drag layer (use moveTo() to change its parent) to avoid shadowing
konvajs.org
. On dragend, update the element’s position in the store and return the node to its original layer.

Resize/rotate: the Transformer emits transformend events when the user finishes resizing; update the element’s width/height/rotation in the store.

Custom shape drawing: For tools like pen or marker, listen for pointer down/up/move. While drawing, build an array of points and update a preview line node. On completion, commit the new LineElement to the store and release any preview nodes.

Double‑click for editing: For text elements, handle dblclick to convert the text into an HTML textarea overlay for editing. When editing finishes, update the store and remove the textarea.

Communication with the store

Do not mutate the store directly inside event handlers. Instead, call actions exposed by the store, e.g. store.getState().addElement(elementDescriptor) or store.getState().updateElement(id, partialUpdate). Use immer to produce immutable updates. The store should handle history (undo/redo) by capturing a snapshot before and after each atomic action.

Integration with Tauri

Some events must trigger backend work via Tauri:

Save/load canvas: Expose Rust commands (e.g. save_canvas_state and load_canvas_state) using #[tauri::command] in src-tauri/src/lib.rs. These commands serialise or deserialise the element state (JSON) into/from SQLite or files. Use invoke('save_canvas_state', { state }) in the frontend and handle the promise
v2.tauri.app
.

Export to image/PDF: Provide a Tauri command that takes the element state and renders it using a Rust canvas or headless Chromium. Alternatively, use stage.toDataURL() on the frontend (costly for large canvases) and send the base64 to the backend for file writing.

Event system: Use appWindow.emit('canvasUpdated', { ids }) after bulk updates to inform other parts of the application or the backend. Register listeners via listen() in Rust if you need to react to changes
v2.tauri.app
.

3.6. Undo/redo implementation

Maintain a history stack in the store. Each action (add/update/remove/transform) should push a diff or previous state snapshot. Provide store actions undo() and redo() that restore the previous/next snapshot and notify the renderer to sync. Because Konva nodes are recreated on each sync and not stored in the history, memory usage remains low.

3.7. Clean up and memory management

When the React component unmounts, call renderer.destroy() to destroy the stage and all child layers to free canvases and listeners. Release pooled nodes if necessary. Remove any listeners registered via Tauri events by calling the returned unlisten function
v2.tauri.app
.

4. State definition and type safety
4.1. Element descriptors

Define a discriminated union CanvasElement covering all supported element types. Each variant stores only serialisable attributes (id, position, rotation, etc.) and optional metadata (e.g. style). Example:

// Brand helper to create opaque types
type Brand<K, T> = K & { __brand: T };
export type ElementId = Brand<string, 'ElementId'>;

interface BaseElement { id: ElementId; x: number; y: number; rotation: number; };
interface RectElement extends BaseElement { type: 'rect'; width: number; height: number; fill: string; stroke?: string; }
interface CircleElement extends BaseElement { type: 'circle'; radius: number; fill: string; }
interface LineElement extends BaseElement { type: 'line'; points: number[]; stroke: string; strokeWidth: number; }
interface ImageElement extends BaseElement { type: 'image'; src: string; width: number; height: number; }
interface TextElement extends BaseElement { type: 'text'; text: string; fontSize: number; }
export type CanvasElement = RectElement | CircleElement | LineElement | ImageElement | TextElement;


Use branded IDs to prevent mixing up element IDs with other strings as recommended in ARCHITECTURE. Additional properties such as layer index, z‑order, and style can be included as needed.

4.2. Zustand store modules

Split the unifiedCanvasStore into modules like elements, selection, viewport, history, etc. Each module exposes selectors and actions. Use subscribeWithSelector to subscribe to only the relevant slice of state; this ensures that CanvasRoot only rerenders when needed【ARCHITECTURE】. Example actions:

addElement(element: CanvasElement)

updateElement(id: ElementId, partial: Partial<CanvasElement>)

removeElement(id: ElementId)

setSelection(ids: ElementId[])

updateViewport(scale: number, position: { x: number; y: number })

undo(), redo()

Do not include Konva nodes or DOM references in the store; only store serialisable data
konvajs.org
.

5. Performance considerations

To achieve high throughput, follow these guidelines:

Minimise layers: Use only the four layers described. Each additional layer adds two canvases (scene and hit graph) and a draw call. Place UI elements like selection rectangle or transform handles in the overlay layer so they do not interfere with the main drawing
konvajs.org
.

Cache complex shapes: For text or shapes with filters/shadows, call node.cache() to rasterise them once and draw the cached image subsequently
konvajs.org
.

Disable listening on non‑interactive layers: Set layer.listening(false) on background and possibly fast layers
konvajs.org
. This disables event processing and speeds up hit detection.

Enable drag layer: On drag start, move the node to a dedicated layer using node.moveTo(dragLayer) so only that node is redrawn during drag. Return it back on drag end
konvajs.org
.

Viewport culling: Before drawing, query the spatial index for nodes intersecting the viewport and draw only those. Hide offscreen nodes (node.visible(false)) or remove them from layers to reduce draw calls. This is vital for documents with thousands of elements.

Pixel ratio and perfect drawing: Set Konva.pixelRatio = 1 globally and disable shape.perfectDrawEnabled(false) on heavy shapes to reduce calculation overhead
konvajs.org
.

Avoid stage.toJSON() for persistence: Instead, store your own element descriptors and recreate the stage on load. Konva’s built‑in serialisation also serialises event listeners and images, which is fragile
konvajs.org
.

6. Integration with the rest of LibreOllama

Existing modules: Keep the unifiedCanvasStore modules intact but refactor the view layer. Replace CanvasLayerManager and react‑konva components with CanvasRoot and CanvasRenderer while preserving the same selectors and actions. This makes the new implementation drop‑in from the perspective of other features.

Cross‑feature communication: Use Tauri events or the Zustand store to update other features (e.g., tasks, chat) when the canvas changes. For example, attach metadata to elements (like sourceTaskId) and update tasks when the user drags them on the canvas.

Persistence: When the user saves a canvas board, call a Tauri command to persist the element descriptors into SQLite. The backend should include migration code to handle schema changes. Loading boards will involve retrieving stored JSON and feeding it into the store, which then triggers the renderer to synchronise.

Plugin architecture: For advanced tools (e.g., AI‑assisted diagramming), implement a command palette that triggers Tauri commands (e.g., call a model on the Rust side). The result can be inserted into the canvas as new elements via store actions.

7. Implementation timeline

Phase 1 – Prototyping (1–2 days)

Implement CanvasRenderer with stage and layers.

Port existing element descriptors and store modules to the new format.

Render basic shapes (rectangles, circles) from the store.

Phase 2 – Interaction & Tools (2–3 days)

Add selection box, multi‑select, and Transformer support.

Implement dragging, resizing, rotating.

Integrate line drawing and freehand drawing using object pooling.

Phase 3 – Advanced features (3–4 days)

Add text editing overlay and image insertion.

Introduce viewport culling via a QuadTree and integrate the SpatialIndex.

Connect undo/redo and history tracking.

Phase 4 – Persistence & Tauri integration (1–2 days)

Implement Tauri commands for saving/loading/exporting boards.

Integrate the filesystem plugin for file exports.

Write integration tests (Rust and TS) to ensure correctness.

Phase 5 – Optimisation & polish (ongoing)

Profile rendering performance with large boards.

Tune pool sizes and caching strategies.

Add unit tests for CanvasRenderer and SpatialIndex.

8. Conclusion

By following the blueprint above, the LibreOllama project can migrate its canvas system from react‑konva to direct Konva API usage while preserving architectural patterns and performance optimisations. The separation between rendering (handled by CanvasRenderer), state (handled by Zustand modules), and persistence/communication (handled via Tauri commands) ensures modularity and maintainability. Adhering to Konva’s performance recommendations
konvajs.org
 and avoiding fragile serialisation
konvajs.org
 will result in a lightweight, high‑performance canvas that integrates seamlessly with the rest of the application.