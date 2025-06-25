# Gemini Workspace

This #### Coordinate System

* Canvas root elements → **absolute** coordinates
* Elements inside sections → **relative** to section origin
* Use Konva's `<Group>` for transforms
* Use viewport store for coordinate conversions between screen and canvas spaceontains context and instructions for the Gemini agent.
## applyTo: '\*\*'

## 🧠 LibreOllama Canvas — Engineering Directives

### 📘 1. Source of Truth

* Follow `CANVAS_DEVELOPMENT_ROADMAP.md`. It defines strategy, architecture, and development phases.
* Follow `CANVAS_TESTING_PLAN.md` for testing methodology, test architecture, and patterns. Update it with results and insights from new tests.
* Refer to the **Canvas Implementation Checklist** for verifying section behaviors, interaction rules, and feature readiness.
* **Current Status (June 25, 2025):**

  * Core canvas functionality is working
  * Section tool, connector tool, pen, table, and image upload are fully functional
  * Event handling centralized through CanvasEventHandler with EventHandlerManager pattern
  * Store operations and memory management systems implemented and validated
  * Foundation and store layers working correctly with comprehensive validation
* **Important:** Do not implement advanced features (e.g., snapping, predictive loading) until core canvas operations (create, move, resize, capture) are confirmed stable.

---

### ⚙️ 2. Core Guidelines

#### Coordinate System

* Canvas root elements → **absolute** coordinates
* Elements inside sections → **relative** to section origin
* Use Konva’s `<Group>` for transforms
* Use `OptimizedCoordinateService` for conversions

#### State Management (Zustand + Immer)

* Zustand is the single source of truth. No `node.x()`/`node.fill()` reads.
* Use:

  * `Map<string, T>` for element storage
  * `Set<string>` for selections
  * `RingBuffer` for history
* Mutate Immer `draft` objects directly (no reassignment).

#### Component & Layer Architecture

* Use multi-layer structure:

  1. **Content Layer** — actual canvas elements
  2. **UI/Tools Layer** — transient tools like guides, previews
  3. **Transformer Layer** — handles selection/resize UI
* Components must pass props explicitly (no prop spreading).
* Refactor any component >400 lines.

#### Event Handling

* Centralize in `CanvasEventHandler`.
* Attach listeners to `Stage` or `Layer`, not individual nodes.
* Use `e.cancelBubble = true` to prevent event propagation.
* Use `onPointer...` events for full device support.

#### Text Editing (DOM via Portal)

* Text input integration with textEditingStore for state coordination
* Rich text formatting system for advanced text elements
* Inline editing workflow with transformer bounds coordination

---

### ⚡ 3. Performance & Optimization

* Implement caching for complex shapes and coordinate transformations
* Use viewport culling to optimize rendering of large numbers of elements  
* Simplify path data for pen tool drawings before persisting
* Detach `Transformer` nodes in `useEffect` cleanup
* Use `Konva.Animation` instead of `requestAnimationFrame`
* Monitor performance with CanvasPerformanceProfiler and MemoryLeakDetector

---

### 🧾 4. TypeScript Best Practices

* Use **branded types** (`ElementId`, `SectionId`) to avoid ID mixups.
* All canvas elements should use discriminated unions.
* Define explicit `interface` or `type` for each shape and store slice.
* Type all Konva events precisely: `KonvaEventObject<MouseEvent>`.
* Write pure functions. Avoid side effects and in-place mutations.

---

### 🧰 5. General Mindset

* Prioritize working features. Optimize only after stability.
* Integration issues → integration fixes (not rewrites).
* Always check the store, existing components, and roadmap before creating something new.
* Maintain modularity and clarity. Favor idiomatic, maintainable code over quick hacks.
* If you need more context or feel stuck when working on a problem, use the Perplexity MCP server to search for an answer.

---

### 🧪 6. Testing Architecture Principles

#### ✅ Store Tests (Zustand Vanilla Pattern)

* Use `createStore` from `zustand/vanilla` to create real test stores.
* Avoid global mocks — test slices in isolation with creator functions.
* Export both `useXStore` (hook) and `createXStore` (vanilla) from each store module.

#### ✅ Integration Tests (UI + Store)

* Validate complete interaction chains: UI → store → UI.
* Use real implementations — avoid over-mocking or shallow testing.
* Render components with proper Konva context and real props.

#### ✅ Mocking Strategy

* Centralize mocks:

  * `vitest.hoisted.setup.ts`: Konva, React-Konva, Canvas API
  * `setup.ts`: store factories, console silencing
* Always expose mock store creators for isolated test logic.
* Use `data-testid` on canvas layers and interactive elements.

#### ✅ Performance Testing

* Use direct store access to benchmark operation timings (<10ms).
* Avoid full canvas rendering when not required.
* Ensure immutability and state batching.

#### ✅ Stability Safeguards

* Recreate store per test with `beforeEach`.
* Silence test console unless debugging.
* Include regression tests for each fixed bug.

> Reference: `src/tests/section-tool-bug-investigation.test.tsx`

---
