# Vanilla Konva Migration Plan

## Overview

This document outlines the comprehensive migration plan from React-Konva to vanilla Konva for the LibreOllama canvas system. The migration maintains all existing functionality while providing direct control over Konva APIs for better performance and flexibility.

## Current Status

✅ **Completed Phase 0: Foundation**
- [x] Created experimental branch `experiment/vanilla-konva`
- [x] Removed `react-konva` and `react-konva-utils` dependencies  
- [x] Updated Konva to latest version (9.3.22)
- [x] Basic vanilla Konva stage setup with layer structure
- [x] Fixed Vite configuration to remove react-konva references

🎯 **Current State**: Basic canvas with grid background and test rectangle working

---

## Migration Strategy

### Core Principles
1. **Incremental Migration**: Replace components systematically, maintaining functionality
2. **API Compatibility**: Keep the same store interfaces and component APIs where possible  
3. **Performance First**: Leverage vanilla Konva's performance advantages
4. **Test Coverage**: Maintain existing test coverage throughout migration

### Architecture Changes

#### Before (React-Konva)
```
CanvasStage (React Component)
├── <Stage> (React-Konva)
    ├── <Layer> (React-Konva)
        ├── <Rect>, <Circle>, etc. (React-Konva Components)
```

#### After (Vanilla Konva)
```
CanvasStage (React Container)
├── <div> (DOM Container)
    ├── Konva.Stage (Direct Konva)
        ├── Konva.Layer (Direct Konva)
            ├── Konva.Rect, Konva.Circle, etc. (Direct Konva)
```

---

## Detailed Migration Phases

### Phase 1: Core Infrastructure (Current Priority)
**Timeline: 1-2 days**

#### 1.1 Element Renderer Factory ⏳ IN PROGRESS
**Files to Migrate:**
- `src/features/canvas/renderers/ElementRendererFactory.ts` (NEW)
- `src/features/canvas/renderers/VanillaElementRenderer.ts` (NEW)

**Tasks:**
- [ ] Create vanilla Konva element factory system
- [ ] Implement element-to-Konva-node conversion utilities
- [ ] Add element lifecycle management (create, update, destroy)
- [ ] Create element property synchronization system

#### 1.2 Layer Management System ⏳ IN PROGRESS  
**Files to Migrate:**
- `src/features/canvas/layers/VanillaLayerManager.ts` (NEW)
- `src/features/canvas/layers/LayerRenderer.ts` (NEW)

**Tasks:**
- [ ] Replace React-Konva Layer components with direct Konva.Layer management
- [ ] Implement layer-specific rendering logic
- [ ] Create layer lifecycle management (show/hide, clear, batch operations)
- [ ] Port background grid rendering from React component to vanilla Konva

#### 1.3 Event System Refactor ⏳ IN PROGRESS
**Files to Migrate:**
- `src/features/canvas/events/VanillaEventHandler.ts` (NEW)
- `src/features/canvas/components/UnifiedEventHandler.tsx` (REFACTOR)

**Tasks:**
- [ ] Convert React-Konva event handlers to vanilla Konva event system
- [ ] Implement direct Konva event binding and cleanup
- [ ] Port mouse, keyboard, and touch event handling
- [ ] Maintain event delegation patterns for tools

---

### Phase 2: Shape Components (2-3 days)
**Priority: High** | **Complexity: Medium-High**

Each shape component needs complete rewrite from React-Konva to vanilla Konva:

#### 2.1 Basic Shapes
**Files to Migrate:**
- [ ] `src/features/canvas/shapes/RectangleShape.tsx` → `VanillaRectangleRenderer.ts`
- [ ] `src/features/canvas/shapes/CircleShape.tsx` → `VanillaCircleRenderer.ts`  
- [ ] `src/features/canvas/shapes/TriangleShape.tsx` → `VanillaTriangleRenderer.ts`
- [ ] `src/features/canvas/shapes/PenShape.tsx` → `VanillaPenRenderer.ts`

**Migration Pattern:**
```typescript
// Before (React-Konva)
<Rect
  x={element.x}
  y={element.y}
  width={element.width}
  height={element.height}
  fill={element.fill}
  onClick={handleClick}
/>

// After (Vanilla Konva)
const rect = new Konva.Rect({
  x: element.x,
  y: element.y,
  width: element.width,
  height: element.height,
  fill: element.fill,
});
rect.on('click', handleClick);
layer.add(rect);
```

#### 2.2 Complex Shapes
**Files to Migrate:**
- [ ] `src/features/canvas/shapes/TextShape.tsx` → `VanillaTextRenderer.ts`
- [ ] `src/features/canvas/shapes/ImageShape.tsx` → `VanillaImageRenderer.ts`
- [ ] `src/features/canvas/shapes/StickyNoteShape.tsx` → `VanillaStickyNoteRenderer.ts`
- [ ] `src/features/canvas/shapes/ConnectorShape.tsx` → `VanillaConnectorRenderer.ts`
- [ ] `src/features/canvas/shapes/SectionShape.tsx` → `VanillaSectionRenderer.ts`

#### 2.3 Special Elements  
**Files to Migrate:**
- [ ] `src/features/canvas/elements/TableElement.tsx` → `VanillaTableRenderer.ts`

**Special Considerations:**
- Tables require complex cell management and editing capabilities
- Text shapes need inline editing support
- Images require async loading and caching
- Connectors need smart routing and snap point calculations

---

### Phase 3: Tools System (3-4 days)
**Priority: High** | **Complexity: High**

#### 3.1 Drawing Tools
**Files to Migrate:**
- [ ] `src/features/canvas/components/tools/drawing/PenTool.tsx` → `VanillaPenTool.ts`
- [ ] `src/features/canvas/components/tools/drawing/MarkerTool.tsx` → `VanillaMarkerTool.ts`
- [ ] `src/features/canvas/components/tools/drawing/HighlighterTool.tsx` → `VanillaHighlighterTool.ts`
- [ ] `src/features/canvas/components/tools/drawing/EraserTool.tsx` → `VanillaEraserTool.ts`

**Key Changes:**
- Replace React component lifecycle with direct Konva event management
- Implement tool activation/deactivation without React renders
- Convert tool preview rendering to vanilla Konva

#### 3.2 Creation Tools
**Files to Migrate:**
- [ ] `src/features/canvas/components/tools/creation/RectangleTool.tsx` → `VanillaRectangleTool.ts`
- [ ] `src/features/canvas/components/tools/creation/CircleTool.tsx` → `VanillaCircleTool.ts`
- [ ] `src/features/canvas/components/tools/creation/TriangleTool.tsx` → `VanillaTriangleTool.ts`
- [ ] `src/features/canvas/components/tools/creation/TextTool.tsx` → `VanillaTextTool.ts`
- [ ] `src/features/canvas/components/tools/creation/StickyNoteTool.tsx` → `VanillaStickyNoteTool.ts`
- [ ] `src/features/canvas/components/tools/creation/ConnectorTool.tsx` → `VanillaConnectorTool.ts`
- [ ] `src/features/canvas/components/tools/creation/SectionTool.tsx` → `VanillaSectionTool.ts`
- [ ] `src/features/canvas/components/tools/creation/MindmapTool.tsx` → `VanillaMindmapTool.ts`
- [ ] `src/features/canvas/components/tools/creation/TableTool.tsx` → `VanillaTableTool.ts`

#### 3.3 Base Tool System
**Files to Migrate:**
- [ ] `src/features/canvas/components/tools/base/BaseCreationTool.tsx` → `VanillaBaseTool.ts`
- [ ] `src/features/canvas/components/tools/base/BaseShapeTool.tsx` → `VanillaBaseShapeTool.ts`

#### 3.4 Tool Management
**Files to Update:**
- [ ] `src/features/canvas/layers/ToolLayer.tsx` → Remove React-Konva dependencies
- [ ] `src/features/canvas/toolbar/ModernKonvaToolbar.tsx` → Update tool activation

---

### Phase 4: UI Components (1-2 days)
**Priority: Medium** | **Complexity: Medium**

#### 4.1 Selection and Transformation
**Files to Migrate:**
- [ ] `src/features/canvas/components/ui/CustomTransformer.tsx` → `VanillaTransformer.ts`
- [ ] `src/features/canvas/components/ui/SelectionBox.tsx` → `VanillaSelectionBox.ts`
- [ ] `src/features/canvas/layers/SelectionLayer.tsx` → `VanillaSelectionLayer.ts`

#### 4.2 Visual Indicators  
**Files to Migrate:**
- [ ] `src/features/canvas/components/ui/SnapPointIndicator.tsx` → `VanillaSnapIndicator.ts`
- [ ] `src/features/canvas/components/ui/SectionPreview.tsx` → `VanillaSectionPreview.ts`

#### 4.3 Text Input System
**Files to Migrate:**
- [ ] `src/features/canvas/components/ui/CanvasTextInput.tsx` → `VanillaTextInput.ts`

**Special Requirements:**
- HTML overlay for rich text editing
- Position synchronization with canvas elements
- Focus management

---

### Phase 5: Background and Grid System (1 day)
**Priority: Low** | **Complexity: Low**

**Files to Migrate:**
- [ ] `src/features/canvas/layers/BackgroundLayer.tsx` → `VanillaBackgroundRenderer.ts`

**Tasks:**
- [ ] Port grid rendering to vanilla Konva
- [ ] Implement infinite canvas background patterns
- [ ] Add zoom-aware grid scaling

---

### Phase 6: Advanced Features (2-3 days)
**Priority: Medium** | **Complexity: High**

#### 6.1 Stroke Renderer
**Files to Migrate:**
- [ ] `src/features/canvas/components/renderers/StrokeRenderer.tsx` → `VanillaStrokeRenderer.ts`

#### 6.2 Error Boundaries and Utilities
**Files to Update:**
- [ ] `src/features/canvas/utils/KonvaElementBoundary.tsx` → Remove React-Konva deps

#### 6.3 Performance Optimizations
**Files to Update:**
- [ ] `src/features/canvas/hooks/useSimpleViewportCulling.ts` → Update for vanilla Konva
- [ ] `src/features/canvas/utils/performance/` → Optimize for direct Konva usage

---

### Phase 7: Testing and Integration (2-3 days)
**Priority: High** | **Complexity: Medium**

#### 7.1 Test Updates
**Files to Update:**
- [ ] All test files in `src/features/canvas/tests/` → Update for vanilla Konva
- [ ] `src/tests/components/simple-canvas.test.tsx` → Update test utilities

#### 7.2 Integration Testing
**Tasks:**
- [ ] Verify all tools work correctly
- [ ] Test element rendering and interactions
- [ ] Performance benchmarking vs React-Konva
- [ ] Memory leak testing

#### 7.3 Migration Cleanup
**Tasks:**
- [ ] Remove all unused React-Konva imports
- [ ] Clean up deprecated utility files
- [ ] Update documentation
- [ ] Performance optimization pass

---

## Implementation Guidelines

### File Naming Convention
- React-Konva components: `ComponentName.tsx`
- Vanilla Konva renderers: `VanillaComponentNameRenderer.ts`
- Vanilla Konva tools: `VanillaToolName.ts`

### Code Structure Pattern

#### Element Renderers
```typescript
export class VanillaElementRenderer<T extends CanvasElement> {
  private konvaNode: Konva.Node | null = null;
  
  constructor(
    private layer: Konva.Layer,
    private element: T,
    private callbacks: ElementCallbacks
  ) {}
  
  render(): Konva.Node {
    // Create Konva node
    // Set properties
    // Bind events
    // Add to layer
  }
  
  update(element: T): void {
    // Update node properties
    // Re-bind events if needed
  }
  
  destroy(): void {
    // Remove from layer
    // Clean up events
    // Dispose resources
  }
}
```

#### Tool Classes
```typescript
export class VanillaTool {
  constructor(
    private stage: Konva.Stage,
    private layer: Konva.Layer,
    private store: UnifiedCanvasStore
  ) {}
  
  activate(): void {
    // Bind stage events
    // Show tool UI
  }
  
  deactivate(): void {
    // Unbind events
    // Hide tool UI
    // Clean up
  }
  
  handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {}
  handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {}
  handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void {}
}
```

### Performance Considerations

1. **Batched Updates**: Use `layer.batchDraw()` for multiple element updates
2. **Object Pooling**: Reuse Konva nodes where possible
3. **Event Delegation**: Minimize event listeners on individual elements
4. **Viewport Culling**: Only render visible elements
5. **Memory Management**: Proper cleanup of Konva nodes and event listeners

### Testing Strategy

1. **Unit Tests**: Test individual renderer classes
2. **Integration Tests**: Test tool interactions with elements
3. **Performance Tests**: Compare rendering performance before/after
4. **Visual Regression Tests**: Ensure visual consistency

---

## Progress Tracking

### Completed ✅
- [x] Phase 0: Foundation setup
- [x] Dependency cleanup
- [x] Basic stage and layer creation
- [x] Test rectangle rendering

### In Progress ⏳
- [ ] Phase 1: Core Infrastructure (0/3 complete)

### Not Started ⭕
- [ ] Phase 2: Shape Components (0/10 complete)
- [ ] Phase 3: Tools System (0/20 complete)  
- [ ] Phase 4: UI Components (0/6 complete)
- [ ] Phase 5: Background System (0/1 complete)
- [ ] Phase 6: Advanced Features (0/3 complete)
- [ ] Phase 7: Testing & Integration (0/3 complete)

### Overall Progress: 8% Complete (6/73 tasks)

---

## Risk Assessment

### High Risk Items
- **Tool System Complexity**: 20+ tools with complex interactions
- **Text Editing**: Rich text editing requires HTML overlay coordination
- **Performance**: Ensuring vanilla Konva is actually faster than React-Konva
- **State Synchronization**: Keeping Zustand store in sync with Konva nodes

### Mitigation Strategies
- **Incremental Testing**: Test each component as it's migrated
- **Fallback Plan**: Keep React-Konva as backup if critical issues arise
- **Performance Monitoring**: Benchmark each phase
- **Documentation**: Detailed API documentation for new vanilla Konva classes

---

## Success Criteria

1. ✅ **Functional Parity**: All existing canvas features work identically
2. ⏳ **Performance Improvement**: 20%+ improvement in rendering performance
3. ⏳ **Memory Efficiency**: Reduced memory usage for large canvases
4. ⏳ **Developer Experience**: Cleaner, more maintainable codebase
5. ⏳ **Test Coverage**: Maintain 90%+ test coverage throughout migration

---

## Next Steps

1. **Start Phase 1.1**: Create the element renderer factory system
2. **Implement basic shape renderers**: Rectangle, Circle, and Line
3. **Create vanilla event handling system**
4. **Test basic shape creation and interaction**

**Target Completion**: 1-2 weeks for full migration

---

## Notes

- This migration provides an opportunity to optimize canvas performance significantly
- The modular approach allows for gradual migration without breaking existing functionality
- Vanilla Konva gives us direct access to all Konva features without React-Konva limitations
- Consider this migration as a foundation for future canvas enhancements and optimizations
