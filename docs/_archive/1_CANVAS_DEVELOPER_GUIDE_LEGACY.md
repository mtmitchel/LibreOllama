# LibreOllama Canvas Developer Guide (Technical Edition)

This guide is the primary technical resource for developers working on the canvas system. It covers the current unified store architecture, working tools, and patterns for implementing new functionality.

**Current Status (June 28, 2025)**: Under intensive development - significant architectural issues identified requiring systematic debugging.
**Critical Issues**: Event handler conflicts, position update conflicts, ReactKonva integration problems, transform management issues.

## Part 1: Foundations & Core Architecture

This section covers the essential setup and architectural principles that *must* be followed for all new and refactored code.

### 1.1. Current Technology Stack

* **React Konva**: Declarative canvas library for scene graph management. Maps unified store state directly to canvas objects.
* **TypeScript**: Strict TypeScript with discriminated unions and branded types for element safety. Some compilation errors remain from migration.
* **Zustand + Immer**: Unified store pattern (`unifiedCanvasStore.ts`) replaces previous multi-slice architecture. Uses Immer for immutable updates.
* **UnifiedEventHandler**: Centralized event handling system replacing previous scattered event logic.
* **Tauri**: Rust backend for file system operations and security-sensitive features.

### 1.2. Core Konva Concepts & Correct Implementation

A Konva scene's hierarchy is `Stage > Layer > Group | Shape`. Our primary performance strategy relies on separating content into logical `Layer` components.

Current layer implementation through `CanvasLayerManager.tsx`:

* **Background Layer**: Grid and static elements (z-index 0)
* **Main Layer**: User elements rendered via `MainLayer.tsx` (z-index 1) 
* **Connector Layer**: Line connections between elements (z-index 2)
* **UI Layer**: Selection indicators and tool previews (z-index 3)

**Current Implementation Pattern:**

```tsx
// Current unified store architecture
const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  // Use unified store selectors
  const elements = useUnifiedCanvasStore(state => state.elements);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);

  return (
    <Stage ref={stageRef} width={width} height={height}>
      <CanvasLayerManager 
        stageRef={stageRef}
        name="canvas-layers"
      />
      <UnifiedEventHandler 
        stageRef={stageRef}
        onStageReady={() => setIsReady(true)}
      />
    </Stage>
  );
};
```

### 1.3. Current Tool Status & Known Issues

**✅ Partially Working (with Issues):**
- **Text**: Basic creation works, editing may have persistence issues
- **Section Tool**: Visual creation and element capture works, but movement/resizing fails
- **Sticky Notes**: Creation works, but resize handles disappear after reselection
- **Selection**: Basic click selection works with visual feedback
- **Toolbar UI**: Modern floating toolbar displays correctly

**❌ Known Broken/Problematic:**
- **Shape Tools**: Rectangle/Circle/Triangle/Star not responding to canvas clicks
- **Element Movement**: All dragged elements snap back to original positions
- **Section Operations**: Cannot move or resize sections reliably
- **Table Resizing**: Tables snap back to original size after resize
- **Pen Tool**: Intermittent lag and performance issues
- **Transform Handles**: Missing or non-functional resize handles after reselection

**🚨 Critical Architectural Issues Identified:**
- **Dual Event Systems**: Stage-level (UnifiedEventHandler) vs element-level (MainLayer) conflicts
- **Transform Handler Conflicts**: TransformerManager vs UnifiedEventHandler competing for same events
- **ReactKonva Integration**: Missing onDragEnd handlers causing state sync warnings
- **Position Update Race Conditions**: Store updates vs Konva node positions causing conflicts
- **Event Handler Duplication**: Multiple handlers for same events causing unpredictable behavior

### 1.4. State Management: Unified Store Architecture

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

### 3.2. Testing: Store-First Methodology with Current Architecture

**Core Testing Principles (MUST FOLLOW):**

1. **Use Store-First Testing**: Test business logic directly through store operations rather than UI rendering
2. **Avoid UI Rendering Tests**: Focus on direct store API testing for performance and reliability
3. **Use Real Store Instances**: Avoid mocks where possible, test actual store logic
4. **Test with Type Safety**: Use branded types and proper type guards in all tests

**Performance Benefits:**
- **Performance Gain**: Sub-10ms execution vs. 30-second UI rendering timeouts
- **Reliability**: 100% consistent execution without React dependencies
- **Real Validation**: Tests actual store logic, not mock stubs

**Current Testing Architecture with useUnifiedCanvasStore:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { 
  useUnifiedCanvasStore, 
  canvasSelectors 
} from '../features/canvas/stores/unifiedCanvasStore';
import { 
  ElementId, 
  SectionId,
  RectangleElement,
  TextElement
} from '../features/canvas/types/enhanced.types';

describe('Unified Store Testing', () => {
  let store: ReturnType<typeof useUnifiedCanvasStore>;

  beforeEach(() => {
    // Reset store state before each test
    store = useUnifiedCanvasStore;
    
    // Clear any existing state using store actions
    act(() => {
      // Clear elements by getting all IDs and deleting them
      const currentElements = Array.from(store.getState().elements.keys());
      currentElements.forEach(id => {
        store.getState().deleteElement(id as ElementId);
      });
      
      // Clear selection and history
      store.getState().clearSelection();
      store.getState().clearHistory();
    });
  });

  it('should add elements with proper branded types', () => {
    // Arrange: Create properly typed elements using branded types
    const rectElement: RectangleElement = {
      id: ElementId('test-rect-1'),
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 1,
      cornerRadius: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Act: Add element using store API
    act(() => {
      store.getState().addElement(rectElement);
    });

    // Assert: Verify element was added correctly
    const state = store.getState();
    expect(state.elements.size).toBe(1);
    expect(state.elements.get(ElementId('test-rect-1'))).toEqual(rectElement);
    expect(state.elementOrder).toEqual([ElementId('test-rect-1')]);
  });

  it('should handle selection operations with type safety', () => {
    // Arrange: Add test elements
    const element1: RectangleElement = {
      id: ElementId('select-test-1'),
      type: 'rectangle',
      x: 100, y: 100, width: 50, height: 50,
      fill: '#ff0000', stroke: '#000000', strokeWidth: 1, cornerRadius: 0,
      createdAt: Date.now(), updatedAt: Date.now()
    };

    act(() => {
      store.getState().addElement(element1);
    });

    // Act & Assert: Test selection operations
    act(() => {
      store.getState().selectElement(ElementId('select-test-1'));
    });

    expect(store.getState().selectedElementIds.has(ElementId('select-test-1'))).toBe(true);
    expect(store.getState().selectedElementIds.size).toBe(1);
    expect(store.getState().lastSelectedElementId).toBe(ElementId('select-test-1'));
  });
});
```

**Type-Safe Selector Testing:**

```typescript
describe('Type-Safe Selectors', () => {
  it('should provide type-safe element access', () => {
    // Arrange: Add test element with proper typing
    const testElement: TextElement = {
      id: ElementId('selector-test-1'),
      type: 'text',
      x: 100, y: 100,
      text: 'Selector Test',
      fontSize: 18,
      fontFamily: 'Arial',
      fill: '#000000',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    act(() => {
      store.getState().addElement(testElement);
      store.getState().selectElement(ElementId('selector-test-1'));
    });

    // Act: Use selectors to access data
    const state = store.getState();
    const elements = canvasSelectors.elements(state);
    const selectedElements = canvasSelectors.selectedElements(state);
    const lastSelected = canvasSelectors.lastSelectedElement(state);

    // Assert: Verify selector results with type safety
    expect(elements.size).toBe(1);
    expect(selectedElements).toHaveLength(1);
    expect(selectedElements[0]).toEqual(testElement);
    expect(lastSelected).toEqual(testElement);
  });
});
```

**Testing Branded Types and Constructors:**

```typescript
describe('Branded Type Testing', () => {
  it('should use branded type constructors correctly', () => {
    // Use branded type constructors for type safety
    const elementId = ElementId('test-elem-1');
    const sectionId = SectionId('test-section-1');
    
    const mockElement: CanvasElement = {
      id: elementId,  // Properly typed with brand
      type: 'rectangle',
      x: 100, y: 100, width: 50, height: 50,
      sectionId: sectionId,  // Properly typed section reference
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    act(() => {
      store.getState().addElement(mockElement);
    });
    
    // Type-safe assertions
    expect(store.getState().elements.get(elementId)).toBeDefined();
    expect(store.getState().elements.get(elementId)?.sectionId).toBe(sectionId);
  });
});
```

**Testing Best Practices:**

- **Performance Focus**: Direct store API testing executes in sub-10ms vs. 30+ second UI rendering
- **Real Instance Usage**: Use actual `useUnifiedCanvasStore` instead of mocks where possible
- **Type Safety**: Always use branded type constructors (`ElementId('string')`, `SectionId('string')`)
- **Comprehensive Coverage**: Include error injection and edge case testing
- **Act Wrapping**: Wrap all store mutations in `act()` for proper React testing integration
