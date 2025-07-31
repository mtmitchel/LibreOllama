**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Canvas Development Roadmap

This document provides a comprehensive overview of the Canvas feature, including its current implementation details and future development plans.

## Design Assets

- **Mockup:** [canvas mockup.png](../../design/mockups/canvas%20mockup.png)
- **Spec:** [canvas.html](../../design/specs/canvas.html)

## Current Implementation

The canvas is a core feature of the application, built using React Konva and a sophisticated state management system.

### Frontend Architecture

- **Rendering Engine:** `react-konva` & `konva` for 2D canvas rendering.
- **State Management:** A unified Zustand store (`unifiedCanvasStore.ts`) manages all canvas-related state, including elements, tools, and UI properties. It uses Immer for immutable state updates.
- **Component Structure:**
    - `CanvasContainer.tsx`: The main wrapper component.
    - `CanvasLayerManager.tsx`: Manages the different layers (background, main, connector, UI).
    - `ElementRenderer.tsx`: A key component responsible for rendering different canvas elements (shapes, text, etc.) based on their type.
    - `UnifiedEventHandler.tsx`: A centralized handler for all canvas events (mouse, keyboard, drag), which translates user interactions into store actions.
- **Tools System:** A modular tool system is located in `src/features/canvas/tools/`. It includes base classes for creation tools (`BaseCreationTool.tsx`) and specific tools like `PenTool`, `TextTool`, and `ConnectorTool`.
- **Performance:** Optimizations include viewport culling, `React.memo` on heavy components, and granular selectors to minimize re-renders.

### Backend Architecture

- **Persistence:** The backend currently has a command `save_canvas_state` in `src-tauri/src/commands/canvas.rs` which saves the current canvas JSON to `canvas-save.json`.
- **No Real-time:** There is currently no real-time backend support for the canvas.

### Implemented Features

**Core Tools:**
- ✅ Selection & Pan tools
- ✅ Text tool with rich text editing
- ✅ Sticky Notes with color picker
- ✅ Table tool with cell editing
- ✅ Image upload and placement
- ✅ Drawing tools: Pen, Marker, Highlighter
- ✅ Eraser tool for drawing strokes
- ✅ Shape tools: Rectangle, Circle, Triangle (via dropdown)
- ✅ Connector tool with multiple styles (arrow, elbow, straight)
- ❌ Section tool (temporarily disabled in toolbar)

**Core Functionality:**
- ✅ Selection and multi-selection with Shift+click
- ✅ Transformation (move, resize, rotate) of elements
- ✅ Undo/redo functionality with history management
- ✅ Layer management system (Background, Main, Connector, UI layers)
- ✅ Viewport controls (pan, zoom in/out)
- ✅ Copy/paste functionality
- ✅ Delete elements
- ✅ Group/ungroup elements
- ✅ Grid display toggle
- ✅ Snap to grid functionality

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