# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreOllama is a Tauri-based desktop application with React 19, TypeScript, and Vite. The primary feature is a sophisticated canvas system for visual content creation and manipulation, built on Konva.js.

**📋 Key Documentation**:
- **docs/PROJECT_STATUS.md** - Current implementation status (READ FIRST for project overview)
- **docs/ARCHITECTURE.md** - Technical implementation patterns, system design, and security
- **docs/TESTING_STRATEGY.md** - Comprehensive testing approach and best practices
- **docs/README.md** - Documentation hub with organized links to all resources

**🚨 Documentation Guidelines**:
- **DO NOT create new documentation files** unless absolutely necessary
- **Always check if information can fit into existing documents first**
- **Consolidate rather than fragment** - enhance existing docs instead
- **Read docs/README.md** for complete documentation structure

**📁 Documentation Organization**:
- **Core Docs**: Architecture, Design System, Testing Strategy, UX Audit, Roadmap
- **Feature Roadmaps**: In `docs/roadmap/` - one file per major feature
- **Archives**: Historical/outdated docs in `docs/_archive/` for reference
- **Root Directory**: Keep minimal - README, LICENSE, CHANGELOG, CLAUDE.md only

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
**CRITICAL**: We have a production-ready testing framework using vanilla Zustand patterns and real store implementations. This framework is specifically designed to catch actual integration bugs and has been completely overhauled (January 2025).

### Key Testing Principles
- **Failing integration tests represent REAL implementation issues** that need to be fixed
- **Use vanilla Zustand testing patterns with real store instances** - no global mocks
- **Robust integration tests expose authentic bugs** that mocked tests miss
- **Real store implementation testing** validates actual functionality, not mock stubs
- **Follow systematic bug fix approach** rather than rebuilding working systems

### Test Suite Status (January 2025)
- **✅ Canvas tests stable** with vanilla Zustand architecture
- **✅ Integration tests passing** with real store instances
- **✅ Gmail integration tests** - some workflow tests disabled due to race conditions
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
- `vitest.hoisted.setup.ts` - Hoisted mocks for proper precedence
- `setup-new.ts` - Modern test environment with real store instances
- Canvas-specific test suites in `src/tests/canvas/`

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

### Integration Testing Protocol
When working on canvas functionality, ALWAYS:
1. **Read the Project Status** (`docs/PROJECT_STATUS.md`) for current implementation status
2. **Read the Implementation Guide** (`docs/IMPLEMENTATION_GUIDE.md`) for development patterns
3. **Use vanilla Zustand testing patterns** with real store instances (not mocked stores)
4. **Run robust integration tests** to expose real implementation issues
5. **Fix actual bugs** identified by failing tests (not test framework issues)
6. **Follow systematic bug fix approach** rather than rebuilding working systems

**🔥 CRITICAL TESTING REQUIREMENTS**:
- **Never use global store mocks** - they hide real integration bugs
- **Always test with real store instances** using `createStore` from `zustand/vanilla`
- **Focus on integration testing** - unit tests alone are insufficient for canvas functionality