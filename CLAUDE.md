# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreOllama is a Tauri-based desktop application**📋 Key Documentation**:
- **docs/README.md** - Documentation guidelines and hierarchy (READ FIRST for new docs)
- **CANVAS_TESTING_PLAN.md** - Comprehensive testing methodology (MUST READ)
- **CANVAS_IMPLEMENTATION_CHECKLIST.md** - Detailed implementation status
- **CANVAS_DEVELOPMENT_ROADMAP.md** - Project phases and achievements

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
3. **Read the Canvas Development Roadmap** (`/docs/CANVAS_DEVELOPMENT_ROADMAP.md`) for overall project status
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
- **CANVAS_DEVELOPMENT_ROADMAP.md** - Project phases and achievements

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

**Branch**: `feat/canvas-refactor-foundation`
**Phase**: 6B-6C (Advanced Element Management & Performance Optimization)
**Status**: Core functionality complete, Section and Connector tools fully implemented

**✅ Recent Achievements (June 2025)**:
- **Section Tool**: Fully functional with click-to-draw workflow
- **Connector Tool**: Complete implementation with smart snap points and auto-update
- **TypeScript Errors**: Reduced from 152 to 100+ errors resolved
- **Integration Issues**: Major UI-backend disconnects resolved
- **Testing Framework**: Robust integration testing with 83/83 tests passing

**🎯 Current Focus Areas**:
- Advanced element management features (grouping, layer management)
- Performance optimization for complex canvas scenarios
- Production readiness validation and user acceptance testing
- Cross-tool integration refinement

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
- **Section and Connector tools are FULLY IMPLEMENTED** - refer to Canvas Tool Development Guidelines above for usage
- **Integration testing framework is robust** - failing tests indicate real bugs, not test issues
- **TypeScript errors focus on store access patterns** - use proper hook patterns vs direct store access
- **Canvas architecture is production-ready** - focus on refinement rather than rebuilding
- **Documentation is comprehensive** - read all canvas docs before making changes

**⚠️ Common Pitfalls to Avoid**:
- Don't call `getState()` on Zustand hook functions
- Don't rebuild working systems - fix specific integration issues
- Don't ignore failing integration tests - they expose real bugs
- Don't assume tools are broken - verify usage workflow first

## Canvas Tool Development Guidelines

### Section Tool Usage
```typescript
// Section tool workflow (FULLY IMPLEMENTED)
// 1. Click the Section tool button (Layout icon - rectangle with grid lines)
// 2. Verify it's active - button highlighted, console shows: "[KonvaCanvas] Tool state updated: section"
// 3. Click and drag on canvas to draw rectangle
// 4. Release mouse to create section (minimum 2x2 pixels)
// 5. Tool automatically switches back to select mode

const handleSectionCreation = () => {
  // Tool state is managed automatically
  // Enhanced debug logging shows tool state changes
  // Minimum section size reduced for easier creation
}

// Features working:
// - Section creation with click and drag
// - Auto-capture of elements within section bounds
// - Section movement (drag to move, child elements move with it)
// - Section resizing and visual feedback during drawing
```

### Connector Tool Usage
```typescript
// Connector tool workflow (FULLY IMPLEMENTED)
// 1. Open Shapes dropdown in toolbar (Square icon with down arrow)
// 2. Select "Line Connector" or "Arrow Connector"
// 3. Click starting point - watch for blue snap indicators on nearby elements
// 4. Drag to ending point - snap points highlight as you hover near elements
// 5. Release to create connector

const connectorFeatures = {
  smartSnapPoints: true,      // Visual feedback with blue circles
  autoUpdate: true,          // Connectors move with connected elements
  attachmentMemory: true,    // Remembers connection points
  realTimePreview: true      // Live preview during creation
}

// What's working:
// - Line connectors (simple lines without arrow heads)
// - Arrow connectors (lines with arrow head at end)
// - Smart snap points (element edges, corners, centers)
// - Auto-update when connected elements move
// - Attachment memory for consistent connection points
```

### Canvas Tool Troubleshooting
```typescript
// Section Tool Issues?
// 1. Check console logs for "[KonvaCanvas] Tool state updated: section"
// 2. Make sure to click and drag (single clicks won't create sections)
// 3. Draw larger sections (very small drags < 2x2 pixels are ignored)
// 4. Check browser console for errors

// Connector Tool Issues?
// 1. Use the Shapes dropdown (don't look for separate connector button)
// 2. Click and drag (single clicks won't create connectors)
// 3. Check console logs for any errors

// Debug Logging Available:
// - Tool state changes logged in KonvaCanvas
// - Event processing logged in CanvasEventHandler  
// - Store updates logged in UI store
// Open browser developer console to see these logs
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