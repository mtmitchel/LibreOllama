# LibreOllama Canvas Master Plan

> **Last Updated**: January 2025  
> **Status**: Phase 2B Critical Integration Fixes - Table Core Functionality Under Active Debug  
> **Architecture**: Konva.js + React-Konva + Zustand + TypeScript + React 19

## 📋 Executive Summary

The LibreOllama Canvas has completed its modular Zustand migration but critical core functionality gaps have been identified that prevent full production readiness. While the architectural foundation is sound, key features like table cell editing, text management, and drawing tools have integration issues preventing proper operation.

**Current Critical Issue**: Table cell editing is broken due to direct array mutation in `handleCellSave`, causing "Cannot assign to read only property" errors. User-reported issues include premature editor closing, text disappearing, and non-functional row/column operations.

**Key Findings**: The primary technical debt exists in state management anti-patterns where direct array mutation conflicts with Immer's immutable updates. The store contains properly implemented `updateTableCell` methods that should be used instead of direct DOM manipulation.

### Implementation Phases

**Phase 1: Foundation & Migration** ✅ COMPLETE  
**Phase 2A: Modular Store Migration** ✅ COMPLETE  
**Phase 2B: Critical Core Functionality Fixes** 🔴 CRITICAL - ACTIVE DEBUG  
**Phase 3A: Architectural Refactoring** ⏳ BLOCKED (pending Phase 2B)  
**Phase 3B: Performance Optimization** ⏳ PENDING

## 🎯 Current Implementation Status

### ✅ Phase 1: Foundation & Migration (100% Complete)

#### Tooling & Configuration
- ✅ **Vite Path Alias Configuration**: Properly configured with `resolve.alias`
- ✅ **TypeScript Strict Mode**: Enabled with all recommended settings
- ✅ **Modern Compiler Options**: Target ESNext, module bundler resolution
- ✅ **Dependencies Updated**: React 19, Konva 9.3.20, Zustand 5.0.5, latest versions
- ✅ **Fabric.js → Konva.js Migration**: Successfully completed June 2025

#### Basic Functionality
- ✅ **15+ Element Types**: All implemented and working
- ✅ **Rich Text System**: Unified editing with DOM portal integration
- ✅ **Enhanced Tables**: Excel-like functionality with 8-handle resize
- ✅ **Section System**: Organizational containers with templates
- ✅ **Pan/Zoom**: Smooth navigation with touch support
- ✅ **Undo/Redo**: 50-state history system
- ✅ **Persistence**: LocalStorage and Tauri file I/O

### 🔄 Phase 2: Architecture Refactoring & Integration

#### Phase 2A: Modular Store Migration ✅ COMPLETE
- ✅ **Zustand Store Slices**: Migrated to modular slice architecture
- ✅ **Hook Extraction**: All components use modular store hooks
- ✅ **TypeScript Integration**: Proper typing with useShallow selectors
- ✅ **Component Updates**: KonvaToolbar, MainLayer, TextShape updated
- ✅ **Import Path Migration**: All imports updated to new modular structure

#### Phase 2B: Critical Core Functionality Fixes 🔴 CRITICAL - ACTIVE DEBUG

**Table Cell Editing - CRITICAL BUG** 
- 🔴 **handleCellSave Array Mutation**: Direct mutation of `cell.content[0]` causes "Cannot assign to read only property" error
- 🔴 **Missing Store Integration**: Current implementation bypasses `updateTableCell` store method 
- 🔴 **Premature Editor Closing**: Cell editor closes on Enter key/mouse movement preventing text input
- 🔴 **Text Disappearing**: Cell content vanishes due to failed state updates from mutation errors
- 🔴 **Row/Column Operations**: Add/delete row/column functionality not working due to state management issues

**Analysis Complete**
- ✅ **Root Cause Identified**: EnhancedTableElement.tsx line 398 `cell.content[0] = newValue` mutates array directly
- ✅ **Solution Located**: Store has `updateTableCell(nodeId, rowIndex, colIndex, newValue)` method for immutable updates  
- ✅ **Reference Implementation**: `archives/src_backup_canvas_components/EnhancedTableElement_fixed.tsx` shows correct approach
- ✅ **Event Flow Traced**: DOM editor → handleCellSave → should call updateTableCell → re-render with new state

**Remaining Tasks**
- 🔴 **Refactor handleCellSave**: Replace direct mutation with `updateTableCell` store method call
- 🔴 **Fix Editor Lifecycle**: Ensure cell editor stays open until explicit save/cancel actions
- 🔴 **Integrate Row/Column Operations**: Wire add/delete operations through store methods
- 🔴 **Validate Text Editing**: Test cell content persistence and proper state synchronization

**General Integration Issues**
- 🟡 **Text Editing Portal**: SimpleTextEditor exists but portal integration needs validation  
- � **Section Rendering**: Sections stored separately, not included in visible elements
- � **Drawing State Management**: Drawing tools exist but missing state management  
- � **Event Handler Wiring**: Stage events not properly connected to drawing tools

#### React 19 Compatibility Issues
- ⚠️ **Portal Implementation**: Need React 19 compatible portal for text editing
- ⚠️ **Hook Naming Convention**: All Zustand hooks properly prefixed with 'use'
- ✅ **React-Konva Version**: Using v19.0.5 compatible with React 19

### ⏳ Phase 3A: Architectural Refactoring (0% Complete) - BLOCKED

**BLOCKED**: Cannot proceed with architectural refactoring until Phase 2B critical functionality is working. Table editing represents a fundamental state management pattern that must be correct before broader optimizations.

#### Priority After Phase 2B Resolution

#### Component Architecture - Monolith Decomposition
- 🔴 **Decompose KonvaCanvas.tsx**: 2000+ line monolith needs breaking into focused components
- 🔴 **Implement React.memo Strategy**: Prevent mass re-renders with granular subscriptions
- 🔴 **Remove Prop Spreading Anti-Pattern**: Replace `{...props}` with explicit prop passing
- 🔴 **Create EditableNode Wrapper**: Abstract selection/drag logic from shape rendering

#### State Management Architecture
- 🔴 **Optimize Store Structure**: Use object maps (Record<string, T>) for O(1) lookups vs arrays
- 🔴 **Implement Fine-Grained Selectors**: Subscribe to primitive values, not entire objects
- 🔴 **Fix Immer Anti-Patterns**: Ensure direct draft mutation without reassignment
- 🔴 **Add Selector Memoization**: Prevent new object creation in computed selectors

#### Custom Hooks Extraction
- 🔴 **useZoomPanControls**: Extract stage transformation logic
- 🔴 **useSelectionManager**: Handle single/multi-select and transformer logic
- 🔴 **useUndoRedo**: Encapsulate history stack management
- 🔴 **usePointerTransform**: Utility for coordinate conversion

### ⏳ Phase 3B: Performance Optimization (0% Complete)

#### True Multi-Layer Canvas Architecture
- 🔴 **Background Layer**: Static grid with `listening={false}` for performance
- 🔴 **Main Content Layer**: Primary shapes and elements
- 🔴 **Connector Layer**: Dedicated layer for line connections
- 🔴 **Interaction Layer**: Temporary layer for smooth dragging (critical for 60fps)
- 🔴 **UI/HUD Layer**: Selection transformers, tooltips, UI elements
- 🔴 **Overlay Layer**: HTML portals for rich text editing

#### Advanced Performance Features
- 🔴 **Strategic Shape Caching**: Cache complex shapes (paths, SVGs), avoid for simple shapes
- 🔴 **Enhanced Viewport Culling**: Optimize beyond MAX_VISIBLE_ELEMENTS constant
- 🔴 **Event Optimization**: Delegation, throttling with requestAnimationFrame
- 🔴 **Memory Optimization**: Diff-based history using Immer patches
- 🔴 **Production Logging**: Remove console.log statements from production builds

## 📊 Detailed Task Breakdown

### 🔴 CRITICAL - Phase 2B: Table Core Functionality (Blocking All Development)

The table editing system represents core state management patterns that must work correctly before any architectural refactoring. Direct array mutation issues discovered here likely exist elsewhere in the codebase.

#### 1. **Fix Table Cell Editing Core Bug** ⚡ IMMEDIATE
   - **Current Bug**: `cell.content[0] = newValue` in handleCellSave causes immutability violation
   - **Error**: "Cannot assign to read only property '0' of object '[object Array]'"
   - **Impact**: Cell editing completely broken, affects user workflow
   - **Solution**: Replace with `updateTableCell(nodeId, rowIndex, colIndex, newValue)` store call
   - **Files**: `src/features/canvas/components/EnhancedTableElement.tsx` line ~398
   - **Reference**: `archives/src_backup_canvas_components/EnhancedTableElement_fixed.tsx`
   - **Priority**: **CRITICAL** - Blocks core functionality
   - **Effort**: Small (1-2 hours)

#### 2. **Fix Cell Editor Lifecycle Management** ⚡ HIGH
   - **Current Issue**: Editor closes prematurely on Enter key and mouse movement
   - **User Impact**: Cannot enter multi-word text, frustrating user experience
   - **Root Cause**: Event handling conflicts between DOM editor and Konva stage
   - **Solution**: Improve event propagation control and editor focus management
   - **Priority**: **CRITICAL** - Core UX issue
   - **Effort**: Medium (4-6 hours)

#### 3. **Restore Row/Column Add/Delete Operations** ⚡ HIGH
   - **Current Issue**: Add/delete row/column buttons present but non-functional
   - **Analysis**: Likely similar state mutation issues as cell editing
   - **Solution**: Ensure all table operations use store methods (addTableRow, deleteTableRow, etc.)
   - **Priority**: **HIGH** - Core table functionality
   - **Effort**: Medium (2-4 hours)

#### 4. **Validate Table State Synchronization** ⚡ MEDIUM
   - **Requirement**: Ensure cell edits persist correctly through undo/redo
   - **Test**: Create table, edit cells, verify state consistency
   - **Solution**: Validate updateTableCell integrates properly with history system
   - **Priority**: **MEDIUM** - Quality assurance
   - **Effort**: Small (1-2 hours)

### 🔴 Critical Architectural Refactoring (Post-2B - High Priority)

Based on the comprehensive architectural review, these are the highest-priority items that must be addressed after Phase 2B completion to achieve 60fps performance:

#### 5. **Decompose Monolithic KonvaCanvas.tsx Component** 
   - **Issue**: 2000+ line component hinders maintenance and performance optimization
   - **Target Architecture**:
     ```
     <CanvasContainer>       # Data fetching & store setup
       <Stage>               # Konva stage management
         <LayerManager>      # Multi-layer architecture
           <NodeRenderer>    # Iterates node IDs, dispatches to shapes
             <ShapeComponent id={id} />  # Memoized, self-subscribing
               <RectangleNode>, <TextNode>, etc.
     ```
   - **Impact**: Enables granular re-renders, improves maintainability
   - **Priority**: **CRITICAL** - Foundation for all other optimizations
   - **Effort**: Large (2-3 days)

#### 6. **Implement React.memo with Explicit Props Strategy**
   - **Current Anti-Pattern**: `<Rect {...konvaElementProps} />` defeats React.memo
   - **Required Pattern**: `<Rect x={node.x} y={node.y} width={node.width} fill={node.fill} />`
   - **Rule**: Shape components must subscribe to their own state via `id` prop
   - **Impact**: Prevents cascade re-renders when single shape changes
   - **Priority**: **CRITICAL** - Core performance fix
   - **Effort**: Medium (1-2 days)

#### 7. **Restructure Zustand Store for O(1) Performance**
   - **Current**: Arrays for element storage (O(n) lookup)
   - **Required**: Object maps `Record<string, NodeData>` (O(1) lookup)
   - **Implementation**:
     ```typescript
     interface CanvasState {
       elements: Record<string, NodeData>; // O(1) lookup
       selection: string[];
       // ... other state
     }
     ```
   - **Impact**: Eliminates array search bottlenecks as canvas scales
   - **Priority**: **HIGH** - Scalability foundation  
   - **Effort**: Medium (1 day)

#### 8. **Fix Immer Usage Anti-Patterns Throughout Codebase**
   - **Critical Discovery**: Table cell editing bug reveals broader Immer anti-pattern issues
   - **Correct Pattern**: Direct draft mutation only
     ```typescript
     updateNodePosition: (nodeId, newPosition) => set((state) => {
       state.elements[nodeId].position = newPosition; // ✓ Correct
     })
     ```
   - **Anti-Pattern**: Reassigning state tree parts breaks Immer tracking
   - **Audit Required**: Search codebase for similar direct mutation patterns
   - **Impact**: Ensures proper immutability and change detection
   - **Priority**: **HIGH** - State consistency (table bug is symptom of broader issue)
   - **Effort**: Medium (1 day audit + fixes)

#### 9. **Implement Fine-Grained Selectors**
   - **Current**: Components subscribe to entire objects
   - **Required**: Subscribe to primitive values only
   - **Examples**:
     - Bad: `useStore(state => state.elements[id])`
     - Good: `useStore(state => state.elements[id]?.position.x)`
   - **Tool**: Add reselect for memoized computed selectors
   - **Impact**: Prevents re-renders from irrelevant state changes
   - **Priority**: **HIGH** - Re-render optimization
   - **Effort**: Medium (1 day)

### 🟡 Important Architecture Tasks (Post-2B)

#### 10. **Extract Logic into Custom Hooks**
   - **useZoomPanControls**: Stage transformation logic
   - **useSelectionManager**: Selection and transformer logic  
   - **useUndoRedo**: History stack management
   - **usePointerTransform**: Coordinate conversion utilities
   - **Impact**: Reusable logic, cleaner components
   - **Priority**: **MEDIUM** - Maintainability
   - **Effort**: Large (2-3 days)

#### 11. **Implement EditableNode Wrapper Pattern**
   ```typescript
   <EditableNode id={node.id}>
     <RectangleNode data={node} />
   </EditableNode>
   ```
   - **Purpose**: Decouple visual rendering from interaction logic
   - **Benefits**: Reusable selection/drag behavior
   - **Impact**: Cleaner shape components, better composition
   - **Priority**: **MEDIUM** - Architecture improvement
   - **Effort**: Medium (1-2 days)

### 🟢 Performance Optimization Tasks (Post-Architecture)

#### 12. **Implement True Multi-Layer Architecture**
   - **Background Layer**: Static grid, `listening={false}`
   - **Main Content Layer**: Primary shapes
   - **Interaction Layer**: Temporary layer for smooth dragging (60fps critical)
   - **UI Layer**: Transformers, tooltips
   - **Overlay Layer**: HTML portals
   - **Impact**: Only affected layers redraw, massive performance gain
   - **Priority**: **HIGH** - Performance critical
   - **Effort**: Large (2-3 days)

#### 13. **Strategic Shape Caching Implementation**
   - **Cache**: Complex shapes (paths, SVGs, groups with filters)
   - **Avoid**: Simple rectangles/circles (overhead > benefit)
   - **Implementation**: useEffect with dependency array for cache invalidation
   - **Impact**: Trade memory for rendering performance
   - **Priority**: **MEDIUM** - Performance optimization
   - **Effort**: Medium (1 day)

#### 14. **Event System Optimization**
   - **Event Delegation**: Single listener on Layer vs individual shapes
   - **Throttling**: requestAnimationFrame for high-frequency events
   - **listening={false}**: All non-interactive elements
   - **perfectDrawEnabled={false}**: Shapes with fill+stroke
   - **Impact**: Reduced event overhead, smoother interactions
   - **Priority**: **MEDIUM** - Interaction performance
   - **Effort**: Medium (1 day)

## 📁 Target Architecture & File Structure

### Recommended Component Hierarchy
```
<CanvasContainer>                    # Top-level data fetching & store setup
  <Stage>                           # Konva stage management
    <LayerManager>                  # Multi-layer orchestration
      <BackgroundLayer listening={false}>     # Static grid, watermarks
      <MainContentLayer>            # Primary shapes and elements
        <NodeRenderer>              # Iterates node IDs from store
          <EditableNode id={nodeId}>  # Selection/drag wrapper
            <ShapeComponent />      # Memoized shape (Rectangle, Text, etc.)
      <ConnectorLayer>              # Dedicated line connections
      <InteractionLayer>            # Temporary drag layer (60fps critical)
      <UILayer>                     # Transformers, tooltips
      <OverlayLayer>                # HTML portals for rich text
```

### Feature-Based Directory Structure
```
src/
├── features/canvas/              # Canvas feature module
│   ├── components/              # Canvas UI components
│   │   ├── CanvasContainer.tsx
│   │   ├── LayerManager.tsx
│   │   └── NodeRenderer.tsx
│   ├── layers/                  # Layer components
│   │   ├── BackgroundLayer.tsx
│   │   ├── MainContentLayer.tsx
│   │   ├── InteractionLayer.tsx
│   │   └── UILayer.tsx
│   ├── shapes/                  # Individual shape components
│   │   ├── EditableNode.tsx     # Wrapper for selection/drag
│   │   ├── RectangleNode.tsx
│   │   ├── TextNode.tsx
│   │   └── StickyNoteNode.tsx
│   ├── hooks/                   # Canvas-specific hooks
│   │   ├── useZoomPanControls.ts
│   │   ├── useSelectionManager.ts
│   │   ├── useUndoRedo.ts
│   │   └── usePointerTransform.ts
│   ├── stores/                  # Modular Zustand stores
│   │   ├── canvasElementsStore.ts
│   │   ├── canvasUIStore.ts
│   │   └── selectors/           # Memoized selectors
│   └── utils/                   # Canvas utilities
│       ├── coordinates.ts
│       ├── performance.ts
│       └── caching.ts
│
├── features/toolbar/             # Toolbar feature
├── features/properties/          # Properties panel
│
├── components/                   # Global reusable UI
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── Portal.tsx
│
└── hooks/                        # Global app-wide hooks
    ├── useDebounce.ts
    └── useThrottle.ts
```

### Current vs Target Migration
```
CURRENT (Legacy):                 TARGET (Modular):
├── components/canvas/           ├── features/canvas/
│   ├── KonvaCanvas.tsx (2000+)  │   ├── components/ (multiple focused)
│   ├── MainLayer.tsx            │   ├── layers/ (specialized layers)
│   └── shapes/ (mixed)          │   └── shapes/ (pure, memoized)
│
├── stores/                      ├── features/canvas/stores/
│   └── konvaCanvasStore.ts      │   ├── canvasElementsStore.ts
                                 │   └── canvasUIStore.ts
```

## 🚀 Prioritized Implementation Roadmap

### Phase 2B: Critical Table Functionality (IMMEDIATE - THIS WEEK)

**Day 1: Core Table Debugging (4-6 hours)**
- [ ] **Fix handleCellSave Array Mutation**: Replace `cell.content[0] = newValue` with `updateTableCell` store call
- [ ] **Test Cell Editing**: Verify text input works and persists correctly
- [ ] **Debug Editor Lifecycle**: Fix premature closing on Enter/mouse movement
- [ ] **Validate Store Integration**: Ensure table operations flow through Zustand properly

**Day 2: Table Operations Completion (4-6 hours)**
- [ ] **Fix Row/Column Operations**: Ensure add/delete row/column use store methods
- [ ] **Test Resize Functionality**: Verify 8-handle resize works correctly
- [ ] **Validate Undo/Redo**: Test table operations in history system
- [ ] **Smoke Test All Features**: Complete table functionality validation

**Success Criteria for Phase 2B**
- [ ] Cell editing works without errors
- [ ] Text persists through edit cycles
- [ ] Add/delete row/column functional
- [ ] Table resize operations work
- [ ] No console errors during table operations
- [ ] Undo/redo works with table changes

### Phase 3A: Architectural Refactoring (POST-2B - Weeks 2-4)

**BLOCKED UNTIL PHASE 2B COMPLETION**

#### Week 2: Foundation Refactoring (16-20 hours)
**Day 1-2: Component Decomposition (Critical)**
- [ ] Break down KonvaCanvas.tsx monolith into focused components
- [ ] Create CanvasContainer, LayerManager, NodeRenderer hierarchy
- [ ] Implement React.memo on all shape components
- [ ] Replace prop spreading with explicit prop passing

**Day 3: Store Architecture & Immer Pattern Audit (High Impact)**
- [ ] Restructure Zustand store to use Record<string, T> for O(1) lookups  
- [ ] **Critical**: Audit entire codebase for Immer anti-patterns like table bug
- [ ] Fix all instances of direct array/object mutation in state updates
- [ ] Implement fine-grained selectors for primitive subscriptions
- [ ] Add reselect for memoized computed selectors

#### Week 3: Multi-Layer Architecture (12-16 hours)
**Day 1-2: Layer Implementation (Performance Critical)**
- [ ] Implement BackgroundLayer with listening={false}
- [ ] Create separate MainContentLayer
- [ ] Build InteractionLayer for smooth dragging (60fps critical)
- [ ] Add UILayer for transformers and tooltips
- [ ] Implement OverlayLayer for HTML portals

**Day 3: EditableNode Pattern**
- [ ] Create EditableNode wrapper component
- [ ] Implement selection/drag logic abstraction
- [ ] Decouple interaction behavior from visual rendering
- [ ] Update all shape components to use wrapper

**Day 4-5: Custom Hooks Extraction**
- [ ] Extract useZoomPanControls hook
- [ ] Extract useSelectionManager hook  
- [ ] Extract useUndoRedo hook
- [ ] Extract usePointerTransform hook

#### Week 4: Performance Optimization (8-12 hours)
**Day 1-2: Event System & Caching**
- [ ] Implement event delegation at layer level
- [ ] Add requestAnimationFrame throttling for high-frequency events
- [ ] Apply listening={false} to all non-interactive elements
- [ ] Implement strategic shape caching for complex elements

**Day 2-3: Memory & History Optimization**
- [ ] Replace full-state undo/redo with Immer patch-based system
- [ ] Remove production console.log statements
- [ ] Add performance monitoring and metrics
- [ ] Implement viewport culling enhancements

### Phase 3B: Polish & Enhancement (FUTURE)

#### Week 5+: User Experience (6-8 hours)
- [ ] Enhanced table cell text editing with proper ID mapping (building on Phase 2B fixes)
- [ ] Improved drawing tool visual feedback
- [ ] Better error boundaries and recovery mechanisms
- [ ] Advanced selection tools (lasso, multi-select)

### Validation Criteria for Each Phase

#### Phase 2B Success Criteria (Must Meet Before 3A)
- **Table Functionality**: All cell editing, row/column operations work without errors
- **State Consistency**: No direct mutation errors, proper store integration
- **User Experience**: Smooth editing workflow, no premature editor closing
- **Persistence**: Table operations work correctly with undo/redo system

#### Phase 3A Performance Targets (Must Meet)
- **Render Time**: < 16ms for 1000+ elements
- **Interaction Latency**: < 50ms for drag/resize operations
- **Memory Usage**: < 200MB for typical canvas
- **Frame Rate**: Consistent 60fps during interactions
- **Undo/Redo**: < 100ms for history operations

#### Phase 3A Code Quality Gates
- **Component Size**: No component > 200 lines
- **Store Slice Size**: No store slice > 300 lines
- **TypeScript Strict**: Zero type errors
- **Prop Spreading**: Eliminated from all shape components
- **React.memo**: Applied to all frequently re-rendering components

## 📈 Success Metrics

### Performance Targets
- **Render Time**: < 16ms for 1000+ elements
- **Interaction Latency**: < 50ms for drag/resize
- **Memory Usage**: < 200MB for typical canvas
- **Undo/Redo**: < 100ms for history operations

### Code Quality Targets
- **Component Size**: No component > 200 lines
- **Store Size**: No store slice > 300 lines  
- **Test Coverage**: > 80% for critical paths
- **TypeScript Strict**: Zero type errors

### User Experience Targets
- **60 FPS**: During all interactions
- **Instant Feedback**: No perceived lag
- **Smooth Animations**: Professional transitions
- **Reliable State**: No sync issues

## 🔧 Technical Debt & Anti-Pattern Log

### Critical Anti-Patterns Identified (Must Fix)

#### **PHASE 2B BLOCKERS** ⚡

#### 0. **Table Cell Array Mutation Anti-Pattern** - CRITICAL
- **Current**: `cell.content[0] = newValue` in EnhancedTableElement.tsx line 398
- **Problem**: Direct mutation of Immer-managed state causes "Cannot assign to read only property" error  
- **Solution**: Replace with `updateTableCell(nodeId, rowIndex, colIndex, newValue)` store method
- **Impact**: Breaks core table editing functionality completely
- **Status**: **IDENTIFIED** - Ready for immediate fix
- **Priority**: **CRITICAL** - Blocking all table usage

#### **ARCHITECTURAL DEBT** (Post-2B)

#### 1. **Monolithic Component Structure**
- **Current**: KonvaCanvas.tsx (2000+ lines)
- **Problem**: Hinders maintenance, optimization, and cognitive load
- **Solution**: Decompose into focused components per hierarchy
- **Priority**: CRITICAL

#### 2. **Prop Spreading Anti-Pattern**
- **Current**: `<Rect {...konvaElementProps} />`
- **Problem**: Defeats React.memo, obscures dependencies, causes unnecessary re-renders
- **Solution**: Explicit prop passing: `<Rect x={node.x} y={node.y} width={node.width} />`
- **Priority**: CRITICAL

#### 3. **Array-Based Element Storage**
- **Current**: Elements stored in arrays requiring O(n) searches
- **Problem**: Performance degrades linearly with canvas size
- **Solution**: Record<string, T> object maps for O(1) lookup
- **Priority**: HIGH

#### 4. **Immer Usage Anti-Patterns Throughout Codebase** 
- **Current**: Table bug reveals systemic issue - direct mutations in other state updates
- **Problem**: Breaks change tracking, defeats immutability purpose across multiple features
- **Solution**: Audit entire codebase for similar patterns, fix systematically
- **Impact**: Potential hidden bugs in other editing workflows
- **Priority**: **HIGH** - Systematic issue requiring codebase audit

#### 5. **Object Creation in Selectors**
- **Current**: Selectors return new objects/arrays on every call
- **Problem**: Breaks React.memo shallow comparison, triggers re-renders
- **Solution**: Subscribe to primitives, use reselect for memoization
- **Priority**: HIGH

### Memory & Performance Issues

#### 6. **Full-State Undo/Redo History**
- **Current**: Complete state snapshots for every history entry
- **Problem**: Memory-intensive, garbage collection pressure
- **Solution**: Immer patch-based diff history
- **Priority**: MEDIUM

#### 7. **Production Console Logging**
- **Current**: Extensive console.log in store actions
- **Problem**: Performance degradation, memory pressure
- **Solution**: Guard statements or build-time removal
- **Priority**: MEDIUM

#### 8. **Single Layer Architecture**
- **Current**: All canvas content in single Konva Layer
- **Problem**: Full layer redraws on any change, poor 60fps performance
- **Solution**: Multi-layer with interaction layer for smooth dragging
- **Priority**: HIGH

### Architecture Debt

#### 9. **Scattered Canvas Logic**
- **Current**: Canvas logic spread across multiple directories
- **Problem**: Hard to maintain, find, and test related functionality
- **Solution**: Feature-based structure with co-located files
- **Priority**: MEDIUM

#### 10. **Missing Event Optimization**
- **Current**: Individual event listeners on every shape
- **Problem**: Event overhead scales linearly with elements
- **Solution**: Event delegation at layer level
- **Priority**: MEDIUM

### Tooling & Configuration

#### 11. **Legacy Code Cleanup** 
- **Current**: Old `/components/canvas/` files alongside new structure  
- **Problem**: Confusion, potential import conflicts
- **Solution**: Complete migration and cleanup after Phase 2B + 3A completion
- **Priority**: **LOW** - Cleanup after major fixes

## 📚 Implementation Guidelines & Best Practices

### Zustand + Immer Best Practices

#### ✅ Correct Patterns
```typescript
// ✅ Direct draft mutation (Immer golden rule)
updateNodePosition: (nodeId, newPosition) => set((state) => {
  state.elements[nodeId].position = newPosition;
});

// ✅ Object map for O(1) performance
interface CanvasState {
  elements: Record<string, NodeData>; // Not Array<NodeData>
  selection: string[];
}

// ✅ Fine-grained selectors for primitives
const x = useStore(state => state.elements[id]?.position.x);
```

#### ❌ Anti-Patterns to Avoid
```typescript
// ❌ Reassigning state tree (breaks Immer)
state.elements[id] = { ...newData };

// ❌ Creating new objects in selectors (breaks React.memo)
const selectedElements = useStore(state => 
  state.selection.map(id => state.elements[id]) // New array every time
);

// ❌ Subscribing to entire objects
const node = useStore(state => state.elements[id]); // Re-renders on any property
```

### React-Konva Performance Patterns

#### ✅ Memoized Shape Components
```jsx
const RectangleNode = React.memo(({ id }) => {
  const x = useStore(state => state.elements[id]?.position.x);
  const y = useStore(state => state.elements[id]?.position.y);
  const width = useStore(state => state.elements[id]?.width);
  const fill = useStore(state => state.elements[id]?.fill);
  
  return <Rect x={x} y={y} width={width} fill={fill} />;
});
```

#### ✅ Multi-Layer Architecture
```jsx
<Stage>
  <Layer listening={false}>         {/* Background - no events */}
    <GridBackground />
  </Layer>
  <Layer>                          {/* Main content */}
    <NodeRenderer />
  </Layer>
  <Layer>                          {/* Interaction - smooth dragging */}
    <DragLayer />
  </Layer>
  <Layer>                          {/* UI overlays */}
    <Transformer />
  </Layer>
</Stage>
```

#### ✅ Strategic Shape Caching
```jsx
const ComplexShape = ({ id }) => {
  const shapeRef = useRef(null);
  const [width, height, fill] = useStore(state => [
    state.elements[id]?.width,
    state.elements[id]?.height,
    state.elements[id]?.fill
  ]);
  
  // Re-cache when visual properties change
  useEffect(() => {
    shapeRef.current?.cache();
  }, [width, height, fill]);
  
  return <Path ref={shapeRef} data={complexPath} />;
};
```

### Event Optimization Patterns

#### ✅ Event Delegation
```jsx
<Layer 
  onMouseDown={(e) => {
    const clickedNode = e.target;
    if (clickedNode.attrs.id) {
      handleNodeClick(clickedNode.attrs.id);
    }
  }}
>
  {/* Individual shapes don't need onClick */}
</Layer>
```

#### ✅ Throttled High-Frequency Events
```jsx
const throttledDragMove = useCallback(
  throttle((e) => {
    updateNodePosition(e.target.attrs.id, {
      x: e.target.x(),
      y: e.target.y()
    });
  }, 16), // 60fps
  []
);
```

### Component Architecture Guidelines

#### ✅ EditableNode Wrapper Pattern
```jsx
const EditableNode = ({ id, children }) => {
  const isSelected = useStore(state => state.selection.includes(id));
  
  return (
    <Group>
      {children}
      {isSelected && <Transformer attachTo={shapeRef} />}
    </Group>
  );
};

// Usage:
<EditableNode id={node.id}>
  <RectangleNode id={node.id} />
</EditableNode>
```

#### ✅ Custom Hook Composition
```jsx
const useCanvasInteraction = (nodeId) => {
  const selection = useSelectionManager();
  const transform = usePointerTransform();
  const history = useUndoRedo();
  
  const handleDrag = useCallback((e) => {
    const newPos = transform.stageToCanvas(e.target.position());
    selection.updatePosition(nodeId, newPos);
    history.saveState();
  }, [nodeId, selection, transform, history]);
  
  return { handleDrag };
};
```

## 📚 Reference Documents & Research

- **Architectural Review**: Comprehensive analysis covering foundational tooling, state management, React-Konva optimization, and performance strategies
- **Current Guide**: `CANVAS_COMPLETE_GUIDE.md` - User-facing documentation
- **Text System Update**: `CANVAS_TEXT_EDITING_UPDATE.md` - Recent fixes
- **Migration Log**: `KONVA_IMPLEMENTATION_COMPLETE.md` - Fabric.js migration

### Key Research Findings Integration

This master plan has been enhanced with findings from a comprehensive architectural review that identified:

1. **Performance Bottlenecks**: Excessive re-rendering due to monolithic components and sub-optimal state patterns
2. **Architecture Gaps**: Single-layer canvas limiting 60fps performance during interactions
3. **Anti-Patterns**: Prop spreading, array-based storage, Immer misuse breaking optimization
4. **Scalability Issues**: O(n) lookups and memory-intensive history system

The updated roadmap addresses these systematically with prioritized, actionable solutions.

## 🎯 Next Actions & Decision Points

### Immediate (TODAY)
1. **Fix Table Cell Editing Bug**: Replace handleCellSave array mutation with updateTableCell store call
2. **Test Cell Editor Lifecycle**: Ensure editor stays open for proper text input
3. **Validate Row/Column Operations**: Confirm add/delete functionality works through store

### This Week (Phase 2B Completion)
1. **Complete Table Feature Validation**: Test all table functionality end-to-end
2. **Document Table Fix**: Update implementation notes for future reference  
3. **Smoke Test Other Features**: Ensure table fixes don't break other canvas functionality

### Next Week (Phase 3A Planning)
1. **Codebase Immer Audit**: Search for similar direct mutation patterns revealed by table bug
2. **Architecture Planning**: Detailed breakdown of component decomposition strategy  
3. **Performance Baseline**: Establish metrics before architectural refactoring

### Milestone Gates
- **Week 1 (Phase 2B)**: Table editing fully functional, no console errors
- **Week 2**: Component decomposition + React.memo implementation  
- **Week 3**: Multi-layer architecture + store optimization
- **Week 4**: Performance validation + optimization fine-tuning

### Success Criteria Validation
- **Phase 2B**: Table editing works reliably without state mutation errors
- **Phase 3A**: Consistent 60fps with 1000+ elements
- **Overall**: Maintainable codebase with clear separation of concerns

---

*This master plan is a living document reflecting current debugging status and architectural analysis. Updated January 2025 to reflect critical table functionality bugs blocking development progress. Phase 2B completion is prerequisite for all architectural optimization work.*