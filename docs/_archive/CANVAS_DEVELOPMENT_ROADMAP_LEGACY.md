# LibreOllama Canvas – Development Roadmap (LEGACY)

> **⚠️ LEGACY DOCUMENT - ARCHIVED AS OF JUNE 26, 2025**
> 
> This document has been superseded by `CANVAS_DEVELOPMENT_ROADMAP_REVISED.md`.
> 
> **Current Status**: All phases in this roadmap have been completed successfully.
> Please refer to the revised roadmap for the latest project status and comprehensive completion summary.

---

**Original Document Content (Archived):**

> **📋 Documentation Navigation****What's Done:**
- **Advanced Grouping**: Fully implemented and production-ready with type-safe `GroupId` and `GroupElement` types, store operations, UI integration, and comprehensive testing.
- **Layer Management**: **NEWLY COMPLETED** - Full layer system implementation:
  - **State Management**: New `layerStore` slice managing z-index order, visibility, and lock state
  - **UI Creation**: Complete `LayersPanel` React component with drag-and-drop reordering, visibility/lock toggles
  - **UI Integration**: Toolbar button and panel integration with store-controlled visibility
  - **Rendering Logic**: Dynamic layer rendering in `CanvasLayerManager` with selective re-rendering and correct stacking
- The codebase maintains strict TypeScript, branded types, and robust error handling throughout.

**What's Next:**
- **Element Snapping** (Currently starting): Grid/guides snapping system with new snapping store and utilities
- Upcoming: Predictive loading, intelligent zoom, and off-main-thread processing

**Recent Dev Thread Summary (June 26, 2025):**
- **✅ COMPLETED Phase 2**: TypeScript discriminated union fixes (33 → 0 errors)
- **✅ COMPLETED**: Enhanced type system with proper discriminated unions
- **✅ COMPLETED**: Canvas component type safety improvements
- **✅ COMPLETED**: Zero TypeScript compilation errors achieved
- **✅ COMPLETED**: Production build verification successful
- **✅ COMPLETED Phase 3B**: UI/UX Modernization & Toolbar Redesign
  - Bottom-center floating toolbar (FigJam-style positioning)
  - Color palette popup stability fixes
  - Modern visual design polish (pastels, refined edges, cursors)
  - CSS architecture modularization
- **✅ COMPLETED Phase 3C**: Advanced Drawing Tools & Professional UX (NEW)
  - **FigJam-style drawing tools**: Draw-to-size functionality for text, tables, and sections
  - **Professional toolbar positioning**: Advanced responsive calculations prevent bleeding
  - **Enhanced sidebar layout**: Proper spacing, toggle functionality, modern styling
  - **Sticky note color system**: Dynamic color selection with store persistence
  - **Crosshair cursors**: Visual feedback for all drawing modes Document**: Project management, phases, business impact, executive summary  
> - **[CANVAS_TESTING_PLAN.md](CANVAS_TESTING_PLAN.md)**: Technical testing methodology, patterns, detailed procedures  
> - **[CANVAS_IMPLEMENTATION_CHECKLIST.md](CANVAS_IMPLEMENTATION_CHECKLIST.md)**: Systematic fixes and current integration status  

> **🎉 TYPE SYSTEM & PERFORMANCE BLUEPRINT COMPLETE (June 26, 2025)**:  
> - **Architecture Audit & Refactor Plan**: Aligned with Ultimate Guide and Developer Checklist  
> - **State Store Redesign**: Discriminated unions, quadtree‐backed spatial index, granular selectors  
> - **Component Layers**: Grid, Element, Connector, UI layers with `batchDraw()` and WebGL  
> - **Event Delegation**: Single listener on Stage, tool‐driven dispatch via `useEventDispatcher`  
> - **IPC & Autosave**: Typed `canvas:save/diff` Tauri commands, Rust/TS shared schemas  
> - **Strict TS Enforcement**: No `any`, no generic `Partial`, 100% `strict` mode  

## 🚀 Current Status & Active Development

**CURRENT STATUS (June 26, 2025):**  
- **Type Safety**: ✅ Zero TypeScript compilation errors achieved in Phase 2
- **User Testing**: ✅ Advanced functionality validated (draw-to-size tools, dynamic colors, responsive layout)
- **UX Excellence**: ✅ All major UX issues resolved with professional-grade implementation
- **Active Development**: ✅ Phase 3C completed - Production-ready drawing tools and UX
- **Component Interfaces**: ✅ Enhanced with specific element types (StickyNoteElement, TableElement)
- **Import Hierarchy**: ✅ Established enhanced.types.ts as single source of truth
- **Build Status**: ✅ Production build successful with optimized performance
- **Testing Framework**: ✅ Robust integration testing with real store instances
- **Drawing Tools**: ✅ FigJam-style draw-to-size functionality for all creation tools
- **Responsive Design**: ✅ Advanced toolbar positioning and sidebar layout system  

### 🎯 Achieved Milestones  

- ✅ **Phase 0**: File removal and duplicate code elimination (COMPLETED December 2024)
- ✅ **Phase 1**: Type consolidation and single source of truth (COMPLETED December 2024)  
- ✅ **Phase 2**: TypeScript discriminated union fixes (COMPLETED December 2024)
  - All 33 TypeScript compilation errors resolved
  - Enhanced StickyNoteElement with rich text support
  - Fixed CacheManager type safety with proper type guards
  - Updated component interfaces for type-safe property access
- 🚧 **Phase 3A**: Import standardization and performance optimization (DEFERRED)
- 🚧 **Phase 3B**: UI/UX Modernization & Toolbar Redesign (ACTIVE)
  - **Priority**: Address immediate UX issues based on user feedback
  - **Scope**: Bottom-center floating toolbar, color palette fixes, visual polish
  - **Goal**: Modern FigJam-style interface with stable interactions
- ⏭️ **Phase 4**: Store architecture cleanup and consolidation (PLANNED)  

## 🛠️ Debugging & Profiling Infrastructure

- **Quadtree Inspector**: Visualizes spatial index coverage  
- **Layer Profiler**: Reports draw counts and `batchDraw()` batches  
- **Event Log**: Central dispatch trace with tool context  
- **MemoryLeakDetector**: Hook and CLI commands for resource tracking  

## 📋 Active Development Phases

### 🎨 Phase 3B: UI/UX Modernization & Toolbar Redesign (ACTIVE)

**Focus**: Transform canvas into modern, polished design tool matching FigJam standards.

**📝 User Feedback Driving Changes:**
- Toolbar positioning issues (current top-sticky causes viewport jumping)
- Color palette popup instability (causes canvas resize)
- Visual design needs modernization (harsh colors, rough edges)
- Missing tools not working (section tool, pen tool)
- CSS consolidation broke UI layout

**🎯 Phase 3B Goals:**

#### **Priority 1: Toolbar Modernization (Days 1-2)**
- ✅ **Bottom-center floating toolbar** - FigJam-style positioning
- ✅ **Fix viewport jumping** - Convert from sticky to overlay positioning
- ✅ **Stable popups** - React Portal implementation for color palette
- ✅ **CSS class fixes** - Resolve ShapesDropdown mismatch bug

#### **Priority 2: Visual Design Polish (Days 3-4)**
- ✅ **Refined color palette** - Lighter, calmer pastels for sticky notes
- ✅ **Modern element styling** - Soft shadows, rounded corners, subtle borders
- ✅ **Enhanced interactions** - Better resize handles, hover states, cursors
- ✅ **Selection indicators** - Clean, modern selection outlines

#### **Priority 3: CSS Architecture (Days 5-6)**
- ✅ **Modular CSS** - Break up 780-line globals.css into components
- ✅ **Z-index management** - Consistent layering system
- ✅ **Performance optimization** - Reduced CSS bundle size

**📈 Success Metrics:**
- ✅ **No viewport jumping** when using toolbar
- ✅ **Stable color palette** popups
- ✅ **Modern visual aesthetics** matching design tool standards
- ✅ **Improved user satisfaction** with interface polish

---

### Phase 5: Advanced Features & Optimization (Planned)

**Focus**: Enhance grouping, snapping, and smart viewport workflows.

- **Advanced Grouping** (✅ Completed): Multi-element grouping/ungrouping, relative transforms - **PRODUCTION READY**  
- **Layer Management** (✅ Completed): Z-index APIs, dynamic layer toggles, selective re-rendering, drag-and-drop reordering - **PRODUCTION READY**  
- **Element Snapping** (🔄 In Progress): Grid, guides, and element-to-element alignment  

### Phase 6: Smart Performance Features (Planned)

- **Predictive Loading**: Pre-fetch elements entering viewport  
- **Intelligent Zoom**: Context-aware zoom levels based on tool and selection  
- **Off-Main-Thread Processing**: Web Worker mesh for heavy calculations  

## 📈 Roadmap Timeline

| Phase | Description                                                | Status        |
|-------|------------------------------------------------------------|---------------|
| 1     | Audit & Architecture Mapping                               | Completed ✅  |
| 2     | Blueprint & Planning                                       | Completed ✅  |
| 3     | Refactor & Implementation                                   | Completed ✅  |
| 4     | Delivery & Validation                                       | Completed ✅  |
| 5     | Advanced Features & Optimization                            | In Progress 🔄 |
| 6     | Performance & Smart Features                                | Planned 🚧    |
| 7     | Release & Monitoring                                        | Upcoming      |

## 📋 Executive Summary

**Production‐ready foundation** with enterprise‐grade type safety, performant rendering, and robust IPC. Current focus is on advanced grouping and smart canvas workflows to elevate user experience beyond baseline FigJam-style canvas.

---

## Handoff Note for Next Developer (June 26, 2025)

Welcome! Here’s a quick summary to get you up to speed on the LibreOllama Canvas module:

**What’s Done:**
- Advanced grouping is now fully implemented and production-ready. This includes:
  - Type-safe `GroupId` and `GroupElement` types, with all type guards and store logic in place.
  - Store operations for grouping/ungrouping, group membership, and group transforms.
  - UI integration: Group/Ungroup controls in the toolbar, keyboard shortcuts, and selection logic.
  - Performance and validation: All group operations are tested, type-checked, and monitored for performance.
- The codebase is clean, modular, and up to date with the latest architectural and type safety standards.

**What’s Next:**
- The next major focus is the Layer Management System (currently at 60% completion):
  - Z-index APIs for element stacking order
  - Dynamic layer toggles and selective re-rendering
  - UI controls for managing layers
- Also upcoming: snapping (grid/guides), predictive loading, intelligent zoom, and off-main-thread processing.

**Relevant Context:**
- All grouping and layer logic centralized in the enhanced canvas store and fully integrated with the selection and toolbar systems.
- The roadmap, implementation checklist, and testing plan are up to date and should be referenced for any new work.
- The codebase enforces strict TypeScript, branded types, and robust error handling throughout.

**Architecture Status:**
- All layer logic centralized in enhanced canvas store
- UI fully integrated with selection and toolbar systems
- Performance optimized with selective re-rendering
- Documentation updated to reflect completion

**Tip:**
- Element Snapping is the current development focus - review the snapping store and utilities for implementation progress.
- All documentation is consolidated—if you need architectural or testing details, see the links at the top of this file.

Good luck, and thank you for continuing the work!

---

# Technical Deep Dive for Developer Implementation

## 1. Typed Zustand Store with Quadtree Spatial Index

### Store Definition  
```ts
import create from 'zustand'
import { Quadtree, Point, Bounds } from './quadtree'

// Discriminated union for all canvas items
export type CanvasItem =
  | { id: ElementId; type: 'rectangle'; x: number; y: number; width: number; height: number }
  | { id: ElementId; type: 'circle'; x: number; y: number; radius: number }
// …other shapes…

interface CanvasStore {
  items: Record<ElementId, CanvasItem>
  quadtree: Quadtree
  viewport: { x: number; y: number; scale: number }
  addItem: (item: CanvasItem) => void
  updateItem: (id: ElementId, props: Partial<CanvasItem>) => void
  removeItem: (id: ElementId) => void
  useVisibleIds: () => ElementId[]
}

export const useCanvasStore = create((set, get) => {
  const qt = new Quadtree({ x: 0, y: 0, width: 10000, height: 10000 })
  return {
    items: {},
    quadtree: qt,
    viewport: { x: 0, y: 0, scale: 1 },
    addItem: item => set(state => {
      state.quadtree.insert(item, { x: item.x, y: item.y, width: getBBoxWidth(item), height: getBBoxHeight(item) })
      return { items: { ...state.items, [item.id]: item } }
    }),
    updateItem: (id, props) => set(state => {
      const existing = state.items[id]
      const updated = { ...existing, ...props }
      state.quadtree.remove(existing, getBounds(existing))
      state.quadtree.insert(updated, getBounds(updated))
      return { items: { ...state.items, [id]: updated } }
    }),
    removeItem: id => set(state => {
      const item = state.items[id]
      state.quadtree.remove(item, getBounds(item))
      const { [id]: _, ...rest } = state.items
      return { items: rest }
    }),
    useVisibleIds: () => {
      const vp = get().viewport
      const bounds: Bounds = {
        x: vp.x,
        y: vp.y,
        width: window.innerWidth / vp.scale,
        height: window.innerHeight / vp.scale
      }
      return get().quadtree.query(bounds).map(item => item.id)
    }
  }
})

// Helpers
function getBBoxWidth(item: CanvasItem): number {
  switch (item.type) {
    case 'rectangle': return item.width
    case 'circle': return item.radius * 2
    // …
  }
}
function getBBoxHeight(item: CanvasItem): number {
  switch (item.type) {
    case 'rectangle': return item.height
    case 'circle': return item.radius * 2
    // …
  }
}
function getBounds(item: CanvasItem): Bounds {
  return { x: item.x, y: item.y, width: getBBoxWidth(item), height: getBBoxHeight(item) }
}
```

## 2. React-Konva Component Layers

### Layered Stage  
```tsx
import { Stage, Layer } from 'react-konva'
import { useCanvasStore } from './store'
import GridLayer from './GridLayer'
import ElementsLayer from './ElementsLayer'
import ConnectorsLayer from './ConnectorsLayer'
import UILayer from './UILayer'

export function KonvaCanvas() {
  const { viewport } = useCanvasStore(state => ({ viewport: state.viewport }))
  const handleTransform = useTransformUpdater() // sync pan/zoom
  return (
    <Stage>
      <GridLayer />
      <ElementsLayer />
      <ConnectorsLayer />
      <UILayer />
    </Stage>
  )
}
```

### ElementsLayer with Memoized Shapes  
```tsx
import { Rect, Circle } from 'react-konva'
import React from 'react'
import { useCanvasStore } from './store'

const Shape = React.memo(function Shape({ item }) {
  switch (item.type) {
    case 'rectangle':
      return <Rect {...item} />
    case 'circle':
      return <Circle {...item} />
    default:
      return null
  }
})

export default function ElementsLayer() {
  const visibleIds = useCanvasStore(state => state.useVisibleIds())
  const items = useCanvasStore(state => state.items)
  return (
    <>
      {visibleIds.map(id => (
        <Shape key={id} item={items[id]} />
      ))}
    </>
  )
}
```

## 3. Centralized Event Dispatcher Hook

```ts
import { useEffect } from 'react'
import { Stage, KonvaEventObject } from 'konva/types/Node'
import { useCanvasStore } from './store'

export function useEventDispatcher(stageRef: React.RefObject<Stage>) {
  const { addItem, updateItem, removeItem } = useCanvasStore()
  const tool = useCanvasStore(state => state.currentTool)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    function onMouseDown(e: KonvaEventObject) {
      tool.handleMouseDown(e, { addItem, updateItem, removeItem })
    }
    function onMouseMove(e: KonvaEventObject) {
      tool.handleMouseMove(e, { updateItem })
    }
    function onMouseUp(e: KonvaEventObject) {
      tool.handleMouseUp(e, { addItem, updateItem })
    }

    stage.on('mousedown touchstart', onMouseDown)
    stage.on('mousemove touchmove', onMouseMove)
    stage.on('mouseup touchend', onMouseUp)
    return () => {
      stage.off('mousedown touchstart', onMouseDown)
      stage.off('mousemove touchmove', onMouseMove)
      stage.off('mouseup touchend', onMouseUp)
    }
  }, [stageRef, tool])
}
```

## 4. Konva Node Pooling

```ts
// NodePool.ts
import { Rect, Circle, Line } from 'konva'

class NodePool<T> {
  private pool: T[] = []
  constructor(private ctor: new () => T, private initialSize = 50) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new ctor())
    }
  }
  acquire(): T {
    return this.pool.pop() || new this.ctor()
  }
  release(node: T) {
    this.pool.push(node)
  }
}
```

// In JSX, directly use pooled nodes when needed.

## 5. Tauri IPC with Typed Schemas

### Shared Payload Definition (TypeScript & Rust)
```ts
// src/tauri/payload.ts
export interface SavePayload {
  roomId: string
  delta: Array<{ id: string; props: any }>
}
```

```rust
// src-tauri/src/payload.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct SavePayload {
    pub room_id: String,
    pub delta: Vec<DeltaEntry>,
}

#[derive(Serialize, Deserialize)]
pub struct DeltaEntry {
    pub id: String,
    pub props: serde_json::Value,
}
```

### Tauri Command Registration
```rust
#[tauri::command(namespace = "canvas")]
fn save(payload: SavePayload) -> Result<(), String> {
    // apply delta to DB or file
    Ok(())
}
```

### Frontend Invocation
```ts
import { invoke } from '@tauri-apps/api'

function triggerSave() {
  const delta = computeYjsDeltas()
  invoke('canvas:save', { payload: delta })
    .catch(err => console.error('Save error', err))
}
```

## 6. Strict TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "target": "ES6",
    "jsx": "react-jsx"
  }
}
```

- All slice actions typed precisely.
- No use of `any` or generic `Partial`.
- Discriminated unions for shape types to enforce exhaustive switches.

## 7. Testing and Profiling

### Unit Tests for Store Selectors
```ts
import { act } from 'react-dom/test-utils'
import { useCanvasStore } from './store'

test('useVisibleIds returns only items in viewport', () => {
  const store = useCanvasStore.getState()
  act(() => {
    store.addItem({ id: 'rect1', type: 'rectangle', x: 0, y: 0, width: 50, height: 50 })
    store.viewport = { x: -100, y: -100, scale: 1 }
  })
  expect(store.useVisibleIds()).toContain('rect1')
})
```

### Performance Profiling
- Enable Konva’s debug mode:  
  ```js
  window.Konva.showWarnings = true
  ```
- Use Chrome DevTools Performance panel to record layer batchDraw counts and frame times.
- Integrate automated FPS checks via Puppeteer:
  ```js
  const metrics = await page.metrics()
  expect(metrics.TasksDuration).toBeLessThan(5) // ms per frame
  ```

This deep technical breakdown equips developers with concrete code patterns and configurations to implement the refactored FigJam-style canvas adhering to the Ultimate Guide and Developer Checklist.

---

## 📝 Recent Development Summary

### Layer Management Implementation (June 26, 2025)

**Completed Features:**
- **New Layer Store Slice**: Created `layerStore` to manage layer order (z-index), visibility, and lock state
- **Enhanced Canvas Store**: Integrated layer store into main CanvasStore with updated types and initializer
- **LayersPanel Component**: Built React component with drag-and-drop reordering using native HTML5 API
- **UI Integration**: Added toolbar toggle button and integrated panel into main Canvas app
- **Dynamic Rendering**: Modified `CanvasLayerManager` to render layers based on store configuration with selective re-rendering
- **Full Feature Set**: Users can now reorder layers, toggle visibility, and lock layers through the UI

**Technical Implementation:**
- Native HTML5 drag-and-drop implementation (resolved third-party library compatibility issues)
- Store-controlled panel visibility
- Proper layer stacking order in rendering pipeline
- Integration with existing selection and toolbar systems

**Current Development:** Element Snapping system is beginning implementation with new snapping store and utilities.
