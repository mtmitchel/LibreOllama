# Canvas Tool Architecture Refactor Plan

Note (2025-08-25): This plan contains aspirational components (e.g., ToolRegistry, ToolEventDelegate, tools-v2 directory). The current runtime uses a UnifiedEventHandler with class-based tools under `src/features/canvas/tools`, a centralized `TransformerController`, and initializes `KonvaDirectRenderer` (tool integration pending). Use this plan as guidance, and consult `docs/CANVAS_TOOL_REFACTOR_STATUS.md` for the code-accurate status.

## Overview
This document outlines the comprehensive plan to refactor the canvas tool system to improve performance, memory management, and maintainability.

## Goals
1. **Implement ITool Interface Pattern** - Separate tool logic from React lifecycle (10-15% performance improvement)
2. **Add Explicit Memory Management** - Prevent memory leaks with proper Konva node cleanup (20-30% memory reduction)
3. **Direct Konva API for Critical Paths** - Bypass React reconciliation for real-time updates (30-40% performance boost)

## Architecture Changes

### Current Architecture Issues
- Tools are React components with render overhead
- No explicit memory cleanup for Konva nodes
- All canvas operations go through React reconciliation
- Tool state mixed with React component state
- Event handling scattered across components

### New Architecture Benefits
- Tools as pure TypeScript classes implementing ITool
- Centralized memory management with explicit cleanup
- Direct Konva API for performance-critical operations
- Clear separation of concerns
- Unified event delegation system

## Implementation Phases

### Phase 1: Foundation Architecture (Days 1-2)

#### 1.1 Core Tool Interfaces
**Location:** `src/features/canvas/tools-v2/interfaces/`
- Create `ITool.ts` - Core tool interface with lifecycle and event methods
- Create `IDrawingTool.ts` - Extended interface for drawing tools
- Create `IShapeTool.ts` - Extended interface for shape creation tools
- Define `ToolState` and `ToolConfig` types

#### 1.2 Base Tool Classes
**Location:** `src/features/canvas/tools-v2/implementations/base/`
- Implement `BaseTool.ts` - Abstract base class with common functionality
- Implement `BaseDrawingTool.ts` - Base for pen, marker, highlighter
- Implement `BaseShapeTool.ts` - Base for rectangle, circle, triangle
- Add memory management hooks in base classes

#### 1.3 Tool Registry System
**Location:** `src/features/canvas/tools-v2/`
- Create `ToolRegistry.ts` - Manages tool instances and lifecycle
- Create `ToolEventDelegate.ts` - Routes events to active tool
- Implement tool activation/deactivation logic
- Add tool state persistence

#### 1.4 Memory Management System
**Location:** `src/features/canvas/core/`
- Create `MemoryManager.ts` - Tracks and cleans up Konva nodes
- Implement `NodeRegistry` - Maps element IDs to Konva nodes
- Add automatic cleanup on element deletion
- Implement memory leak detection

#### 1.5 Direct Konva Renderer
**Location:** `src/features/canvas/renderers/`
- Create `KonvaDirectRenderer.ts` - Bypasses React for critical updates
- Implement batched updates for efficiency
- Add performance monitoring
- Create render queue system

#### 1.6 Compatibility Layer
**Location:** `src/features/canvas/tools-v2/compatibility/`
- Create `ReactToolAdapter.ts` - Wraps existing React tools
- Implement event forwarding
- Maintain backward compatibility
- Enable gradual migration

### Phase 2: Tool Migration (Days 3-5)

#### 2.1 Simple Tools Migration
**Tools:** Pan, Select
- Implement as pure TypeScript classes
- No complex state management
- Test thoroughly before proceeding

#### 2.2 Event System Integration
- Update `UnifiedEventHandler.tsx` to use `ToolEventDelegate`
- Maintain fallback to existing system
- Add performance logging

#### 2.3 Shape Tools Migration
**Tools:** Rectangle, Circle, Triangle
- Implement preview rendering with direct Konva
- Add memory cleanup for preview nodes
- Migrate one at a time with testing

#### 2.4 Drawing Tools Migration
**Tools:** Pen, Marker, Highlighter, Eraser
- Use direct Konva API for path updates
- Implement efficient point batching
- Add smoothing algorithms

#### 2.5 Complex Tools Migration
**Tools:** Connector, Table, Text, StickyNote, Mindmap
- Handle multiple interaction states
- Preserve all existing functionality
- Extra testing for edge cases

#### 2.6 Test Suite Updates
- Unit tests for each tool
- Integration tests for tool switching
- Memory leak tests
- Performance benchmarks

### Phase 3: Optimization & Cleanup (Days 6-7)

#### 3.1 Performance Optimization
- Profile and optimize hot paths
- Implement render batching
- Add frame rate limiting for smooth UX
- Optimize memory allocation patterns

#### 3.2 Memory Leak Prevention
- Add automatic cleanup on unmount
- Implement weak references where appropriate
- Add memory usage monitoring
- Create leak detection tests

#### 3.3 Legacy Code Removal
- Remove old React tool components
- Clean up unused event handlers
- Remove compatibility adapters
- Update all import statements

#### 3.4 Code Cleanup
- Remove dead code
- Consolidate duplicate logic
- Update type definitions
- Clean up store modules

#### 3.5 Documentation
- Update inline documentation
- Create migration guide
- Document new patterns
- Add usage examples

## File Structure

```
src/features/canvas/
├── tools-v2/                        # New tool system
│   ├── interfaces/
│   │   ├── ITool.ts                # Core interface
│   │   ├── IDrawingTool.ts         # Drawing tools
│   │   └── IShapeTool.ts           # Shape tools
│   ├── implementations/
│   │   ├── base/
│   │   │   ├── BaseTool.ts
│   │   │   ├── BaseDrawingTool.ts
│   │   │   └── BaseShapeTool.ts
│   │   ├── core/
│   │   │   ├── SelectTool.ts
│   │   │   └── PanTool.ts
│   │   ├── shapes/
│   │   │   ├── RectangleTool.ts
│   │   │   ├── CircleTool.ts
│   │   │   └── TriangleTool.ts
│   │   └── drawing/
│   │       ├── PenTool.ts
│   │       ├── MarkerTool.ts
│   │       ├── HighlighterTool.ts
│   │       └── EraserTool.ts
│   ├── ToolRegistry.ts
│   ├── ToolEventDelegate.ts
│   └── compatibility/
│       └── ReactToolAdapter.ts
├── core/
│   ├── MemoryManager.ts
│   └── NodeRegistry.ts
└── renderers/
    └── KonvaDirectRenderer.ts
```

## Integration Points

### Store Updates
```typescript
// unifiedCanvasStore.ts additions
interface StoreEnhancements {
  toolRegistry: ToolRegistry;
  memoryManager: MemoryManager;
  directRenderer: KonvaDirectRenderer;
  activeTool: ITool | null;
  setActiveTool: (toolId: string) => void;
}
```

### Event Handler Updates
```typescript
// UnifiedEventHandler.tsx modifications
- Add tool delegation for all mouse/keyboard events
- Maintain backward compatibility
- Add performance tracking
```

### Component Updates
- `CanvasStage.tsx` - Initialize tool registry
- `ToolLayer.tsx` - Use new tool system
- `CanvasLayerManager.tsx` - Add memory cleanup

## Performance Targets

### Metrics to Track
- **Frame Rate:** Maintain 60fps during drawing
- **Tool Switch:** < 50ms latency
- **Memory Usage:** < 100MB for 1000 elements
- **Cleanup Time:** < 100ms for 100 elements

### Benchmarks
- Before: Baseline measurements
- After Each Phase: Progress tracking
- Final: Full comparison report

## Risk Management

### Potential Issues
1. **React StrictMode double mounting**
   - Solution: Proper cleanup in useEffect
2. **Hot reload breaking tool state**
   - Solution: Persist state in Zustand
3. **Memory leaks from event listeners**
   - Solution: Centralized event management
4. **Performance regression**
   - Solution: Feature flags for rollback

### Rollback Strategy
1. Feature flag: `enableNewToolSystem`
2. Keep old components until validated
3. Parallel testing environment
4. Gradual rollout to users

## Testing Strategy

### Unit Tests
- Each tool implementation
- Memory manager operations
- Event delegation logic
- Renderer operations

### Integration Tests
- Tool switching scenarios
- Multi-tool workflows
- Store synchronization
- Memory cleanup verification

### Performance Tests
- Drawing performance (1000+ points)
- Multiple element selection
- Rapid tool switching
- Memory usage over time

### User Acceptance Tests
- All existing features work
- No visible performance degradation
- Smooth user experience
- No memory leaks

## Success Criteria

### Phase 1 Complete When:
- [ ] All interfaces defined
- [ ] Base classes implemented
- [ ] Registry system working
- [ ] Memory manager operational
- [ ] Direct renderer functional
- [ ] Compatibility layer ready

### Phase 2 Complete When:
- [ ] All tools migrated
- [ ] Tests passing
- [ ] No regressions
- [ ] Performance improved
- [ ] Memory leaks fixed

### Phase 3 Complete When:
- [ ] Legacy code removed
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] Clean codebase
- [ ] Production ready

## Timeline

### Week 1
- Days 1-2: Foundation (Phase 1)
- Days 3-5: Migration (Phase 2)

### Week 2
- Days 6-7: Optimization (Phase 3)
- Day 8: Final testing and validation
- Day 9: Documentation and deployment prep
- Day 10: Production deployment

## Appendix

### Code Examples

#### ITool Interface
```typescript
interface ITool {
  readonly type: string;
  readonly id: string;
  
  activate(stage: Konva.Stage, store: UnifiedCanvasStore): void;
  deactivate(): void;
  dispose(): void;
  
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): void;
}
```

#### Memory Cleanup Example
```typescript
deleteElement(id: ElementId) {
  const node = memoryManager.getNode(id);
  if (node) {
    node.destroy(); // Explicit cleanup
    memoryManager.unregisterNode(id);
  }
  state.elements.delete(id);
}
```

#### Direct Rendering Example
```typescript
// Bypassing React for real-time updates
onMouseMove(e: MouseEvent) {
  if (this.isDrawing) {
    const points = this.currentPath.points();
    points.push(e.x, e.y);
    this.currentPath.points(points);
    this.directRenderer.requestRedraw('drawing');
  }
}
```

## Notes

- Prioritize stability over speed during migration
- Test extensively at each phase
- Keep stakeholders informed of progress
- Document any deviations from plan
- Measure and validate improvements

---

*Last Updated: 2025-08-22*
*Status: Ready for Implementation*