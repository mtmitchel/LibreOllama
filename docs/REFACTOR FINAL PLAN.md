
This is the complete and authoritative roadmap for codebase recovery.

-----

## **🔄 CURRENT IMPLEMENTATION STATUS**

### ✅ **COMPLETED: Phase 1.1 - Unify Event Handling (100%)**
- **Enhanced UnifiedEventHandler** with enterprise-grade error handling, retry logic, fallback mechanisms, and metrics tracking
- **Deleted both EventHandlerManager.ts files** and updated all component references
- **Established single authority** for canvas events with debugging interface (`window.__canvasEventHealth()`)
- **Result:** Core event handling conflicts eliminated

### 🔄 **IN PROGRESS: Phase 1.2 - Consolidate State Management (60%)**
- **Main components verified** - CanvasLayerManager and LayersPanel already use unified store
- **SnapLine types consolidated** to enhanced.types.ts, snappingUtils.ts updated
- **No legacy store imports** found in active components
- **Remaining:** Test infrastructure modernization and legacy test file updates

### ⏳ **PENDING: Phase 1.3 - Component Hierarchy Restoration (0%)**
- **Create CanvasContainer.tsx** as primary Konva Stage owner
- **Move KonvaAppRefactored.tsx** → `features/canvas/components/KonvaApp.tsx`
- **Update CanvasPage.tsx** to render `<CanvasContainer />`
- **Establish proper component chain** of responsibility

**Overall Phase 1 Progress: 70% Complete**

---

### **The Final, Unified Rectification Plan & Target Architecture**

This document serves as the single source of truth for the project's refactoring. It systematically eliminates architectural conflicts, and removes technical debt.

### **Part 1: The Amended Rectification Plan**

#### **Phase 1: Critical System Stabilization (Immediate Priority)**

The goal of this phase is to fix the broken foundation by resolving core conflicts.

**1.1. Unify Event Handling:**

  * **Action:** The `features/canvas/components/UnifiedEventHandler.tsx` component will be the **sole authority** for all canvas-related events.
  * **Steps:**
    1.  Audit the logic within `utils/state/EventHandlerManager.ts` and `_legacy_archive/stores/EventHandlerManager.ts`.
    2.  Migrate any essential, non-duplicated logic into `UnifiedEventHandler.tsx`.
    3.  Delete both `EventHandlerManager.ts` files from the repository.
    4.  Update all component references to work exclusively with `UnifiedEventHandler.tsx`.

**1.2. Consolidate State Management:**

  * **Action:** The `features/canvas/stores/unifiedCanvasStore.ts` will be the **single source of truth** for all canvas state.
  * **Steps:**
    1.  Perform a global search for any import statement referencing `_legacy_archive/stores`.
    2.  Refactor every component and hook to select state and dispatch actions using only `unifiedCanvasStore`.
    3.  Create a new test store factory for the unified store and remove the legacy `createCanvasTestStore.ts` helper.

**1.3. Restore Core Component Hierarchy:**

  * **Action:** Re-establish the primary canvas component structure within the new feature-centric architecture.
  * **Steps:**
    1.  Create a new `CanvasContainer.tsx` component in the `features/canvas/components/` directory. This component will own the Konva `Stage`.
    2.  The existing `KonvaAppRefactored.tsx` will be moved to `features/canvas/components/` and renamed to `KonvaApp.tsx`.
    3.  `CanvasContainer.tsx` will render `KonvaApp.tsx`.
    4.  The top-level `CanvasPage.tsx` will render `<CanvasContainer />`, restoring the correct chain of responsibility.

-----

#### **Phase 2: Codebase Consolidation & Deletion**

The goal of this phase is to eliminate all duplicated and abandoned code.

**2.1. Purge the Legacy Archive:**

  * **Action:** The entire `_legacy_archive` directory will be **deleted** from the repository.
  * **Prerequisite:** All actions in Phase 1 must be complete.
  * **Verification:** The application must build and all tests must pass after deletion. This is a non-negotiable checkpoint.

**2.2. Standardize the Type System:**

  * **Action:** A single `features/canvas/types/canvas.types.ts` file will be the **single source of truth** for all canvas-related type definitions.
  * **Steps:**
    1.  Merge any necessary types from `types/types.ts` and `types/compatibility.ts` into `enhanced.types.ts`.
    2.  Rename the consolidated `enhanced.types.ts` file to `canvas.types.ts` and move it to `features/canvas/types/`.
    3.  Delete all other type definition files (`types.ts`, `compatibility.ts`, etc.).
    4.  Update all `import type` statements to point to the new single source of truth.

-----

#### **Phase 3: Architectural Refinement & Discipline**

The goal of this phase is to enforce clean architectural patterns for long-term maintainability.

**3.1. Enforce Component Responsibility:**

  * **Action:** Refactor canvas components to adhere to a strict separation of concerns within the `features/canvas` directory.
  * **Definitions:**
      * **Elements (`features/canvas/components/elements/`):** Smart components using the Zustand store.
      * **Shapes (`features/canvas/components/shapes/`):** Dumb Konva components for pure rendering.
      * **Renderers (`features/canvas/components/renderers/`):** Factory components mapping state to Shapes.
  * **Steps:**
    1.  Audit and refactor components in these directories to enforce their defined roles.

**3.2. Standardize File Organization:**

  * **Action:** Ensure all canvas-related files are located in their correct, logical directories under `features/canvas`.
  * **Steps:**
    1.  Move `components/ConnectorTool.tsx` to `features/canvas/components/tools/`.
    2.  Move all other canvas-specific components, hooks, and utils from the root `components`, `hooks`, and `utils` directories into their corresponding subdirectories within `features/canvas/`.

-----

#### **Phase 4: Verification and Optimization**

The goal of this phase is to validate the success of the rectification.

**4.1. Full Test Suite Execution:**

  * **Action:** Achieve a 100% pass rate on the entire test suite.
  * **Steps:**
    1.  Write new tests for the consolidated components (`CanvasContainer`, `KonvaApp`, `UnifiedEventHandler`).
    2.  Ensure all tests are updated to reflect the new file structure.
    3.  Delete all test files associated with the `_legacy_archive`.

**4.2. Performance Profiling:**

  * **Action:** Validate that canvas interactions meet performance benchmarks.
  * **Steps:**
    1.  Profile rendering performance during intense operations (zooming, panning, drawing).
    2.  Ensure smooth frame rates by leveraging `requestAnimationFrame` and `batchDraw`.
    3.  Verify viewport culling is active and effective.

-----

### **Part 2: The Target Folder Structure Blueprint**

Executing the plan above will result in the following clean and unambiguous architecture.

```
C:/PROJECTS/LIBREOLLAMA/SRC/
|
|   App.tsx               // Main application router and layout provider.
|   main.tsx              // Application entry point.
|
+---assets/               // Static assets like images, fonts, etc.
|
+---components/           // GLOBAL, REUSABLE UI COMPONENTS (Non-Canvas)
|   |
|   +---chat/             // Components for the chat feature.
|   +---dashboard/        // Components for the dashboard widgets.
|   +---layout/           // App layout components (TopBar, etc.).
|   +---navigation/       // App navigation components (Sidebar, etc.).
|   |
|   |   CommandPalette.tsx  // Remains a global component.
|   |   ThemeProvider.tsx   // Remains a global component.
|   |   ...etc
|
+---features/             // Self-contained business logic and components for major features.
|   |
|   +---canvas/           // *** THE HEART OF THE REFACTORED CANVAS FEATURE ***
|       |
|       +---components/   // All React components specific to the canvas.
|       |   |
|       |   +---elements/ // "Smart" components managing state for canvas items.
|       |   |   |   StickyNoteElement.tsx
|       |   |   |   UnifiedTextElement.tsx
|       |   |
|       |   +---renderers/ // "Factory" components that map state to shapes.
|       |   |   |   ElementRenderer.tsx
|       |   |   |   ConnectorRenderer.tsx
|       |   |
|       |   +---shapes/   // "Dumb" Konva components for pure rendering.
|       |   |   |   Rectangle.tsx
|       |   |   |   Text.tsx
|       |   |
|       |   +---tools/    // Components that implement canvas tool logic.
|       |   |   |   PenTool.tsx
|       |   |   |   ConnectorTool.tsx // MOVED to its correct, consolidated location.
|       |   |
|       |   |   CanvasContainer.tsx   // NEW: The primary owner of the Konva Stage.
|       |   |   KonvaApp.tsx          // RENAMED & MOVED: Manages layers and renders elements.
|       |   |   UnifiedEventHandler.tsx // CONSOLIDATED: The single authority for all events.
|       |
|       +---hooks/        // Custom hooks specific to canvas functionality.
|       |   |   useCanvasInteraction.ts
|       |   |   useTauriCanvas.ts
|       |
|       +---stores/       // Zustand state management for the canvas.
|       |   |   unifiedCanvasStore.ts // The single, authoritative store.
|       |
|       +---types/        // TypeScript definitions for the canvas.
|       |   |   canvas.types.ts     // RENAMED & MOVED: The single source of truth.
|       |
|       +---utils/        // Helper functions specific to the canvas.
|       |       coordinate-utils.ts
|       |       geometry-utils.ts
|
+---hooks/                // GLOBAL, app-wide hooks.
|       useCommandPalette.ts
|
+---pages/                // Top-level page components that map to routes.
|       Dashboard.tsx
|       CanvasPage.tsx      // This page will now simply render <CanvasContainer />.
|       ...etc
|
+---utils/                // GLOBAL, app-wide utility functions.
|
+---__tests__/             // Root test directory with a structure mirroring /src.
    |
    +---features/
        +---canvas/
            +---components/
            |   |   CanvasContainer.test.tsx
            |   |   UnifiedEventHandler.test.tsx
            |
            +---stores/
                |   unifiedCanvasStore.test.ts

```

This final structure is clean, robust, and directly aligned with our architectural standards. It is ready for future development.