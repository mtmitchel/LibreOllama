
# Roadmap: FigJam Canvas Refactor — Updated 2025-08-24

## 1. Mission & Architecture Alignment

**Objective:** Refactor the entire canvas feature to align with the new specification, prioritizing performance, maintainability, and a clean, imperative Konva.js architecture.

**Key Architectural Shifts:**
- **Remove `react-konva`:** Eliminate the `react-konva` wrapper and interact with Konva.js directly.
- **Imperative Rendering:** All canvas objects will be created and managed imperatively, outside of the React render cycle.
- **Centralized Event Handling:** A single `UnifiedEventHandler` will manage all canvas events.
- **Declarative Cursor Management:** A new `CursorProvider` will manage cursor state declaratively.
- **New Directory Structure:** The `src/features/canvas` directory will be completely restructured.

## 2. Pre-flight Checks & Setup

- **[x] Audit Existing Code:** Systematically review all components in `src/features/canvas` to identify logic that needs to be migrated or discarded.
- **[x] Create New Directory Structure:** Scaffold the new directory structure as per the specification.
- [x] Update Dependencies: Removed `react-konva` from `package.json`. Note: Some legacy React-Konva components remain in the repo for tests/backup, but are not used in runtime.

## 3. Core Systems Implementation

- **[x] Type Definitions:** Create comprehensive TypeScript definitions for all canvas elements, tools, and state.
- **[x] Zustand Store Refactor:** Refactor to the unified modular store `stores/unifiedCanvasStore.ts`.
- **[x] `ElementRegistry.ts`:** Implement the new element registry for managing canvas objects.
- **[x] `CanvasRenderer.ts`:** Create the imperative renderer for all Konva shapes.
- **[x] `UnifiedEventHandler.ts`:** Implement the centralized event handler.

## 4. Component & Tool Refactoring

- **[x] `CanvasStage.tsx`:** Refactor to initialize Konva imperatively in a `useEffect` hook.
- **[x] `CanvasContainer.tsx`:** Update to use the new `CanvasStage` and `ModernKonvaToolbar`.
- **[x] Tool Refactoring:** Core tools implemented as classes and registered in UnifiedEventHandler: select, pan, text, rectangle, circle, triangle, sticky note, connector, pen, marker, highlighter, eraser. Table/section UX pending.

## 5. Final Integration & Polish

- **[x] Toolbar Integration:** Tools wired via unified store `selectedTool`; cursor updates applied from active tool.
- **[~] Rotation Workflow:** Centralized TransformerController implemented (multi-select, batching, basic guides). Improve rotation cursor hot-zones and stability.
- **[x] Documentation Update:** Archive old documentation and align docs with the imperative Konva approach.

## 6. Testing & Validation

- **[ ] Unit Tests:** Add for `ElementRegistry`, `CanvasRenderer`, `TransformerController`, tools.
- **[ ] E2E Tests:** Selection/multi-select, transform (resize/rotate), pan/zoom, undo/redo.
- **[ ] Performance Testing:** Integrate KonvaDirectRenderer for drawing tools and validate 60fps.

This roadmap tracks the refactor. See docs/CANVAS_TOOL_REFACTOR_STATUS.md for code-accurate progress and deviations (e.g., UnifiedEventHandler instead of ToolRegistry).
