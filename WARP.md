# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

LibreOllama is a cross-platform desktop application built with Tauri (Rust backend) and React 19 (TypeScript frontend). It combines AI chat, visual canvas, email management, task organization, and note-taking in a single workspace.

## Essential Development Commands

### Core Development
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

### Code Quality (Required before commits)
```bash
# TypeScript type checking (MUST pass)
npm run type-check

# Linting (MUST pass)
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check design system compliance
npm run lint:design-system
```

### Visual Testing & Component Development
```bash
# Launch component library/storybook
npm run ladle

# Visual regression tests
npm run visual-test

# Component library build
npm run ladle:build
```

## High-Level Architecture

### Frontend Architecture
- **Framework**: React 19 + TypeScript with strict mode enabled
- **State Management**: Zustand stores with Immer middleware for immutable updates
- **Desktop Framework**: Tauri for secure, lightweight desktop applications
- **Build Tool**: Vite with advanced chunk splitting for performance
- **Canvas System**: Konva.js + custom imperative renderer (migrating from react-konva)

### Backend Architecture (Rust/Tauri)
- **Commands**: `src-tauri/src/commands/` - API endpoints exposed to frontend
- **Services**: `src-tauri/src/services/` - Business logic and integrations
- **Database**: SQLite for local persistence with encryption
- **Authentication**: OAuth2 with OS keyring for secure token storage

### Feature Module Structure
Located in `src/features/`:
- **canvas/**: Visual whiteboard with 15+ element types, advanced drawing tools
- **chat/**: AI chat with multi-provider LLM support (OpenAI, Anthropic, Ollama, etc.)
- **mail/**: Gmail integration with OAuth2 authentication
- **notes/**: Rich text editor using BlockNote
- **projects/**: Project management and organization
- **google/**: Google services integration (Calendar, Tasks)

## Canvas System (Core Architecture)

The canvas is the most complex feature with a sophisticated architecture:

### Rendering Pipeline
- **NonReactCanvasStage**: Main canvas component using imperative Konva pipeline
- **Layer System**: Background → Main → Preview FastLayer (GPU-accelerated) → Overlay
- **Migration Status**: Phase 1 complete (imperative core), Phase 2 in progress (state bridge)

### State Management
- **Unified Store**: `src/features/canvas/stores/unifiedCanvasStore.ts`
- **8 Modules**: Element, selection, viewport, tools, etc. using Zustand + Immer
- **Performance**: Spatial indexing with QuadTree, viewport culling, node pooling

### Key Canvas Files
- `src/features/canvas/components/NonReactCanvasStage.tsx` - Main canvas component
- `src/features/canvas/renderer/` - Core rendering pipeline
- `src/features/canvas/stores/modules/` - State management modules

**Important**: Always update `docs/CANVAS_IMPLEMENTATION.md` and `docs/CANVAS_STATUS.md` when making canvas changes.

## Design System Migration

Currently migrating from Tailwind to an Asana-inspired design system:
- **Design tokens**: `src/styles/asana/` directory
- **Goal**: Clean, light theme with purple accents only
- **Backwards compatibility**: Layer maintained during gradual migration
- **Status**: Components still being updated to use Asana classes

## Testing Architecture

### Framework & Setup
- **Testing Library**: Vitest with React Testing Library
- **Environment**: jsdom with comprehensive DOM mocking
- **Setup Files**: `vitest.hoisted.setup.ts` and `src/tests/setup.ts`
- **Coverage Goal**: 80%+ for implemented features

### Feature Testing Status
- Canvas: 98/100 (Exemplary) - Store-first unit tests
- Chat System: 95/100 (Exemplary) - Real LLM integration tests
- Tasks: 95/100 (Exemplary) - Local persistence & drag-drop tests
- Gmail: 85/100 (Strong) - Mocked Tauri service tests
- Backend: 90/100 (Strong) - Individual command handlers

## TypeScript Configuration

### Strict Type Safety
- **Zero compilation errors** policy enforced
- **Path aliases**: `@/` → `src/`, `@tests/` → `src/tests/`
- **No `any` types** allowed
- **Branded types**: Used in canvas system for type-safe ID handling

### Key Type Definitions
- Canvas elements: Discriminated union in `src/features/canvas/types/`
- Google API types: `src/types/google.ts`
- Store types: Co-located with each feature store

## Development Patterns

### State Management
- **Primary**: Zustand stores in `src/stores/` and feature-specific stores
- **Canvas**: Unified 8-module store with Immer for immutable updates
- **Pattern**: Modular slices with clear separation of concerns

### File Organization
- **Components**: PascalCase (e.g., `SyncStatus.tsx`)
- **Utilities**: kebab-case (e.g., `spatial-index.ts`)
- **Hooks**: `useX` pattern (e.g., `useCanvasStore`)
- **Directories**: kebab-case or domain folders

### Performance Guidelines
- **Canvas**: Viewport culling, spatial indexing, GPU-accelerated FastLayer
- **General**: React.memo for expensive components, virtualized lists
- **State**: Use proper Zustand selectors to minimize re-renders

## Security & Authentication

- **OAuth2 with PKCE**: All Google integrations use secure desktop flow
- **Token Storage**: OS keyring via Tauri (never localStorage)
- **Content Sanitization**: DOMPurify for email and HTML content
- **Encryption**: AES-256-GCM for canvas data persistence

## Git Workflow & Commit Standards

- **Branches**: Feature branches from `main`
- **Pre-commit hooks**: Husky runs linting and type checks automatically
- **Commit format**: Clear, imperative subject (prefer Conventional Commits)
- **Documentation**: Update CHANGELOG.md for all significant changes

## Critical Documentation

When making changes, update these key files:
- **CHANGELOG.md**: Document all features, fixes, and changes
- **docs/CANVAS_IMPLEMENTATION.md**: Canvas architecture details
- **docs/CANVAS_STATUS.md**: Canvas progress and known issues
- **docs/PROJECT_STATUS.md**: Overall project status and roadmap

## Known Issues & Current Focus

### Canvas V2 Migration
- Phase 1 (Complete): Fresh imperative Konva core
- Phase 2 (In Progress): State bridge integration
- Phase 3 (Planned): Feature parity and performance optimization

### Testing Issues
- 24 failing tests related to Google API mocks need resolution
- Some race conditions in Gmail frontend tests

### Design System Migration
- Components still using Tailwind instead of Asana classes
- Sidebar needs conversion from dark to light Asana design

## Path Aliases & Module Resolution

- **@/**: Points to `src/` directory
- **@tests/**: Points to `src/tests/` directory
- **Canvas mocking**: Universal canvas mock at `src/tests/__mocks__/canvas-universal.ts`
- **Optimized dependencies**: Konva, React, Zustand pre-bundled for performance
