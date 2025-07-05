# LibreOllama Canvas: Master Documentation

**Welcome to the comprehensive guide for the LibreOllama Canvas. This document serves as the central source of truth for all canvas-related development, architecture, and testing.**

## 1. Core Philosophy & Architecture

The LibreOllama Canvas is designed to be a high-performance, modular, and extensible digital whiteboard. Our architecture prioritizes clean separation of concerns, scalability, and maintainability.

### 1.1. Modular Store Architecture

To avoid the pitfalls of a monolithic state management system, the canvas utilizes a modular store pattern built with Zustand. Each distinct domain of the canvas state is managed by its own dedicated module. [[memory:2186835]]

**Location:** `src/features/canvas/stores/modules/`

**Key Modules:**

*   `elementModule.ts`: Manages all canvas elements (shapes, text, images, etc.), including their creation, deletion, and updates.
*   `selectionModule.ts`: Handles the selection state, including which elements are selected and the bounding box of the selection.
*   `toolModule.ts`: Manages the currently active tool, its properties, and interactions.
*   `historyModule.ts`: Implements undo/redo functionality by tracking state changes.
*   `panZoomModule.ts`: Controls the canvas viewport's position and zoom level.
*   `interactionModule.ts`: Governs user interaction modes (e.g., 'selecting', 'drawing', 'panning').
*   `connectorModule.ts`: Manages all aspects of connectors, including creation, updates, and attached element logic.
*   `drawingModule.ts`: Handles real-time drawing data for tools like the pen and highlighter.
*   `eraserModule.ts`: Manages the state and logic for the eraser tool.
*   `mindmapModule.ts`: Contains logic specific to the mind mapping tool.
*   `containerModule.ts`: Manages canvas-level properties like background and dimensions.
*   `editorModule.ts`: Handles state related to inline text editing.

All modules are unified in `src/features/canvas/stores/unifiedCanvasStore.ts`, which provides a single, cohesive interface for canvas state management while keeping the logic separated and manageable.

### 1.2. Rendering Engine: React Konva

The canvas is rendered using `react-konva`, which provides a declarative React-based API for the imperative Konva 2D graphics library. This allows us to build a complex canvas experience using familiar React components and hooks. [[memory:2149907]]

**Best Practices Adherence:**

*   **Performance:** We leverage `React.memo` for heavy components, optimize store subscriptions with `useShallow`, and use viewport culling to minimize re-renders. [[memory:2190868]]
*   **Layers:** The canvas is structured into distinct layers (`BackgroundLayer`, `MainLayer`, `ConnectorLayer`, `ToolLayer`, `UILayer`) to optimize rendering and event handling.
*   **Event Handling:** A `UnifiedEventHandler` centralizes and manages all user input (mouse, keyboard, touch) to ensure consistent behavior across all tools and components.

## 2. Key Features & Functionality

### 2.1. Connectors

Connectors are a core feature, allowing users to create visual links between canvas elements.

**Functionality:**

*   **Creation:** Connectors are created using the Connector Tool, snapping to predefined anchor points on shapes.
*   **Dynamic Updates:** When a connected shape is moved, the connector automatically adjusts its path to maintain the connection. The logic for this is optimized to prevent unnecessary recalculations.
*   **State Management:** The `connectorModule` is the source of truth for all connector data, ensuring consistency.

### 2.2. Eraser Tool

The eraser tool has been optimized for both performance and user experience.

*   **Minimalist UI:** The eraser features a clean, simple circular cursor with a central dot for precision, removing previous visual clutter like highlight boxes and crosshairs. [[memory:1932067]]
*   **Efficient Deletion:** It uses a spatial index (`SimpleEraserIndex`) for fast identification of elements to be deleted, ensuring smooth performance even on crowded canvases.

## 3. Development & Testing

### 3.1. Development Practices

*   **Logging:** All `console.log` statements should be replaced with our custom `canvasLogger`. This allows for standardized, level-based logging that can be easily disabled in production. [[memory:2190868]]
*   **Modularity:** Always add new state to the appropriate module. If a new domain is introduced, create a new store module for it.
*   **Pure Functions:** Favor pure functions for calculations and state transformations to improve predictability and testability.

### 3.2. Testing Philosophy

Our testing strategy is pragmatic and risk-oriented, focusing on ensuring the stability of critical user-facing functionality rather than aiming for 100% code coverage.

**Core Principles:**

1.  **Critical Path First:** We prioritize tests for features that are essential to the user experience. The MVP (Minimum Viable Product) functionality must be covered by robust integration tests.
2.  **User-Centric Scenarios:** Tests should simulate real user workflows. For example, "a user can select a shape, drag it, and see the connector update" is a more valuable test than a unit test for a single calculation function.
3.  **Confidence, Not Coverage:** The goal of our test suite is to provide confidence that the application works as expected, not to hit arbitrary coverage metrics. A high-impact integration test is more valuable than dozens of low-impact unit tests.
4.  **Pragmatic Unit Testing:** Unit tests are used for complex, isolated logic (e.g., algorithms, critical state transformations) where the behavior can be validated independently. We do not write unit tests for simple components or trivial functions.

**Testing Workflow:**

1.  **New Feature:** When developing a new feature, start by writing an integration test that covers its primary user-facing workflow.
2.  **Bug Fix:** When fixing a bug, first write a failing test that reproduces the bug. The fix is complete when the test passes.
3.  **Refactoring:** Existing tests should continue to pass after refactoring. If the refactor is significant, new tests may be needed to cover altered logic.

This approach ensures our testing efforts are focused where they matter most, delivering a stable and reliable product without getting bogged down in writing low-value tests. 