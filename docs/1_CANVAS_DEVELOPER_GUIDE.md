# The Ultimate Guide to the LibreOllama Canvas (Technical Edition)

This guide is the primary technical resource for any developer working on the canvas. It consolidates all previous guides and checklists into a single, authoritative source, providing deep technical context, code examples, and clear architectural patterns.

## Part 1: Foundations & Core Architecture

This section covers the essential setup and architectural principles that *must* be followed for all new and refactored code.

### 1.1. Technology Stack & Synergy

* **React Konva**: The declarative nature of React Konva is essential for managing a complex scene graph. We use it to map our application state directly to canvas objects.
* **TypeScript**: We enforce strict TypeScript to eliminate entire classes of runtime errors. The use of **discriminated unions** and **branded types** is mandatory for type-safe handling of different canvas elements and their IDs.
* **Zustand**: Chosen for its simplicity, performance, and minimal boilerplate. It allows for direct state subscription and the use of memoized selectors to prevent unnecessary re-renders, which is critical for canvas performance. The slice pattern with Immer is the standard for organizing the store.
* **Tauri**: The Rust backend is used for all security-sensitive operations and interactions with the native file system, providing a secure and performant bridge between the webview frontend and the OS.

### 1.2. Core Konva Concepts & Correct Implementation

A Konva scene's hierarchy is `Stage > Layer > Group | Shape`. Our primary performance strategy relies on separating content into logical `Layer` components.

* **Static Layer**: For non-interactive elements like grids, backgrounds, or watermarks. This layer rarely needs to be redrawn.
* **Dynamic Layer**: For user-manipulated elements (shapes, text, connectors). This layer will update frequently.
* **UI Layer**: For high-frequency updates like selection boxes, resize handles, or tool previews. This isolates the most frequent redraws from the main content.

**Correct Implementation Example:**

```tsx
// Correct layering strategy
const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  // Selectors to get specific elements from the Zustand store
  const dynamicElements = useCanvasStore(state => state.elements);
  const selectionRect = useUIStore(state => state.selectionRectangle);

  return (
    <Stage ref={stageRef} width={window.innerWidth} height={window.innerHeight}>
      {/* Layer for static background elements */}
      <Layer name="static-background">
        <GridLines />
      </Layer>

      {/* Main layer for all user-drawn shapes */}
      <Layer name="main-content">
        {dynamicElements.map(element => (
          <ElementRenderer key={element.id} element={element} />
        ))}
      </Layer>

      {/* UI layer for high-frequency updates like selection boxes */}
      <Layer name="ui-overlay">
        {selectionRect && <Rect {...selectionRect} />}
      </Layer>
    </Stage>
  );
};
```

### 1.3. State Management: The Zustand Store-First Standard

All business logic resides within the Zustand store. UI components should be "dumb," reading from the store and dispatching actions.

**Store Architecture Violation (from `CANVAS_DEVELOPMENT_ROADMAP_REVISED.md`):**

```typescript
// ❌ INCORRECT: Violates single source of truth.
// The store should already know about all elements.
export interface SelectionStore {
  select: (elementId: string, allElements: any[]) => void;
}
```

**Correct Store Architecture (Slice Pattern with Immer):**

```typescript
// ✅ CORRECT: A self-contained store slice.
import { StateCreator } from 'zustand';
import { AllCanvasElements } from '../types/enhanced.types'; // Use strict types

export interface ElementsSlice {
  elements: Map<string, AllCanvasElements>;
  updateElementPosition: (elementId: string, x: number, y: number) => void;
}

export const createElementsSlice: StateCreator<
  ElementsSlice,
  [],
  [],
  ElementsSlice
> = (set) => ({
  elements: new Map(),
  updateElementPosition: (elementId, x, y) =>
    set((state) => {
      const element = state.elements.get(elementId);
      if (element) {
        // Use Immer for safe, direct mutation syntax
        const newElements = new Map(state.elements);
        newElements.set(elementId, { ...element, x, y });
        return { elements: newElements };
      }
      return state;
    }),
});
```

### 1.4. Critical: Coordinate System Management

This is a frequent source of bugs. The "jumping" artifact during drag-and-drop is a classic symptom of coordinate desynchronization.

* **The Problem**: Mixing Konva's internal absolute position (`getAbsolutePosition()`) with React's stateful relative position (`x`, `y` props) during a drag operation.
* **The Solution**: At the end of a drag, **always** trust the event target's final relative position.

**Correct Drag Handler Implementation:**

```tsx
import { KonvaEventObject } from 'konva/lib/Node';

// Get the store action once, outside the handler
const updateElementPosition = useCanvasStore.getState().updateElementPosition;

const handleDragEnd = (e: KonvaEventObject<DragEvent>, elementId: string) => {
  // ✅ CORRECT: Use e.target.position() to get the final coordinates
  // relative to the parent (the Layer). This is the source of truth.
  const finalPos = e.target.position();

  // Dispatch a single action to the store.
  // The store handles the business logic.
  updateElementPosition(elementId, finalPos.x, finalPos.y);

  // ❌ INCORRECT: Do not do this. It introduces scaling and offset errors.
  // const stage = e.target.getStage();
  // const absolutePos = e.target.getAbsolutePosition();
  // const calculatedPos = { x: absolutePos.x - stage.x(), y: absolutePos.y - stage.y() };
};

// In your component:
<Rect onDragEnd={(e) => handleDragEnd(e, element.id)} {...props} />
```

---

## Part 2: Active Refactoring Plan & Code-Level Violations

This section details the specific, code-level problems we are fixing.

### 2.1. Code-Level Violations Identified

* **Type Safety (`MainLayer.tsx`):** The rampant use of `as any` (29+ instances) is a critical failure of the type system. It negates the benefits of TypeScript and hides bugs.

    * **Example Violation:** `const shape = e.target as any;`
    * **Required Fix:** Implement proper type guards and use strictly typed event objects. `(e.target as Konva.Rect)` is acceptable if the handler is only for a Rect, but a type guard function is preferred.

* **Event Handling (Shape Components):** Business logic is incorrectly placed inside component event handlers. This creates scattered, duplicated logic that is hard to maintain.

    * **Example Violation (Conceptual):**
      ```tsx
      // ❌ In a Shape Component
      const handleDragMove = (e) => {
          // Business logic for snapping, collision detection, etc.
          // This is "thick" and belongs in the store or a dedicated hook.
      }
      ```
    * **Required Fix:** Use **event delegation**. Attach a single `onDragEnd` handler to the `Layer`. Use `e.target` to identify which shape was dragged and dispatch a generic action to the store.

* **Performance (`VirtualizedSection`):** The existence of a `SimpleElementRenderer` that bypasses the main `ElementRenderer` and its caching/memoization logic creates a duplicate, unoptimized rendering path.

    * **Required Fix:** Remove `SimpleElementRenderer` and `VirtualizedSection`. The main `ElementRenderer` must be optimized with spatial indexing (quadtrees) to handle viewport culling itself.

### 2.2. Technical Refactoring Guide

* **Phase 3 (Active): UI/UX Modernization**

    * **Floating Toolbar:** Create `src/features/canvas/components/FloatingToolbar.tsx`. It will be rendered inside the main `CanvasPage.tsx` but positioned absolutely relative to the canvas container. Its state (visible tools, selected options) will be managed by a new `uiStore` slice.
    * **Stable Popups:** Use `ReactDOM.createPortal()` to render all popups and context menus into a dedicated DOM node at the `<body>` level. This prevents z-index and clipping issues with the Konva stage.

* **Phase 4 (Planned): Store & Event System Overhaul**

  1. **Merge Stores:** Consolidate all state related to canvas elements (`elements`, `selection`, `history`) into a single `canvasStore` with multiple slices.
  2. **Centralize Events:** Remove all `onDrag*` handlers from individual shape components.
  3. **Implement Delegation:** Add `onDragEnd`, `onClick`, etc., to the main content `<Layer>`. The handler will inspect `e.target.name()` or `e.target.id()` to determine which element was acted upon and dispatch the appropriate action.
  4. **Enforce Thin Handlers:** The `Layer` event handlers should only extract necessary information and dispatch an action. All logic must be in the store.

---

## Part 3: Development Best Practices & Testing

### 3.1. Developer "Must-Follow" Checklist

* **Store-First Architecture**: Write business logic in the store. Test the logic by calling store methods directly.
* **Spatial Indexing**: To achieve performance with 10k+ elements, we *must* use a spatial index like a quadtree. On every pan/zoom, query the quadtree for elements in the current viewport and pass only those to the Konva `Layer`.
* **Node Pooling**: For frequently created/destroyed objects (like during a freehand pen stroke), maintain a pool of reusable Konva `Shape` instances to avoid triggering garbage collection.
* **Strict Typing**: **NO `any`**. Use `unknown` and type guards. Use branded types (`type ElementId = string & { __brand: 'elementId' }`) to prevent accidentally mixing up different kinds of IDs.

### 3.2. Testing: The "Store-First" Pattern

Tests should be fast, reliable, and test the logic, not the rendering.

**Correct Testing Example (using Vitest):**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createCanvasStore, CanvasStore } from './canvasStore'; // Your Zustand store
import { RectangleElement } from '../types/enhanced.types';
import { act } from '@testing-library/react';

describe('Canvas Store: Element Management', () => {
  let store: ReturnType<typeof createCanvasStore>;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createCanvasStore();
  });

  it('should correctly update an element position', () => {
    // Arrange: Create a mock element and add it to the store
    const mockElement: RectangleElement = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      fill: 'red'
    };
    act(() => {
        store.getState().addElement(mockElement);
    });

    // Act: Call the store action we want to test
    act(() => {
        store.getState().updateElementPosition('rect-1', 250, 300);
    });

    // Assert: Check if the state was updated correctly
    const updatedElement = store.getState().elements.get('rect-1');
    expect(updatedElement).toBeDefined();
    expect(updatedElement?.x).toBe(250);
    expect(updatedElement?.y).toBe(300);
  });
});
```
