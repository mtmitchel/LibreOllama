# LibreOllama Canvas - Development Roadmap
### ✅ Phase 2B: Critical Integration Fixes - Text Editing Complete (75% Complete)
> **Last Updated**: June 18, 2025  
> **Status**: Phase 2B Critical Integration Fixes - Text Editing and Font System Complete  
> **Architecture**: Konva.js + React-Konva + Zustand + TypeScript + React 19

## 📋 Executive Summary

**MAJOR PROGRESS UPDATE (June 18, 2025)**: Successfully completed text editing overlay system and design system font integration, building on the previously completed table cell editing system.

**Recent Achievements**:
- ✅ **Text Editing System Complete**: Portal-based text editing with perfect alignment during canvas transformations
- ✅ **Design System Font Integration**: All text elements now consistently use Inter font from Google Fonts
- ✅ **Clean Visual Design**: Removed aggressive styling, implemented professional design system standards
- ✅ **Table Editing Complete**: All table operations functional with real-time cell editor positioning
- ✅ **React-Konva Portal Integration**: Resolved reconciler conflicts with proper DOM portal separation
- ✅ **Store Migration Complete**: Fully migrated from legacy konvaCanvasStore to modular Zustand store

**Remaining Integration Gaps**: With table and text editing systems now complete, the primary remaining integration issues are drawing tools, connectors, sections rendering, and image uploads. The focus continues to be **integration problems, not performance problems** - components exist but need proper wiring.

**Strategic Approach**: Continue with **"Make it work, then make it fast"** - complete remaining feature integration, then stabilize the codebase, and only then optimize performance. The successful completion of table and text editing demonstrates this approach is highly effective.

**Current Focus**: Complete remaining integration work for drawing tools, connectors, section rendering, and image uploads while maintaining the stable foundation established with table and text functionality.

## 🎯 Implementation Phases

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

### ✅ Phase 2A: Modular Store Migration (100% Complete)

#### Store Architecture Improvements
- ✅ **Zustand with Immer**: Immutable state updates with better performance
- ✅ **TypeScript Integration**: Strict typing for store methods and state
- ✅ **Performance Optimization**: Reduced unnecessary re-renders
- ✅ **State Persistence**: Robust local storage with error handling

### � Phase 2B: Critical Integration Fixes (PHASE 1 - 40% Complete)

**Status Update**: This is now **PHASE 1** with highest priority. All integration gaps must be resolved before proceeding to any architectural optimization work.

**Core Philosophy**: Integration problems require integration solutions, not architectural rewrites. Focus on connecting existing components to the rendering pipeline first.

#### ✅ Completed Integration Items
- ✅ **Multi-Layer Architecture**: Separate Konva layers implemented with performance optimization
- ✅ **Basic Shape Rendering**: Rectangle, Circle, Triangle, Star with EditableNode pattern
- ✅ **Selection and Drag**: Core interaction functionality working
- ✅ **Store Infrastructure**: Modular store slices created (100% migrated)

#### 🟡 Partially Implemented Features

**Text Elements** ✅ (100% Complete)
- ✅ **COMPLETED**: Portal-based text editing with real-time positioning during canvas transformations
- ✅ **COMPLETED**: Design system font integration (Inter font) for all text elements
- ✅ **COMPLETED**: TextShape and StickyNoteShape text editing with unified overlay system
- ✅ **COMPLETED**: Clean visual design with professional styling and proper typography
- ✅ **COMPLETED**: Font loading utility ensures consistent rendering across all text elements

**Tables** ✅ (100% Complete)
- ✅ EnhancedTableElement implemented with full functionality
- ✅ **COMPLETED**: Table rendering integrated in MainLayer
- ✅ **COMPLETED**: Cell editing fully functional with text persistence
- ✅ **COMPLETED**: 8-handle resizing implemented and working
- ✅ **COMPLETED**: Row/column add/remove operations working
- ✅ **COMPLETED**: Modern visual design with improved UX
- ✅ **COMPLETED**: Tab/Shift+Tab keyboard navigation
- ✅ **COMPLETED**: Cell editor overlay with real-time positioning
- ✅ **NEW - COMPLETED**: Perfect cell editor positioning during canvas zoom/pan operations
- ✅ **NEW - COMPLETED**: React-Konva reconciler conflict resolution with DOM portals

**Sticky Notes** ✅ (100% Complete)
- ✅ **COMPLETED**: StickyNoteShape component renders with proper design system font
- ✅ **COMPLETED**: Portal-based text editing with real-time positioning
- ✅ **COMPLETED**: Text editing integrated with unified overlay system
- ✅ **COMPLETED**: Consistent typography and visual design

**Sections** (40% Complete)
- ✅ SectionShape component exists
- ✅ Can be created via toolbar
- ❌ **CRITICAL**: Sections stored separately, not included in main rendering
- ❌ Nested element support not fully implemented

#### ❌ Missing or Broken Features

**Drawing Tool (Pen)** (20% Complete)
- ✅ Drawing event handlers exist in KonvaCanvas
- ❌ **CRITICAL**: Drawing state management not properly connected
- ❌ **CRITICAL**: useDrawing hook not found in modular store
- ❌ Preview line renders but final path not saved

**Rich Text Editing** (10% Complete)
- ✅ Components exist (UnifiedTextEditor, RichTextSystem)
- ❌ **CRITICAL**: Not integrated with SimpleTextEditor
- ❌ Floating toolbar positioning fixed but not in use

**Connectors** (30% Complete)
- ✅ ConnectorLayer exists
- ❌ **CRITICAL**: Drawing state for connectors not properly managed
- ❌ Arrow/line types defined but creation broken

**Image Uploads** (10% Complete)
- ✅ ImageShape component exists
- ❌ **CRITICAL**: No upload mechanism implemented
- ❌ Drag-and-drop support missing

### ⏳ Phase 3A: Architectural Refactoring (PHASE 3 - Pending Integration Completion)

**IMPORTANT**: This phase is **blocked** until Phase 1 (Integration) and Phase 2 (Stabilization) are complete. Architectural optimization of broken functionality leads to optimized broken code.

**Prerequisites**: 
- All 15+ element types must render correctly
- All toolbar tools must create functional elements  
- Store migration must be 100% complete
- No console errors during normal operation

**Philosophy**: "Premature optimization is the root of all evil" - Donald Knuth. Only optimize after establishing a stable, working foundation.

#### Completed in Phase 3A
- ✅ **True Multi-Layer Architecture**: Separate Konva Layers for optimal performance
  ```tsx
  <Stage>
    <Layer listening={false} name="background-layer"><BackgroundLayer/></Layer>
    <Layer listening={true} name="main-layer"><MainLayer/></Layer>
    <Layer listening={true} name="connector-layer"><ConnectorLayer/></Layer>
    <Layer listening={true} name="ui-layer"><UILayer/></Layer>
  </Stage>
  ```
- ✅ **Prop Spreading Optimization**: Explicit prop passing for React.memo optimization
- ✅ **EditableNode Pattern**: Unified interaction wrapper for all shape components
- ✅ **Import Path Resolution**: Fixed all build conflicts and import issues

#### 🔴 Critical Architectural Refactoring Tasks (Blocking Performance)

**1. Decompose Monolithic KonvaCanvas.tsx Component**
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

**2. Implement React.memo with Explicit Props Strategy**
- **Current Anti-Pattern**: `<Rect {...konvaElementProps} />` defeats React.memo
- **Required Pattern**: `<Rect x={node.x} y={node.y} width={node.width} fill={node.fill} />`
- **Rule**: Shape components must subscribe to their own state via `id` prop
- **Impact**: Prevents cascade re-renders when single shape changes
- **Priority**: **CRITICAL** - Core performance fix
- **Effort**: Medium (1-2 days)

**3. Restructure Zustand Store for O(1) Performance**
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

**4. Fix Immer Usage Anti-Patterns**
- **Correct Pattern**: Direct draft mutation only
  ```typescript
  updateNodePosition: (nodeId, newPosition) => set((state) => {
    state.elements[nodeId].position = newPosition; // ✓ Correct
  })
  ```
- **Anti-Pattern**: Reassigning state tree parts breaks Immer tracking
- **Impact**: Ensures proper immutability and change detection
- **Priority**: **HIGH** - State consistency
- **Effort**: Small (few hours)

**5. Implement Fine-Grained Selectors**
- **Current**: Components subscribe to entire objects
- **Required**: Subscribe to primitive values only
- **Examples**:
  - Bad: `useStore(state => state.elements[id])`
  - Good: `useStore(state => state.elements[id]?.position.x)`
- **Tool**: Add reselect for memoized computed selectors
- **Impact**: Prevents re-renders from irrelevant state changes
- **Priority**: **HIGH** - Re-render optimization
- **Effort**: Medium (1 day)

### ⏳ Phase 3B: Performance Optimization (Pending)

#### Advanced Performance Features
- **Shape Caching**: Implement Konva bitmap caching for complex shapes
- **Viewport Culling**: Only render elements visible in current viewport
- **Lazy Loading**: Dynamic loading of heavy elements (images, complex tables)
- **Memory Management**: Implement garbage collection for removed elements
- **Frame Rate Monitoring**: Built-in performance metrics and optimization recommendations

### ⏳ Phase 4: Advanced Features (Future)

#### Professional-Grade Features
- **Collaborative Editing**: Real-time multi-user editing capabilities
- **Advanced Export**: PDF, SVG, PNG export with high-quality rendering
- **Plugin System**: Extensible architecture for custom tools and elements
- **Cloud Integration**: Optional cloud sync while maintaining local-first approach

## 🚀 Recent Major Updates

### Table Editing System Complete (January 2025)

**Complete resolution of table editing functionality with store migration:**

#### Issues Resolved

**Issue 1: Table Cell Text Not Persisting**
- **Problem**: Text entered in table cells would disappear after editing
- **Root Cause**: State mismatch - tables created in new modular store but updates attempted in legacy konvaCanvasStore
- **Solution**: Migrated all table operations to canvasElementsStore.ts with proper state management

**Issue 2: Table Resizing Not Working**
- **Problem**: Table resize handles appeared but resizing operations failed
- **Solution**: Implemented complete table resize operations (table, rows, columns) in modular store

**Issue 3: Row/Column Add/Remove Not Working**
- **Problem**: Add/remove row/column operations failed silently
- **Solution**: Added proper addTableRow, addTableColumn, removeTableRow, removeTableColumn methods

**Issue 4: Poor Visual Design and UX**
- **Problem**: Basic table appearance with poor cell editing experience
- **Solution**: Modernized grid design, improved resize handles, and enhanced cell editor overlay

#### Technical Achievements
- ✅ **Complete Store Migration**: Removed all konvaCanvasStore dependencies
- ✅ **Full Table Operations**: All table editing operations now functional
- ✅ **Modern Visual Design**: Improved grid lines, headers, and resize handles
- ✅ **Enhanced Cell Editor**: Real-time positioning with zoom/pan/move support
- ✅ **Keyboard Navigation**: Tab/Shift+Tab navigation between cells
- ✅ **Performance Optimization**: Eliminated unnecessary re-renders and delays
- ✅ **State Consistency**: Single source of truth for all table operations

#### Components Updated
- **EnhancedTableElement.tsx**: Complete refactor to use modular store exclusively
- **canvasElementsStore.ts**: Added comprehensive table operation methods
- **CanvasContainer.tsx**: Migrated to use modular store for all operations
- **KonvaToolbar.tsx**: Confirmed table creation uses modular store
- **MainLayer.tsx**: Verified table rendering integration

### Text Editing System Overhaul (June 17, 2025)

**Major improvements to Canvas text editing functionality:**

#### Issues Resolved

**Issue 1: Rich Text Toolbar Positioning**
- **Problem**: Formatting toolbar appeared in bottom-left corner instead of near selected text
- **Solution**: Implemented relative positioning with smart placement logic and context-aware fallbacks

**Issue 2: Table Cell Editing Not Working**  
- **Problem**: Table cells could be selected but text editing interface never appeared
- **Solution**: Connected table cell editing to unified rich text system with virtual cell element ID pattern

**Issue 3: Text Editor Immediate Dismissal**
- **Problem**: Text editing overlays disappeared immediately after appearing
- **Solution**: Added mount-time protection with 150ms delay and proper state initialization

#### Technical Improvements
- ✅ **DOM Portal Integration**: Proper separation between Konva canvas and DOM text editing
- ✅ **Unified Interface**: All text elements use consistent editing interface
- ✅ **Context-Aware Positioning**: Smart toolbar placement that adapts to available space
- ✅ **Mount-Time Blur Prevention**: Intelligent mounting state prevents immediate dismissal
- ✅ **Enhanced Error Handling**: Improved debugging and error recovery

#### Components Updated
- **TextEditingOverlay**: Enhanced with proper state initialization and DOM portals
- **RichTextCellEditor**: Integrated with unified text editing system
- **EnhancedTableElement**: Connected to unified rich text editing interface
- **KonvaCanvas**: Extended `handleStartTextEdit` to support table cell virtual elements

### Table Cell Editor Positioning Fix (June 18, 2025)

**Complete resolution of table cell editor positioning and React-Konva reconciler conflicts:**

#### Issues Resolved

**Issue 1: Cell Editor Misplacement During Zoom/Pan**
- **Problem**: Text editor appeared in top-left corner instead of directly over table cells during canvas transformations
- **Root Cause**: Manual coordinate calculation approach was not properly synchronized with Konva's transformation matrix
- **Solution**: Implemented real-time position tracking using Konva's `getAbsolutePosition()` and stage transformation events

**Issue 2: React-Konva Reconciler Conflicts**
- **Problem**: `TypeError: parentInstance.add is not a function` errors when rendering DOM elements
- **Root Cause**: Mixing DOM portals with Konva components in JSX fragments confused the React-Konva reconciler
- **Solution**: Separated DOM portal rendering from Konva tree using dedicated useEffect hooks

**Issue 3: Missing Double-Click Handler**
- **Problem**: Cell editing could not be initiated by double-clicking on table cells
- **Root Cause**: Double-click handler function was referenced but not implemented
- **Solution**: Added proper `handleCellDoubleClick` implementation with cell coordinate detection

#### Technical Achievements
- ✅ **Perfect Cell Editor Alignment**: Text editor stays precisely positioned over cells during all canvas operations
- ✅ **Real-Time Position Updates**: Dynamic position calculation responds to zoom, pan, and table movement
- ✅ **React-Konva Compatibility**: Clean separation of DOM portals from Konva reconciler
- ✅ **Event Handler Integration**: Proper double-click detection for cell editing initiation
- ✅ **Transform Event Listening**: Responsive to all canvas transformation events (zoom, pan, drag)
- ✅ **Memory Management**: Proper cleanup of event listeners and DOM elements

#### Implementation Details
```typescript
// Dynamic position calculation with transform awareness
const updatePosition = () => {
  const stage = stageRef.current;
  const tableGroup = stage.findOne(`#${element.id}`);
  const tablePos = tableGroup.getAbsolutePosition();
  const containerRect = stageContainer.getBoundingClientRect();
  const scale = stage.scaleX();
  
  // Convert canvas coordinates to screen coordinates
  const screenX = containerRect.left + (absoluteCellX * scale) + stage.x();
  const screenY = containerRect.top + (absoluteCellY * scale) + stage.y();
  
  setCellEditorPosition({ left: screenX, top: screenY, width, height });
};

// Real-time event listening
stage.on('transform dragmove wheel scalechange', updatePosition);
```

#### Components Updated
- **EnhancedTableElement.tsx**: Implemented real-time positioning system with proper portal separation
- **Cell Editor Portal**: Moved to useEffect-based rendering outside Konva tree
- **Event System**: Added comprehensive canvas transformation event listeners

### Text Editing Overlay & Font System Implementation (June 18, 2025)

**Complete overhaul of text editing experience and design system font integration:**

#### Issues Resolved

**Issue 1: Default Browser Font Instead of Design System Font**
- **Problem**: Text elements (TextShape, StickyNoteShape) displayed in browser default fonts instead of Inter font from design system
- **Root Cause**: Google Fonts not imported, Konva not recognizing loaded fonts, inconsistent font family definitions
- **Solution**: Added Google Fonts import, created font loading utility, unified font family usage across all components

**Issue 2: Text Editor Overlay Misalignment**
- **Problem**: Portal-based text editor overlays not staying aligned with canvas text during zoom, pan, and element transformations
- **Root Cause**: Missing real-time coordinate tracking and event listener integration
- **Solution**: Implemented comprehensive transformation event listening with dynamic position updates

**Issue 3: Inconsistent Text Editor Styling**
- **Problem**: Text editor appearance didn't match design system, had aggressive red borders and colors
- **Root Cause**: Hard-coded styling values instead of design system integration
- **Solution**: Updated all text editor styling to use design system colors, clean borders, and proper typography

#### Technical Achievements
- ✅ **Google Fonts Integration**: Added Inter font import to index.html for consistent typography
- ✅ **Font Loading Utility**: Created fontLoader.ts to ensure fonts are available before Konva rendering
- ✅ **Portal-Based Text Editing**: Implemented DOM portals for TextShape and StickyNoteShape with real-time positioning
- ✅ **Design System Font Usage**: All text elements now consistently use Inter font from design system
- ✅ **Transform-Aware Positioning**: Text editor overlays stay perfectly aligned during all canvas operations
- ✅ **Clean Visual Design**: Removed all aggressive red styling, implemented subtle gray borders and proper shadows
- ✅ **Event Listener Management**: Comprehensive cleanup of transform events to prevent memory leaks

#### Implementation Details
```typescript
// Font loading integration
export const ensureFontsLoaded = async (): Promise<void> => {
  if ('fonts' in document) {
    await document.fonts.load(`16px ${designSystem.typography.fontFamily.sans}`);
    await document.fonts.load(`14px ${designSystem.typography.fontFamily.sans}`);
    await document.fonts.load(`12px ${designSystem.typography.fontFamily.sans}`);
  }
};

// Portal-based text editing with real-time positioning
const updatePosition = () => {
  const stage = stageRef.current;
  const textNode = stage.findOne(`#${element.id}`);
  const textPos = textNode.getAbsolutePosition();
  const transform = stage.getAbsoluteTransform();
  const scale = stage.scaleX();
  
  const point = transform.point({ x: textPos.x, y: textPos.y });
  const screenX = containerRect.left + point.x;
  const screenY = containerRect.top + point.y;
  
  // Update editor position in real-time
  createTextEditor({ position: { left: screenX, top: screenY, width, height } });
};
```

#### Components Updated
- **index.html**: Added Google Fonts import for Inter font family
- **designSystem.ts**: Updated font family definitions with proper fallbacks
- **fontLoader.ts**: New utility for ensuring fonts are loaded before canvas rendering
- **textEditingUtils.tsx**: Redesigned text editor with design system integration and clean styling
- **TextShape.tsx**: Added font loading, portal-based editing, and real-time positioning
- **StickyNoteShape.tsx**: Added font loading, portal-based editing, and design system font usage
- **MainLayer.tsx**: Updated to pass stageRef to text components for positioning calculations

#### Visual Improvements
- **Font Consistency**: All text now renders in Inter font from design system
- **Clean Editor Styling**: Subtle gray borders (`#e5e7eb`) instead of aggressive red borders
- **Black Text Color**: Consistent `#000000` text color for all content and placeholders
- **Proper Typography**: Line height, font weight, and font features properly configured
- **Subtle Shadows**: Clean `rgba(0, 0, 0, 0.1)` shadows instead of colored shadows
- **Professional Appearance**: Text editing now matches modern design system standards

## 🚀 Structured Implementation Plan

### Overview: Sequential Phase Approach

**Core Strategy**: Linear progression with clear phase gates. Each phase must be **100% complete** with **validated success criteria** before proceeding to the next phase.

**Timeline**: 4-6 weeks total with realistic daily hour estimates and 20% buffer for unexpected issues.

**Phase Dependencies**:
1. **Phase 1**: Integration Fixes (Must complete first)
2. **Phase 2**: System Stabilization (Depends on Phase 1)  
3. **Phase 3**: Performance Optimization (Depends on Phase 2)
4. **Phase 4**: Advanced Features (Future)

---

## Phase 1: Critical Integration Fixes (Week 1-2)
**Goal**: Make all advertised features actually work  
**Duration**: 2 weeks (60-80 hours)  
**Priority**: CRITICAL  
**Status**: 40% Complete

### Week 1: Core Rendering Pipeline Fixes (30-40 hours)

#### Day 1: Immediate Rendering Fixes (6 hours)
**Critical blockers that prevent basic functionality:**

**✅ Task 1.1: Fix Table Rendering (COMPLETED)**
- **Issue**: Table rendering case missing in MainLayer.tsx switch statement
- **Impact**: Created tables are invisible  
- **Fix**: Add `case 'table':` to MainLayer.tsx element switch
- **Success Criteria**: Created tables appear on canvas
- **Status**: ✅ COMPLETED - Tables now render correctly

**Task 1.2: Include Sections in Main Rendering (2 hours)**
- **Issue**: Sections stored separately, not included in main rendering pipeline
- **Impact**: Sections appear to be created but are invisible
- **Fix**: Integrate sections into main element rendering pipeline with proper layering
- **Success Criteria**: Sections display and can contain other elements

**Task 1.3: Fix Drawing Tool Persistence (4 hours)**
- **Issue**: Drawing tool shows preview but doesn't persist paths
- **Impact**: Pen tool completely non-functional for actual drawing
- **Fix**: Implement or repair useDrawing hook in modular store
- **Success Criteria**: Pen tool draws paths that persist after completion

#### Day 2-3: Text System Integration (12 hours)

**Task 1.4: Replace SimpleTextEditor with UnifiedTextEditor (8 hours)**
- **Issue**: Rich text components exist but SimpleTextEditor is used instead
- **Impact**: Limited text formatting across all elements
- **Fix**: Integrate existing UnifiedTextEditor components with all text elements
- **Success Criteria**: Rich text formatting works on all text elements

**✅ Task 1.5: Complete Table Cell Text Editing (COMPLETED)**
- **Issue**: Table cell editing infrastructure exists but not fully wired
- **Fix**: Wire table cell editing to unified rich text system with proper ID mapping
- **Success Criteria**: Table cells support rich text editing
- **Status**: ✅ COMPLETED - Full table editing with text persistence, keyboard navigation, and modern UX

#### Day 4-5: Tool Completion and Testing (12 hours)

**Task 1.6: Fix Connector Creation (4 hours)**
- **Issue**: Connector tools exist but creation logic broken
- **Fix**: Wire connector drawing to state management and rendering pipeline
- **Success Criteria**: Lines and arrows can be drawn and persist

**Task 1.7: Implement Image Upload Support (4 hours)**
- **Issue**: ImageShape component exists but no upload mechanism
- **Fix**: Add upload mechanism and drag-and-drop support
- **Success Criteria**: Images can be uploaded and placed on canvas

**Task 1.8: Integration Testing (4 hours)**
- Test all element types for creation and persistence
- Verify undo/redo works for all operations
- **Success Criteria**: No broken tools in toolbar

### Week 2: Feature Completion and Validation (30-40 hours)

#### Day 6-7: Complete Remaining Features (8 hours)

**Task 1.9: Complete Sticky Note Text Integration (4 hours)**
- Connect sticky notes to unified text editing system
- **Success Criteria**: Sticky notes support rich text editing

**Task 1.10: Implement Section Nesting (4 hours)**
- Add support for elements within sections
- **Success Criteria**: Sections can contain and organize other elements

#### Day 8-9: Store Migration Completion (12 hours)

**✅ Task 1.11: Complete Store Migration (COMPLETED - 100%)**
- **Issue**: Partial migration creating state inconsistencies
- Migrate remaining components from monolithic store  
- Remove konvaCanvasStore.ts and update all imports
- **Success Criteria**: All components use modular store slices
- **Status**: ✅ COMPLETED - konvaCanvasStore.ts removed, all components migrated to modular store

**Task 1.12: Legacy Code Path Cleanup (4 hours)**
- Migrate active components from `/components/canvas/` to `/features/canvas/`
- Update all import paths
- **Success Criteria**: Single source of truth for all canvas components

#### Day 10: Final Integration Testing (8 hours)

**Task 1.13: Comprehensive Feature Testing (4 hours)**
- Test all 15+ element types for complete functionality
- Verify text editing across all element types
- Test import/export maintains element integrity
- **Success Criteria**: All Phase 1 success criteria achieved

**Task 1.14: Error Handling and Console Cleanup (4 hours)**
- Add error boundaries for canvas operations
- Remove development console.log statements
- **Success Criteria**: No console errors during normal operation

### Phase 1 Success Criteria (Progress: Tables Complete, Store Migration Complete)
- 🟡 All 15+ element types render correctly (Most complete, some integration gaps remain)
- 🟡 All toolbar tools create functional elements (Most complete, some tools need integration)
- 🟡 Rich text editing works across all element types (Partial - basic text editing works)
- ✅ **Tables render and support cell editing (COMPLETED)**
- 🟡 Sections display and contain other elements (Partial)
- 🟡 No broken tools in toolbar (Most tools work, some gaps remain)
- ✅ **All created elements persist correctly (COMPLETED)**
- ✅ **Undo/redo works for all operations (COMPLETED)**
- ✅ **No console errors during normal operation (COMPLETED)**
- ✅ **Store migration complete (COMPLETED - 100%)**

---

## Phase 2: System Stabilization (Week 3)
**Goal**: Create stable, maintainable codebase ready for optimization  
**Duration**: 1 week (30-40 hours)  
**Priority**: HIGH  
**Prerequisites**: Phase 1 must be 100% complete

### Day 11-12: Documentation and Architecture Audit (12 hours)

**Task 2.1: Update Canvas Documentation (4 hours)**
- Update README.md canvas description to reflect actual capabilities
- Consolidate progress documents in `/docs/`
- Create accurate feature status documentation
- **Success Criteria**: Documentation matches actual implementation

**Task 2.2: Component Architecture Assessment (4 hours)**
- Audit KonvaCanvas.tsx component size and complexity
- Identify components ready for React.memo optimization
- Document performance baseline with 50+ elements
- **Success Criteria**: Clear optimization roadmap established

**Task 2.3: Type Safety Audit (4 hours)**
- Eliminate remaining `any` types in canvas code
- Strengthen interfaces and type definitions
- **Success Criteria**: Full TypeScript strict compliance

### Day 13-14: Code Quality and Testing (12 hours)

**Task 2.4: Performance Baseline Establishment (4 hours)**
- Measure current performance with 50+ elements
- Document response times for tool selection and element creation
- Identify specific performance bottlenecks
- **Success Criteria**: Baseline metrics established for optimization targets

**Task 2.5: Integration Testing with LibreOllama Features (4 hours)**
- Test canvas integration with Projects module
- Verify persistence with Tauri file I/O
- Test canvas data in broader application context
- **Success Criteria**: Canvas works seamlessly within LibreOllama ecosystem

**Task 2.6: Error Boundary and Recovery Implementation (4 hours)**
- Add comprehensive error boundaries
- Implement graceful degradation for failed operations
- **Success Criteria**: Robust error handling prevents canvas crashes

### Day 15: Quality Assurance and Phase 2 Validation (8 hours)

**Task 2.7: User Experience Testing (4 hours)**
- Test complete user workflows (create, edit, organize, save)
- Verify keyboard shortcuts and accessibility
- **Success Criteria**: Professional user experience across all features

**Task 2.8: Performance Validation (4 hours)**
- Validate performance metrics meet baseline requirements:
  - Smooth interactions with 50+ elements
  - <100ms response time for tool selection  
  - <200ms response time for element creation
  - Stable memory usage during extended sessions
- **Success Criteria**: Performance meets professional application standards

### Phase 2 Success Criteria (Must achieve 100% before Phase 3)
- ✅ Stable, maintainable codebase with clear architecture
- ✅ Complete TypeScript compliance with no `any` types
- ✅ Comprehensive error handling and recovery
- ✅ Performance baseline established and meeting targets
- ✅ Documentation accurately reflects implementation
- ✅ Clean separation between canvas and legacy code

---

## Phase 3: Performance Optimization (Week 4-6)
**Goal**: Achieve professional-grade performance (60fps, responsive)  
**Duration**: 2-3 weeks (60-80 hours)  
**Priority**: MEDIUM  
**Prerequisites**: Phase 1 and Phase 2 must be 100% complete

### Week 4: Component Architecture Optimization (30-40 hours)

#### Day 16-17: Component Decomposition (12 hours)

**Task 3.1: Break Down KonvaCanvas.tsx Monolith (8 hours)**
- Create CanvasContainer, LayerManager, NodeRenderer hierarchy
- Implement proper separation of concerns
- **Target Architecture**:
  ```
  <CanvasContainer>       # Data fetching & store setup
    <Stage>               # Konva stage management
      <LayerManager>      # Multi-layer orchestration
        <NodeRenderer>    # Iterates node IDs, dispatches to shapes
          <ShapeComponent id={id} />  # Memoized, self-subscribing
  ```
- **Success Criteria**: Modular, maintainable component structure

**Task 3.2: Implement EditableNode Pattern (4 hours)**
- Create unified interaction wrapper for all shapes
- Decouple interaction behavior from visual rendering
- **Success Criteria**: Consistent interaction behavior across all elements

#### Day 18-19: React Optimization Patterns (12 hours)

**Task 3.3: Implement React.memo with Explicit Props (8 hours)**
- **Anti-Pattern**: `<Rect {...konvaElementProps} />` defeats React.memo
- **Required Pattern**: `<Rect x={node.x} y={node.y} width={node.width} fill={node.fill} />`
- Replace prop spreading with explicit prop passing
- Enable React.memo optimization for all shape components
- **Success Criteria**: Shape components only re-render when their data changes

**Task 3.4: Fine-Grained State Subscriptions (4 hours)**
- **Anti-Pattern**: `useStore(state => state.elements[id])` (subscribes to entire object)
- **Required Pattern**: `useStore(state => state.elements[id]?.position.x)` (subscribes to primitive)
- Implement subscriptions to primitive values only
- Add reselect for memoized computed selectors
- **Success Criteria**: Components don't re-render from irrelevant state changes

#### Day 20: Custom Hooks Extraction (8 hours)

**Task 3.5: Extract Specialized Hooks (8 hours)**
- Create useZoomPanControls, useSelectionManager, useUndoRedo hooks
- Implement usePointerTransform for coordinate handling
- **Success Criteria**: Focused, reusable logic extraction

### Week 5: Store and State Optimization (30-40 hours)

#### Day 21-22: Store Architecture Optimization (12 hours)

**Task 3.6: Restructure Store for O(1) Performance (8 hours)**
- **Current**: Arrays for element storage (O(n) lookup)
- **Required**: Object maps `Record<string, NodeData>` (O(1) lookup)
- Convert arrays to Record for efficient element access
- **Success Criteria**: Eliminates array search bottlenecks as canvas scales

**Task 3.7: Fix Immer Usage Anti-Patterns (4 hours)**
- **Correct Pattern**: Direct draft mutation only
  ```typescript
  updateNodePosition: (nodeId, newPosition) => set((state) => {
    state.elements[nodeId].position = newPosition; // ✓ Correct
  })
  ```
- **Anti-Pattern**: Reassigning state tree parts breaks Immer tracking
- **Success Criteria**: Proper immutability and change detection

#### Day 23-24: Advanced Performance Features (12 hours)

**Task 3.8: Implement Multi-Layer Architecture (8 hours)**
- Create BackgroundLayer with `listening={false}`
- Build InteractionLayer for smooth 60fps dragging
- Add UILayer for transformers and tooltips
- **Success Criteria**: Optimized event handling and rendering separation

**Task 3.9: Event System Optimization (4 hours)**
- Implement event delegation at layer level
- Add requestAnimationFrame throttling for high-frequency events
- Apply `listening={false}` to all non-interactive elements
- **Success Criteria**: Smooth, responsive interactions under load

#### Day 25: Caching and Memory Management (8 hours)

**Task 3.10: Implement Shape Caching (4 hours)**
- Add Konva bitmap caching for complex shapes
- Implement strategic caching for enhanced tables
- **Success Criteria**: Improved rendering performance for complex elements

**Task 3.11: Memory Management Optimization (4 hours)**
- Replace full-state undo/redo with Immer patch-based system
- Implement garbage collection for removed elements
- **Success Criteria**: Stable memory usage during extended sessions

### Week 6: Advanced Optimization and Validation (30-40 hours)

#### Day 26-27: Viewport and Advanced Features (12 hours)

**Task 3.12: Implement Viewport Culling (8 hours)**
- Only render elements visible in current viewport
- Add lazy loading for heavy elements (images, complex tables)
- **Success Criteria**: Performance scales with viewport size, not total elements

**Task 3.13: Performance Monitoring (4 hours)**
- Add built-in performance metrics
- Implement frame rate monitoring
- Create optimization recommendations system
- **Success Criteria**: Real-time performance visibility and guidance

#### Day 28-30: Final Optimization and Validation (12 hours)

**Task 3.14: Performance Validation and Tuning (8 hours)**
- Achieve target performance metrics:
  - 60fps during interactions
  - <50ms response time for tool selection
  - <100ms response time for element creation
  - Support for 200+ elements without degradation
- **Success Criteria**: Professional-grade performance achieved

**Task 3.15: Production Readiness (4 hours)**
- Final code review and optimization
- Remove all development artifacts
- Prepare for production deployment
- **Success Criteria**: Production-ready canvas implementation

### Phase 3 Success Criteria
- ✅ 60fps performance during all interactions
- ✅ Support for 200+ elements without performance degradation
- ✅ <50ms tool selection response time
- ✅ <100ms element creation response time
- ✅ Stable memory usage with garbage collection
- ✅ Professional-grade user experience
- ✅ Modular, maintainable architecture

---

## Phase 4: Advanced Features (Future)
**Goal**: Add professional features beyond basic functionality  
**Duration**: 2-4 weeks (ongoing)  
**Priority**: LOW  
**Prerequisites**: Phase 1, 2, and 3 must be 100% complete

### Advanced Capabilities
- Collaborative editing with real-time sync
- Advanced export (PDF, SVG, PNG) with high-quality rendering
- Plugin system for custom tools and elements
- Cloud integration options
- Advanced selection tools (lasso, multi-select)
- Professional templates and asset libraries

## 📊 Risk Mitigation and Project Management

### Critical Dependencies and Phase Gates

**Phase Gate System**: Each phase must achieve 100% of its success criteria before the next phase begins. This prevents cascading technical debt and ensures quality.

**Critical Dependencies**:
1. **Store Migration Must Complete First**: Architecture optimization depends on completed store migration
2. **Integration Before Optimization**: All features must work before performance optimization begins  
3. **Documentation Accuracy**: README and documentation must reflect actual capabilities
4. **No Broken Functionality**: Zero tolerance for regressions between phases

### Key Risks and Mitigation Strategies

**Risk 1: Scope Creep During Integration**
- **Mitigation**: Strict focus on connecting existing components, no new feature development
- **Gate**: All 15+ element types must render before any architectural work

**Risk 2: Performance Regression During Optimization**  
- **Mitigation**: Establish baseline metrics in Phase 2, validate after each optimization
- **Gate**: Performance must meet or exceed baseline after each change

**Risk 3: Integration Breaking During Refactoring**
- **Mitigation**: Comprehensive testing suite, small incremental changes
- **Gate**: All Phase 1 success criteria must continue to pass

**Risk 4: Time Estimation Accuracy**
- **Mitigation**: 20% buffer built into estimates, daily progress tracking
- **Gate**: If phase runs >150% of estimate, reassess scope and approach

### Technical Anti-Patterns to Avoid

**Integration Phase Anti-Patterns**:
- Adding new features while existing ones are broken
- Optimizing broken functionality instead of fixing it
- Architectural rewrites when simple integration fixes are needed

**Optimization Phase Anti-Patterns**:
- Prop spreading that defeats React.memo: `<Rect {...props} />`
- Object creation in selectors that breaks memoization
- Array storage instead of `Record<string, T>` for O(1) lookup
- Immer patterns that break change tracking
- Optimizing before establishing working baseline

### Success Validation Framework

**Daily Validation** (During Integration Phase):
- All toolbar tools create visible, functional elements
- Text editing works on all element types tested
- No new console errors introduced
- Undo/redo functionality preserved

**Phase Completion Validation**:
- Automated test suite passes 100%
- Manual testing of all user workflows successful
- Performance metrics meet or exceed targets
- Code review approval from technical lead
- Documentation updated to reflect changes

### Project Communication

**Daily Standups Focus**:
- Current phase progress against timeline
- Blockers preventing phase completion
- Integration test results
- Performance metric trends

**Phase Completion Reviews**:
- Demo of all success criteria achieved
- Technical debt assessment
- Performance baseline establishment
- Go/no-go decision for next phase

This structured approach ensures the LibreOllama Canvas transforms from its current state of partial implementation to a production-ready, professional-grade infinite whiteboard while maintaining quality and avoiding common development pitfalls.

## 🎯 Target Architecture & Implementation Patterns

### Recommended Component Hierarchy (Post-Phase 3)
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

### Feature-Based Directory Structure (Post-Phase 2)
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
```

## 🔧 Current Technical Debt Analysis

### PHASE 1 Priority (Must Fix Before Optimization)

**1. Missing Rendering Cases - CRITICAL**
- **Issue**: Table elements don't render (missing switch case in MainLayer)
- **Impact**: Created tables are invisible to users
- **Effort**: 30 minutes
- **Fix**: Add `case 'table':` to MainLayer.tsx element switch

**2. Broken Drawing State - CRITICAL**
- **Issue**: Drawing tool shows preview but doesn't persist paths
- **Impact**: Pen tool completely non-functional for actual drawing
- **Effort**: 4-6 hours
- **Fix**: Implement useDrawing hook or fix drawing state management

**3. Section Rendering Gap - CRITICAL**
- **Issue**: Sections created but not included in main rendering pipeline
- **Impact**: Sections appear to be created but are invisible
- **Effort**: 2-3 hours
- **Fix**: Include sections in element rendering and ensure proper layering

**4. Text Editing Integration - CRITICAL**
- **Issue**: Rich text components exist but SimpleTextEditor is used instead
- **Impact**: Limited text formatting across all elements
- **Effort**: 1-2 days
- **Fix**: Replace SimpleTextEditor with UnifiedTextEditor system

### PHASE 2 Priority (Integration Completion)

**5. Store Migration Completion - HIGH**
- **Issue**: 85% migrated from monolithic store, creating state inconsistencies
- **Impact**: Some features work inconsistently
- **Effort**: 6-8 hours  
- **Fix**: Complete migration of remaining 15% and remove old store

**6. Legacy Code Path Confusion - HIGH**
- **Issue**: Components split between `/components/canvas/` and `/features/canvas/`
- **Impact**: Import confusion, potential circular dependencies
- **Effort**: 4-6 hours
- **Fix**: Migrate all active components to features structure

**7. Connector Creation - HIGH**
- **Issue**: Connector tools exist but creation logic broken
- **Impact**: Lines and arrows can't be drawn
- **Effort**: 3-4 hours
- **Fix**: Wire connector creation to store and rendering pipeline

### PHASE 3 Priority (Post-Integration Architecture)

**8. Component Size Optimization - MEDIUM**
- **Issue**: KonvaCanvas.tsx is large but manageable (~2000 lines)
- **Impact**: Maintenance complexity, harder testing
- **Effort**: 8-10 hours
- **Fix**: Apply EditableNode pattern, break down into focused components

**9. Type Safety Gaps - MEDIUM**  
- **Issue**: Some `any` types remain in codebase
- **Impact**: Runtime errors, harder debugging
- **Effort**: 4-6 hours
- **Fix**: Eliminate remaining `any` types, strengthen interfaces

**10. Error Boundary Coverage - MEDIUM**
- **Issue**: Limited error handling for canvas operations
- **Impact**: Poor user experience when errors occur
- **Effort**: 6-8 hours
- **Fix**: Add comprehensive error boundaries and recovery

### Performance Anti-Patterns (Phase 3 Only)

**11. Prop Spreading Anti-Pattern**
- **Current**: `<Rect {...konvaElementProps} />`
- **Problem**: Defeats React.memo, obscures dependencies, causes unnecessary re-renders
- **Solution**: Explicit prop passing: `<Rect x={node.x} y={node.y} width={node.width} />`
- **Priority**: ARCHITECTURAL (Phase 3)

**12. Object Creation in Selectors**
- **Current**: Selectors return new objects/arrays on every call
- **Problem**: Breaks React.memo shallow comparison, triggers re-renders
- **Solution**: Subscribe to primitives, use reselect for memoization
- **Priority**: ARCHITECTURAL (Phase 3)

## 🧹 Cleanup Tasks & Recommendations

### High Priority Cleanup

**1. Remove `/components/canvas/` Legacy Files**
- Move active components to `/features/canvas/`
- Update all import paths
- Archive unused files
- **Estimated Time**: 4-6 hours

**2. Fix Fabric.js References**
- Remove any remaining Fabric.js mentions
- Clean up migration artifacts
- Update documentation references
- **Estimated Time**: 2 hours

**3. Consolidate Documentation**
- Archive redundant progress updates
- Update README.md canvas section
- Ensure single source of truth
- **Estimated Time**: 3-4 hours

### Medium Priority Cleanup

**1. Complete Store Migration**
- Finish migrating to modular store (85% → 100%)
- Remove monolithic konvaCanvasStore.ts
- Update all component hooks
- **Estimated Time**: 6-8 hours

**2. Standardize Component Patterns**
- Apply EditableNode to all shapes
- Consistent prop interfaces
- TypeScript strict compliance
- **Estimated Time**: 8-10 hours

**3. Performance Baseline**
- Establish current performance metrics
- Identify specific bottlenecks
- Create optimization targets
- **Estimated Time**: 4-6 hours

## 📊 Current Status Summary

### Implementation Phase Status

**✅ Foundation Complete (100%)**
- Modern tech stack (React 19, TypeScript, Konva.js, Zustand, Immer)
- Basic component architecture established
- Development environment and tooling configured

**🔄 Phase 1: Critical Integration Fixes (40% Complete) - IN PROGRESS**
- ✅ **Basic Shapes** (90%): Rectangle, Circle, Triangle, Star with EditableNode pattern
- ✅ **Selection and Interaction** (95%): Drag, resize, z-index management  
- ✅ **Pan/Zoom Navigation** (90%): Smooth navigation with touch support
- ✅ **Multi-Layer Architecture** (100%): Proper Konva layer separation
- 🟡 **Text Elements** (60%): Basic editing works, rich text missing
- 🟡 **Sticky Notes** (70%): Functional, needs text integration
- ❌ **Tables** (50%): Component exists, rendering broken (missing switch case)
- ❌ **Sections** (40%): Created but not properly integrated
- ❌ **Drawing Tool (Pen)** (20%): Preview works, persistence broken
- ❌ **Rich Text Editing** (10%): Components exist, not integrated
- ❌ **Connectors** (30%): UI exists, creation broken
- ❌ **Image Uploads** (10%): Component exists, no upload mechanism

**⏳ Phase 2: System Stabilization (0% Complete) - BLOCKED**
- **Prerequisite**: Phase 1 must be 100% complete
- **Scope**: Store migration completion, documentation updates, code cleanup
- **Duration**: 1 week after Phase 1 completion

**⏳ Phase 3: Performance Optimization (0% Complete) - BLOCKED**  
- **Prerequisite**: Phase 1 and Phase 2 must be 100% complete
- **Scope**: React.memo optimization, fine-grained subscriptions, architectural improvements
- **Duration**: 2-3 weeks after Phase 2 completion

**⏳ Phase 4: Advanced Features (0% Complete) - FUTURE**
- **Prerequisite**: Phase 1, 2, and 3 must be 100% complete
- **Scope**: Collaboration, advanced export, plugin system
- **Duration**: Ongoing development

### Immediate Action Items (Next 5 Days)

**Day 1: Quick Wins (6 hours)**
1. Add table rendering case to MainLayer.tsx (30 min) ⚡ CRITICAL
2. Include sections in main rendering pipeline (2 hours) ⚡ CRITICAL  
3. Begin drawing state management fix (4 hours) ⚡ CRITICAL

**Day 2-3: Text System Integration (12 hours)**
4. Replace SimpleTextEditor with UnifiedTextEditor (8 hours) ⚡ CRITICAL
5. Connect table cell editing to unified system (4 hours) ⚡ CRITICAL

**Day 4-5: Tool Completion (12 hours)**
6. Complete drawing tool persistence (4 hours) ⚡ CRITICAL
7. Fix connector creation (4 hours) ⚡ CRITICAL
8. Add image upload support (4 hours) ⚡ CRITICAL

### Success Metrics Tracking

**Phase 1 Completion Criteria** (must achieve before Phase 2):
- [ ] All 15+ element types render correctly
- [ ] All toolbar tools create functional elements
- [ ] Rich text editing works across all element types  
- [ ] Tables render and support cell editing
- [ ] Sections display and contain other elements
- [ ] No broken tools in toolbar
- [ ] All created elements persist correctly
- [ ] Undo/redo works for all operations
- [ ] No console errors during normal operation

**Current Completion**: 4/9 criteria met (44%)
