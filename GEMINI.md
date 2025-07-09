
# LibreOllama Canvas Engineering Guide

> **ALWAYS think carefully and holistically before acting/coding**

## 1. Source of Truth

- Follow `docs/PROJECT_STATUS.md` (current implementation status and roadmap)
- Follow `docs/IMPLEMENTATION_GUIDE.md` (development patterns and architecture)
- Follow `docs/TECHNICAL_DEBT.md` (known issues and improvement plans)
- DO NOT CREATE NET NEW DOCUMENTATION UNDER ANY CIRCUMSTANCES UNLESS GIVEN EXPLICIT PERMISSION 
- WHEN YOU ARE ASKED TO READ A FILE OR DOCUMENT DO NOT SKIM IT -- READ **ALL** OF IT!

**As of January 2025:**
- Core canvas operations stable
- Functional: section tool, connectors, pen, table, image upload
- Central event handling via `CanvasEventHandler` and `EventHandlerManager`
- Store operations and memory systems validated

> Do not build advanced features until create/move/resize/capture are reliable

---

## 2. Core Guidelines

### Coordinate System

- Root elements use **absolute** coordinates
- Section-contained elements use **relative** coordinates
- Use Konva `<Group>` for transforms
- Use `OptimizedCoordinateService` for coordinate conversions

### State Management

- Zustand is the single source of truth
- Avoid direct reads (`node.x()`, `node.fill()`, etc.)
- Use:
  - `Map<string, T>` for elements
  - `Set<string>` for selections
  - `RingBuffer` for undo/redo history
- Immer: mutate `draft` directly

### Component Architecture

- Three-layer structure:
  1. Content Layer
  2. UI/Tools Layer
  3. Transformer Layer
- No prop spreading; use explicit props
- Refactor components >400 LOC

### Event Handling

- Centralized in `CanvasEventHandler`
- Attach listeners to `Stage` or `Layer`, not nodes
- Use `onPointer...` events
- Block propagation using `e.cancelBubble = true`

### Text Editing

- Integrated via `textEditingStore`
- Supports rich formatting and transformer-aligned editing
- Inline editing with DOM portal

---

## 3. Performance & Optimization

- Cache shape + coordinate computations
- Use viewport culling for large canvases
- Simplify pen path data before persisting
- Detach `Transformer` in `useEffect` cleanup
- Use `Konva.Animation`, not `requestAnimationFrame`
- Monitor using `CanvasPerformanceProfiler` and `MemoryLeakDetector`

---

## 4. TypeScript Best Practices

- Use branded types (`ElementId`, `SectionId`) to prevent ID collisions
- Use discriminated unions for all canvas element types
- Define explicit interfaces for shapes and store slices
- Type all Konva events: `KonvaEventObject<MouseEvent>`
- Prefer pure functions, avoid side effects

---

## 5. Engineering Mindset

- Prioritize working features over early optimization
- Don't rewrite stable features to solve integration bugs
- Reuse existing store logic and components
- Keep code modular and idiomatic
- Use Perplexity MCP for help if stuck

---

## 6. Testing Architecture

### Store Tests

- Use `zustand/vanilla` + `createStore`
- Avoid global mocks; isolate logic via `createXStore`

### Integration Tests

- Validate UI ↔ store ↔ UI flows
- Render with full Konva context and props

### Mocking

- Centralize mocks:
  - `vitest.hoisted.setup.ts` → Konva, React-Konva, canvas APIs
  - `setup.ts` → store factories, console silencing
- Expose mock store creators
- Use `data-testid` on interactive canvas layers/elements

### Performance Tests

- Benchmark store ops (<10ms ideal)
- Skip unnecessary renders
- Batch state updates and preserve immutability

### Stability

- Recreate store in `beforeEach`
- Silence logs unless debugging