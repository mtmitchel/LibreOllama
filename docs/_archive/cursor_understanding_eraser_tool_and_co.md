# Understanding eraser tool and connector snapping
_Exported on 9/12/2025 at 23:54:20 GMT+2 from Cursor (1.5.11)_

---

**User**

tell me in detail how the eraser tool and the lline and arrow connectors and their snapping logic work i need to share with another dev so provide a ton of detail

---

**Cursor**

I'll help you understand the eraser tool and line/arrow connectors with their snapping logic in detail. Let me explore the codebase to gather comprehensive information about these components.

Based on my analysis of the LibreOllama codebase, I'll provide you with a comprehensive breakdown of how the eraser tool and line/arrow connectors work, including their snapping logic. This should give your fellow developer all the details they need.

# Detailed Technical Documentation: Eraser Tool & Line/Arrow Connectors

## Overview
The LibreOllama canvas implements a sophisticated modular rendering architecture with specialized tools for erasing strokes and creating connected line/arrow elements with intelligent port-based snapping.

## 1. ERASER TOOL IMPLEMENTATION

### Architecture
The eraser tool is implemented through two main components:
- **EraserModule** (`src/features/canvas/renderer/modular/modules/EraserModule.ts`) - Handles rendering-level interactions
- **Drawing Module** (`src/features/canvas/stores/modules/drawingModule.ts`) - Handles store-level erasure logic

### Core Functionality

#### Event Handling & Lifecycle
```1:53:src/features/canvas/renderer/modular/modules/EraserModule.ts
init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const layers = this.ctx.konva.getLayers();
    const stage = layers.overlay?.getStage() || layers.main?.getStage();
    if (!stage || this.bound) return;
    this.bound = true;

    // Stage listeners for eraser lifecycle when tool is active
    // Bind pointer/mouse first, plus capture-phase content* for reliability
    stage.on('pointerdown.moderaser', (e: any) => this.onDown(e));
    stage.on('pointermove.moderaser', (e: any) => this.onMove(e));
    stage.on('pointerup.moderaser',   (e: any) => this.onUp(e));
    stage.on('mousedown.moderaser',   (e: any) => this.onDown(e));
    stage.on('mousemove.moderaser',   (e: any) => this.onMove(e));
    stage.on('mouseup.moderaser',     (e: any) => this.onUp(e));
    stage.on('contentMousedown.moderaser', (e: any) => this.onDown(e));
    stage.on('contentMousemove.moderaser', (e: any) => this.onMove(e));
    stage.on('contentMouseup.moderaser',   (e: any) => this.onUp(e));

    // Create a dashed preview circle on overlay
    try {
      const overlay = layers.overlay;
      if (overlay && !this.previewCircle) {
        this.previewCircle = new Konva.Circle({
          x: 0,
          y: 0,
          radius: 10,
          stroke: '#ef4444',
          strokeWidth: 1,
          dash: [6, 6],
          listening: false,
          visible: false,
          name: 'eraser-preview'
        });
        overlay.add(this.previewCircle as any);
        overlay.batchDraw();
      }
    } catch {}
  }
```

The eraser binds to multiple event types for maximum compatibility across devices and browsers.

#### Visual Feedback System

**Preview Circle**: A dashed red circle (`#ef4444`) follows the cursor when the eraser is active:

```78:89:src/features/canvas/renderer/modular/modules/EraserModule.ts
// Show preview sized to world eraser radius
try {
  const size = Number(store.strokeConfig?.eraser?.size) || 30;
  const rPx = Math.max(1, size * (stage.scaleX?.() || 1)) / 2;
  if (this.previewCircle) {
    this.previewCircle.position({ x: p.x, y: p.y });
    this.previewCircle.radius(rPx);
    this.previewCircle.visible(true);
    this.ctx.konva.getLayers().overlay?.batchDraw();
  }
} catch {}
```

**Key Details:**
- Preview circle scales with canvas zoom (`stage.scaleX()`)
- Size comes from `store.strokeConfig.eraser.size` (default 30px)
- Positioned on the overlay layer to avoid interfering with main canvas content
- Uses screen coordinates, not world coordinates

#### Erasure Logic - Two-Phase Approach

**Phase 1: Incremental Erasure During Movement**
```105:112:src/features/canvas/renderer/modular/modules/EraserModule.ts
// Incremental erase for responsiveness
const size = Number(store.strokeConfig?.eraser?.size) || 30;
try {
  const ids = store.eraseAtPoint(wp.x, wp.y, size) || [];
  if (ids.length > 0 && process.env.NODE_ENV === 'development') {
    console.info('[eraser] move deleted', ids);
  }
} catch {}
```

**Phase 2: Path-Based Final Erasure**
```132:135:src/features/canvas/renderer/modular/modules/EraserModule.ts
// Commit erasure along path in one history entry
const size = Number(store.strokeConfig?.eraser?.size) || 30;
try { store.eraseInPath(this.path, size); } catch {}
```

### Spatial Index Optimization

The eraser uses a spatial index for performance:

```323:376:src/features/canvas/stores/modules/drawingModule.ts
eraseAtPoint: (x: number, y: number, eraserSize: number) => {
  const { spatialIndex, spatialIndexDirty } = getState();
  
  // Update spatial index if needed
  if (spatialIndexDirty || !spatialIndex) {
    getState().updateSpatialIndex();
  }
  
  const halfSize = eraserSize / 2;
  const eraserBounds = {
    x: x - halfSize,
    y: y - halfSize,
    width: eraserSize,
    height: eraserSize
  };
  
  // Find candidate elements using spatial index
  const candidateIds = getState().spatialIndex!.findIntersections(eraserBounds);
  const deletedIds: ElementId[] = [];
  
  setState((state: any) => {
    candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
      const element = state.elements.get(id);
      
      if (!element || !getState().isElementErasable(element)) return;
      
      // Check if any point is within eraser radius
      const points = (element as { points?: number[] }).points;
      if (points && Array.isArray(points)) {
        for (let i = 0; i < points.length; i += 2) {
          const px = points[i];
          const py = points[i + 1];
          const dist = Math.hypot(px - x, py - y);
          
          if (dist <= halfSize) {
            deletedIds.push(id as ElementId);
            state.elements.delete(id);
            state.elementOrder = state.elementOrder.filter((elId: ElementId) => elId !== id);
            state.spatialIndexDirty = true;
            break;
          }
        }
      }
    });
    // Force elements Map reference change to trigger subscribers
    state.elements = new Map(state.elements);
  });
  
  if (deletedIds.length > 0) {
    getState().addToHistory('Erase strokes');
  }
  
  return deletedIds;
},
```

**Performance Optimizations:**
1. **Spatial Index**: Only checks elements within eraser bounds rectangle
2. **Point-based Detection**: Tests individual points against circular eraser radius
3. **Early Exit**: Stops checking points once one intersection is found
4. **Batch History**: Single history entry per erasure action

## 2. LINE/ARROW CONNECTORS SYSTEM

### Architecture Overview
Connectors are implemented through a multi-layered system:

- **ConnectorTool** - User interaction layer
- **ConnectorModule** - Rendering and visual feedback
- **EdgeModule** - State management and geometry
- **Routing System** - Path calculation algorithms
- **Port System** - Attachment point management

### Connector Types & Visual Properties

**Line Connectors** (`subType: 'line'`):
```5022:5038:src/features/canvas/services/CanvasRendererV2.ts
connectorNode = new Konva.Line({
  points,
  stroke: el.stroke || '#374151',
  strokeWidth: el.strokeWidth || 2,
  hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
  lineCap: 'round',
  lineJoin: 'round',
  listening: true,
  draggable: true,
  // Prevent the Konva node from actually moving; we move its points instead
  dragBoundFunc: () => ({ x: 0, y: 0 }),
  strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
  perfectDrawEnabled: false,
  id: el.id
});
```

**Arrow Connectors** (`subType: 'arrow'`):
```5003:5021:src/features/canvas/services/CanvasRendererV2.ts
connectorNode = new Konva.Arrow({
  points,
  stroke: el.stroke || '#374151',
  strokeWidth: el.strokeWidth || 2,
  hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
  lineCap: 'round',
  lineJoin: 'round',
  pointerLength: 12, // Make arrow head more visible
  pointerWidth: 10,  // Make arrow head more visible
  fill: el.stroke || '#374151', // Arrow head fill color
  listening: true,
  draggable: true,
  // Prevent the Konva node from actually moving; we move its points instead
  dragBoundFunc: () => ({ x: 0, y: 0 }),
  strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
  perfectDrawEnabled: false,
  id: el.id
});
```

**Key Visual Features:**
- **Enhanced Hit Area**: `hitStrokeWidth` is 4x the visual stroke width (minimum 40px) for easier selection
- **Zoom-Consistent**: `strokeScaleEnabled: false` maintains visual consistency across zoom levels
- **Arrow Heads**: 12px length, 10px width with matched fill color
- **Immobile Nodes**: `dragBoundFunc: () => ({ x: 0, y: 0 })` prevents direct node dragging - movement happens via endpoint manipulation

## 3. PORT-BASED SNAPPING SYSTEM

### Port Types & Geometry

**Port Definitions** (from `src/features/canvas/utils/ports.ts`):

```8:28:src/features/canvas/utils/ports.ts
export function getDefaultPortsFor(el: NodeElement): ElementPort[] {
  const ports: ElementPort[] = [];
  
  // For circles, we want ports on the circle perimeter
  if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
    // Cardinal directions on the circle perimeter
    ports.push(createPort('N', 0, -1));       // top
    ports.push(createPort('S', 0, 1));        // bottom
    ports.push(createPort('E', 1, 0));        // right
    ports.push(createPort('W', -1, 0));       // left
  } else if ((el as any).type === 'sticky-note') {
    // For sticky notes: rectangular ports at edges
    ports.push(createPort('N', 0, -0.5));     // top middle
    ports.push(createPort('S', 0, 0.5));      // bottom middle
    ports.push(createPort('E', 0.5, 0));      // right middle
    ports.push(createPort('W', -0.5, 0));     // left middle
  }
  // Other element types (text, tables, etc.) get NO ports per requirements
  
  return ports;
}
```

**Circle Elements**: Ports at perimeter (N/S/E/W)
**Rectangular Elements**: Ports at edge centers (N/S/E/W)
**Other Elements**: No ports by design

### World Coordinate Conversion

**Circle Port Calculation**:
```35:52:src/features/canvas/utils/ports.ts
// Simple direct calculation for circles
if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
  // Get radius - try different properties
  const radius = (el as any).radius || 
                 (el as any).radiusX || 
                 (el.width ? el.width / 2 : 50);
  
  // Circle center is at el.x, el.y
  const cx = el.x;
  const cy = el.y;
  
  // Calculate port position based on normalized coordinates
  // For circles, we use radius directly
  const worldX = cx + port.nx * radius;
  const worldY = cy + port.ny * radius;
  
  return { x: worldX, y: worldY };
}
```

**Rectangular Port Calculation**:
```54:67:src/features/canvas/utils/ports.ts
// For rectangles/sticky notes: el.x, el.y is top-left
const width = el.width || 100;
const height = el.height || 100;

// Center of rectangle/sticky note
const cx = el.x + width / 2;
const cy = el.y + height / 2;

// Calculate port position - ports are at ±0.5 normalized, so multiply by width/height
const worldX = cx + port.nx * width;
const worldY = cy + port.ny * height;

return { x: worldX, y: worldY };
```

### Snapping Algorithm

**Primary Snapping Logic** (ConnectorModule):
```218:251:src/features/canvas/renderer/modular/modules/ConnectorModule.ts
private findNearestSnap(wx: number, wy: number, maxDist: number): { elementId: ElementId; portKind: string } | null {
  if (!this.ctx) return null;
  const snapCandidates: Array<{ elementId: ElementId; portKind: string; x: number; y: number }> = [];
  const snapFromDraft = (() => {
    try { return (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.draft?.from?.elementId as ElementId | undefined; } catch { return undefined; }
  })();
  const { elements } = this.ctx.store.getSnapshot();
  elements.forEach((el, id) => {
    if (!el || el.type === 'edge') return;
    if (snapFromDraft && id === snapFromDraft) return; // don't snap to source
    const x = Number(el.x || 0);
    const y = Number(el.y || 0);
    const w = Math.max(1, Number(el.width || 0));
    const h = Math.max(1, Number(el.height || 0));
    const cx = x + w / 2;
    const cy = y + h / 2;
    snapCandidates.push({ elementId: id, portKind: 'CENTER', x: cx, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'W', x: x, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'E', x: x + w, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'N', x: cx, y: y });
    snapCandidates.push({ elementId: id, portKind: 'S', x: cx, y: y + h });
  });

  let best: { elementId: ElementId; portKind: string } | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of snapCandidates) {
    const dx = s.x - wx;
    const dy = s.y - wy;
    const d = Math.hypot(dx, dy);
    if (d < bestDist) { bestDist = d; best = { elementId: s.elementId, portKind: s.portKind }; }
  }
  if (best && bestDist <= maxDist) return best;
  return null;
}
```

**Snap Distance Calculation** (ConnectorTool):
```72:78:src/features/canvas/components/tools/creation/ConnectorTool.tsx
const getWorldSnapDistance = () => {
  if (!stageRef.current) return 20;
  const stage = stageRef.current;
  const scaleX = stage.scaleX() || 1;
  return Math.max(10, 20 / scaleX); // Scale snap distance with zoom
};
```

**Snapping Features:**
- **Dynamic Snap Distance**: Scales inversely with zoom level
- **Source Exclusion**: Prevents snapping to the connector's start element
- **5-Port System**: CENTER + N/S/E/W ports
- **Distance-Based**: Uses Euclidean distance (`Math.hypot`) for precise calculations

### Visual Port Indicators

**Port Rendering** (RendererCore):
```884:896:src/features/canvas/renderer/modular/RendererCore.ts
const addSquarePort = (x: number, y: number, id: string) => {
  const node = new Konva.Rect({ 
    x: x - 4, y: y - 4, width: 8, height: 8, 
    stroke: '#6b7280', strokeWidth: 2, fill: '#ffffff', 
    cornerRadius: 2, listening: true, name: 'connector-port' 
  });
  node.setAttr('elId', id);
  this.connectorOverlayGroup!.add(node);
  if (world) {
    const d = Math.hypot(x - world.x, y - world.y);
    if (d < bestDist) { bestDist = d; bestNode = node; }
  }
};
```

**Port Visual Properties:**
- **Size**: 8x8px squares with 2px corner radius
- **Style**: Gray border (`#6b7280`), white fill (`#ffffff`)
- **Positioning**: Centered on port coordinates (`x - 4, y - 4`)
- **Hover Indication**: Closest port to cursor is highlighted

## 4. ROUTING ALGORITHMS

### Straight Line Routing
```17:19:src/features/canvas/utils/routing.ts
export function routeStraight(start: WorldPoint, end: WorldPoint): number[] {
  return [start.x, start.y, end.x, end.y];
}
```
Simple two-point path from source to target.

### Orthogonal (L-shaped) Routing
```26:72:src/features/canvas/utils/routing.ts
export function routeOrthogonal(
  start: WorldPoint & { normal?: { x: number; y: number } },
  end: WorldPoint & { normal?: { x: number; y: number } },
  opts?: { leave?: number; enter?: number; minSegment?: number; preferAxis?: 'x'|'y'|'auto' }
): number[] {
  const leave = Math.max(0, opts?.leave ?? 8);
  const enter = Math.max(0, opts?.enter ?? 8);
  const minSeg = Math.max(0, opts?.minSegment ?? 1);

  const s0 = { x: start.x + (start.normal?.x || 0) * leave, y: start.y + (start.normal?.y || 0) * leave };
  const e0 = { x: end.x   - (end.normal?.x   || 0) * enter, y: end.y   - (end.normal?.y   || 0) * enter };

  const viaHV = [s0, { x: e0.x, y: s0.y }, e0];
  const viaVH = [s0, { x: s0.x, y: e0.y }, e0];

  const score = (pts: {x:number;y:number}[]) => {
    let len = 0, bends = 0;
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y); }
    // one bend in both candidates; tie-breaker is length
    return len + bends * 10;
  };

  const choice = opts?.preferAxis === 'x' ? viaHV : opts?.preferAxis === 'y' ? viaVH : (score(viaHV) <= score(viaVH) ? viaHV : viaVH);

  // Collapse tiny segments
  const out: number[] = [];
  const pts = [ {x: start.x, y: start.y}, ...choice ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (out.length >= 2) {
      const xPrev = out[out.length - 2];
      const yPrev = out[out.length - 1];
      if (Math.abs(p.x - xPrev) + Math.abs(p.y - yPrev) < minSeg) continue;
      // Merge collinear
      if (out.length >= 4) {
        const xPrev2 = out[out.length - 4];
        const yPrev2 = out[out.length - 3];
        const colX = xPrev2 === xPrev && xPrev === p.x;
        const colY = yPrev2 === yPrev && yPrev === p.y;
        if (colX || colY) { out[out.length - 2] = p.x; out[out.length - 1] = p.y; continue; }
      }
    }
    out.push(p.x, p.y);
  }
  out.push(end.x, end.y);
  return out;
}
```

**Orthogonal Features:**
- **Port Normals**: Uses port direction vectors to create proper entry/exit paths
- **Leave/Enter Distance**: Default 8px clearance from ports
- **Path Optimization**: Chooses between Horizontal→Vertical vs Vertical→Horizontal based on total length
- **Segment Collapsing**: Merges tiny segments and collinear points for cleaner paths

### Curved Routing (Mindmap Style)
```78:83:src/features/canvas/utils/routing.ts
export function routeCurved(start: WorldPoint, end: WorldPoint): number[] {
  // Midpoint with slight horizontal bias toward the direction of travel
  const midX = (start.x + end.x) / 2;
  const midY = start.y + (end.y - start.y) * 0.35;
  return [start.x, start.y, midX, midY, end.x, end.y];
}
```

Creates organic-looking curved paths with 3 control points.

## 5. INTERACTION WORKFLOWS

### Connector Creation Workflow

1. **Tool Activation**: Select connector-line or connector-arrow tool
2. **Mouse Down**: Start draft edge at pointer location with port snapping
3. **Mouse Move**: 
   - Update draft pointer position
   - Calculate nearest snap target
   - Update visual preview
4. **Mouse Up**: Commit edge with routing and add to canvas

**Draft State Management**:
```289:395:src/features/canvas/stores/modules/edgeModule.ts
commitEdgeDraftTo: (target) => {
  const state = getState();
  if (!state.draft) return null;

  // ... validation logic ...

  // Determine routing from current tool (line = straight, else orthogonal)
  const currentTool = (getState() as any)?.selectedTool as string | undefined;
  const routing: EdgeRouting = (currentTool === 'connector-line' || currentTool === 'connector-arrow') ? 'straight' : 'orthogonal';

  // Create connected edge with explicit ports
  const edgeId = getState().addEdge({
    type: 'edge',
    source: state.draft.from,
    target: finalTarget,
    routing,
    stroke: '#10b981',  // Green for connected
    strokeWidth: 2,
    selectable: true,
    subType: state.draft.connectorType || 'line',  // Use the connector type from draft
  });

  // Immediately compute routed points and commit
  try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}

  return edgeId;
},
```

### Edge Reflow System

**Automatic Recomputation**: When elements move, connected edges automatically recalculate their paths:

```105:143:src/features/canvas/stores/modules/edgeModule.ts
computeAndCommitDirtyEdges: () => {
  const state = getState() as any;
  const elems: Map<ElementId, any> = state.elements;
  const edges: Map<ElementId, EdgeElement> = state.edges;
  if (!edges || edges.size === 0) return;

  const updates: Array<{ id: ElementId; updates: Partial<EdgeElement> }> = [];
  // ... processing logic ...
  edges.forEach((edge, id) => {
    if (!state.dirtyEdges?.has(id)) return;
    const src = elems.get(edge.source.elementId);
    const tgt = elems.get(edge.target.elementId);
    
    // Skip if both elements are missing
    if (!src || !tgt) return;

    // Compute geometry in world coords using routing utils
    try {
      const geom = updateEdgeGeometry(edge as any, src as any, tgt as any);
      if (geom?.points && Array.isArray(geom.points)) {
        updates.push({ id, updates: { ...geom, points: [...geom.points] } as any });
      }
    } catch (e) {
      console.warn('[edgeModule] routing/updateEdgeGeometry failed', e);
    }
  });
  // ... commit updates ...
},
```

This system ensures connectors maintain their connections even when connected elements are moved, resized, or transformed.

```typescript
init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const layers = this.ctx.konva.getLayers();
    const stage = layers.overlay?.getStage() || layers.main?.getStage();
    if (!stage || this.bound) return;
    this.bound = true;

    // Stage listeners for eraser lifecycle when tool is active
    // Bind pointer/mouse first, plus capture-phase content* for reliability
    stage.on('pointerdown.moderaser', (e: any) => this.onDown(e));
    stage.on('pointermove.moderaser', (e: any) => this.onMove(e));
    stage.on('pointerup.moderaser',   (e: any) => this.onUp(e));
    stage.on('mousedown.moderaser',   (e: any) => this.onDown(e));
    stage.on('mousemove.moderaser',   (e: any) => this.onMove(e));
    stage.on('mouseup.moderaser',     (e: any) => this.onUp(e));
    stage.on('contentMousedown.moderaser', (e: any) => this.onDown(e));
    stage.on('contentMousemove.moderaser', (e: any) => this.onMove(e));
    stage.on('contentMouseup.moderaser',   (e: any) => this.onUp(e));

    // Create a dashed preview circle on overlay
    try {
      const overlay = layers.overlay;
      if (overlay && !this.previewCircle) {
        this.previewCircle = new Konva.Circle({
          x: 0,
          y: 0,
          radius: 10,
          stroke: '#ef4444',
          strokeWidth: 1,
          dash: [6, 6],
          listening: false,
          visible: false,
          name: 'eraser-preview'
        });
        overlay.add(this.previewCircle as any);
        overlay.batchDraw();
      }
    } catch {}
  }
```

```typescript
// Show preview sized to world eraser radius
try {
  const size = Number(store.strokeConfig?.eraser?.size) || 30;
  const rPx = Math.max(1, size * (stage.scaleX?.() || 1)) / 2;
  if (this.previewCircle) {
    this.previewCircle.position({ x: p.x, y: p.y });
    this.previewCircle.radius(rPx);
    this.previewCircle.visible(true);
    this.ctx.konva.getLayers().overlay?.batchDraw();
  }
} catch {}
```

```typescript
// Incremental erase for responsiveness
const size = Number(store.strokeConfig?.eraser?.size) || 30;
try {
  const ids = store.eraseAtPoint(wp.x, wp.y, size) || [];
  if (ids.length > 0 && process.env.NODE_ENV === 'development') {
    console.info('[eraser] move deleted', ids);
  }
} catch {}
```

```typescript
// Commit erasure along path in one history entry
const size = Number(store.strokeConfig?.eraser?.size) || 30;
try { store.eraseInPath(this.path, size); } catch {}
```

```typescript
eraseAtPoint: (x: number, y: number, eraserSize: number) => {
  const { spatialIndex, spatialIndexDirty } = getState();
  
  // Update spatial index if needed
  if (spatialIndexDirty || !spatialIndex) {
    getState().updateSpatialIndex();
  }
  
  const halfSize = eraserSize / 2;
  const eraserBounds = {
    x: x - halfSize,
    y: y - halfSize,
    width: eraserSize,
    height: eraserSize
  };
  
  // Find candidate elements using spatial index
  const candidateIds = getState().spatialIndex!.findIntersections(eraserBounds);
  const deletedIds: ElementId[] = [];
  
  setState((state: any) => {
    candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
      const element = state.elements.get(id);
      
      if (!element || !getState().isElementErasable(element)) return;
      
      // Check if any point is within eraser radius
      const points = (element as { points?: number[] }).points;
      if (points && Array.isArray(points)) {
        for (let i = 0; i < points.length; i += 2) {
          const px = points[i];
          const py = points[i + 1];
          const dist = Math.hypot(px - x, py - y);
          
          if (dist <= halfSize) {
            deletedIds.push(id as ElementId);
            state.elements.delete(id);
            state.elementOrder = state.elementOrder.filter((elId: ElementId) => elId !== id);
            state.spatialIndexDirty = true;
            break;
          }
        }
      }
    });
    // Force elements Map reference change to trigger subscribers
    state.elements = new Map(state.elements);
  });
  
  if (deletedIds.length > 0) {
    getState().addToHistory('Erase strokes');
  }
  
  return deletedIds;
},
```

```typescript
connectorNode = new Konva.Line({
  points,
  stroke: el.stroke || '#374151',
  strokeWidth: el.strokeWidth || 2,
  hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
  lineCap: 'round',
  lineJoin: 'round',
  listening: true,
  draggable: true,
  // Prevent the Konva node from actually moving; we move its points instead
  dragBoundFunc: () => ({ x: 0, y: 0 }),
  strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
  perfectDrawEnabled: false,
  id: el.id
});
```

```typescript
connectorNode = new Konva.Arrow({
  points,
  stroke: el.stroke || '#374151',
  strokeWidth: el.strokeWidth || 2,
  hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4), // Larger hit area for easier selection
  lineCap: 'round',
  lineJoin: 'round',
  pointerLength: 12, // Make arrow head more visible
  pointerWidth: 10,  // Make arrow head more visible
  fill: el.stroke || '#374151', // Arrow head fill color
  listening: true,
  draggable: true,
  // Prevent the Konva node from actually moving; we move its points instead
  dragBoundFunc: () => ({ x: 0, y: 0 }),
  strokeScaleEnabled: false, // Consistent feel under zoom (blueprint requirement)
  perfectDrawEnabled: false,
  id: el.id
});
```

```typescript
export function getDefaultPortsFor(el: NodeElement): ElementPort[] {
  const ports: ElementPort[] = [];
  
  // For circles, we want ports on the circle perimeter
  if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
    // Cardinal directions on the circle perimeter
    ports.push(createPort('N', 0, -1));       // top
    ports.push(createPort('S', 0, 1));        // bottom
    ports.push(createPort('E', 1, 0));        // right
    ports.push(createPort('W', -1, 0));       // left
  } else if ((el as any).type === 'sticky-note') {
    // For sticky notes: rectangular ports at edges
    ports.push(createPort('N', 0, -0.5));     // top middle
    ports.push(createPort('S', 0, 0.5));      // bottom middle
    ports.push(createPort('E', 0.5, 0));      // right middle
    ports.push(createPort('W', -0.5, 0));     // left middle
  }
  // Other element types (text, tables, etc.) get NO ports per requirements
  
  return ports;
}
```

```typescript
// Simple direct calculation for circles
if ((el as any).type === 'circle' || (el as any).type === 'circle-text') {
  // Get radius - try different properties
  const radius = (el as any).radius || 
                 (el as any).radiusX || 
                 (el.width ? el.width / 2 : 50);
  
  // Circle center is at el.x, el.y
  const cx = el.x;
  const cy = el.y;
  
  // Calculate port position based on normalized coordinates
  // For circles, we use radius directly
  const worldX = cx + port.nx * radius;
  const worldY = cy + port.ny * radius;
  
  return { x: worldX, y: worldY };
}
```

```typescript
// For rectangles/sticky notes: el.x, el.y is top-left
const width = el.width || 100;
const height = el.height || 100;

// Center of rectangle/sticky note
const cx = el.x + width / 2;
const cy = el.y + height / 2;

// Calculate port position - ports are at ±0.5 normalized, so multiply by width/height
const worldX = cx + port.nx * width;
const worldY = cy + port.ny * height;

return { x: worldX, y: worldY };
```

```typescript
private findNearestSnap(wx: number, wy: number, maxDist: number): { elementId: ElementId; portKind: string } | null {
  if (!this.ctx) return null;
  const snapCandidates: Array<{ elementId: ElementId; portKind: string; x: number; y: number }> = [];
  const snapFromDraft = (() => {
    try { return (window as any).__UNIFIED_CANVAS_STORE__?.getState()?.draft?.from?.elementId as ElementId | undefined; } catch { return undefined; }
  })();
  const { elements } = this.ctx.store.getSnapshot();
  elements.forEach((el, id) => {
    if (!el || el.type === 'edge') return;
    if (snapFromDraft && id === snapFromDraft) return; // don't snap to source
    const x = Number(el.x || 0);
    const y = Number(el.y || 0);
    const w = Math.max(1, Number(el.width || 0));
    const h = Math.max(1, Number(el.height || 0));
    const cx = x + w / 2;
    const cy = y + h / 2;
    snapCandidates.push({ elementId: id, portKind: 'CENTER', x: cx, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'W', x: x, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'E', x: x + w, y: cy });
    snapCandidates.push({ elementId: id, portKind: 'N', x: cx, y: y });
    snapCandidates.push({ elementId: id, portKind: 'S', x: cx, y: y + h });
  });

  let best: { elementId: ElementId; portKind: string } | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of snapCandidates) {
    const dx = s.x - wx;
    const dy = s.y - wy;
    const d = Math.hypot(dx, dy);
    if (d < bestDist) { bestDist = d; best = { elementId: s.elementId, portKind: s.portKind }; }
  }
  if (best && bestDist <= maxDist) return best;
  return null;
}
```

```typescriptreact
const getWorldSnapDistance = () => {
  if (!stageRef.current) return 20;
  const stage = stageRef.current;
  const scaleX = stage.scaleX() || 1;
  return Math.max(10, 20 / scaleX); // Scale snap distance with zoom
};
```

```typescript
const addSquarePort = (x: number, y: number, id: string) => {
  const node = new Konva.Rect({ 
    x: x - 4, y: y - 4, width: 8, height: 8, 
    stroke: '#6b7280', strokeWidth: 2, fill: '#ffffff', 
    cornerRadius: 2, listening: true, name: 'connector-port' 
  });
  node.setAttr('elId', id);
  this.connectorOverlayGroup!.add(node);
  if (world) {
    const d = Math.hypot(x - world.x, y - world.y);
    if (d < bestDist) { bestDist = d; bestNode = node; }
  }
};
```

```typescript
export function routeStraight(start: WorldPoint, end: WorldPoint): number[] {
  return [start.x, start.y, end.x, end.y];
}
```

```typescript
export function routeOrthogonal(
  start: WorldPoint & { normal?: { x: number; y: number } },
  end: WorldPoint & { normal?: { x: number; y: number } },
  opts?: { leave?: number; enter?: number; minSegment?: number; preferAxis?: 'x'|'y'|'auto' }
): number[] {
  const leave = Math.max(0, opts?.leave ?? 8);
  const enter = Math.max(0, opts?.enter ?? 8);
  const minSeg = Math.max(0, opts?.minSegment ?? 1);

  const s0 = { x: start.x + (start.normal?.x || 0) * leave, y: start.y + (start.normal?.y || 0) * leave };
  const e0 = { x: end.x   - (end.normal?.x   || 0) * enter, y: end.y   - (end.normal?.y   || 0) * enter };

  const viaHV = [s0, { x: e0.x, y: s0.y }, e0];
  const viaVH = [s0, { x: s0.x, y: e0.y }, e0];

  const score = (pts: {x:number;y:number}[]) => {
    let len = 0, bends = 0;
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y); }
    // one bend in both candidates; tie-breaker is length
    return len + bends * 10;
  };

  const choice = opts?.preferAxis === 'x' ? viaHV : opts?.preferAxis === 'y' ? viaVH : (score(viaHV) <= score(viaVH) ? viaHV : viaVH);

  // Collapse tiny segments
  const out: number[] = [];
  const pts = [ {x: start.x, y: start.y}, ...choice ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (out.length >= 2) {
      const xPrev = out[out.length - 2];
      const yPrev = out[out.length - 1];
      if (Math.abs(p.x - xPrev) + Math.abs(p.y - yPrev) < minSeg) continue;
      // Merge collinear
      if (out.length >= 4) {
        const xPrev2 = out[out.length - 4];
        const yPrev2 = out[out.length - 3];
        const colX = xPrev2 === xPrev && xPrev === p.x;
        const colY = yPrev2 === yPrev && yPrev === p.y;
        if (colX || colY) { out[out.length - 2] = p.x; out[out.length - 1] = p.y; continue; }
      }
    }
    out.push(p.x, p.y);
  }
  out.push(end.x, end.y);
  return out;
}
```

```typescript
export function routeCurved(start: WorldPoint, end: WorldPoint): number[] {
  // Midpoint with slight horizontal bias toward the direction of travel
  const midX = (start.x + end.x) / 2;
  const midY = start.y + (end.y - start.y) * 0.35;
  return [start.x, start.y, midX, midY, end.x, end.y];
}
```

```typescript
commitEdgeDraftTo: (target) => {
  const state = getState();
  if (!state.draft) return null;

  // ... validation logic ...

  // Determine routing from current tool (line = straight, else orthogonal)
  const currentTool = (getState() as any)?.selectedTool as string | undefined;
  const routing: EdgeRouting = (currentTool === 'connector-line' || currentTool === 'connector-arrow') ? 'straight' : 'orthogonal';

  // Create connected edge with explicit ports
  const edgeId = getState().addEdge({
    type: 'edge',
    source: state.draft.from,
    target: finalTarget,
    routing,
    stroke: '#10b981',  // Green for connected
    strokeWidth: 2,
    selectable: true,
    subType: state.draft.connectorType || 'line',  // Use the connector type from draft
  });

  // Immediately compute routed points and commit
  try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}

  return edgeId;
},
```

```typescript
computeAndCommitDirtyEdges: () => {
  const state = getState() as any;
  const elems: Map<ElementId, any> = state.elements;
  const edges: Map<ElementId, EdgeElement> = state.edges;
  if (!edges || edges.size === 0) return;

  const updates: Array<{ id: ElementId; updates: Partial<EdgeElement> }> = [];
  // ... processing logic ...
  edges.forEach((edge, id) => {
    if (!state.dirtyEdges?.has(id)) return;
    const src = elems.get(edge.source.elementId);
    const tgt = elems.get(edge.target.elementId);
    
    // Skip if both elements are missing
    if (!src || !tgt) return;

    // Compute geometry in world coords using routing utils
    try {
      const geom = updateEdgeGeometry(edge as any, src as any, tgt as any);
      if (geom?.points && Array.isArray(geom.points)) {
        updates.push({ id, updates: { ...geom, points: [...geom.points] } as any });
      }
    } catch (e) {
      console.warn('[edgeModule] routing/updateEdgeGeometry failed', e);
    }
  });
  // ... commit updates ...
},
```

## Performance Considerations & Edge Cases

### Eraser Performance Optimizations
- **Spatial Indexing**: Pre-built QuadTree for O(log n) element lookup instead of O(n) iteration
- **Incremental + Batch**: Real-time feedback during drag, single history entry on completion
- **Canvas Scaling**: Preview circle automatically scales with zoom level for consistent UX
- **Event Throttling**: Multiple event bindings ensure compatibility across browsers/devices

### Connector Performance Optimizations  
- **Dirty Edge Tracking**: Only recalculates geometry for edges that need updates
- **RAF Batching**: Geometry updates are batched and scheduled with requestAnimationFrame
- **Immutable Updates**: Map reference changes trigger only necessary subscriber updates
- **Hit Area Enhancement**: 4x stroke width hit areas make connectors easier to select

### Edge Cases Handled
- **Free-floating

