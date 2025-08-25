**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Canvas Development Roadmap

This document provides a comprehensive overview of the Canvas feature, including its current implementation details and future development plans.

## Design Assets

- **Mockup:** [canvas mockup.png](../../design/mockups/canvas%20mockup.png)
- **Spec:** [canvas.html](../../design/specs/canvas.html)

## Current Implementation

The canvas is implemented using a direct imperative Konva.js API with a modular Zustand store. Some legacy react-konva components exist for archived/tests but are not part of the runtime path.

### Frontend Architecture

- Rendering Engine: Imperative Konva.js via `CanvasRenderer` and `ElementRegistry`.
- State Management: Modular unified store (`stores/unifiedCanvasStore.ts`) with element, selection, viewport, drawing, history, section, table, sticky note, UI, eraser, and event modules.
- **Core Files:**
    - `components/CanvasStage.tsx`: Initializes Konva `Stage` and layers imperatively, draws background, handles zoom.
    - `core/CanvasRenderer.ts`: Subscribes to store and syncs elements to Konva nodes.
    - `core/ElementRegistry.ts`: Creates/updates/destroys Konva nodes for elements.
    - `core/UnifiedEventHandler.ts`: Centralized event delegation and tool activation.
- Tools System: Tools are pure TypeScript classes (e.g., `tools/TextTool.ts`, `tools/ShapeTools.ts`, `tools/DrawingTools.ts`, `tools/ConnectorTool.ts`) managed by `core/UnifiedEventHandler.ts`.
- **Performance:** Batch draws, minimal subscriptions, and removal of React reconciliation for canvas operations.

### Backend Architecture

- Persistence: No active backend persistence; the canvas.rs command module currently contains no implemented commands.
- **No Real-time:** There is currently no real-time backend support for the canvas.

### Implemented Features

Core Tools:
- Selection & Pan tools
- Text tool
- Sticky Notes
- Drawing tools: Pen, Marker, Highlighter, Eraser
- Shape tools: Rectangle, Circle, Triangle
- Connector tool (basic line)
- Image element supported via ElementRegistry
- Table/Section element types exist; Table tool UX pending; Section tool currently disabled

**Core Functionality:**
- 🔄 Selection and multi-selection with Shift+click (in progress with imperative transformer)
- 🔄 Transformation (move, resize, rotate) of elements (pending transformer controller)
- ✅ Undo/redo functionality with history management (via modular history module)
- ❌ Legacy react-konva layer system removed; background rendered imperatively
- ✅ Viewport controls (wheel zoom; pan disabled temporarily)
- 🔄 Copy/paste, group/ungroup, grid toggle, snap to grid (to be reintroduced post-migration)

**Performance Optimizations:**
- ✅ Viewport culling for rendering only visible elements
- ✅ React.memo on heavy components
- ✅ Granular selectors to minimize re-renders
- ✅ Modularized store architecture for better performance

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Bugfix:** Fix tool consistency issues that appear under intensive use.
- [ ] **Bugfix:** Address the occasional need for re-selection of transform handles.
- [ ] **Bugfix:** Investigate and fix inconsistent element movement.

### MVP Must-Haves

- [x] **Core Tools:** Pen, text, shape creation (rectangles/circles/triangles), sticky notes. *(Completed)*
- [x] **Connectors:** Multiple connector styles (arrow, elbow, straight). *(Completed)*
- [x] **Undo/Redo:** Standard undo/redo functionality with history management. *(Completed)*
- [x] **Basic Persistence:** Save canvas state to JSON file. *(Completed)*

### Post-MVP Enhancements

- [ ] **Layer Visibility:** A simple toggle to show/hide layers.
- [ ] **Export:** Export the canvas as a PNG or PDF file.
- [ ] **Real-time Collaboration:** Deferring all team, sharing, and real-time features.
- [ ] **Template & Shape Library:** A library of pre-made shapes and templates.
- [ ] **Auto-layout & Smart Routing:** Advanced connector routing and diagram formatting.

### Future Vision & "Wow" Delighters

- [ ] **Intelligent Guides:** Smart grouping, alignment, and snap-to-grid/proximity guides.
- [ ] **Version History:** A visual timeline/slider to track canvas changes.
- [ ] **Personal Macros:** Record and replay drawing sequences.
- [ ] **AI Assistance:** Convert text prompts into initial diagram stencils.

### UX/UI Improvements

- [ ] **Toolbar Redesign:** Refine the visual design of the toolbar and tool icons for better clarity and aesthetics.
- [ ] **Keyboard Shortcuts:** Implement a comprehensive set of keyboard shortcuts for all major tools and actions to improve power-user workflow.
- [ ] **Alignment Guides:** Improve the "snap-to-grid" and smart alignment guides for easier element positioning.

### Technical Debt & Refactoring

- [ ] **Refactor `UnifiedEventHandler`:** Review and refactor the central event handler for better clarity, performance, and maintainability.
- [ ] **Increase Test Coverage:** Add more tests for complex user interactions like drag-and-drop and multi-select to improve stability.
- [ ] **Type Safety:** Refactor the `UILayer.tsx` to use enhanced, properly defined types instead of temporary type assertions.
- [ ] **Documentation:** Create detailed documentation for the canvas store architecture, data flow, and event handling logic.
- [ ] **Backend Persistence:** Move from a single JSON file to a proper database solution for storing canvas data, especially for multi-canvas and multi-user support. 

### Phase 3 Hardening Tests

- **Cold-boot persistence validation:** save state, reload app, assert full store re-hydration (elements, viewport, history, auth)
- **Race-condition tests:** run drawing + auto-save concurrently and ensure deterministic state & no history corruption
- **Accessibility audit:** keyboard navigation (Tab order) and `axe-core` scan – zero critical violations
- **Cross-feature workflow:** create canvas → embed in note → attach to project; verify links stay intact after reload 