# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreOllama is a Tauri-based desktop application**📋 Key Documentation**:
- **docs/README.md** - Documentation guidelines and hierarchy (READ FIRST for new docs)
- **CANVAS_TESTING_PLAN.md** - Comprehensive testing methodology (MUST READ)
- **CANVAS_IMPLEMENTATION_CHECKLIST.md** - Detailed implementation status
- **CANVAS_DEVELOPMENT_ROADMAP_REVISED.md** - Project phases and achievements

**🚨 Documentation Guidelines**:
- **DO NOT create new documentation files** unless absolutely necessary
- **Always check if information can fit into existing documents first**
- **Consolidate rather than fragment** - enhance existing docs instead
- **Read docs/README.md** for complete documentation guidelinest with React 19, TypeScript, and Vite. The primary feature is a sophisticated canvas system for visual content creation and manipulation, built on Konva.js.

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:tauri        # Start Tauri dev mode

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI
npm run test:canvas      # Run canvas-specific tests
npm run test:windows     # Run Windows-optimized tests

# Building
npm run build            # Build for production
npm run build:tauri      # Build Tauri app

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint fix
npm run type-check       # TypeScript check
```

## Architecture Overview

### Core Technologies
- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri (Rust backend)
- **Canvas**: Konva.js + React-Konva
- **State**: Zustand with Immer
- **Styling**: Tailwind CSS
- **Testing**: Vitest with ESM configuration

### Feature Structure
```
src/
├── features/canvas/     # Primary canvas system
├── core/               # Core utilities and types
├── stores/             # Zustand state management
├── components/         # Shared UI components
└── tests/              # Test utilities and setup
```

### Canvas System Architecture

The canvas is the application's centerpiece with a sophisticated layer-based system:

**Layers** (z-index ordered):
- Background Layer (grid, guides)
- Main Layer (user elements)
- Connector Layer (connections between elements) - ✅ **FULLY IMPLEMENTED**
- UI Layer (selections, controls)

**Element Types**: 15+ types including text, shapes, tables, connectors, sections with discriminated union typing.

**✅ Fully Implemented Tools**:
- **Section Tool**: Click-to-draw workflow with auto-capture functionality
- **Connector Tool**: Smart snap points, auto-update, attachment memory, FigJam-like behavior
- **Drawing Tools**: Pen/pencil with smooth rendering
- **Table Tool**: Enhanced table creation with rich text cells
- **Image Upload**: Complete pipeline with drag-and-drop support

**Key Patterns**:
- Orchestrator pattern for canvas coordination
- Viewport culling for performance
- 50-state undo/redo system
- Unified rich text editing across elements
- Smart snap point system for connectors
- Auto-update system for connected elements

## State Management

Uses Zustand with slice pattern:
- `canvasStore` - Main canvas state and operations
- `selectionStore` - Element selection management  
- `viewportStore` - Pan/zoom and viewport state
- `historyStore` - Undo/redo operations
- `sectionStore` - Section management and element capture
- `connectorStore` - Connector relationships and auto-updates

All stores use Immer for immutable updates and follow branded type patterns (`ElementId`, `SectionId`).

**✅ Recent Store Enhancements**:
- Cross-store registration for sections and elements
- Auto-update system for connected connectors
- Enhanced element capture logic for sections
- Comprehensive validation and error handling

## Testing Approach

### Sophisticated Testing Framework
**CRITICAL**: We have a production-ready testing framework using vanilla Zustand patterns and real store implementations. This framework is specifically designed to catch actual integration bugs and has been completely overhauled (June 2025).

### Key Testing Principles
- **Failing integration tests represent REAL implementation issues** that need to be fixed
- **Use vanilla Zustand testing patterns with real store instances** - no global mocks
- **Robust integration tests expose authentic bugs** that mocked tests miss
- **Real store implementation testing** validates actual functionality, not mock stubs
- **Follow systematic bug fix approach** rather than rebuilding working systems

### Test Suite Status (June 2025)
- **✅ 50/50 store tests passing** with vanilla Zustand architecture
- **✅ 10/10 integration tests passing** with real store instances
- **✅ 95%+ performance improvement** (62s → 2.37s execution time)
- **✅ Zero test hangs/timeouts** - eliminated infinite loop issues
- **✅ Architectural overhaul complete** - removed brittle global mocks

### Vitest Configuration
- ESM-first setup with SWC
- **Force inline processing** for Konva libraries to prevent hanging
- Comprehensive Konva mocking with complete API coverage
- React-Konva component mocking with proper prop forwarding
- Path aliases matching Vite config
- **Hoisted setup architecture** for proper mock precedence

### Test Utilities
- `konva-test-utils.tsx` - Canvas testing helpers with comprehensive mocking
- `vitest.hoisted.setup.ts` - Hoisted mocks for proper precedence (NEW)
- `setup-new.ts` - Modern test environment with real store instances
- Canvas-specific test suites in `src/tests/canvas/`
- **Read the Canvas Testing Plan line by line** - `/docs/CANVAS_TESTING_PLAN.md`

### Testing Architecture Patterns
```typescript
// ✅ NEW: Vanilla Zustand testing (RECOMMENDED)
import { createStore } from 'zustand/vanilla';
const createTestStore = () => createStore<SelectionState>(createSelectionStore);
const store = createTestStore();
store.getState().selectElement(id1);
expect(store.getState().selectedElementIds).toEqual(new Set([id1]));

// ❌ OLD: React hook testing (PROBLEMATIC)
const { result } = renderHook(() => useSelectionStore());
// Causes useSyncExternalStore errors and React dependency issues
```

### Critical Testing Insights
- **Mock-heavy testing hides UI workflow bugs** - real integration testing is essential
- **Real store testing provides authentic validation** - mocks can mask critical issues
- **Integration tests are critical for UI component interaction** - unit tests alone insufficient
- **User workflow testing catches bugs that technical tests miss** - user experience validation crucial

### Running Specific Tests
```bash
# Single test file
npm test -- ComponentName.test.tsx

# Canvas tests only  
npm run test:canvas

# Watch mode for development
npm run test:watch -- --testNamePattern="specific test"

# Coverage with performance optimization
npm run test:coverage

# UI mode for debugging
npm run test:ui
```

### Test Execution Performance
- **Sub-10ms store operations** with real store instances
- **2.37s total execution time** (down from 62s)
- **Zero hanging tests** - resolved infinite loop issues
- **Parallel test execution** for optimal performance

### Integration Testing Protocol
When working on canvas functionality, ALWAYS:
1. **Read the Canvas Testing Plan** (`/docs/CANVAS_TESTING_PLAN.md`) line by line
2. **Read the Canvas Implementation Checklist** (`/docs/CANVAS_IMPLEMENTATION_CHECKLIST.md`) for current status
3. **Read the Canvas Development Roadmap** (`/docs/CANVAS_DEVELOPMENT_ROADMAP_REVISED.md`) for overall project status
4. **Use vanilla Zustand testing patterns** with real store instances (not mocked stores)
5. **Run robust integration tests** to expose real implementation issues
6. **Fix actual bugs** identified by failing tests (not test framework issues)
7. **Follow systematic bug fix approach** rather than rebuilding working systems

**� CRITICAL TESTING REQUIREMENTS**:
- **Never use global store mocks** - they hide real integration bugs
- **Always test with real store instances** using `createStore` from `zustand/vanilla`
- **Focus على integration testing** - unit tests alone are insufficient for canvas functionality
- **Validate complete user workflows** - not just individual component behavior

**�📋 Key Documentation**:
- **CANVAS_TOOL_STATUS.md** - Current tool functionality and usage instructions
- **CANVAS_TESTING_PLAN.md** - Comprehensive testing methodology (MUST READ)
- **CANVAS_IMPLEMENTATION_CHECKLIST.md** - Detailed implementation status
- **CANVAS_DEVELOPMENT_ROADMAP_REVISED.md** - Project phases and achievements

## Canvas Development Guidelines

### Element Creation Pattern
```typescript
// Use discriminated unions with type guards
const isTextElement = (element: CanvasElement): element is TextElement => 
  element.type === 'text'

// Use branded types for IDs
type ElementId = string & { __brand: 'ElementId' }
```

### Performance Considerations
- Viewport culling is implemented - respect visible bounds
- Use granular selectors to minimize re-renders
- Leverage Konva's caching for complex shapes
- Monitor memory usage with built-in tools

### State Updates
```typescript
// Always use Immer patterns in stores
set(produce((state) => {
  state.elements[id] = updatedElement
}))
```

## Current Development Context

**Branch**: `canvas-cleanup-phase0`
**Phase**: **NEAR-PRODUCTION READY** - All Critical Systems Completed
**Status**: Professional-grade canvas application with one remaining critical bug

**🚀 COMPREHENSIVE COMPLETION UPDATE (January 2025)**:
**ALL CRITICAL DEVELOPMENT PHASES COMPLETED** - Professional canvas application ready for production deployment:

- ✅ **Complete Architecture**: Store-first design with 95% viewport culling performance
- ✅ **Professional UX**: Full undo/redo system, keyboard shortcuts, and organized toolbar
- ✅ **Text System**: FigJam-style canvas-native text editing with auto-sizing
- ✅ **Tool Organization**: Clean, professional toolbar with distinct icons and logical grouping
- ✅ **Menu Systems**: Polished dropdown menus with proper visual hierarchy
- ✅ **Production Quality**: Comprehensive error handling, state management, and performance optimization

**🚨 CURRENT STATUS: ONE CRITICAL ISSUE REMAINS**:
- ❌ **Shape Text Editing Bug**: Rectangle, Circle, Triangle shapes show dual text fields during editing
- ✅ **All Other Systems**: Production-ready with professional-grade functionality
- ✅ **Sticky Note Containers**: Full container functionality for drawing and adding elements
- ✅ **Performance Excellence**: 60+ FPS with 1000+ elements using quadtree optimization

**🎯 Latest Achievements (January 2025)**:
- **Shape Tools Implementation**: Complete FigJam-style UX with crosshair cursors, click-to-place, immediate text editing
- **Text Editing Resolution**: Fixed "two text fields visible" issue with proper state timing
- **Undo/Redo System**: Complete history management with UI button states
- **Tool Icon Cleanup**: Distinct icons for all tools, removed duplicates, added mindmap tool
- **Performance Architecture**: Store-first design with quadtree spatial indexing and viewport culling

## Path Aliases

The project uses extensive path aliases defined in `vite.config.ts`:
- `@/` → `src/`
- `@core/` → `src/core/`
- `@features/` → `src/features/`
- `@stores/` → `src/stores/`
- `@components/` → `src/components/`

## Important Notes

- TypeScript strict mode is enabled with branded types for enhanced safety
- Canvas system uses Konva.js - familiarize with its patterns and performance characteristics  
- All stores follow immutable update patterns with Immer
- Test files should mock Konva appropriately using provided utilities
- Windows development uses the same Vitest configuration as other platforms

**🚨 Critical Development Notes**:
- **Phase 2 COMPLETED**: Zero TypeScript compilation errors achieved
- **Type Safety**: Proper discriminated union patterns implemented throughout
- **Component Interfaces**: Enhanced with specific element types (StickyNoteElement, TableElement)
- **Import Hierarchy**: Enhanced.types.ts established as single source of truth
- **Production Build**: Verified successful (51s build time)
- **Testing Framework**: Robust integration testing with real store instances

**⚠️ Common Pitfalls to Avoid**:
- Don't call `getState()` on Zustand hook functions
- Don't access properties without proper type guards in discriminated unions
- Don't ignore TypeScript errors - they indicate real type safety issues
- Don't use generic CanvasElement when specific element types are available
- Don't rebuild working type systems - enhance incrementally

## Canvas Tool Development Guidelines

### Shape Tools (FULLY IMPLEMENTED - FigJam-Style UX)
```typescript
// Shape tools workflow (Rectangle, Circle, Triangle, Mindmap)
// 1. Click shape tool button (toolbar shows crosshair cursor)
// 2. Click anywhere on canvas to place shape at cursor position
// 3. Shape appears with immediate text editing capability
// 4. Double-click to edit text anytime after creation
// 5. Blue resize frame with minimal handles for professional appearance

const shapeFeatures = {
  crosshairCursor: true,        // Professional cursor feedback
  clickToPlace: true,          // Instant placement at cursor
  immediateTextEdit: true,     // Text editing right after creation
  blueResizeFrame: true,       // Professional resize handles
  drawingToolSupport: true,    // Can draw on shapes with pen/marker
  containerFunctionality: true // Support for child elements
}

// All shapes working:
// - Rectangle, Circle, Triangle: Geometric primitives
// - Mindmap: Styled rectangles perfect for mind mapping
// - Crosshair cursor feedback on tool selection
// - Faint shape preview following cursor movement
// - Professional blue resize frame (minimal handles)
// - Support for drawing tools (pen, marker, highlighter, eraser)
```

### Text Tool (FULLY IMPLEMENTED - Canvas-Native)
```typescript
// Text tool workflow (FigJam-style implementation)
// 1. Click Text tool (crosshair cursor with "Add text" instruction)
// 2. Click on canvas - blue outlined text box appears immediately
// 3. Real-time auto-hugging as user types (text box resizes to fit content)
// 4. Tab/click-away saves text and auto-selects with resize handles
// 5. Double-click to re-edit anytime

const textFeatures = {
  canvasNativeEditing: true,    // No DOM overlays - pure canvas
  realTimeAutoHug: true,       // Text box resizes during typing
  figJamStyleWorkflow: true,   // Professional editing experience
  visualEditingStates: true,   // Blue background during editing
  proportionalResizing: true,  // Maintains text proportions
  autoSizeToContent: true      // Perfect content fitting
}

// Text editing completely resolved:
// - Canvas-native editing (no DOM overlay issues)
// - Real-time auto-hugging during typing
// - Professional visual states (blue background)
// - Proportional resize handling
// - Perfect content bounds management
```

### Sticky Note Tools (FULLY IMPLEMENTED - Container System)
```typescript
// Sticky note workflow (Complete container functionality)
// 1. Click Sticky Note tool (crosshair cursor)
// 2. Click to place sticky note with immediate text editing
// 3. Draw on sticky notes with pen, marker, highlighter tools
// 4. Add text, images, tables, connectors to sticky notes
// 5. Move sticky notes - all contents move together

const stickyNoteFeatures = {
  containerFunctionality: true, // Full container support
  drawingToolSupport: true,    // Draw directly on sticky notes
  multiElementSupport: true,   // Text, images, tables, connectors
  smoothMovement: true,        // Move with all content intact
  eventHandlingFix: true,      // Proper drawing tool integration
  visualClipping: true         // Content stays within boundaries
}

// Container features working:
// - Draw with marker, highlighter, pen tools on sticky notes
// - Add text elements inside sticky note boundaries
// - Place images and tables within sticky notes
// - Create connectors between elements in sticky notes
// - Move sticky notes with all child elements intact
```

### Drawing Tools (PROFESSIONAL SUITE)
```typescript
// Drawing tools (Pen, Marker, Highlighter, Eraser)
// 1. Select drawing tool from toolbar
// 2. Draw anywhere on canvas or on sticky notes/shapes
// 3. Variable width, pressure sensitivity, smooth curves
// 4. Auto-switch to select tool after drawing completion

const drawingFeatures = {
  variableWidth: true,         // 2-20px with pressure sensitivity
  catmullRomSmoothing: true,   // Professional curve algorithms
  realTimePreview: true,      // Live stroke preview
  stickyNoteSupport: true,    // Draw on sticky notes and shapes
  performanceOptimized: true, // 60fps with point throttling
  autoToolSwitch: true        // Switch to select after drawing
}

// All drawing tools working:
// - Pen: Fine detail drawing with variable width
// - Marker: Bold strokes with pressure sensitivity  
// - Highlighter: Semi-transparent overlay effects
// - Eraser: Per-stroke removal with visual feedback
```

### TypeScript Error Prevention
```typescript
// CRITICAL: Avoid these common mistakes

// ❌ Wrong - calling getState() on hook
const store = useCanvasStore.getState()

// ✅ Correct - use hook properly
const store = useCanvasStore()

// ✅ Correct - access store instance directly if needed
const storeInstance = useCanvasStore.getState()
```

### Current Critical Issues & Troubleshooting

#### **🚨 Shape Text Editing Critical Bug (UNRESOLVED)**
**Problem**: Rectangle, Circle, Triangle shapes show two text input fields simultaneously during editing

**Status**: Investigation completed but issue persists despite implementing React-Konva recommended patterns

**Technical Details**:
- Applied conditional rendering: `{!isCurrentlyEditing && (<Text ... />)}`
- Fixed state timing: Set `textEditingElementId` BEFORE creating textarea editors
- Enhanced store debugging with comprehensive logging
- Applied fixes across all shape components (Rectangle, Circle, Triangle)

**Investigation Required**:
- Component instance audit (check for duplicate rendering)
- React state propagation monitoring with DevTools
- Editor lifecycle debugging (creation/destruction cycles)
- Memory leak detection for orphaned textarea elements
- Race condition analysis between state updates and renders

#### **✅ Working Systems (Production Ready)**:
- **Text Tool**: Complete canvas-native implementation with FigJam-style workflow
- **Sticky Note Containers**: Full container functionality with drawing tool support
- **Drawing Tools**: Professional suite (Pen, Marker, Highlighter, Eraser) with variable width
- **Shape Creation**: Professional click-to-place workflow with crosshair cursors
- **Undo/Redo**: Complete history management with UI button states
- **Performance**: 60+ FPS with 1000+ elements using quadtree optimization

#### **Development Debugging**:
```typescript
// Enhanced debug logging available:
console.log('🎯 [Store] setTextEditingElement:', { from: currentId, to: id });
console.log('[KonvaCanvas] Tool state updated:', toolName);
console.log('[CanvasEventHandler] Event processing:', eventType);

// Check browser console for:
// - Tool state changes
// - Text editing state transitions  
// - Element creation/update cycles
// - Store state modifications
```