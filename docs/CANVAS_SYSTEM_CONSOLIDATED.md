# LibreOllama Canvas System - Consolidated Documentation

**Last Updated**: August 29, 2025  
**Purpose**: Single source of truth for canvas system architecture, migration status, and implementation details

## 🎯 Executive Summary

The LibreOllama canvas system is migrating from react-konva to direct Konva usage following the **KONVA_BASED_CANVAS.md blueprint**. This migration eliminates React overhead in hot drawing paths while preserving all existing architectural patterns and performance optimizations.

**Current Status**: Phase 1 completed ✅, Phase 2 in progress 🔄 (runtime now pure Konva; react-konva gated/no-op)  
**Performance Targets**: All met (Init < 50ms, 60fps drawing, tool switch < 16ms, zero pointer violations)

## 🏗️ Architecture Overview

### Core Components
- **NonReactCanvasStage**: Main canvas component implementing direct Konva usage
- **CanvasLayerManager**: Manages multi-layer rendering pipeline
- **unifiedCanvasStore**: 8-module Zustand store with immer middleware
- **KonvaNodePool**: Object pooling for drawing tools
- **SpatialIndex**: QuadTree-based viewport culling

### Layer System
1. **BackgroundLayer**: Static grid (listening=false for performance)
2. **MainLayer**: Persisted shapes, text, connectors
3. **Preview Layer**: Previews and images on Konva.Layer({ listening: false }) (FastLayer deprecated)
4. **OverlayLayer**: Selection boxes, Transformer, UI elements

### State Management
- **Elements Module**: CanvasElement discriminated union with branded IDs
- **Selection Module**: Multi-select with Transformer support
- **Viewport Module**: Zoom/pan with spatial culling
- **History Module**: Undo/redo with atomic snapshots
- **Tools Module**: Active tool state and configuration

## 🚀 Migration Status

### Phase 1: Fresh Core ✅ **COMPLETED**
- ✅ NonReactCanvasStage implemented and mounted
- ✅ Imperative drawing pipeline for Pen/Marker/Highlighter
- ✅ FastLayer preview rendering with object pooling
- ✅ Performance targets achieved

### Phase 2: State Bridge 🔄 **IN PROGRESS** (CanvasRendererV2 active for persisted elements; overlay Transformer imperative)
- 🔄 CanvasRendererV2 service development
- 🔄 Overlay-layer selection and Transformer
- 🔄 Feature flag system for rollback

### Phase 3: Feature Migration (Planned)
- Drawing tools, basic shapes, text editing
- Transformations (selection/resize/rotate)
- Advanced tools (images/connectors)

### Phase 4: Legacy Cleanup (Planned)
- Remove react-konva dependencies
- Clean up unused components

## 🎨 Drawing Pipeline

### Current Implementation
- **Single-source drawing**: Component-driven imperative approach
- **Preview rendering**: FastLayer with batchDraw() for smooth updates
- **Object pooling**: KonvaNodePool for Pen/Marker/Highlighter
- **Store policy**: No writes during preview, atomic commits on completion

### Performance Features
- **Progressive rendering**: Gated by `!isDrawing` and element count > 500
- **Spatial culling**: QuadTree-based viewport optimization
- **Layer optimization**: Background layer listening disabled
- **Caching strategy**: Strategic shape caching for complex elements

## 🔧 Technical Implementation

### Konva Integration
- **Direct API usage**: No react-konva wrapper
- **Imperative rendering**: Stage/layer management via refs
- **Event handling**: Direct stage/node event listeners
- **Performance tuning**: Konva.pixelRatio = 1, perfectDraw disabled

### Type Safety
- **Branded IDs**: `ElementId = Brand<string, 'ElementId'>`
- **Discriminated unions**: `CanvasElement = RectElement | CircleElement | ...`
- **No Konva nodes in store**: Only serializable element descriptors
- **100% type coverage**: All `any` types eliminated

### Memory Management
- **Object pooling**: Reuse Konva nodes for drawing tools
- **Spatial indexing**: Efficient viewport culling
- **Cleanup**: Proper stage/layer destruction on unmount
- **Event cleanup**: Remove Tauri listeners

## 📊 Performance Metrics

### Achieved Targets
- ✅ Canvas initialization: < 50ms
- ✅ Drawing performance: 60fps sustained
- ✅ Tool switching: < 16ms
- ✅ Pointer latency: Zero violations

### Optimization Techniques
- **Viewport culling**: Only render visible elements
- **Object pooling**: Reduce garbage collection
- **Layer consolidation**: Minimal canvas overhead
- **Batch rendering**: RAF-batched drawing operations

## 🔗 Integration Points

### Tauri Backend
- **Canvas persistence**: SQLite storage with AES-256-GCM encryption
- **File export**: Image/PDF generation via Rust commands
- **Event system**: Backend notifications for canvas updates

### Frontend Features
- **Tasks integration**: Drag-and-drop from canvas to task system
- **Notes linking**: Canvas elements with note references
- **Project assets**: Canvas boards as project components

## 📚 Documentation References

### Primary Documents
- **Blueprint**: `docs/KONVA_BASED_CANVAS.md` - Complete migration blueprint
- **Migration Plan**: `docs/CANVAS_MIGRATION_PLAN.md` - Implementation phases
- **Current Status**: `docs/CANVAS_MIGRATION_STATUS.md` - Progress tracking
- **Drawing Pipeline**: `docs/CANVAS_DRAWING_PIPELINE_STATUS.md` - Implementation details

### Supporting Documents
- **Architecture**: `docs/ARCHITECTURE.md` - Overall system architecture
- **Type Safety**: `docs/COMPLETE_TYPE_SAFETY_AUDIT.md` - Type system audit
- **Project Status**: `docs/PROJECT_STATUS.md` - Overall project status

## 🎯 Next Steps

### Immediate (Phase 2)
1. **CanvasRendererV2 Service**: Implement imperative diff renderer
2. **Selection System**: Add overlay-layer selection and Transformer
3. **Feature Flags**: Implement production rollback capability

### Short-term (Phase 3)
1. **Feature Migration**: Move remaining features to new renderer
2. **Performance Tuning**: Optimize based on real-world usage
3. **Testing**: Comprehensive integration testing

### Long-term (Phase 4)
1. **Legacy Cleanup**: Remove react-konva dependencies
2. **Performance Monitoring**: Continuous optimization
3. **Feature Expansion**: AI-assisted diagramming, advanced tools

## 🚨 Risk Mitigation

### Rollback Strategy
- **Feature flags**: Instant rollback to legacy renderer
- **A/B testing**: Gradual rollout with performance monitoring
- **Data validation**: Ensure element consistency during migration

### Performance Monitoring
- **Real-time metrics**: Init time, pointer latency, frame rate
- **Regression detection**: Automated performance testing
- **User feedback**: Performance impact assessment

---

**Status**: ✅ **PRODUCTION-READY** with clear migration path  
**Blueprint Alignment**: 100% aligned with KONVA_BASED_CANVAS.md  
**Next Milestone**: CanvasRendererV2 service implementation
