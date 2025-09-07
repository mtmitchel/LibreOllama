# Canvas Renderer V2 - Modular Architecture

## Overview
The Canvas Renderer has been refactored from a monolithic 5500-line file into focused, testable modules that follow the single-responsibility principle.

## Module Structure

```
src/features/canvas/renderer/
├── index.ts                 # Main orchestrator
├── types.ts                 # Branded IDs and discriminated unions
├── geometry.ts              # Pure math/geometry functions
├── text-layout.ts           # Text measurement and layout
├── layers.ts                # 4-layer pipeline management
├── nodes.ts                 # Node factory with pooling
├── transform.ts             # Transformer controller
├── tween.ts                 # Animation system
├── store-adapter.ts         # Zustand wrapper
├── editor/
│   ├── overlay.ts          # DOM editor overlays
│   └── measure.ts          # Auto-grow measurement
└── tests/
    ├── geometry.test.ts    # Geometry tests
    └── text-layout.test.ts # Text layout tests
```

## Key Improvements

### 1. **Modular Architecture**
- Each module has a single, clear responsibility
- Dependencies flow in one direction (no circular deps)
- Easy to test, maintain, and extend

### 2. **Type Safety**
- Branded IDs (`ElementId`, `LayerId`) prevent type confusion
- Discriminated unions for element types enable exhaustive checking
- Narrowed APIs (e.g., `updateCircle(el: CircleElement)`)

### 3. **Performance Optimizations**
- Node pooling reduces GC pressure
- RAF batching for efficient drawing
- Fine-grained store subscriptions
- Spatial indexing ready (quadtree hooks)

### 4. **Testing**
- Pure functions in geometry/text-layout are easily testable
- Store adapter enables isolated testing
- Mock implementations for integration tests

## Module Responsibilities

### **Orchestrator** (`index.ts`)
- Public API: `mount()`, `sync()`, `openEditor()`, `syncSelection()`
- Coordinates all modules
- Manages lifecycle and event flow

### **Layer Manager** (`layers.ts`)
- Creates and manages 4 layers: background, main, preview, overlay
- Background draws grid
- Preview handles in-progress operations
- Overlay for transformer and DOM bounds

### **Node Factory** (`nodes.ts`)
- Creates Konva nodes for each element type
- Implements object pooling for frequently replaced nodes
- Manages hit areas for touch-friendly interaction

### **Geometry** (`geometry.ts`)
- Pure functions for center-origin geometry
- Inscribed square/rectangle calculations
- Hit area sizing
- Point-in-shape tests

### **Text Layout** (`text-layout.ts`)
- Ensures DOM/Canvas text parity
- Measures text with proper line height
- Fits font size to bounds
- Calculates auto-grow requirements

### **Editor Overlay** (`editor/overlay.ts`)
- Manages contenteditable/textarea overlays
- Positions using absolute transform
- Handles input coalescing via RAF
- Implements circle clipping for FigJam-style editing

### **Measurement** (`editor/measure.ts`)
- Ghost element measurement
- Fixed-point convergence (5 passes or Δ<0.5px)
- Device pixel snapping
- Guard band calculation (fontSize*0.4 + 4px)

### **Transformer** (`transform.ts`)
- Element-specific constraints (circles: bottom-right only, keep ratio)
- Centered scaling for circles
- Transform normalization (scale → size)

### **Tween** (`tween.ts`)
- Smooth animations for radius, position, opacity
- Multiple easing functions
- Cancellable animations
- Updates overlay + shape in same frame

### **Store Adapter** (`store-adapter.ts`)
- Thin wrapper around Zustand
- Enables testing with mock stores
- Fine-grained subscriptions
- Respects "store is source of truth"

## Migration Guide

### From CanvasRendererV2 to new architecture:

```typescript
// Old
import { CanvasRendererV2 } from './services/CanvasRendererV2';
const renderer = new CanvasRendererV2();

// New
import { createRenderer } from './renderer';
const renderer = createRenderer({
  autoFitDuringTyping: false,
  editorClipEnabled: true
});

// Mount to stage and store
renderer.mount(stage, store);

// Sync elements
renderer.sync(elements);

// Open editor
renderer.openEditor(elementId);

// Update selection
renderer.syncSelection(selectedIds);
```

## Testing

Run tests with:
```bash
npm test src/features/canvas/renderer/tests
```

Example test:
```typescript
import { inscribedSquare } from '../geometry';

it('should calculate inscribed square', () => {
  const result = inscribedSquare(100, 8, 2);
  expect(result.size).toBeCloseTo(133.42, 1);
});
```

## Performance Considerations

1. **Node Pooling**: Reuses nodes to reduce garbage collection
2. **Batch Drawing**: Coalesces draw calls via RAF
3. **Lazy Updates**: Only updates changed properties
4. **Spatial Indexing**: Ready for quadtree integration
5. **Memory Management**: Proper cleanup in `dispose()`

## Future Enhancements

- [ ] Viewport culling with quadtree
- [ ] WebGL renderer option
- [ ] Worker-based text measurement
- [ ] Incremental rendering for large canvases
- [ ] Undo/redo integration

## Blueprint Alignment

This architecture follows the established blueprint:
- ✅ 4-layer pipeline (background, main, preview, overlay)
- ✅ Renderer-owned overlays
- ✅ Store-first testing
- ✅ Type safety with branded IDs
- ✅ Performance optimizations (pooling, batching)
- ✅ Same-frame DOM/Canvas sync