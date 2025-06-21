# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreOllama is a Tauri-based desktop application built with React 19, TypeScript, and Vite. The primary feature is a sophisticated canvas system for visual content creation and manipulation, built on Konva.js.

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
- **Testing**: Jest with ESM configuration

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
- Connector Layer (connections between elements)
- UI Layer (selections, controls)

**Element Types**: 15+ types including text, shapes, tables, connectors, sections with discriminated union typing.

**Key Patterns**:
- Orchestrator pattern for canvas coordination
- Viewport culling for performance
- 50-state undo/redo system
- Unified rich text editing across elements

## State Management

Uses Zustand with slice pattern:
- `canvasStore` - Main canvas state and operations
- `selectionStore` - Element selection management
- `viewportStore` - Pan/zoom and viewport state
- `historyStore` - Undo/redo operations

All stores use Immer for immutable updates and follow branded type patterns (`ElementId`, `SectionId`).

## Testing Approach

### Jest Configuration
- ESM-first setup with `@swc/jest`
- Konva mocking for canvas tests
- Path aliases matching Vite config
- Separate Windows configuration (`jest.config.js`)

### Test Utilities
- `konva-test-utils.tsx` - Canvas testing helpers
- `setup-new.ts` - Modern test environment
- Canvas-specific test suites in `src/tests/canvas/`

### Running Specific Tests
```bash
# Single test file
npm test -- ComponentName.test.tsx

# Canvas tests only  
npm run test:canvas

# Watch mode for development
npm run test:watch -- --testNamePattern="specific test"
```

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
**Phase**: 5A (95% complete)
**Status**: Major TypeScript improvements, reduced errors from 152 to 100

Recent focus areas:
- ViewportStore test resolution
- TransformerManager optimization  
- Test suite configuration modernization
- Canvas orchestrator pattern refinement

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
- Windows development requires specific Jest configuration (`jest.config.js`)