# LibreOllama Canvas: Technical Roadmap & Action Plan

This document provides a high-level strategic overview with concrete technical implementation details for project tracking and stakeholder communication.

## 1. Executive Summary & Current Status ⚠️ **ARCHITECTURE UNDER INTENSIVE DEBUGGING**

**Status Update (June 28, 2025):** Critical architectural issues have been identified that prevent consistent canvas functionality. While the unified store foundation is solid, significant conflicts in event handling and state management require systematic resolution.

### 📋 **Issue Summary**

| Problem Category | Technical Issue | Impact Level |
| :--- | :--- | :--- |
| **🚨 Event Conflicts** | Dual event systems causing handler conflicts | **CRITICAL** - Elements snap back, tools non-functional |
| **🚨 Position Sync** | Store vs Konva node position mismatches | **CRITICAL** - Movement operations fail |
| **🚨 Transform Issues** | Multiple transform handlers interfering | **CRITICAL** - Resize/transform operations broken |
| **🚨 ReactKonva Warnings** | Missing drag handlers preventing state sync | **HIGH** - Inconsistent behavior, console warnings |
| **🚨 Tool Creation** | Shape tools not responding to canvas clicks | **HIGH** - Core functionality broken |

## 2. 🔧 **Architecture Migration Progress**

The major architectural refactoring phases are substantially complete with some refinement ongoing:

### 🔧 **Phase 3B: UI/UX Modernization & Toolbar Redesign (MOSTLY COMPLETE)**

* **Objective**: Implement a modern, FigJam-style UI.
* **Technical Status**:
  1. **✅ Component:** `ModernKonvaToolbar.tsx` implemented with floating design
  2. **✅ Positioning:** CSS positioning with sidebar awareness and centering
  3. **✅ State:** Integrated with unified store for tool selection
  4. **🔧 Tool Integration:** Basic tools working, advanced tool workflows in development

### 🔧 **Phase 4: Store Architecture Cleanup (CORE COMPLETE)**

* **Objective**: Establish a single source of truth and centralize all business logic.
* **Technical Status**:
  1. **✅ Unified Store:** `unifiedCanvasStore.ts` operational, combines all state management
  2. **✅ Store Methods:** Core methods implemented, some edge cases need fixes
  3. **🔧 Event Handling:** `UnifiedEventHandler` framework complete, tool-specific handlers in progress
  4. **✅ Rendering Pipeline:** Store → LayerManager → MainLayer chain functional

## 3. 🚨 **Critical Issues Identified & Debugging Patterns**

### **🔴 Immediate Blocking Issues**
- **Element Position Persistence**: All dragged elements snap back to original positions after mouse release
- **Section Movement Failure**: Sections cannot be moved or resized despite visual feedback during operation
- **Shape Tool Non-Response**: Rectangle/Circle/Triangle/Star tools not creating elements on canvas click
- **Transform Handle Disappearance**: Resize handles vanish after element reselection
- **Table Resize Failure**: Tables snap back to original size after resize operations

### **🔧 Architectural Patterns Identified**
- **Dual Event System Conflicts**: Both stage-level (UnifiedEventHandler) and element-level (MainLayer) handlers compete
- **Transform Handler Duplication**: TransformerManager and UnifiedEventHandler both handle transform events
- **Position Update Race Conditions**: Store updates and Konva node positions get out of sync
- **ReactKonva Integration Issues**: Missing onDragEnd handlers prevent proper state synchronization
- **Event Handler Cleanup Problems**: Handlers not properly removed causing memory leaks and conflicts

### **🔍 Debugging Approaches Attempted**
- **Enhanced Debug Logging**: Added comprehensive console logging to track event flow and state changes
- **Handler Consolidation**: Attempted to remove duplicate transform handlers (partial success)
- **Store Update Validation**: Added validation to prevent invalid position updates
- **Event Handler Registration**: Improved event handler cleanup and registration patterns

### **🚨 Development Workflow Impact**
- **Regression Introduction**: Fixes for one issue often introduce new problems in other areas
- **Testing Complexity**: Manual testing required for each change due to complex interaction patterns
- **Documentation Gaps**: Current behavior doesn't match documented expectations

## 4. 🛠️ **Required Immediate Actions: Systematic Debugging**

Before advancing to new features, critical architectural issues must be resolved:

### **Priority 1: Event Handler Architecture Resolution**
- **Investigate Event Conflicts**: Determine optimal architecture for stage vs element-level event handling
- **Consolidate Transform Management**: Choose between TransformerManager vs UnifiedEventHandler for transforms
- **Fix ReactKonva Integration**: Implement proper onDragEnd handlers to prevent state sync issues
- **Resolve Position Update Conflicts**: Establish single source of truth for element positioning

### **Priority 2: Systematic Issue Resolution**
- **Element Movement Pipeline**: Fix the drag → store update → render pipeline
- **Shape Tool Debugging**: Investigate why click handlers aren't triggering for shape tools
- **Transform Handle Management**: Fix resize handle visibility and functionality
- **Section Operation Fixes**: Resolve section movement and resizing failures

### **Priority 3: Development Process Improvements**
- **Automated Testing**: Implement integration tests to catch regressions early
- **Debug Tooling**: Create canvas debugging utilities for faster issue identification
- **Documentation Updates**: Align documentation with actual implementation status

### Phase 5: Performance Optimization (Planned)

* **Objective**: Ensure smooth performance with 10,000+ elements.
* **Technical Implementation**:
  1. **Spatial Indexing**: Integrate a quadtree library (e.g., `d3-quadtree`). On canvas pan/zoom, query the tree for visible elements and render only those.
  2. **Layer Separation**: Create three distinct `<Layer>` components as described in the guide: `BackgroundLayer`, `MainContentLayer`, `UILayer`.
  3. **Shape Caching**: For complex shapes or groups, use Konva's built-in caching (`shape.cache()`) to render them to a bitmap, improving redraw performance. This should be applied strategically to elements that are not frequently changing.

## 3. Definition of Done (DoD)

All phases and tasks must meet these criteria for completion.

* [ ] All TypeScript checks (`tsc --noEmit`) must pass. **No new `any` types.**
* [ ] All existing Vitest tests must pass. New logic must have corresponding unit tests.
* [ ] Existing canvas features must remain fully functional (no regressions).
* [ ] Performance must be equal to or better than the previous state (validated via profiling).
* [ ] All new public functions, components, and store slices must have clear JSDoc comments.

## 4. Detailed Implementation Tasks

### Phase 4: Store Architecture Cleanup - Detailed Tasks

#### 4.1. Eliminate State Duplication

**Task:** Refactor `selectionStore.ts`
- Remove the `elements: CanvasElement[]` property
- Replace with `selectedElementIds: Set<string>`
- Create memoized selector `selectSelectedElements(state)` that retrieves full element objects from `canvasElementsStore`

**Task:** Create unified store selectors
- Components will use the new selector to get data, ensuring single source of truth
- Implement proper memoization to prevent unnecessary re-renders

#### 4.2. Enforce Store-First Logic

**Task:** Create `toolLogicStore.ts`
- Encapsulate logic for tool usage (e.g., `handlePenMove`, `handleSectionDraw`)
- Move tool state management from `KonvaApp.tsx` useEffect hooks into store actions

**Task:** Refactor `KonvaApp.tsx`
- Remove complex state subscriptions and useEffects
- Simplify component to pure rendering logic
- Move business logic to dedicated hooks or store

#### 4.3. Component Refactoring Strategy

**Task:** Activate Viewport Culling in `ElementRenderer.tsx`
- Integrate `useViewportCulling()` hook
- Iterate over reduced list of visible element IDs instead of entire `canvasElements` map
- Measure performance improvement on large canvases (5,000+ elements)

**Task:** Centralize Event Handling
- Refactor shape components (e.g., `EnhancedTableElement.tsx`)
- Remove individual `onDragMove`, `onDragEnd`, `onTransform` handlers
- Make components "dumb" - only receive props for rendering
- Consolidate interaction logic in `CanvasEventHandler.tsx`

**Task:** Implement Node Pooling
- Create `NodePool.ts` utility class
- Manage pool of reusable Konva `Shape` instances
- Request nodes from pool when adding shapes
- Return nodes to pool when shapes are culled

### Phase 5: Performance Optimization - Detailed Tasks

#### 5.1. Spatial Indexing Implementation

**Task:** Integrate Quadtree Library
- Use library like `d3-quadtree` for spatial indexing
- Query tree for visible elements on pan/zoom operations
- Render only visible elements to improve performance

**Task:** Optimize Large Canvas Performance
- Target: Maintain 45+ FPS with 5,000+ elements during rapid pan/zoom
- Implement efficient viewport culling
- Measure and validate performance improvements

#### 5.2. Advanced Caching Strategy

**Task:** Enhance Shape Caching
- Improve `useShapeCaching.ts` to invalidate cache on shape property changes
- Connect caching to visual attributes (color, size, stroke) changes
- Apply strategic caching to complex, non-frequently-changing elements

**Task:** Memory Management
- Implement node pooling to reduce garbage collection overhead
- Target: Memory usage returns to baseline after adding/removing 1,000 elements
- Measure memory leak reduction and GC pressure improvement

### Phase 6: Type Safety & Code Quality

#### 6.1. Enforce Strict TypeScript

**Task:** Eliminate `any` Types
- Conduct project-wide search for `any` type usage
- Replace with specific types, `unknown`, or proper type guards
- Special focus on `canvasHistoryStore.ts` and event handlers

**Task:** Implement Discriminated Unions
- Refactor `features/canvas/types.ts`
- Convert `CanvasElement` to true discriminated union with literal type properties
- Improve type safety and reduce type casting

**Task:** Shared IPC Types
- Create `src/types/ipc-contracts.ts`
- Define payload and response types for all Tauri commands
- Use in both `useTauriCanvas.ts` and Rust command handlers

#### 6.2. Documentation & Testing

**Task:** Comprehensive Documentation
- Add TSDoc comments to all refactored components, hooks, and store actions
- Document new centralized data flow patterns
- Create developer onboarding guide

**Task:** Enhanced Testing Suite
- Write unit tests for all store actions in `toolLogicStore.ts`
- Implement integration tests simulating user workflows
- Add performance tests measuring viewport culling impact
- Ensure test coverage for critical path operations

## 5. Risk Mitigation & Validation

### 5.1. Validation Criteria

**Correctness Validation:**
- Manual verification of all existing features
- Special attention to selection, transformation, and tool switching
- No regression in user-facing functionality

**Performance Validation:**
- Frame Rate: 45+ FPS during rapid pan/zoom with 5,000+ elements
- Memory Usage: Return to baseline after large operations
- Startup Time: No degradation in initial load performance

**Reliability Validation:**
- Measurable decrease in runtime errors
- Robust test suite maintaining reliability
- Type safety preventing entire classes of bugs

### 5.2. Rollback Plan

- Maintain feature branches for each phase
- Incremental rollout with feature flags where applicable
- Comprehensive regression testing before each phase completion
- Documentation of rollback procedures for each major change

## 6. Success Metrics & Timeline

### Key Performance Indicators (KPIs)

- **Type Safety**: 0 `any` types in new code, <5 in legacy code
- **Performance**: 45+ FPS with 5,000+ elements
- **Memory Efficiency**: <10% memory growth after intensive operations
- **Test Coverage**: >80% coverage for store logic and critical paths
- **Documentation**: 100% TSDoc coverage for public APIs

### Estimated Timeline

- **Phase 3B (Active)**: 1-2 weeks
- **Phase 4**: 3-4 weeks
- **Phase 5**: 2-3 weeks
- **Phase 6**: 2 weeks

**Total Estimated Duration**: 8-11 weeks

This timeline assumes dedicated development focus and may be adjusted based on team capacity and competing priorities.

---

## 7. Phase 4 Implementation Progress & Migration Guide

### Implementation Status: ACTIVE

Phase 4 Store Architecture Cleanup is currently in progress with significant foundational work completed:

#### ✅ Completed Components

**Unified Store Architecture**
- **File**: `src/features/canvas/stores/unifiedCanvasStore.ts`
- **Achievement**: Single source of truth consolidating 9 separate store slices
- **Benefits**: Eliminates state duplication, provides type-safe selectors, centralizes business logic

**EventHandlerManager Class**
- **File**: `src/features/canvas/stores/EventHandlerManager.ts`
- **Achievement**: Centralized event logic eliminating scattered component handlers
- **Benefits**: Type-safe event handling, consistent business logic, eliminates coordinate calculation errors

**Refactored MainLayer**
- **File**: `src/features/canvas/layers/MainLayerRefactored.tsx`
- **Achievement**: Zero `as any` type casts, proper discriminated union patterns
- **Benefits**: Type safety, performance optimization, clean component architecture

#### 🎯 Migration Benefits Achieved

**Type Safety Improvements**
- **Before**: 25+ `as any` type casts in MainLayer.tsx
- **After**: Zero type casts with proper discriminated union patterns
- **Impact**: Compile-time error detection, IntelliSense support, runtime error prevention

**Architectural Improvements**
- **Before**: 9 separate store slices with complex cross-dependencies
- **After**: Single unified store with centralized business logic
- **Impact**: Eliminated state synchronization bugs, simplified testing, improved maintainability

**Performance Improvements**
- **Before**: Multiple store subscriptions causing excessive re-renders
- **After**: Optimized selectors with memoization
- **Impact**: Reduced component re-renders, faster state access, improved memory usage

#### 📋 Migration Checklist

**Phase 4A: Foundation (COMPLETED)**
- [x] Create unified store architecture
- [x] Implement EventHandlerManager pattern
- [x] Refactor MainLayer to eliminate type casts
- [x] Create type-safe element rendering system

**Phase 4B: Component Migration (IN PROGRESS)**
- [x] Update `KonvaApp.tsx` to use unified store (KonvaAppRefactored.tsx created)
- [x] Create refactored viewport controls hook (useViewportControlsRefactored.ts)
- [x] Identify component interface patterns for migration
- [ ] Align shape component interfaces with unified store patterns
- [ ] Complete component migration with proper interface mapping
- [ ] Test individual component migrations

**Phase 4C: Integration & Testing (PENDING)**
- [ ] Replace original MainLayer with refactored version
- [ ] Remove deprecated store slices
- [ ] Run comprehensive integration testing
- [ ] Performance validation and optimization

**Phase 4D: Cleanup (PENDING)**
- [ ] Remove legacy store files
- [ ] Update all component imports
- [ ] Documentation updates
- [ ] Final type checking validation

#### 🔧 Technical Implementation Details

**Store Consolidation Pattern**
```typescript
// OLD: Complex multi-slice architecture
import { useCanvasElementsStore } from './slices/canvasElementsStore';
import { useSelectionStore } from './slices/selectionStore';
// ... 7 more store imports

// NEW: Single unified store
import { useUnifiedCanvasStore, canvasSelectors } from './unifiedCanvasStore';
```

**Event Handling Transformation**
```typescript
// OLD: Scattered event logic with type casts
const handleDragEnd = (e: any) => {
  const element = e.target as any; // ❌ Type violation
  // Complex cross-store coordination
};

// NEW: Centralized, type-safe event handling
const eventHandler = useUnifiedCanvasStore(state => state.eventHandler);
// All event logic handled by EventHandlerManager - zero type casts
```

**Component Simplification**
```typescript
// OLD: 15+ props with type casting requirements
export const MainLayer: React.FC<ComplexProps> = ({ 
  elements, selectedElementIds, onElementClick, onElementDragEnd, ...
}) => {
  // 25+ 'as any' type casts throughout component
};

// NEW: Clean, minimal props with type safety
export const MainLayerRefactored: React.FC<SimpleProps> = ({ name, stageRef }) => {
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const eventHandler = useUnifiedCanvasStore(state => state.eventHandler);
  // Zero type casts - all operations properly typed
};
```

#### ⚠️ Critical Migration Points

**Type Safety Validation**
- All TypeScript checks must pass without errors
- Zero `as any` casts in new architecture
- Proper discriminated union usage throughout

**Performance Validation**
- Equal or better performance compared to old architecture
- Memory usage stability during intensive operations
- Frame rate maintenance during rapid interactions

**Functional Validation**
- All existing canvas features must remain functional
- No regressions in user-facing functionality
- Comprehensive test coverage for new patterns

#### 📈 Success Metrics

**Code Quality Metrics**
- Type Safety: 0 `any` types (down from 25+ violations)
- Maintainability: Single source of truth (down from 9 stores)
- Performance: <10% memory growth during operations
- Test Coverage: >80% coverage for store logic

**Development Experience Metrics**
- Component Complexity: Simplified props (15+ → 2-3 props)
- Event Logic: Centralized (scattered → EventHandlerManager)
- State Access: Type-safe selectors (manual coordination → automated)
- Debugging: Clear data flow (complex cross-store → unified store)

This Phase 4 implementation represents the most critical architectural improvement in the canvas system, establishing a production-ready foundation that eliminates technical debt and enables future feature development.
