# Canvas Renderer Migration Guide

## Overview

This document outlines the migration from the monolithic `CanvasRendererV2.ts` (6000+ lines) to the new modular architecture.

## Architecture Comparison

### Old Structure (CanvasRendererV2)
```
CanvasRendererV2.ts (6004 lines)
├── All initialization logic
├── All event handling
├── All element creation/updating
├── All selection management
├── All text editing
├── All drag/drop logic
├── All viewport handling
└── Everything else...
```

### New Modular Structure
```
CanvasRenderer.ts (350 lines) - Orchestrator
├── renderer/core.ts - Stage/layer lifecycle
├── renderer/events.ts - Centralized event handling
├── renderer/selection.ts - Transformer & selection
├── renderer/elements/factory.ts - Element creation/updates
├── renderer/text-editor.ts - Text/sticky editing (TODO)
├── renderer/drag-drop.ts - Drag operations (TODO)
├── renderer/viewport.ts - Pan/zoom (TODO)
└── renderer/sync.ts - State synchronization (TODO)
```

## Migration Status

### ✅ Completed Modules
- **Core** (`renderer/core.ts`): Stage initialization, layer management, RAF batching
- **Events** (`renderer/events.ts`): Centralized event handling at stage level
- **Selection** (`renderer/selection.ts`): Transformer, selection highlights
- **Element Factory** (`renderer/elements/factory.ts`): Already existed, being reused
- **Orchestrator** (`services/CanvasRenderer.ts`): Main coordinating class

### 🚧 Modules To Extract
- **Text Editor**: Extract lines 2719-3500 from CanvasRendererV2
- **Drag/Drop**: Extract lines 2824-2910 from CanvasRendererV2  
- **Viewport**: Extract pan/zoom logic
- **Connectors**: Extract connector-specific logic
- **State Sync**: Extract diffing/sync logic from syncElements

### 🗑️ To Remove
- Entire `__archive__/2025-09-01-canvas-react-konva/` folder
- `.backup.react-konva` files
- Duplicate type files
- Duplicate throttling utilities
- Old spatial index implementation

## Migration Steps

### Phase 1: Parallel Implementation (Current)
1. ✅ Create modular structure alongside CanvasRendererV2
2. ✅ Implement core modules
3. 🚧 Test new renderer in isolation

### Phase 2: Integration Testing
1. Create test harness comparing both renderers
2. Ensure feature parity
3. Performance benchmarking

### Phase 3: Switchover
1. Update `NonReactCanvasStage.tsx` to use new renderer
2. Keep CanvasRendererV2 as backup (renamed to `CanvasRendererV2.backup.ts`)
3. Monitor for issues

### Phase 4: Cleanup
1. Remove CanvasRendererV2 after stability confirmed
2. Remove archive folders
3. Consolidate duplicate utilities

## API Changes

### Initialization
```typescript
// Old
const renderer = new CanvasRendererV2();
renderer.init(container, viewport, {
  updateElement: (id, updates) => { ... }
});

// New
const renderer = new CanvasRenderer({
  container,
  onElementUpdate: (id, updates) => { ... },
  onSelectionChange: (ids) => { ... }
});
renderer.init();
```

### Element Syncing
```typescript
// Old
renderer.syncElements(elements);

// New (same API)
renderer.syncElements(elements);
```

### Selection
```typescript
// Old
renderer.syncSelection(selectedIds);

// New (same API)
renderer.syncSelection(selectedIds);
```

## Benefits of New Architecture

1. **Maintainability**: 350-line orchestrator vs 6000-line monolith
2. **Testability**: Each module can be unit tested independently
3. **Performance**: Clearer separation allows targeted optimizations
4. **Extensibility**: New features can be added as modules
5. **Debugging**: Issues isolated to specific modules
6. **Code Reuse**: Modules can be shared with other renderers

## Risk Mitigation

1. **Gradual Migration**: Running both renderers in parallel initially
2. **Feature Flags**: Toggle between old/new renderer at runtime
3. **Comprehensive Testing**: Full test suite before switchover
4. **Rollback Plan**: Keep V2 as backup for quick revert

## Next Steps

1. Complete remaining module extractions (text-editor, drag-drop, viewport)
2. Create integration test suite
3. Performance benchmark against V2
4. Update NonReactCanvasStage to support both renderers
5. Implement feature flag for A/B testing
6. Monitor metrics and user feedback
7. Complete switchover when stable

## Code Quality Improvements

### Before
- Mixed concerns in single file
- Difficult to understand flow
- Hard to test individual features
- Performance bottlenecks hidden

### After
- Single responsibility per module
- Clear data flow
- Isolated unit tests
- Performance profiling per module

## Timeline Estimate

- Week 1: Complete module extraction ✅ (Partially done)
- Week 2: Integration testing and bug fixes
- Week 3: Performance optimization
- Week 4: Production rollout with feature flag
- Week 5: Monitor and fix issues
- Week 6: Remove old renderer

## Success Metrics

- [ ] All canvas features working identically
- [ ] Performance equal or better than V2
- [ ] Test coverage > 80% for new modules
- [ ] Zero regression bugs in production
- [ ] Code complexity metrics improved
- [ ] Developer satisfaction increased