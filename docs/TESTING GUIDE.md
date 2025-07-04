cd# Testing Philosophy

## Overview

This document outlines the official testing guidelines for LibreOllama Canvas and related systems. These principles prioritize maintainability, reliability, and developer confidence while aligning with our unified architecture.

## Core Principles

### 1. Store-First Testing (Preferred)

**Test business logic and state changes directly through real store instances, not mocks.**

```typescript
// ✅ PREFERRED: Real store testing
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';

const store = createUnifiedTestStore();
store.getState().addElement(testElement);
expect(store.getState().elements.has(testElement.id)).toBe(true);
```

**Why:** Real stores provide authentic behavior, catch integration bugs, and are more maintainable than complex mocks.

### 2. Minimal UI/Integration Testing

**Use UI/integration tests only for critical flows that cannot be validated at the store/state level.**

Examples of when UI testing is necessary:
- Drag-and-drop interactions
- Keyboard navigation flows
- Cross-component interactions that depend on DOM events
- Canvas rendering behaviors that require visual validation

```typescript
// ✅ APPROPRIATE: Testing drag-and-drop behavior
test('element drag updates position in store', () => {
  // UI interaction test for behavior that can't be tested at store level
});
```

### 3. Limited External Mocking Only

**Mocks are acceptable only for truly external dependencies—not for our core store or canvas logic.**

Acceptable mocking targets:
- Browser APIs (`canvas.getContext`, `window.requestAnimationFrame`)
- External libraries (Tauri/Electron APIs, third-party services)
- File system operations
- Network requests

```typescript
// ✅ ACCEPTABLE: Mock external dependencies
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// ❌ AVOID: Mocking our own stores
vi.mock('@/stores/unifiedCanvasStore', () => ({ ... }));
```

### 4. Targeted, Type-Safe Tests

**Focus on specific edge cases and bug regressions rather than broad integration tests.**

```typescript
// ✅ GOOD: Specific, focused test
test('element deletion removes from sections map', () => {
  const store = createUnifiedTestStore();
  const element = createTestElement();
  const section = createTestSection();
  
  store.getState().addElement(element);
  store.getState().addElementToSection(element.id, section.id);
  store.getState().deleteElement(element.id);
  
  expect(store.getState().sectionElementMap.get(section.id)?.has(element.id)).toBe(false);
});

// ❌ AVOID: Overly broad integration test
test('entire canvas workflow from creation to deletion', () => {
  // Too many moving parts, hard to debug when it fails
});
```

## Implementation Guidelines

### Store Testing Patterns

#### Real Store Creation
```typescript
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';

describe('Canvas Store Behavior', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;
  
  beforeEach(() => {
    store = createUnifiedTestStore();
  });
  
  test('element operations work correctly', () => {
    const element = createTestElement();
    store.getState().addElement(element);
    
    expect(store.getState().elements.size).toBe(1);
    expect(store.getState().elements.get(element.id)).toEqual(element);
  });
});
```

#### Component Testing with Real Stores
```typescript
import { renderWithStore } from '@/tests/utils/testUtils';

test('component updates when store changes', () => {
  const store = createUnifiedTestStore();
  const { getByTestId } = renderWithStore(<MyComponent />, store);
  
  // Test component behavior with real store
  act(() => {
    store.getState().setSelectedTool('rectangle');
  });
  
  expect(getByTestId('tool-indicator')).toHaveTextContent('rectangle');
});
```

### When Store Mocking is Unavoidable

If real store testing is blocked by technical constraints, document the challenge:

```typescript
// ⚠️ DOCUMENTED EXCEPTION: Store mocking due to [specific technical reason]
// TODO: Investigate migrating to real store testing when [blocking issue] is resolved
vi.mock('@/stores/unifiedCanvasStore', () => ({
  useUnifiedCanvasStore: vi.fn(() => ({
    // Minimal mock implementation
  }))
}));
```

### External Dependencies

Mock external dependencies at the module boundary:

```typescript
// ✅ Mock external Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    // ... other canvas context methods
  })
});

// ✅ Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({})
}));
```

## Test Organization

### File Structure
```
src/tests/
├── helpers/              # Test utilities and store factories
│   ├── createUnifiedTestStore.ts
│   └── testUtils.tsx
├── stores/              # Store-level tests (preferred)
│   ├── canvasStore.test.ts
│   └── selectionStore.test.ts
├── integration/         # Minimal integration tests
│   └── criticalFlows.test.tsx
└── components/          # Component tests (with real stores)
    └── CanvasComponent.test.tsx
```

### Test Naming Conventions
- Store tests: `[feature]Store.test.ts`
- Component tests: `[ComponentName].test.tsx`
- Integration tests: `[workflow].integration.test.tsx`

## Performance Testing

### Bundle Size Validation
```typescript
test('production bundle excludes debug code', () => {
  // Validate that debug components are tree-shaken in production
  expect(productionBundle).not.toContain('CanvasDebugger');
});
```

### Memory Leak Detection
```typescript
test('store cleanup prevents memory leaks', () => {
  const store = createUnifiedTestStore();
  // Test cleanup behavior
  store.destroy?.();
  // Validate references are cleared
});
```

## Migration Guide

### Converting Mock-Heavy Tests

1. **Identify the core behavior** being tested
2. **Create a real store instance** using `createUnifiedTestStore`
3. **Test through store methods** rather than mocked interfaces
4. **Remove unnecessary mocks** that aren't external dependencies

```typescript
// BEFORE: Mock-heavy approach
vi.mock('@/stores/canvasStore');
const mockStore = { addElement: vi.fn() };

// AFTER: Real store approach
const store = createUnifiedTestStore();
store.getState().addElement(testElement);
```

### Handling Component Dependencies

```typescript
// Create wrapper component for testing
const TestWrapper: React.FC<{ store: any; children: React.ReactNode }> = ({ store, children }) => (
  <StoreProvider store={store}>
    {children}
  </StoreProvider>
);
```

## Troubleshooting

### Common Issues

1. **"Store not found" errors**: Ensure test components are wrapped with proper store providers
2. **Async state updates**: Use `act()` when testing state changes that trigger re-renders
3. **Canvas context errors**: Mock browser APIs appropriately for headless testing

### Debug Strategies

1. **Console log store state** during test execution
2. **Use real browser environment** for complex canvas interactions
3. **Isolate failing behavior** into minimal reproduction cases

### Key Troubleshooting Lessons

Our recent refactoring efforts have highlighted several critical patterns for testing with our `unifiedCanvasStore`.

1.  **Test Store Must Mirror Production**: The test store factory (`createUnifiedTestStore`) **must** use the exact same slice creator and middleware (`immer`, `subscribeWithSelector`) as the production store. A mismatched or partially mocked test store will lead to subtle bugs where actions appear to not exist or state doesn't update.

    ```typescript
    // ✅ CORRECT: src/tests/helpers/createUnifiedTestStore.ts
    import { createStore } from 'zustand/vanilla';
    import { subscribeWithSelector } from 'zustand/middleware';
    import { immer } from 'zustand/middleware/immer';
    import { createCanvasStoreSlice } from '../../features/canvas/stores/unifiedCanvasStore';

    export const createUnifiedTestStore = () => {
      // Use the *actual* store slice creator from production
      return createStore(
        subscribeWithSelector(
          immer(createCanvasStoreSlice)
        )
      );
    };
    ```

2.  **Use `addElement` for Full Objects**: When adding a pre-constructed element object in a test, use the `addElement` action. The `createElement` action is designed to create a new element from minimal data (`type` and `position`) and will not work correctly if passed a full object.

3.  **Manual State Synchronization in Tests**: Some store actions are not fully interconnected by design to avoid complex side effects. For example, creating an element with `addElement` does *not* automatically check if it's inside a section. Tests must reflect this by calling subsequent actions manually to achieve the desired state for an assertion.

    ```typescript
    // ✅ CORRECT: Manually trigger containment check after adding an element
    await act(async () => {
      sectionId = getState().createSection(0, 0, 100, 100);
      getState().addElement({ id: el1Id, type: 'shape', ... });
      // Manually trigger the containment logic
      getState().captureElementsInSection(sectionId);
    });
    // Now it's safe to assert containment
    expect(getState().sections.get(sectionId!)?.childElementIds).toContain(el1Id);
    ```

### Critical Store Usage Patterns (ConnectorTool Test Findings)

**CRITICAL**: The most important lesson from recent test development is the correct store method invocation pattern.

4.  **Correct Store Method Invocation**: Always use `store.getState().methodName()` pattern, never call methods directly on state variables.

    ```typescript
    // ✅ CORRECT: This pattern works
    const store = createUnifiedTestStore();
    store.getState().addElement(element);
    expect(store.getState().elements.size).toBe(1);

    // ❌ WRONG: This pattern fails silently
    const state = store.getState();
    state.addElement(element);  // Method exists but doesn't work
    expect(state.elements.size).toBe(0);  // Still 0, element not added
    ```

    **Why this happens**: Zustand with Immer middleware requires method calls to go through the store's state getter to properly trigger the Immer proxy and state updates.

5.  **Event Handler Testing with Konva**: When testing React-Konva components, ensure mock objects match the actual Konva API structure.

    ```typescript
    // ✅ CORRECT: Mock target with proper Konva structure
    const mockTarget = {
      ...mockStage,
      getStage: () => mockStage  // Essential for ConnectorTool logic
    };

    mouseDownHandler({
      target: mockTarget,
      evt: { clientX: 100, clientY: 100 }
    });
    ```

6.  **Match Implementation Event Names**: Always verify the actual event names used in component implementation rather than assuming.

    ```typescript
    // ✅ CORRECT: Check actual implementation first
    // ConnectorTool uses: mousedown, mousemove, mouseup
    expect(mockStage.on).toHaveBeenCalledWith('mousedown', expect.any(Function));

    // ❌ WRONG: Assuming pointer events
    expect(mockStage.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    ```

7.  **Element Property Names**: Use the correct property names as defined in the type system.

    ```typescript
    // ✅ CORRECT: Use actual property names
    expect(addedConnector.pathPoints).toEqual([0, 0, 100, 100]);

    // ❌ WRONG: Using assumed property names
    expect(addedConnector.points).toEqual([0, 0, 100, 100]);
    ```

### Test Development Debugging Workflow

When store-first tests fail with "elements.size is 0" or similar issues:

1. **Verify Store Pattern**: Ensure using `store.getState().method()` not `state.method()`
2. **Check Element Structure**: Verify all required properties are present (id, type, createdAt, updatedAt)
3. **Validate Store Factory**: Confirm test store uses same middleware as production
4. **Console Log State**: Add `console.log(store.getState().elements)` to debug
5. **Compare with Working Tests**: Reference `core-canvas-store.test.ts` for proven patterns

```typescript
// Debugging template for failed store tests
test('debug element addition', () => {
  const store = createUnifiedTestStore();
  
  console.log('Initial state:', store.getState().elements.size);
  
  const element = {
    id: ElementId('test-1'),
    type: 'connector',
    // ... all required properties
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  store.getState().addElement(element);
  
  console.log('After addition:', store.getState().elements.size);
  console.log('Elements map:', store.getState().elements);
  
  expect(store.getState().elements.size).toBe(1);
});
```

## Contributing

When adding new tests:

1. **Start with store-level testing** when possible
2. **Document any mocking decisions** with clear reasoning
3. **Follow the established patterns** in existing test files
4. **Ensure tests are deterministic** and don't depend on external factors

For questions about testing approach, refer to this document first, then reach out to the team for clarification.

---

*This testing philosophy is designed to maintain high code quality while supporting rapid development and reliable deployments. It should be reviewed and updated as our architecture evolves.*