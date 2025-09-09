# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LibreOllama is a cross-platform desktop application built with Tauri (Rust backend) and React 19 (TypeScript frontend). It combines AI chat, visual canvas, email management, task organization, and note-taking in a single workspace.

## Essential Commands

### Development
```bash
# Run full Tauri application (recommended for most development)
npm run tauri:dev

# Run frontend only (Vite dev server - faster for UI-only changes)
npm run dev

# Build for production
npm run tauri:build
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a single test file
npx vitest run path/to/test.ts
```

### Code Quality
```bash
# TypeScript type checking (MUST pass before committing)
npm run type-check

# Linting (MUST pass before committing)
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check design system compliance
npm run lint:design-system
```

## Architecture & Core Systems

### Canvas System
- **Location**: `src/features/canvas/`
- **Renderer**: Custom V2 renderer with imperative Konva pipeline in `src/features/canvas/renderer/`
- **State**: Unified store at `src/features/canvas/stores/unifiedCanvasStore.ts` (8 modules using Zustand + Immer)
- **Components**: `NonReactCanvasStage.tsx` is the main canvas component
- **Key Features**: 15+ element types, smart connectors, drawing tools (pen, highlighter, eraser), sections, image support
- **Performance**: Spatial indexing with QuadTree, viewport culling, node pooling, GPU-accelerated FastLayer for images
- **Migration**: Currently migrating from react-konva to direct Konva (Phase 1 complete, Phase 2 in progress)

**IMPORTANT Canvas Documentation**:
- **ALWAYS CHECK**: `docs/CANVAS_IMPLEMENTATION.md` for current implementation details
- **ALWAYS CHECK**: `docs/CANVAS_STATUS.md` for latest status and known issues
- **Architecture**: See these docs for the architectural approach and design decisions
- **Updates Required**: When making canvas changes, update these documentation files accordingly

### State Management
- **Primary**: Zustand stores in `src/stores/` and feature-specific stores
- **Canvas**: 8-module unified store with Immer for immutable updates
- **Pattern**: Modular slices with clear separation of concerns

### Backend (Rust/Tauri)
- **Commands**: `src-tauri/src/commands/` - API endpoints exposed to frontend
- **Services**: `src-tauri/src/services/` - Business logic
- **Authentication**: OAuth2 with OS keyring for secure token storage
- **Database**: SQLite for local persistence

### Feature Modules
Located in `src/features/`:
- `canvas/` - Visual whiteboard system
- `chat/` - AI chat interface with multi-provider support
- `mail/` - Gmail integration
- `notes/` - Rich text note-taking with BlockNote
- `projects/` - Project management
- `google/` - Google services integration

### Design System
- **Migration**: Moving from Tailwind to Asana-inspired design system
- **Files**: Design tokens in `src/styles/asana/`
- **Compatibility**: Backwards compatibility layer for gradual migration
- **Goal**: Clean, light theme with purple accents (not dark themes)

## Important Patterns & Conventions

### TypeScript
- **Strict mode** enabled - no `any` types
- **Path aliases**: `@/` maps to `src/`, `@tests/` maps to `src/tests/`
- **Zero compilation errors** policy enforced

### Testing
- **Framework**: Vitest with React Testing Library
- **Setup files**: `vitest.hoisted.setup.ts` and `src/tests/setup.ts`
- **Coverage goal**: 80%+ for implemented features
- **Canvas tests**: Located in `src/features/canvas/tests/`

### Canvas Development
- When modifying canvas rendering, check `src/features/canvas/renderer/`
- State changes go through the unified store modules
- Performance-critical code uses imperative Konva API, not React components
- Always test with large canvases (1000+ elements) for performance
- **Update docs**: After significant changes, update `docs/CANVAS_IMPLEMENTATION.md` and `docs/CANVAS_STATUS.md`

### Git Workflow
- Feature branches from `main`
- Current branch indicator available in git status
- Pre-commit hooks via Husky run linting and type checks
- **Update CHANGELOG.md**: Document all significant changes, features, and fixes

## Critical Files to Know

- `src/features/canvas/components/NonReactCanvasStage.tsx` - Main canvas component
- `src/features/canvas/stores/unifiedCanvasStore.ts` - Canvas state management
- `src/features/canvas/renderer/index.ts` - Core rendering pipeline
- `src/features/canvas/renderer/nodes.ts` - Node rendering logic
- `src/features/canvas/renderer/transform.ts` - Transformation utilities
- `src/stores/settingsStore.ts` - Global app settings
- `src-tauri/src/main.rs` - Tauri backend entry point

## Documentation to Maintain

When making changes, update these key documentation files:
- **`CHANGELOG.md`** - Document all features, fixes, and changes
- **`docs/CANVAS_IMPLEMENTATION.md`** - Canvas architecture and implementation details
- **`docs/CANVAS_STATUS.md`** - Current canvas status, known issues, and progress
- **`docs/PROJECT_STATUS.md`** - Overall project status and roadmap

## Current Focus Areas

### Canvas V2 Migration
Following the blueprint in `docs/KONVA_BASED_CANVAS.md`:
- Phase 1 (Complete): Fresh imperative Konva core
- Phase 2 (In Progress): State bridge integration
- Phase 3 (Planned): Feature parity
- Phase 4 (Planned): Performance optimization

### Known Issues
- 24 failing tests related to Google API mocks
- Some components still using Tailwind instead of Asana classes
- Sidebar using dark theme instead of light Asana design

## Performance Guidelines

### Canvas Performance
- Use viewport culling for elements outside view
- Batch state updates with Immer
- Leverage FastLayer for images (GPU acceleration)
- Node pooling for frequently created/destroyed elements
- Spatial indexing with QuadTree for hit detection

### General Performance
- Lazy load feature modules
- Use React.memo for expensive components
- Virtualize long lists with @tanstack/react-virtual
- Minimize re-renders with proper Zustand selectors

## Security Notes

- Never commit API keys, tokens, or secrets
- OAuth tokens stored in OS keyring via Tauri
- Canvas data encrypted with AES-256-GCM for persistence
- All external API calls go through Rust backend
- DO NOT take initiative on your own or carry out tasks for which you haven't been given explicit permission. Only do what's asked of you.
- NEVER make claims about anything being production ready unless you are given EXPLICIT PERMISSION to do so.
- you are to use the sequential thinking server AT ALL times. you are expressly forbidden from thinking or taking any action without using the sequential thinking server.