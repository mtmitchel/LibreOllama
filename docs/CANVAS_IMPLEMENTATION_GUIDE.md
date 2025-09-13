# LibreOllama Canvas Implementation Guide - Consolidated Edition

## Overview

This document serves as the single source of truth for the LibreOllama canvas system, consolidating all architectural, implementation, and status details. It reflects the current production state, which uses a monolithic renderer (`CanvasRendererV2`) while building toward a modular architecture.

## 1) Goals & Non-Negotiables

*   **Direct Konva, No React-Konva**: A single `CanvasRendererV2` service exclusively owns and manages the Konva Stage and its layers. React components are used for tool activation and UI, but not for rendering Konva nodes.
*   **Four Fixed Layers (Order & Roles)**: The canvas operates with four distinct Konva layers, maintained in a strict z-order (top to bottom):
    1.  `overlay-layer`: For selection chrome, transformer handles, connector handles, cursor ghosts, and other interactive UI overlays. By default, it has `listening: true` to enable interaction with handles and active elements.
    2.  `preview-fast-layer`: Used for transient drawing tool previews (e.g., pen strokes while drawing) and potentially for high-performance image rendering. It is cleared on `pointerup` and should never contain persistent selection or transformer nodes.
    3.  `main-layer`: Contains all interactive and persistent canvas elements, including shapes, text, sticky notes, and connectors. It is `listening: true` to enable element interaction.
    4.  `background-layer`: For static grid, background colors, and decorative elements. It is `listening: false` to prevent interference with interactive elements.
*   **Store-First Architecture**: The Zustand store (`unifiedCanvasStore`) holds all serializable canvas state (element descriptors, selection, viewport, history, etc.). It *never* stores Konva node instances or DOM references. The `CanvasRendererV2` observes changes in the store and efficiently rebuilds/updates the Konva tree by computing and applying diffs (create, update, remove). Immutable updates are enforced for all state changes.
*   **Production Stability**: The current monolithic implementation provides stable, feature-complete canvas functionality.
*   **Modular Architecture (In Development)**: The system includes experimental modular components through `RendererCore` and specialized modules, designed for future migration from the monolithic renderer.
*   **Persistence**: Secure saving and loading of canvas data via Tauri commands, including AES-256-GCM encryption, secure key storage, and schema versioning.

## 2) Current Architecture

### Primary Implementation: Monolithic Renderer

**`CanvasRendererV2`** (`src/features/canvas/services/CanvasRendererV2.ts`) - **4,502 lines**
*   **Primary production renderer** handling all canvas functionality
*   Manages element creation, update, and deletion for all element types
*   Handles text editing, selection, transform operations, and connector rendering
*   Integrates with Zustand store for state synchronization
*   Performance-optimized with RAF batching and spatial indexing

### Experimental: Modular Architecture (Feature-Flagged)

**Status**: Built but not yet primary implementation

*   **`RendererCore`** (`src/features/canvas/renderer/modular/RendererCore.ts`): Orchestrates module registration and coordination
*   **Available Modules**: Specialized modules for specific functionality:
    *   `SelectionModule`: Transformer management, selection sync (only module currently active in shadow mode)
    *   `TextModule`: Text editor overlay, live auto-resize, commit measurement
    *   `ViewportModule`: Zoom/pan controls, matrix conversions
    *   `DrawingModule`: Pen/marker/highlighter previews and smoothing
    *   `EraserModule`: Hit-testing and deletion rules
    *   `ConnectorModule`: Snapping, routing, reflow, visual indicators
*   **Adapters**:
    *   `StoreAdapterUnified`: Bridges between modular renderer and Zustand store
    *   `KonvaAdapterStage`: Encapsulates Konva-specific node creation and layer access
    *   `OverlayAdapter`: Reserved for DOM overlay mount/teardown lifecycle

**Activation**: Requires `localStorage.setItem('USE_NEW_CANVAS', 'true')` or `VITE_USE_NEW_CANVAS=true`
**Default**: `false` (uses monolithic `CanvasRendererV2`)

### Module Interface Contract

```typescript
export interface RendererModule {
  /** One-time initialization with adapters and stable refs */
  init(ctx: ModuleContext): void;
  /** Deterministic sync on each state change or RAF-tick boundary */
  sync(snapshot: CanvasSnapshot): void;
  /** Optional pointer/keyboard handling when module is active */
  onEvent?(evt: CanvasEvent, snapshot: CanvasSnapshot): boolean;
  /** Cleanup listeners and pooled resources */
  destroy(): void;
}

export interface CanvasSnapshot {
  elements: Map<ElementId, CanvasElement>;
  selection: Set<ElementId>;
  viewport: ViewportState;
  history: HistoryState;
  edges?: Map<string, any>;
}
```

## 3) CanvasRendererV2 Lifecycle (Current Production Implementation)

### Initialization
*   Create Konva Stage sized to container with ResizeObserver for responsive updates
*   Create four layers in correct z-order with appropriate listening states
*   Initialize `CanvasRendererV2` and register with global window references (`__CANVAS_RENDERER_V2__`)
*   Optionally set up experimental modular renderer (behind feature flag) with `RendererCore` and `SelectionModule`
*   Configure viewport transform system

### State Synchronization
*   **Primary Path**: `CanvasRendererV2.syncElements()` handles all element rendering
*   Compute add/update/remove diffs from store changes
*   Enforce exactly one Konva node per element ID
*   Instantiate/update nodes on correct layers using monolithic renderer methods
*   Apply viewport transform via `stage.scale()` and `stage.position()`
*   Update spatial index for viewport culling

### Performance Batching
*   Single `requestAnimationFrame` per render cycle
*   One `batchDraw()` call per dirty layer per frame
*   Node pooling for heavy operations (drawing tools)
*   Spatial indexing for viewport culling with `useSpatialIndex()` hook

## 4) State Management & Types

### Store Architecture
The `unifiedCanvasStore` is modularized across focused modules:
*   `elementModule`: Element CRUD operations, spatial management
*   `selectionModule`: Selection state, multi-select operations  
*   `viewportModule`: Pan/zoom state, viewport dimensions
*   `drawingModule`: Drawing tools state, eraser functionality
*   `historyModule`: Undo/redo operations with bounded history
*   `uiModule`: Tool selection, overlay states, loading states
*   `edgeModule`: Connector/edge management, draft state

### Element Types
*   **Discriminated unions** with branded IDs for type safety
*   **Core variants**: `text`, `sticky-note`, `circle`, `triangle`, `table`, `image`, `edge`, `connector`
*   **Serializable descriptors**: `{id, type, x, y, rotation, width, height, style, text, ...}`
*   **No Konva/DOM references** stored in state

## 5) Event Model & Routing

### Current Implementation
*   **Stage-Level Event Handling**: Event listeners are attached at the Konva Stage level in `NonReactCanvasStage.tsx`
*   **Tool-Specific Routing**: Different tools (text, select, drawing, etc.) register their own event handlers based on the active tool
*   **Event Propagation Control**: 
    *   DOM overlay elements (like text editor `<textarea>`) use `e.stopPropagation()` with `capture: true` to prevent events from reaching the Konva stage
    *   Selection tool ignores events when text editor overlays are active
*   **Priority System**: Element interactions take precedence over background/viewport operations

### Event Flow
1. **Overlay Capture**: DOM overlays (text editors) capture and stop propagation of pointer/keyboard events
2. **Tool-Specific Handlers**: Active tool's event handlers process remaining events
3. **Selection/Background**: Default selection and background click handling
4. **Stage Default**: Konva's built-in event system handles remaining interactions

## 6) Critical Implementation Details

### Text Editing System
*   **Creation**: Click with text tool creates element and immediately switches to select tool
*   **Editor Overlay**: Fixed-position `<textarea>` appended to `document.body`
*   **Live Auto-Resize**: Real-time width adjustment based on content measurement
*   **World↔DOM Conversion**: Accurate positioning using `worldRectToDOM()` helper
*   **Commit Process**: Measurement using `Konva.Text.measureSize()`, frame fitting, transformer reattachment

### Connector System  
*   **Snap Tuning**: Threshold of 20px with ±8px hysteresis to prevent jitter
*   **Visual Feedback**: Green lines when snapped, gray when floating
*   **RAF Reflow**: Batch edge updates in `requestAnimationFrame` for performance

### Transform & Selection
*   **Single Global Transformer**: One `Konva.Transformer` instance in overlay layer
*   **Group Attachment**: Transformer always attaches to element `Konva.Group`, never child nodes
*   **Scale Conversion**: On `transformend`, scale values are converted to width/height and scale reset to 1
*   **Border Styling**: Consistent `#3B82F6` border with 8px anchor size

## 7) Element-Specific Implementation

### Text Elements
*   **Descriptor**: `{id, type:'text', text, fontSize, fontFamily, fill, x, y, width?, height?}`
*   **Renderer**: `Konva.Text` on main layer within a `Konva.Group`
*   **Editing**: Double-click spawns `<textarea>` overlay with live auto-resize
*   **Live Resize**: `padding ≈ 10px`, `minWidth = max(12, ceil(fontSize))`, sensitivity of 0.5 world units
*   **Commit**: `width = ceil(measured.width) + 8`, `height = ceil(measured.height * 1.2)`, inset `(4,2)`
*   **Transformer**: All eight anchors + mids, border `#3B82F6`

### Sticky Notes
*   **Descriptor**: `{id, type:'sticky-note', x, y, width, height, text, style, ...}`
*   **Renderer**: `Konva.Group` on main layer with rect background + text child
*   **Container Semantics**: Child elements translate when parent moves
*   **Auto-Resize**: Text measurement triggers height expansion
*   **Clipping**: Optional `clipChildren` with 10px padding enforcement

### Shapes
*   **Circle**: `{id, type:'circle', x, y, radius, width, height, fill, stroke, ...}`
    *   Uses inscribed square for text layout
    *   Aspect ratio maintained during resize
    *   Text overlay uses center-anchored inscribed square
*   **Triangle**: `{id, type:'triangle', x, y, width, height, fill, stroke, ...}`
*   **Rectangle**: Standard rect with all transform anchors

### Tables
*   **Descriptor**: `{id, type:'table', x, y, width, height, rows, cols, cellWidth, cellHeight, ...}`
*   **Cell Editor**: Overlay aligns to exact cell content rect
*   **Structural Operations**: Add/remove row/col triggers next-frame transformer refresh via `__REFRESH_TRANSFORMER__`
*   **Cell Dimensions**: Minimum cell size 60x30px

### Images
*   **Upload Handling**: Unified creation path for drop/paste/upload
*   **EXIF Processing**: Orientation handling for imported images
*   **Size Constraints**: Max dimension clamp at 4096px
*   **Aspect Lock**: Shift key locks aspect ratio during resize

### Connectors/Edges
*   **Descriptor**: `{id, type:'edge', points:number[], stroke, strokeWidth, markerEnd, ...}`
*   **Rendering**: `Konva.Arrow` or `Konva.Line` based on `markerEnd` property
*   **Snapping**: 20px threshold, ±8px hysteresis, priority: port > center > edge-midpoint
*   **Reflow**: Connected edges update endpoints when nodes move/resize

## 8) Persistence & Integration

### Tauri Commands
*   `save_canvas_data`: AES-256-GCM encrypted saving to app data directory
*   `load_canvas_data`: Decrypt and load canvas data with version checking
*   `list_canvas_files`: Enumerate saved canvas files
*   `delete_canvas_file`: Remove saved canvas files
*   `ensure_encryption_key`: Generate and store encryption keys via system keyring

### Schema & Versioning
*   **Current Version**: "1.0.0" with timestamp metadata
*   **Encryption**: AES-256-GCM with secure key storage
*   **Forward Compatibility**: Schema versioning for future migrations

### Export Options
*   Direct save to encrypted format via Tauri
*   `stage.toDataURL()` for image export (potential)
*   Cross-feature metadata linking (e.g., `sourceTaskId`)

## 9) Performance & Optimization

### Batching & RAF
*   Single `requestAnimationFrame` loop managed by `performanceLogger`
*   Layer-specific `batchDraw()` calls for dirty regions only
*   16ms debounced resize handling for viewport updates

### Node Pooling
*   Pooled nodes for drawing tools to reduce GC pressure
*   Helper functions in `renderer/compat/snippets.ts` for reusable calculations
*   Memory budgets: FPS ≥55 under 1k elements

### Spatial Optimization
*   Viewport culling via spatial indexing
*   `useSpatialIndex()` hook for efficient element queries
*   QuadTree or similar data structure for spatial queries

## 10) Accessibility & Keyboard Support

### Text Editor Overlays
*   `aria-label="Canvas text editor"` for screen readers
*   Focus management with escape/enter semantics
*   Global shortcut prevention during active editing

### Selection & Transform
*   Keyboard navigation for transformer anchors (if supported)
*   Selection count announcements
*   Tab order management for canvas interactions

### IME Support
*   Composition event handling for international text input
*   Commit deferral during active composition

## 11) Current Status & Implementation Reality

### ✅ Production Ready (CanvasRendererV2)
*   **Monolithic renderer** handling all canvas functionality (4,502 lines)
*   Four-layer system with correct naming and z-order
*   Store-first architecture with immutable updates
*   Undo/redo fully wired to toolbar with keyboard shortcuts
*   Text editing with live auto-resize and proper World↔DOM conversion
*   Connector snap tuning (20px threshold, ±8px hysteresis)
*   Persistence via Tauri with AES-256-GCM encryption
*   Transform system with scale-to-size conversion
*   Drawing tool previews in `preview-fast-layer`
*   All element types supported: text, sticky notes, shapes, tables, connectors, images

### 🔬 Experimental (Modular Architecture)
*   **Modular infrastructure built** but not yet primary implementation
*   `RendererCore` and module interfaces implemented
*   Only `SelectionModule` currently active in shadow mode behind feature flag
*   Feature flag defaults to `false` (uses monolithic renderer)
*   Full modular migration incomplete

### ❌ Not Yet Implemented
*   **Marquee Selection**: Listed as completed in docs but not found in codebase
*   **Complete Modular Migration**: Still relies on monolithic `CanvasRendererV2`
*   **Centralized Event Routing**: Tools attach events directly to stage, not through `RendererCore`

### 📋 Known Technical Debt
*   Migration from monolithic to modular renderer incomplete
*   Documentation claims don't match current implementation
*   `Konva.pixelRatio = 1` setting not explicitly found in codebase
*   Feature flag system present but defaults to legacy implementation

## 12) Development & Testing

### Test Coverage
*   Unit tests for utility functions (`snippets.test.ts`)
*   Integration tests for undo/redo atomicity
*   Performance regression tests
*   State persistence tests

### Debug Tools
*   Dev HUD available via `localStorage.setItem('CANVAS_DEV_HUD','1')`
*   Parity probes for text commit metrics, selection bbox, connector endpoints
*   Performance monitoring via `performanceLogger`

### Feature Flags
*   `readNewCanvasFlag()` for modular renderer toggle
*   Per-tool flags planned but not fully implemented
*   Hot-switchable renderer mode capability

## 13) Migration Status & Next Steps

### 🏗️ Complete Modular Migration (Major Project)
The canvas system currently operates with:
- **Production**: Monolithic `CanvasRendererV2` (4,502 lines) - stable and feature-complete
- **Experimental**: Modular architecture infrastructure built but not fully integrated
- **Goal**: Transition from monolithic to modular renderer as primary implementation

### Migration Completion Requirements
1.  **Full Module Implementation**: Complete all modules to handle their respective functionality
2.  **Replace CanvasRendererV2 Usage**: Migrate all element rendering from monolithic to modular approach
3.  **Event System Migration**: Implement centralized event routing through `RendererCore`
4.  **Feature Parity Testing**: Ensure modular system handles all element types and interactions
5.  **Performance Validation**: Confirm modular system maintains or improves performance
6.  **Flip Default Flag**: Change feature flag default to use modular renderer

### Immediate Priorities (Current Architecture)

#### High Priority
1.  **Implement Marquee Selection**: Add rubber-band selection rectangle functionality to `CanvasRendererV2`
2.  **Set `Konva.pixelRatio = 1`**: Add explicit setting as documented in implementation guides
3.  **Fix Documentation Accuracy**: Ensure all docs reflect actual current state

#### Medium Priority
1.  **Complete Modular Migration Planning**: Create detailed plan for transitioning away from `CanvasRendererV2`
2.  **Module Testing**: Add comprehensive tests for individual modules
3.  **Performance Benchmarking**: Compare monolithic vs modular renderer performance

#### Low Priority  
1.  **Advanced Features**: Eraser tool improvements, advanced table operations
2.  **Visual Polish**: Animation improvements, enhanced visual feedback

## 14) Reference Implementations

### World ↔ DOM Conversion (Overlay Positioning)
```typescript
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

### Text Live Auto-Resize (During Typing)
```typescript
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

### Text Commit Measurement (Exact)
```typescript
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

### Transform Scale → Size Conversion
```typescript
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

### Connector Snap with Hysteresis
```typescript
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

### Table Transformer Refresh (Next Frame)
```typescript
export function refreshTransformerNextFrame(tableId: string) {
  setTimeout(() => {
    try { (window as any).__REFRESH_TRANSFORMER__?.(tableId); } catch {}
  }, 16);
}
```

### Pooled Preview Lines (Drawing Performance)
```typescript
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

### History Guards (Skip vs. Commit)
```typescript
// Interim updates during live editing/dragging
store.updateElement(id, updates, { skipHistory: true });

// Final commits only
store.addToHistory('transformEnd');
```

## Conclusion

The LibreOllama canvas system operates on a **stable monolithic architecture** (`CanvasRendererV2`) that provides complete functionality with excellent performance and security. While modular architecture infrastructure has been built, the migration to a fully modular system remains incomplete.

**Current State**: Production-ready with monolithic renderer (4,502 lines)  
**Future Goal**: Complete migration to modular architecture for better maintainability and testability

This guide serves as the definitive source of truth for current canvas implementation, accurately reflecting both the production monolithic system and the experimental modular architecture being developed for future transition.
