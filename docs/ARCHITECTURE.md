# LibreOllama Implementation Guide & Architectural Patterns

**Last Updated**: August 28, 2025

## 1. Overview

This guide provides comprehensive implementation patterns, architectural decisions, and development best practices for the LibreOllama project. It is intended to be a living document that reflects the current state of the production code.

## 2. Core Architecture

### Frontend Architecture
- **Framework**: React 19 + TypeScript
- **State Management**: Zustand (with Immer middleware)
- **Desktop Framework**: Tauri
- **Build Tool**: Vite

### Backend Architecture
- **Language**: Rust (within the Tauri framework)
- **Database**: SQLite for local persistence
- **API Layer**: Secure command handlers exposed to the frontend

## 3. Feature Implementation Patterns

This section details established patterns and "lessons learned" from implementing key features. New development should adhere to these patterns to maintain consistency and quality.

### 3.1. Canvas System Patterns

The canvas is the most architecturally complex feature. Its patterns prioritize performance and maintainability.

- **Rendering**: The canvas is migrating to a pure `konva` renderer with an imperative, multi-layer pipeline following the KONVA_BASED_CANVAS.md blueprint. `NonReactCanvasStage` creates `background`, `main`, `preview-fast-layer`, and `overlay` layers. Legacy react-konva components are being phased out.
  - `BackgroundLayer`: For the static grid.
  - `MainLayer`: For most shapes, text, and connectors.
  - **Preview FastLayer**: A dedicated, GPU-accelerated layer for live previews (and images if needed).
  - `OverlayLayer`: For UI elements like selection boxes and the resize/rotate `Transformer`.
- **State Management**: A highly modular Zustand store (`unifiedCanvasStore`) manages all canvas state. It is composed of **8 distinct modules** (element, selection, viewport, etc.). State mutations are handled immutably via `immer`.
- **Performance**: 
  - **Viewport Culling**: The `useSpatialIndex` hook (using a QuadTree) is the single source of truth for determining which elements are visible. This is a critical optimization.
  - **Object Pooling**: The `KonvaNodePool` is used for drawing-heavy tools (Pen, Marker) to reuse Konva nodes and reduce garbage collection overhead.
- **Type Safety**: The canvas uses **Branded Types** (e.g., `type ElementId = Brand<string, 'ElementId'>`) to prevent ID misuse at compile time. All canvas elements are part of a **discriminated union** (`CanvasElement`) for type-safe rendering and updates.
- **Migration Status**: Currently in Phase 1 of the migration plan, with `NonReactCanvasStage` implemented and drawing tools using imperative FastLayer for previews.

> **For a complete, deep-dive analysis of the canvas system, refer to the `docs/CANVAS_ARCHITECTURE_AUDIT_UPDATED.md` document.**
> **For the current migration blueprint and implementation plan, refer to `docs/KONVA_BASED_CANVAS.md` and `docs/CANVAS_MIGRATION_PLAN.md`.**

### 3.2. Google Tasks Integration Patterns

**LESSON LEARNED**: Google Tasks API only stores DATE information, not DATETIME. Treating dates as datetime values causes timezone shifts.

- **Correct Date Handling**: Always parse only the date part (`YYYY-MM-DD`) from Google's RFC3339 timestamp and create a new `Date` object in the user's local timezone to avoid day-shifting bugs.
- **Selective Updates**: When updating a task, only include fields in the payload that have actually changed. This prevents accidental data corruption (e.g., unintentionally nullifying a date).
- **Component-Led Filtering**: Pass unfiltered data sets to components and let them handle their own view logic (e.g., showing/hiding completed tasks). Pre-filtering data in parent components or hooks can break component-level state.

```typescript
// CORRECT: Pass all tasks, let components filter
const allTasks = Object.values(unifiedTasks);
return { tasks: allTasks }; // Component now controls its own view
```

### 3.3. Notes Feature & Database Patterns

**LESSON LEARNED**: Always validate that the frontend service layer's data model perfectly matches the backend database schema before writing integration tests.

- **Data Transformation Layer**: Implement a dedicated transformation layer to map database responses (e.g., `folder_name`, numeric IDs) to the frontend's expected data model (e.g., `name`, string IDs).
- **Input Validation**: Validate user input on the frontend *before* making a service call to the backend. This provides immediate feedback and prevents invalid data from hitting the database.
- **Service Layer Pattern**: Use simple, exported async functions for individual service calls. A singleton service class can wrap these functions to manage instance-specific state like a `userId`.

## 4. Security Architecture

- **Authentication**: All Google integrations use the **OAuth 2.0 with PKCE** flow, which is essential for desktop application security.
- **Token Storage**: OAuth tokens are stored securely in the **OS keyring** via Tauri's native capabilities, never in `localStorage`.
- **XSS Protection**: Email and other HTML content is sanitized using **DOMPurify**. All external links are opened with `rel="noopener noreferrer"`.
- **State Management**: Sensitive data is excluded from persisted Zustand stores using the `partialize` middleware option.

## 5. Testing Strategy

**Last Updated**: August 28, 2025
**Overall Testing Health**: ✅ **STRONG (94% Pass Rate)**

### 5.1. Feature-by-Feature Testing Status

This table reflects the current state of test coverage and aligns with the `PROJECT_STATUS.md`.

| Feature | Score | Status | Location | Key Focus |
|---|---|---|---|---|
| **Canvas** | 98/100 | ✅ **EXEMPLARY** | `src/features/canvas/tests/` | Store-first unit tests. |
| **Chat System** | 95/100 | ✅ **EXEMPLARY** | `src/features/chat/tests/` | Real LLM integration tests. |
| **Tasks Management** | 95/100 | ✅ **EXEMPLARY** | `src/stores/__tests__/` | Local persistence & dnd kit. |
| **Gmail Integration** | 85/100 | ✅ **STRONG** | `src/tests/integration/gmail-*` | Mocked Tauri service tests. |
| **Backend Services** | 90/100 | ✅ **STRONG** | `src-tauri/src/tests/` | Individual command handlers. |
| **Calendar** | 40/100 | ⚠️ **NEEDS WORK** | Basic structure only | **GAP**: API integration. |

### 5.2. Critical Gaps & Next Steps

The primary testing gap is the lack of deep integration tests for features relying on Google APIs.

- **HIGH PRIORITY**: Add comprehensive integration tests for **Calendar-to-Tasks** workflows (e.g., drag-and-drop time blocking).
- **MEDIUM PRIORITY**: Resolve the few remaining test failures in the **Gmail** and **Backend** services related to OAuth configuration and scopes.
- **LOW PRIORITY**: Increase unit test coverage for smaller UI components and utility functions.

## 6. Development Workflow

### 6.1. Frontend Development
- Use `npm run dev` for the Vite dev server (frontend only).
- Use `npm run tauri:dev` to run the full desktop application.
- Follow the component and styling patterns outlined in `docs/DESIGN_SYSTEM.md`.

### 6.2. Rust Backend Development

Use the `cargo` toolchain for backend development. These commands are the equivalent of the TypeScript/ESLint workflow.

- `cargo check`: Fast, type-only compilation (like `tsc --noEmit`).
- `cargo clippy`: In-depth static analysis and linting (like ESLint).
- `cargo fmt`: Automatic code formatting (like Prettier).
- `cargo test`: Runs all unit and integration tests for the backend.

It is recommended to add these as scripts to `package.json` for easy access, e.g., `npm run tauri:check`.

## 7. Performance Considerations

This project takes performance seriously. The following are key strategies in use:

- **Canvas**: The canvas uses multiple advanced techniques. See Section 3.1 and the `CANVAS_ARCHITECTURE_AUDIT_UPDATED.md` for full details.
- **State Management**: Zustand's `subscribeWithSelector` is used to create fine-grained subscriptions to state, preventing unnecessary re-renders in components that only care about a small slice of the store.
- **Database**: For features using the SQLite database, ensure queries are performant by using indexed columns and implementing pagination for large data sets.
- **UI**: Use `React.memo` for components that render large lists and `useCallback` to memoize event handlers passed to them to prevent unnecessary re-renders.